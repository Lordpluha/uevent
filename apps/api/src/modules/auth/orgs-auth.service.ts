import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationSession } from '../organizations/entities/organization-session.entity'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './types/jwt-payload.interface'
import { hashPassword, verifyPassword } from '../../common/password.util'
import { CreateOrganizationDto } from '../organizations/dto/create-organization.dto'

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

  async logout(sessionId: string) {
    await this.sessionsRepo.delete(sessionId)
  }

  private async signTokens(payload: JwtPayload) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_EXPIRES }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ])
    return { access_token, refresh_token }
  }
}
