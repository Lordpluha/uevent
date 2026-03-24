import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './types/jwt-payload.interface'
import { hashPassword, verifyPassword } from '../../common/password.util'
import { CreateUserDto } from '../users/dto/create-user.dto'

const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

@Injectable()
export class UsersAuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {}

  async register(dto: CreateUserDto) {
    const exists = await this.usersRepo.findOneBy({ email: dto.email })
    if (exists) throw new ConflictException('Invalid credentials')

    const password = await hashPassword(dto.password)
    const user = this.usersRepo.create({ ...dto, password })
    await this.usersRepo.save(user)

    return this.login({ email: dto.email, password: dto.password })
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOneBy({ email: dto.email })

    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await verifyPassword(user.password, dto.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    if (user.is_banned) throw new UnauthorizedException('Account is banned, please contact support')

    const session = this.sessionsRepo.create({
      user_id: user.id,
      expiration: new Date(Date.now() + REFRESH_EXPIRES_MS),
      access: '',
      refresh: '',
    })
    await this.sessionsRepo.save(session)

    const payload: JwtPayload = { sub: user.id, type: 'user', session_id: session.id }
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
      where: { id: payload.session_id as number, refresh: token },
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

  async logout(sessionId: number) {
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
