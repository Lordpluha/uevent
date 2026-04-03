import { Controller, Post, Delete, Get, Body, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { Request, Response } from 'express'
import { z } from 'zod'
import { Throttle } from '@nestjs/throttler'
import { OrgsAuthService } from './orgs-auth.service'
import { LoginDto, LoginDtoSchema } from './dto/login.dto'
import {
  ChangeOrgPasswordDto,
  ChangeOrgPasswordDtoSchema,
  UpdateOrgEmailDto,
  UpdateOrgEmailDtoSchema,
  UpdateOrgProfileDto,
  UpdateOrgProfileDtoSchema,
} from './dto/org-settings.dto'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { CreateOrganizationDto, CreateOrganizationDtoSchema } from '../organizations/dto/create-organization.dto'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationAuthSuccessModel, TwoFaEnabledModel, TwoFaRequiredModel, TwoFaSetupModel } from './openapi.models'
import { setAuthCookies, clearAuthCookies } from '../../common/auth-cookie.util'
import { ApiConfigService } from '../../config/api-config.service'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiAccessCookieAuth, ApiRefreshCookieAuth, ApiZodBody, messageSchema } from '../../common/swagger/openapi.util'
import { ApiOrganizationAuthResultResponse, ApiOrganizationMeResponse, ApiTwoFaEnabledResponse, ApiTwoFaSetupResponse } from './decorators/swagger'

const Verify2faSchema = z.object({ tempToken: z.string(), code: z.string().length(6) })
const Confirm2faSchema = z.object({ code: z.string().length(6) })
const Disable2faSchema = z.object({ code: z.string().length(6) })

@Controller('auth/organizations')
@ApiTags('Auth: Organizations')
@ApiExtraModels(Organization, OrganizationAuthSuccessModel, TwoFaRequiredModel, TwoFaSetupModel, TwoFaEnabledModel)
export class OrgsAuthController {
  constructor(
    private readonly orgsAuthService: OrgsAuthService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Register organization account' })
  @ApiZodBody(CreateOrganizationDtoSchema)
  @ApiOrganizationAuthResultResponse('Registers the organization and sets HTTP-only auth cookies.')
  async register(
    @Body(new ZodValidationPipe(CreateOrganizationDtoSchema)) dto: CreateOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.register(dto)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'organization' }
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login organization account' })
  @ApiZodBody(LoginDtoSchema)
  @ApiOrganizationAuthResultResponse('Logs in organization account or returns 2FA temp token.')
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.orgsAuthService.login(dto)

    if ('requires2fa' in result) {
      return { requires2fa: true, tempToken: result.tempToken }
    }

    setAuthCookies(res, result as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'organization' }
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify organization login 2FA challenge' })
  @ApiZodBody(Verify2faSchema)
  @ApiOrganizationAuthResultResponse('Completes 2FA login and sets HTTP-only auth cookies.')
  async verify2fa(
    @Body(new ZodValidationPipe(Verify2faSchema)) body: { tempToken: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.verify2fa(body.tempToken, body.code)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string }, this.apiConfig.isProd)
    return { accountType: 'organization' }
  }

  @Post('2fa/setup')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Start organization 2FA setup' })
  @ApiAccessCookieAuth()
  @ApiTwoFaSetupResponse('2FA setup payload.')
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.orgsAuthService.setup2fa(user.sub as string)
  }

  @Post('2fa/confirm')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Confirm organization 2FA setup' })
  @ApiAccessCookieAuth()
  @ApiZodBody(Confirm2faSchema)
  @ApiTwoFaEnabledResponse('2FA confirmation result.')
  confirm2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Confirm2faSchema)) body: { code: string },
  ) {
    return this.orgsAuthService.confirm2fa(user.sub as string, body.code)
  }

  @Post('2fa/disable')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Disable organization 2FA' })
  @ApiAccessCookieAuth()
  @ApiZodBody(Disable2faSchema)
  @ApiTwoFaEnabledResponse('2FA disable result.')
  disable2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Disable2faSchema)) body: { code: string },
  ) {
    return this.orgsAuthService.disable2fa(user.sub as string, body.code)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh organization auth session' })
  @ApiRefreshCookieAuth()
  @ApiOrganizationAuthResultResponse('Rotates tokens and resets HTTP-only auth cookies.')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.orgsAuthService.refresh(token)
    setAuthCookies(res, tokens, this.apiConfig.isProd)
    return { accountType: 'organization' }
  }

  @Delete('logout')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Logout organization account' })
  @ApiAccessCookieAuth()
  @ApiOkResponse({ description: 'Clears HTTP-only auth cookies.', schema: messageSchema('Logged out') })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.orgsAuthService.logout(user.session_id as string)
    clearAuthCookies(res, this.apiConfig.isProd)
    return { message: 'Logged out' }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get current organization account' })
  @ApiAccessCookieAuth()
  @ApiOrganizationMeResponse('Current organization profile.')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.orgsAuthService.getMe(user.sub as string)
  }

  @Post('settings/profile')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update organization profile settings' })
  @ApiAccessCookieAuth()
  @ApiZodBody(UpdateOrgProfileDtoSchema)
  @ApiOrganizationMeResponse('Updated organization profile.')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrgProfileDtoSchema)) dto: UpdateOrgProfileDto,
  ) {
    return this.orgsAuthService.updateProfile(user.sub as string, dto)
  }

  @Post('settings/email')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update organization email' })
  @ApiAccessCookieAuth()
  @ApiZodBody(UpdateOrgEmailDtoSchema)
  @ApiOrganizationMeResponse('Updated organization email.')
  updateEmail(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrgEmailDtoSchema)) dto: UpdateOrgEmailDto,
  ) {
    return this.orgsAuthService.updateEmail(user.sub as string, dto)
  }

  @Post('settings/password')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Change organization password' })
  @ApiAccessCookieAuth()
  @ApiZodBody(ChangeOrgPasswordDtoSchema)
  @ApiOkResponse({ description: 'Password change result.', schema: messageSchema('Password updated') })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(ChangeOrgPasswordDtoSchema)) dto: ChangeOrgPasswordDto,
  ) {
    return this.orgsAuthService.changePassword(user.sub as string, dto)
  }
}

