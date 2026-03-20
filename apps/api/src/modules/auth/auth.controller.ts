import { Controller, Post, Delete, Get, Body, UseGuards, Res, Req, Param, Query, UnauthorizedException } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { Request, Response } from 'express'
import { UsersAuthService } from './users-auth.service'
import { OrgsAuthService } from './orgs-auth.service'
import { GoogleAuthService } from './google-auth.service'
import { LoginDto, LoginDtoSchema } from './dto/login.dto'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { CreateUserDto, CreateUserDtoSchema } from '../users/dto/create-user.dto'
import { CreateOrganizationDto, CreateOrganizationDtoSchema } from '../organizations/dto/create-organization.dto'
import { setAuthCookies, clearAuthCookies } from '../../common/auth-cookie.util'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersAuthService: UsersAuthService,
    private readonly orgsAuthService: OrgsAuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  // Users

  @Post('users/register')
  async userRegister(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.usersAuthService.register(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'user' }
  }

  @Post('users/login')
  async userLogin(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.usersAuthService.login(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'user' }
  }

  @Post('users/refresh')
  async userRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.usersAuthService.refresh(token)
    setAuthCookies(res, tokens)
    return { accountType: 'user' }
  }

  @Delete('users/logout')
  @UseGuards(JwtGuard)
  async userLogout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersAuthService.logout(user.session_id as number)
    clearAuthCookies(res)
    return { message: 'Logged out' }
  }

  // Organizations

  @Post('organizations/register')
  async orgRegister(
    @Body(new ZodValidationPipe(CreateOrganizationDtoSchema)) dto: CreateOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.register(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
  }

  @Post('organizations/login')
  async orgLogin(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.orgsAuthService.login(dto)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
  }

  @Post('organizations/refresh')
  async orgRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token
    if (!token) throw new UnauthorizedException('No refresh token')
    const tokens = await this.orgsAuthService.refresh(token)
    setAuthCookies(res, tokens)
    return { accountType: 'organization' }
  }

  @Delete('organizations/logout')
  @UseGuards(JwtGuard)
  async orgLogout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.orgsAuthService.logout(user.session_id as string)
    clearAuthCookies(res)
    return { message: 'Logged out' }
  }

  // Google OAuth

  @Get('google')
  async googleRedirect(@Res() res: Response) {
    const url = this.googleAuthService.getConsentUrl()
    res.redirect(url)
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    if (!code) {
      const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
      res.redirect(`${clientUrl}?auth_error=no_code`)
      return
    }

    const tokens = await this.googleAuthService.handleCallback(code)
    setAuthCookies(res, tokens)

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
    res.redirect(`${clientUrl}?auth=google`)
  }

  // Google Calendar

  @Post('google/calendar/:eventId')
  @UseGuards(JwtGuard)
  async addToGoogleCalendar(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.googleAuthService.addEventToCalendar(user.sub as number, eventId)
  }
}
