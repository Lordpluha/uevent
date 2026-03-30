import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as speakeasy from 'speakeasy'
import {toDataURL} from 'qrcode'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { UserOtp } from '../users/entities/user-otp.entity'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './types/jwt-payload.interface'
import { hashPassword, verifyPassword } from '../../common/password.util'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { EmailService } from '../notifications/email.service'
import {randomInt} from 'crypto'

const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface LoginMeta {
  ip_address?: string
  user_agent?: string
}

@Injectable()
export class UsersAuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,

    @InjectRepository(UserOtp)
    private readonly otpRepo: Repository<UserOtp>,

    private readonly emailService: EmailService,
  ) {}

  async register(dto: CreateUserDto, meta?: LoginMeta) {
    const exists = await this.usersRepo.findOneBy({ email: dto.email })
    if (exists) throw new ConflictException('Invalid credentials')

    const password = await hashPassword(dto.password)
    const user = this.usersRepo.create({ ...dto, password })
    await this.usersRepo.save(user)

    return this.login({ email: dto.email, password: dto.password }, meta)
  }

  async login(dto: LoginDto, meta?: LoginMeta) {
    const user = await this.usersRepo.findOneBy({ email: dto.email })

    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await verifyPassword(user.password, dto.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    if (user.is_banned) throw new UnauthorizedException('Account is banned, please contact support')

    // If 2FA is enabled, return a temporary token instead of full auth
    if (user.two_fa && user.two_fa_secret) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, type: '2fa_pending', ip: meta?.ip_address },
        { expiresIn: '5m' },
      )
      return { requires2fa: true, tempToken }
    }

    return this.createSession(user, meta)
  }

  async verify2fa(tempToken: string, code: string, meta?: LoginMeta) {
    let payload: { sub: string; type: string }
    try {
      payload = await this.jwtService.verifyAsync(tempToken)
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA token')
    }

    if (payload.type !== '2fa_pending') {
      throw new UnauthorizedException('Invalid token type')
    }

    const user = await this.usersRepo.findOneBy({ id: payload.sub })
    if (!user || !user.two_fa_secret) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isValid = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code')
    }

    return this.createSession(user, meta)
  }

  private async createSession(user: User, meta?: LoginMeta) {
    const session = this.sessionsRepo.create({
      user_id: user.id,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
      access: '',
      refresh: '',
      ip_address: meta?.ip_address,
      user_agent: meta?.user_agent,
    })
    await this.sessionsRepo.save(session)

    const payload: JwtPayload = { sub: user.id, type: 'user', session_id: session.id }
    const tokens = await this.signTokens(payload)

    await this.sessionsRepo.update(session.id, { access: tokens.access_token, refresh: tokens.refresh_token })

    // Send login notification email (async, don't block login)
    if (user.login_notifications_enabled) {
      this.emailService.sendLoginNotification(
        user.email,
        user.first_name || user.username,
        meta?.ip_address || 'Unknown',
        meta?.user_agent || 'Unknown',
        new Date(),
      ).catch(() => undefined)
    }

    return { access_token: tokens.access_token, refresh_token: tokens.refresh_token }
  }

  async refresh(token: string) {
    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: payload.session_id, refresh: token },
    })

    if (!session || session.expiration < new Date()) {
      throw new UnauthorizedException('Session not found or expired')
    }

    const newPayload: JwtPayload = { sub: payload.sub, type: 'user', session_id: session.id }
    const tokens = await this.signTokens(newPayload)

    await this.sessionsRepo.update(session.id, {
      access: tokens.access_token,
      refresh: tokens.refresh_token,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
    })

    return tokens
  }

  async getMe(id: string) {
    const user = await this.usersRepo.findOneBy({ id })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async logout(sessionId: string) {
    await this.sessionsRepo.delete(sessionId)
  }

  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.sessionsRepo.find({
      where: { user_id: userId },
      order: { last_active_at: 'DESC' },
    })
    return sessions.map(s => ({
      id: s.id,
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      device_type: s.device_type,
      location: s.location,
      created_at: s.created_at,
      last_active_at: s.last_active_at,
      is_current: s.id === currentSessionId,
    }))
  }

  async revokeSession(userId: string, sessionId: string, code?: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    if (user.two_fa && user.two_fa_secret) {
      if (!code) throw new BadRequestException('2FA code is required')
      const isValid = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: code, window: 1 })
      if (!isValid) throw new BadRequestException('Invalid verification code')
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, user_id: userId },
    })
    if (!session) throw new NotFoundException('Session not found')
    await this.sessionsRepo.delete(sessionId)
  }

  private async signTokens(payload: JwtPayload) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_EXPIRES }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ])
    return { access_token, refresh_token }
  }

  // ── 2FA Setup ──────────────────────────────────────────────

  async setup2fa(userId: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    const generated = speakeasy.generateSecret({ name: `UEvent:${user.email}`, issuer: 'UEvent' })
    const secret = generated.base32
    const otpauthUrl = generated.otpauth_url!
    const qrCodeDataUrl = await toDataURL(otpauthUrl)

    // Store secret temporarily (not enabled yet until verified)
    await this.usersRepo.update(userId, { two_fa_secret: secret })

    return { secret, qrCodeDataUrl }
  }

  async confirm2fa(userId: string, code: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user || !user.two_fa_secret) {
      throw new BadRequestException('2FA setup not initiated')
    }

    const isValid = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new BadRequestException('Invalid verification code')
    }

    await this.usersRepo.update(userId, { two_fa: true })
    return { enabled: true }
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    if (!user.two_fa || !user.two_fa_secret) {
      throw new BadRequestException('2FA is not enabled')
    }

    const isValid = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new BadRequestException('Invalid verification code')
    }

    await this.usersRepo.update(userId, { two_fa: false, two_fa_secret: null })
    return { enabled: false }
  }

  // ── Password Reset ────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOneBy({ email })
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset code has been sent.' }

    // Generate 6-digit code
    const code = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Invalidate old password reset OTPs
    await this.otpRepo.update(
      { user_id: user.id, type: 'password_reset', used: false },
      { used: true },
    )

    // Save new OTP
    const otp = this.otpRepo.create({
      code,
      type: 'password_reset',
      expires_at: expiresAt,
      user_id: user.id,
    })
    await this.otpRepo.save(otp)

    // Send email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.first_name || user.username,
      code,
    )

    return { message: 'If that email exists, a reset code has been sent.' }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.usersRepo.findOneBy({ email })
    if (!user) throw new BadRequestException('Invalid or expired reset code')

    const otp = await this.otpRepo.findOne({
      where: { user_id: user.id, code, type: 'password_reset', used: false },
      order: { expires_at: 'DESC' },
    })

    if (!otp || otp.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset code')
    }

    // Mark OTP as used
    await this.otpRepo.update(otp.id, { used: true })

    // Update password
    const hashedPassword = await hashPassword(newPassword)
    await this.usersRepo.update(user.id, { password: hashedPassword })

    return { message: 'Password has been reset successfully' }
  }
}
