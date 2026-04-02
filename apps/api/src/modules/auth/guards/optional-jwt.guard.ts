import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'
import { JwtPayload } from '../types/jwt-payload.interface'
import { UserSession } from '../../users/entities/user-session.entity'
import { OrganizationSession } from '../../organizations/entities/organization-session.entity'
import { User } from '../../users/entities/user.entity'
import { Organization } from '../../organizations/entities/organization.entity'

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)
    if (!token) return true

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)

      if (payload.session_id) {
        if (payload.type === 'organization') {
          const session = await this.dataSource
            .getRepository(OrganizationSession)
            .findOne({ where: { id: payload.session_id }, select: ['id', 'organization_id'] })
          if (!session) return true
          const org = await this.dataSource
            .getRepository(Organization)
            .findOne({ where: { id: session.organization_id }, select: ['id', 'is_banned'] })
          if (org?.is_banned) return true
        } else {
          const session = await this.dataSource
            .getRepository(UserSession)
            .findOne({ where: { id: payload.session_id }, select: ['id', 'user_id'] })
          if (!session) return true
          const user = await this.dataSource
            .getRepository(User)
            .findOne({ where: { id: session.user_id }, select: ['id', 'is_banned'] })
          if (user?.is_banned) return true
        }
      }

      request['user'] = payload
    } catch {
      // Keep endpoint public when auth token is missing/invalid.
    }

    return true
  }

  private extractToken(request: Request): string | null {
    const cookie = (request.cookies as Record<string, string>)?.access_token
    if (cookie) return cookie
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? (token ?? null) : null
  }
}