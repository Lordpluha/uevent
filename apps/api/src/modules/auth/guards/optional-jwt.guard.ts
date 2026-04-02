import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'
import { JwtPayload } from '../types/jwt-payload.interface'
import { UserSession } from '../../users/entities/user-session.entity'
import { OrganizationSession } from '../../organizations/entities/organization-session.entity'

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
        const repo =
          payload.type === 'organization'
            ? this.dataSource.getRepository(OrganizationSession)
            : this.dataSource.getRepository(UserSession)
        const sessionExists = await repo.existsBy({ id: payload.session_id })
        if (!sessionExists) return true
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