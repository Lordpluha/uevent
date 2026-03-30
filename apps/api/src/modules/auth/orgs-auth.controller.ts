import { Controller, Post, Delete, Get, Body, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { Request, Response } from 'express'
import { z } from 'zod'
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
import { setAuthCookies, clearAuthCookies } from '../../common/auth-cookie.util'

const Verify2faSchema = z.object({ tempToken: z.string(), code: z.string().length(6) })
const Confirm2faSchema = z.object({ code: z.string().length(6) })
const Disable2faSchema = z.object({ code: z.string().length(6) })

@Controller('auth/organizations')
export class OrgsAuthController {
  constructor(private readonly orgsAuthService: OrgsAuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(CreateOrganizationDtoSchema)) dto: CreateOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.register(dto)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string })
    return { accountType: 'organization' }
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.orgsAuthService.login(dto)

    if ('requires2fa' in result) {
      return { requires2fa: true, tempToken: result.tempToken }
    }

    setAuthCookies(res, result as { access_token: string; refresh_token: string })
    return { accountType: 'organization' }
  }

  @Post('2fa/verify')
  async verify2fa(
    @Body(new ZodValidationPipe(Verify2faSchema)) body: { tempToken: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.verify2fa(body.tempToken, body.code)
    setAuthCookies(res, tokens as { access_token: string; refresh_token: string })
    return { accountType: 'organization' }
  }

  @Post('2fa/setup')
  @UseGuards(JwtGuard)
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.orgsAuthService.setup2fa(user.sub as string)
  }

  @Post('2fa/confirm')
  @UseGuards(JwtGuard)
  confirm2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Confirm2faSchema)) body: { code: string },
  ) {
    return this.orgsAuthService.confirm2fa(user.sub as string, body.code)
  }

  @Post('2fa/disable')
  @UseGuards(JwtGuard)
  disable2fa(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(Disable2faSchema)) body: { code: string },
  ) {
    return this.orgsAuthService.disable2fa(user.sub as string, body.code)
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.orgsAuthService.refresh(token)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
  }

  @Delete('logout')
  @UseGuards(JwtGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.orgsAuthService.logout(user.session_id as string)
    clearAuthCookies(res)
    return { message: 'Logged out' }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.orgsAuthService.getMe(user.sub as string)
  }

  @Post('settings/profile')
  @UseGuards(JwtGuard)
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrgProfileDtoSchema)) dto: UpdateOrgProfileDto,
  ) {
    return this.orgsAuthService.updateProfile(user.sub as string, dto)
  }

  @Post('settings/email')
  @UseGuards(JwtGuard)
  updateEmail(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrgEmailDtoSchema)) dto: UpdateOrgEmailDto,
  ) {
    return this.orgsAuthService.updateEmail(user.sub as string, dto)
  }

  @Post('settings/password')
  @UseGuards(JwtGuard)
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(ChangeOrgPasswordDtoSchema)) dto: ChangeOrgPasswordDto,
  ) {
    return this.orgsAuthService.changePassword(user.sub as string, dto)
  }
}

