import { Controller, Post, Delete, Get, Body, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { Request, Response } from 'express'
import { OrgsAuthService } from './orgs-auth.service'
import { LoginDto, LoginDtoSchema } from './dto/login.dto'
import {
  ChangeOrgPasswordDto,
  ChangeOrgPasswordDtoSchema,
  UpdateOrgEmailDto,
  UpdateOrgEmailDtoSchema,
  UpdateOrgProfileDto,
  UpdateOrgProfileDtoSchema,
  UpdateOrgSecurityDto,
  UpdateOrgSecurityDtoSchema,
} from './dto/org-settings.dto'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { CreateOrganizationDto, CreateOrganizationDtoSchema } from '../organizations/dto/create-organization.dto'
import { setAuthCookies, clearAuthCookies } from '../../common/auth-cookie.util'

@Controller('auth/organizations')
export class OrgsAuthController {
  constructor(private readonly orgsAuthService: OrgsAuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(CreateOrganizationDtoSchema)) dto: CreateOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.register(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.login(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
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

  @Post('settings/security')
  @UseGuards(JwtGuard)
  updateSecurity(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrgSecurityDtoSchema)) dto: UpdateOrgSecurityDto,
  ) {
    return this.orgsAuthService.updateSecurity(user.sub as string, dto)
  }
}
