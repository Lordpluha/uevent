import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { clearAuthCookies, setAuthCookies } from '../../common/auth-cookie.util'
import {
  ApiAccessCookieAuth,
  ApiRefreshCookieAuth,
  ApiUuidParam,
  ApiZodBody,
  messageSchema,
} from '../../common/swagger/openapi.util'
import { ApiConfigService } from '../../config/api-config.service'
import { CreateUserDto, CreateUserDtoSchema } from '../users/dto/create-user.dto'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { CurrentUser } from './decorators/current-user.decorator'
import {
  ApiTwoFaEnabledResponse,
  ApiTwoFaSetupResponse,
  ApiUserAuthResultResponse,
  ApiUserMeResponse,
  ApiUserSessionsResponse,
} from './decorators/swagger'
import { LoginDto, LoginDtoSchema } from './dto/login.dto'
import { JwtGuard } from './guards/jwt.guard'
import { TwoFaEnabledModel, TwoFaRequiredModel, TwoFaSetupModel, UserAuthSuccessModel } from './openapi.models'
import { JwtPayload } from './types/jwt-payload.interface'
import { UsersAuthService } from './users-auth.service'

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
@ApiTags('Auth: Users')
@ApiExtraModels(User, UserSession, UserAuthSuccessModel, TwoFaRequiredModel, TwoFaSetupModel, TwoFaEnabledModel)
export class UsersAuthController {
  constructor(
    private readonly usersAuthService: UsersAuthService,
    private readonly jwtService: JwtService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Register user account' })
  @ApiZodBody(CreateUserDtoSchema)
  @ApiUserAuthResultResponse('Registers the user and sets HTTP-only access_token and refresh_token cookies.')
  async register(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) dto: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip_address: req.ip, user_agent: req.headers['user-agent'] }
    const result = await this.usersAuthService.register(dto, meta)
    setAuthCookies(res, result as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'user' }
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login user account' })
  @ApiZodBody(LoginDtoSchema)
  @ApiUserAuthResultResponse(
    'Logs in the user. On success sets HTTP-only auth cookies; on 2FA-enabled accounts returns a temp token.',
  )
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

    setAuthCookies(res, result as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'user' }
  }

  @Post('2fa/verify')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Verify user login 2FA challenge' })
  @ApiZodBody(Verify2faSchema)
  @ApiUserAuthResultResponse('Completes 2FA login and sets HTTP-only auth cookies.')
  async verify2fa(
    @Body(new ZodValidationPipe(Verify2faSchema)) body: { tempToken: string; code: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip_address: req.ip, user_agent: req.headers['user-agent'] }
    const tokens = await this.usersAuthService.verify2fa(body.tempToken, body.code, meta)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'user' }
  }

  @Post('2fa/setup')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Start user 2FA setup' })
  @ApiAccessCookieAuth()
  @ApiTwoFaSetupResponse('2FA setup payload.')
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.setup2fa(user.sub)
  }

  @Post('2fa/confirm')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Confirm user 2FA setup' })
  @ApiAccessCookieAuth()
  @ApiZodBody(Confirm2faSchema)
  @ApiTwoFaEnabledResponse('2FA confirmation result.')
  confirm2fa(@CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(Confirm2faSchema)) body: { code: string }) {
    return this.usersAuthService.confirm2fa(user.sub, body.code)
  }

  @Post('2fa/disable')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Disable user 2FA' })
  @ApiAccessCookieAuth()
  @ApiZodBody(Disable2faSchema)
  @ApiTwoFaEnabledResponse('2FA disable result.')
  disable2fa(@CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(Disable2faSchema)) body: { code: string }) {
    return this.usersAuthService.disable2fa(user.sub, body.code)
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Send user password reset code' })
  @ApiZodBody(ForgotPasswordSchema)
  @ApiOkResponse({
    description: 'Password reset initiation result.',
    schema: messageSchema('If that email exists, a reset code has been sent.'),
  })
  forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordSchema)) body: { email: string }) {
    return this.usersAuthService.forgotPassword(body.email)
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Reset user password' })
  @ApiZodBody(ResetPasswordSchema)
  @ApiOkResponse({
    description: 'Password reset result.',
    schema: messageSchema('Password has been reset successfully'),
  })
  resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: { email: string; code: string; password: string },
  ) {
    return this.usersAuthService.resetPassword(body.email, body.code, body.password)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh user auth session' })
  @ApiRefreshCookieAuth()
  @ApiUserAuthResultResponse('Rotates tokens and resets HTTP-only auth cookies.')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.usersAuthService.refresh(token)
    setAuthCookies(res, tokens, this.apiConfig.isProd)
    return { accountType: 'user' }
  }

  @Delete('logout')
  @ApiOperation({ summary: 'Logout user account' })
  @ApiOkResponse({ description: 'Clears HTTP-only auth cookies.', schema: messageSchema('Logged out') })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Best-effort session cleanup — always clear cookies even if token is invalid
    try {
      const token = (req.cookies as Record<string, string>)?.access_token
      if (token) {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token).catch(() => null)
        if (payload?.session_id) {
          await this.usersAuthService.logout(payload.session_id)
        }
      }
    } catch {
      /* best-effort cleanup */
    }
    clearAuthCookies(res, this.apiConfig.isProd)
    return { message: 'Logged out' }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get current user account' })
  @ApiAccessCookieAuth()
  @ApiUserMeResponse('Current user profile.')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.getMe(user.sub)
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'List active user sessions' })
  @ApiAccessCookieAuth()
  @ApiUserSessionsResponse('Active sessions.')
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.usersAuthService.getSessions(user.sub, user.session_id)
  }

  @Delete('sessions/:id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Revoke user session' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Session id')
  @ApiBody({ required: false, schema: { type: 'object', properties: { code: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Session revoked.', schema: messageSchema('Session revoked') })
  revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() body?: { code?: string },
    @Res({ passthrough: true }) res?: Response,
  ) {
    return this.usersAuthService.revokeSession(user.sub, sessionId, body?.code).then(() => {
      if (sessionId === user.session_id && res) {
        clearAuthCookies(res, this.apiConfig.isProd)
      }
      return { message: 'Session revoked' }
    })
  }
}
