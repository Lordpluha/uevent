import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { JwtPayload } from '../types/jwt-payload.interface'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)

    if (!token) throw new UnauthorizedException('No token provided')

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
      request['user'] = payload
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }

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
