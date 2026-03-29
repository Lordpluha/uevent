import { Controller, Post, Delete, Get, Body, UseGuards, Res, Req, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { Request, Response } from 'express'
import { z } from 'zod'
import { UsersAuthService } from './users-auth.service'
import { LoginDto, LoginDtoSchema } from './dto/login.dto'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { CreateUserDto, CreateUserDtoSchema } from '../users/dto/create-user.dto'
import { setAuthCookies, clearAuthCookies } from '../../common/auth-cookie.util'

const Verify2faSchema = z.object({ tempToken: z.string(), code: z.string().length(6) })
const Confirm2faSchema = z.object({ code: z.string().length(6) })
const Disable2faSchema = z.object({ code: z.string().length(6) })
const ForgotPasswordSchema = z.object({ email: z.email() })
const ResetPasswordSchema = z.object({
  email: z.email(),
  code: z.string().length(6),
  password: z.string().min(8),
})

@Controller('auth/users')
export class UsersAuthController {
  constructor(private readonly usersAuthService: UsersAuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) dto: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip_address: req.ip, user_agent: req.headers['user-agent'] }
    const result = await this.usersAuthService.register(dto, meta)
    setAuthCookies(res, result as { access_token: string; refresh_token: string })
    return { accountType: 'user' }
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip_address: req.ip, user_agent: req.headers['user-agent'] }
    const result = await this.usersAuthService.login(dto, meta)

    if ('requires2fa' in result) {
      return { requires2fa: true, tempToken: result.tempToken }
    }

    setAuthCookies(res, result as { access_token: string; refresh_token: string })
    return { accountType: 'user' }
  }

  @Post('2fa/verify')
  async verify2fa(
    @Body(new ZodValidationPipe(Verify2faSchema)) body: { tempToken: string; code: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip_address: req.ip, user_agent: req.headers['user-agent'] }
    const tokens = await this.usersAuthService.verify2fa(body.tempToken, body.code, meta)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string })
    return { accountType: 'user' }
  }

  @Post('2fa/setup')
  @UseGuards(JwtGuard)
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.setup2fa(user.sub)
  }

  @Post('2fa/confirm')
  @UseGuards(JwtGuard)
  confirm2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Confirm2faSchema)) body: { code: string },
  ) {
    return this.usersAuthService.confirm2fa(user.sub, body.code)
  }

  @Post('2fa/disable')
  @UseGuards(JwtGuard)
  disable2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Disable2faSchema)) body: { code: string },
  ) {
    return this.usersAuthService.disable2fa(user.sub, body.code)
  }

  @Post('forgot-password')
  forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) body: { email: string },
  ) {
    return this.usersAuthService.forgotPassword(body.email)
  }

  @Post('reset-password')
  resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: { email: string; code: string; password: string },
  ) {
    return this.usersAuthService.resetPassword(body.email, body.code, body.password)
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.usersAuthService.refresh(token)
    setAuthCookies(res, tokens)
    return { accountType: 'user' }
  }

  @Delete('logout')
  @UseGuards(JwtGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersAuthService.logout(user.session_id)
    clearAuthCookies(res)
    return { message: 'Logged out' }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.getMe(user.sub)
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.getSessions(user.sub)
  }

  @Delete('sessions/:id')
  @UseGuards(JwtGuard)
  revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.usersAuthService.revokeSession(user.sub, sessionId)
  }
}
