import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as speakeasy from 'speakeasy'
import { toDataURL } from 'qrcode'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationSession } from '../organizations/entities/organization-session.entity'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './types/jwt-payload.interface'
import { hashPassword, verifyPassword } from '../../common/password.util'
import { CreateOrganizationDto } from '../organizations/dto/create-organization.dto'
import {
  ChangeOrgPasswordDto,
  UpdateOrgEmailDto,
  UpdateOrgProfileDto,
} from './dto/org-settings.dto'

const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

@Injectable()
export class OrgsAuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,

    @InjectRepository(OrganizationSession)
    private readonly sessionsRepo: Repository<OrganizationSession>,
  ) {}

  async register(dto: CreateOrganizationDto) {
    const exists = await this.orgsRepo.findOneBy({ email: dto.email })
    if (exists) throw new ConflictException('Email already in use')

    const password = await hashPassword(dto.password)
    const org = this.orgsRepo.create({ ...dto, password })
    await this.orgsRepo.save(org)

    return this.login({ email: dto.email, password: dto.password })
  }

  async login(dto: LoginDto) {
    const org = await this.orgsRepo.findOneBy({ email: dto.email })

    if (!org) throw new UnauthorizedException('Invalid credentials')

    const valid = await verifyPassword(org.password, dto.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    // If 2FA is enabled, return a temporary token instead of full auth
    if (org.two_factor_enabled && org.two_fa_secret) {
      const tempToken = await this.jwtService.signAsync(
        { sub: org.id, type: '2fa_pending' },
        { expiresIn: '5m' },
      )
      return { requires2fa: true, tempToken }
    }

    return this.createSession(org)
  }

  async verify2fa(tempToken: string, code: string) {
    let payload: { sub: string; type: string }
    try {
      payload = await this.jwtService.verifyAsync(tempToken)
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA token')
    }

    if (payload.type !== '2fa_pending') {
      throw new UnauthorizedException('Invalid token type')
    }

    const org = await this.orgsRepo.findOneBy({ id: payload.sub })
    if (!org || !org.two_fa_secret) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isValid = speakeasy.totp.verify({ secret: org.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code')
    }

    return this.createSession(org)
  }

  private async createSession(org: Organization) {
    const session = this.sessionsRepo.create({
      organization_id: org.id,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
      access: '',
      refresh: '',
    })
    await this.sessionsRepo.save(session)

    const payload: JwtPayload = { sub: org.id, type: 'organization', session_id: session.id }
    const tokens = await this.signTokens(payload)

    await this.sessionsRepo.update(session.id, { access: tokens.access_token, refresh: tokens.refresh_token })

    return tokens
  }

  async refresh(token: string) {
    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: payload.session_id as string, refresh: token },
    })

    if (!session || session.expiration < new Date()) {
      throw new UnauthorizedException('Session not found or expired')
    }

    const newPayload: JwtPayload = { sub: payload.sub, type: 'organization', session_id: session.id }
    const tokens = await this.signTokens(newPayload)

    await this.sessionsRepo.update(session.id, {
      access: tokens.access_token,
      refresh: tokens.refresh_token,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
    })

    return tokens
  }

  async getMe(id: string) {
    const org = await this.orgsRepo.findOneBy({ id })
    if (!org) throw new NotFoundException('Organization not found')
    return this.toSafeOrganization(org)
  }

  async updateProfile(id: string, dto: UpdateOrgProfileDto) {
    const org = await this.orgsRepo.findOneBy({ id })
    if (!org) throw new NotFoundException('Organization not found')

    Object.assign(org, dto)
    const updated = await this.orgsRepo.save(org)
    return this.toSafeOrganization(updated)
  }

  async updateEmail(id: string, dto: UpdateOrgEmailDto) {
    const org = await this.orgsRepo.findOneBy({ id })
    if (!org) throw new NotFoundException('Organization not found')

    const exists = await this.orgsRepo.findOneBy({ email: dto.email })
    if (exists && exists.id !== id) throw new ConflictException('Email already in use')

    org.email = dto.email
    const updated = await this.orgsRepo.save(org)
    return this.toSafeOrganization(updated)
  }

  async changePassword(id: string, dto: ChangeOrgPasswordDto) {
    const org = await this.orgsRepo.findOneBy({ id })
    if (!org) throw new NotFoundException('Organization not found')

    const valid = await verifyPassword(org.password, dto.current_password)
    if (!valid) throw new UnauthorizedException('Current password is invalid')

    org.password = await hashPassword(dto.new_password)
    await this.orgsRepo.save(org)
    return { message: 'Password updated' }
  }

  async logout(sessionId: string) {
    await this.sessionsRepo.delete(sessionId)
  }

  // ── 2FA Setup ──────────────────────────────────────────────

  async setup2fa(orgId: string) {
    const org = await this.orgsRepo.findOneBy({ id: orgId })
    if (!org) throw new NotFoundException('Organization not found')

    const generated = speakeasy.generateSecret({ name: `UEvent:${org.email}`, issuer: 'UEvent' })
    const secret = generated.base32
    const otpauthUrl = generated.otpauth_url!
    const qrCodeDataUrl = await toDataURL(otpauthUrl)

    // Store secret temporarily (not enabled until confirmed)
    await this.orgsRepo.update(orgId, { two_fa_secret: secret })

    return { secret, qrCodeDataUrl }
  }

  async confirm2fa(orgId: string, code: string) {
    const org = await this.orgsRepo.findOneBy({ id: orgId })
    if (!org || !org.two_fa_secret) {
      throw new BadRequestException('2FA setup not initiated')
    }

    const isValid = speakeasy.totp.verify({ secret: org.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new BadRequestException('Invalid verification code')
    }

    await this.orgsRepo.update(orgId, { two_factor_enabled: true })
    return { enabled: true }
  }

  async disable2fa(orgId: string, code: string) {
    const org = await this.orgsRepo.findOneBy({ id: orgId })
    if (!org) throw new NotFoundException('Organization not found')

    if (!org.two_factor_enabled || !org.two_fa_secret) {
      throw new BadRequestException('2FA is not enabled')
    }

    const isValid = speakeasy.totp.verify({ secret: org.two_fa_secret, encoding: 'base32', token: code, window: 1 })
    if (!isValid) {
      throw new BadRequestException('Invalid verification code')
    }

    await this.orgsRepo.update(orgId, { two_factor_enabled: false, two_fa_secret: null })
    return { enabled: false }
  }

  private async signTokens(payload: JwtPayload) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_EXPIRES }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ])
    return { access_token, refresh_token }
  }

  private toSafeOrganization(org: Organization) {
    const { password, two_fa_secret, ...safe } = org
    return safe
  }
}

