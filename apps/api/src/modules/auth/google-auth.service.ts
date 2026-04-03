import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { google } from 'googleapis'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { Event } from '../events/entities/event.entity'
import { Ticket } from '../tickets/entities/ticket.entity'
import { JwtPayload } from './types/jwt-payload.interface'
import { ApiConfigService } from '../../config/api-config.service'

const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const ACCESS_EXPIRES = '15m'
const GOOGLE_LINK_STATE_EXPIRES = '10m'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

type GoogleLinkStatePayload = {
  sub: string
  type: 'user'
  purpose: 'google-link'
}

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiConfig: ApiConfigService,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
  ) {}

  private createOAuth2Client() {
    const { clientId, clientSecret, callbackUrl } = this.apiConfig.googleConfig
    return new google.auth.OAuth2(clientId, clientSecret, callbackUrl)
  }

  async getLinkState(accessToken?: string, refreshToken?: string): Promise<string | undefined> {
    const subject = await this.resolveUserIdFromTokens(accessToken, refreshToken)
    if (!subject) return undefined

    await this.resetGoogleGrantIfMissingCalendarScope(subject)

    return await this.jwtService.signAsync(
      { sub: subject, type: 'user', purpose: 'google-link' } as GoogleLinkStatePayload,
      { expiresIn: GOOGLE_LINK_STATE_EXPIRES },
    )
  }

  private async resetGoogleGrantIfMissingCalendarScope(userId: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user?.google_refresh_token) return

    const oauth2 = this.createOAuth2Client()
    oauth2.setCredentials({ refresh_token: user.google_refresh_token })

    try {
      const accessToken = await oauth2.getAccessToken()
      if (!accessToken.token) return

      const tokenInfo = await oauth2.getTokenInfo(accessToken.token)
      const scopes = tokenInfo.scopes ?? []
      if (scopes.includes(CALENDAR_SCOPE)) return
    } catch {
      // Invalid/revoked token should also be cleared to force a clean relink.
    }

    await oauth2.revokeToken(user.google_refresh_token).catch(() => undefined)
    await this.usersRepo.update(user.id, { google_refresh_token: null })
  }

  private async resolveUserIdFromTokens(accessToken?: string, refreshToken?: string): Promise<string | undefined> {
    if (accessToken) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken)
        if (payload.type === 'user') return payload.sub
      } catch {
        return this.resolveUserIdFromTokens(undefined, refreshToken)
      }
    }

    if (!refreshToken) return undefined

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken)
      if (payload.type !== 'user') return undefined

      const session = await this.sessionsRepo.findOne({
        where: { id: payload.session_id, refresh: refreshToken },
      })

      if (!session || session.expiration < new Date()) return undefined
      return payload.sub
    } catch {
      return undefined
    }
  }

  /** Generate the Google consent URL */
  getConsentUrl(state?: string): string {
    const oauth2 = this.createOAuth2Client()
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state,
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    })
  }

  /** Exchange authorization code → find or create user → return JWT tokens */
  async handleCallback(code: string, state?: string) {
    const oauth2 = this.createOAuth2Client()
    const { tokens } = await oauth2.getToken(code)
    oauth2.setCredentials(tokens)

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 })
    const { data: profile } = await oauth2Api.userinfo.get()

    if (!profile.email) {
      throw new UnauthorizedException('Google account has no email')
    }

    let user: User | null = null

    if (state) {
      let linkPayload: GoogleLinkStatePayload
      try {
        linkPayload = await this.jwtService.verifyAsync<GoogleLinkStatePayload>(state)
      } catch {
        throw new UnauthorizedException('Invalid Google link state')
      }

      if (linkPayload.type !== 'user' || linkPayload.purpose !== 'google-link') {
        throw new UnauthorizedException('Invalid Google link state')
      }

      user = await this.usersRepo.findOneBy({ id: linkPayload.sub })
      if (!user) throw new UnauthorizedException('User for Google linking not found')
    } else {
      // Find existing user by google_id or email
      user = await this.usersRepo.findOneBy({ google_id: profile.id ?? undefined })
      if (!user) {
        user = await this.usersRepo.findOneBy({ email: profile.email })
      }
    }

    if (user) {
      // Link Google account + store refresh token
      user.google_id = profile.id ?? user.google_id
      if (tokens.refresh_token) {
        user.google_refresh_token = tokens.refresh_token
      }
      await this.usersRepo.save(user)
    } else {
      // Create new user (no password — Google-only account)
      const username = profile.email.split('@')[0] + '_' + Date.now().toString(36)
      user = this.usersRepo.create({
        email: profile.email,
        username,
        password: '', // no local password
        first_name: profile.given_name ?? undefined,
        last_name: profile.family_name ?? undefined,
        avatar: profile.picture ?? undefined,
        google_id: profile.id ?? undefined,
        google_refresh_token: tokens.refresh_token ?? undefined,
      })
      await this.usersRepo.save(user)
    }

    if (state) {
      return { linked: true as const }
    }

    // If user has 2FA enabled, return a temp token for verification instead of creating a session
    if (user.two_fa && user.two_fa_secret) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, type: '2fa_pending' },
        { expiresIn: '5m' },
      )
      return { linked: false as const, requires2fa: true as const, tempToken }
    }

    // Create session + JWT tokens
    const session = this.sessionsRepo.create({
      user_id: user.id,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
      access: '',
      refresh: '',
    })
    await this.sessionsRepo.save(session)

    const payload: JwtPayload = { sub: user.id, type: 'user', session_id: session.id }
    const jwtTokens = await this.signTokens(payload)

    await this.sessionsRepo.update(session.id, {
      access: jwtTokens.access_token,
      refresh: jwtTokens.refresh_token,
    })

    return { linked: false as const, tokens: jwtTokens }
  }

  /** Add a uevent event to the user's Google Calendar */
  async addEventToCalendar(userId: string, eventId: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user?.google_refresh_token) {
      throw new UnauthorizedException(
        'Google account not linked or missing calendar permissions. Please re-login with Google.',
      )
    }

    const event = await this.eventsRepo.findOne({
      where: { id: eventId },
      relations: ['tags'],
    })
    if (!event) {
      throw new NotFoundException('Event not found')
    }

    return this.insertCalendarEvent(user, {
      summary: event.name,
      description: this.buildEventDescription(event),
      start: event.datetime_start,
      end: event.datetime_end,
      timeZone: event.time_zone || 'UTC',
      location: event.location ?? undefined,
    })
  }

  /** Add a purchased ticket (with full event details) to the user's Google Calendar */
  async addTicketToCalendar(userId: string, ticketId: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user?.google_refresh_token) {
      throw new UnauthorizedException(
        'Google account not linked or missing calendar permissions. Please re-login with Google.',
      )
    }

    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId, user_id: userId },
      relations: ['event', 'event.tags'],
    })
    const resolvedTicket = ticket ?? await this.ticketsRepo.findOne({
      where: { id: ticketId },
      relations: ['event', 'event.tags'],
    })
    if (!resolvedTicket) {
      throw new NotFoundException('Ticket not found')
    }

    const event = resolvedTicket.event
    const description = [
      `🎟 Ticket: ${resolvedTicket.name}`,
      resolvedTicket.description ? `📋 ${resolvedTicket.description}` : '',
      '',
      this.buildEventDescription(event),
    ]
      .filter((l) => l !== null && l !== undefined)
      .join('\n')

    return this.insertCalendarEvent(user, {
      summary: `🎟 ${event?.name ?? resolvedTicket.name}`,
      description,
      start: resolvedTicket.datetime_start,
      end: resolvedTicket.datetime_end,
      timeZone: event?.time_zone || 'UTC',
      location: event?.location ?? undefined,
    })
  }

  private buildEventDescription(event: Event): string {
    const clientUrl = this.apiConfig.clientUrl
    const lines: string[] = []
    if (event.description) lines.push(event.description)
    if (event.location) lines.push(`📍 ${event.location}`)
    if (event.tags?.length) lines.push(`🏷 ${event.tags.map((t) => t.name).join(', ')}`)
    lines.push(`🔗 ${clientUrl}/events/${event.id}`)
    return lines.join('\n')
  }

  private async insertCalendarEvent(
    user: User,
    opts: {
      summary: string
      description: string
      start: Date
      end: Date
      timeZone: string
      location?: string
    },
  ) {
    const oauth2 = this.createOAuth2Client()
    oauth2.setCredentials({ refresh_token: user.google_refresh_token })

    const calendar = google.calendar({ version: 'v3', auth: oauth2 })

    const startDate = new Date(opts.start)
    const endDate = new Date(opts.end)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new InternalServerErrorException('Event has invalid date/time values')
    }

    const startIso = startDate.toISOString()
    const endIso = endDate.toISOString()

    try {
      const result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: opts.summary,
          description: opts.description,
          start: { dateTime: startIso, timeZone: opts.timeZone },
          end: { dateTime: endIso, timeZone: opts.timeZone },
          location: opts.location,
        },
      })

      return {
        calendarEventId: result.data.id,
        htmlLink: result.data.htmlLink,
      }
    } catch (err: unknown) {
      const googleErr = err as {
        response?: {
          status?: number
          data?: {
            error?: {
              message?: string
              status?: string
              errors?: Array<{ reason?: string; message?: string }>
              details?: Array<{ reason?: string; metadata?: Record<string, string> }>
            }
          }
        }
        message?: string
      }
      const status = googleErr?.response?.status
      const googleError = googleErr?.response?.data?.error
      const reasons = [
        ...(googleError?.errors?.map((item) => item.reason).filter(Boolean) ?? []),
        ...(googleError?.details?.map((item) => item.reason).filter(Boolean) ?? []),
      ]

      if (status === 401 || status === 403) {
        if (reasons.includes('accessNotConfigured') || reasons.includes('SERVICE_DISABLED')) {
          throw new ServiceUnavailableException(
            'Google Calendar API is disabled for the configured Google Cloud project. Enable calendar-json.googleapis.com and try again.',
          )
        }

        throw new UnauthorizedException(
          'Google Calendar access denied. Please re-link your Google account.',
        )
      }

      throw new InternalServerErrorException('Failed to add event to Google Calendar')
    }
  }

  private async signTokens(payload: JwtPayload) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_EXPIRES }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ])
    return { access_token, refresh_token }
  }
}
