import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { DataSource } from 'typeorm'
import { Organization } from '../../organizations/entities/organization.entity'
import { OrganizationSession } from '../../organizations/entities/organization-session.entity'
import { User } from '../../users/entities/user.entity'
import { UserSession } from '../../users/entities/user-session.entity'
import { JwtPayload } from '../types/jwt-payload.interface'

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
      if (payload.type === 'organization') {
        const session = await this.dataSource
          .getRepository(OrganizationSession)
          .findOne({ where: { id: payload.session_id }, select: ['id', 'organization_id'] })
        if (!session) throw new UnauthorizedException('Session has been revoked')

        const org = await this.dataSource
          .getRepository(Organization)
          .findOne({ where: { id: session.organization_id }, select: ['id', 'is_banned'] })
        if (org?.is_banned) throw new ForbiddenException('Account is banned')
      } else {
        const session = await this.dataSource
          .getRepository(UserSession)
          .findOne({ where: { id: payload.session_id }, select: ['id', 'user_id'] })
        if (!session) throw new UnauthorizedException('Session has been revoked')

        const user = await this.dataSource
          .getRepository(User)
          .findOne({ where: { id: session.user_id }, select: ['id', 'is_banned'] })
        if (user?.is_banned) throw new ForbiddenException('Account is banned')
      }
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
