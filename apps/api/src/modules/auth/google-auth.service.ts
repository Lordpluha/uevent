import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { google } from 'googleapis'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { Event } from '../events/entities/event.entity'
import { JwtPayload } from './types/jwt-payload.interface'

const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const ACCESS_EXPIRES = '15m'

@Injectable()
export class GoogleAuthService {
  private readonly clientId = process.env.GOOGLE_CLIENT_ID ?? ''
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''
  private readonly callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback'

  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
  ) {}

  private createOAuth2Client() {
    return new google.auth.OAuth2(this.clientId, this.clientSecret, this.callbackUrl)
  }

  /** Generate the Google consent URL */
  getConsentUrl(): string {
    const oauth2 = this.createOAuth2Client()
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    })
  }

  /** Exchange authorization code → find or create user → return JWT tokens */
  async handleCallback(code: string) {
    const oauth2 = this.createOAuth2Client()
    const { tokens } = await oauth2.getToken(code)
    oauth2.setCredentials(tokens)

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 })
    const { data: profile } = await oauth2Api.userinfo.get()

    if (!profile.email) {
      throw new UnauthorizedException('Google account has no email')
    }

    // Find existing user by google_id or email
    let user = await this.usersRepo.findOneBy({ google_id: profile.id ?? undefined })
    if (!user) {
      user = await this.usersRepo.findOneBy({ email: profile.email })
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

    return jwtTokens
  }

  /** Add a uevent event to the user's Google Calendar */
  async addEventToCalendar(userId: number, eventId: string) {
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
      throw new UnauthorizedException('Event not found')
    }

    const oauth2 = this.createOAuth2Client()
    oauth2.setCredentials({ refresh_token: user.google_refresh_token })

    const calendar = google.calendar({ version: 'v3', auth: oauth2 })

    const calendarEvent = {
      summary: event.name,
      description: event.description ?? '',
      start: {
        dateTime: new Date(event.datetime_start).toISOString(),
        timeZone: event.time_zone || 'UTC',
      },
      end: {
        dateTime: new Date(event.datetime_end).toISOString(),
        timeZone: event.time_zone || 'UTC',
      },
      location: event.location ?? undefined,
    }

    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    })

    return {
      calendarEventId: result.data.id,
      htmlLink: result.data.htmlLink,
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
