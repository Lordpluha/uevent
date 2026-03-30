import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'
import { JwtPayload } from '../types/jwt-payload.interface'
import { UserSession } from '../../users/entities/user-session.entity'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)

    if (!token) throw new UnauthorizedException('No token provided')

    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }

    if (payload.session_id) {
      const sessionExists = await this.dataSource.getRepository(UserSession).existsBy({ id: payload.session_id })
      if (!sessionExists) throw new UnauthorizedException('Session has been revoked')
    }

    request['user'] = payload
    return true
  }

  private extractToken(request: Request): string | null {
    // Prefer httpOnly cookie, fall back to Bearer header for API clients
    const cookie = (request.cookies as Record<string, string>)?.access_token
    if (cookie) return cookie
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? (token ?? null) : null
  }
}
