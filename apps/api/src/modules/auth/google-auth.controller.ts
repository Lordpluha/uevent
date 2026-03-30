import { Controller, Post, Get, UseGuards, Res, Req, Param, Query } from '@nestjs/common'
import { Request, Response } from 'express'
import { GoogleAuthService } from './google-auth.service'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { setAuthCookies } from '../../common/auth-cookie.util'

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get()
  async googleRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const accessToken = (req.cookies as Record<string, string>)?.access_token
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token
    const state = await this.googleAuthService.getLinkState(accessToken, refreshToken)
    const url = this.googleAuthService.getConsentUrl(state)
    res.redirect(url)
  }

  @Get('callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    if (!code) {
      const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
      res.redirect(`${clientUrl}?auth_error=no_code`)
      return
    }

    const result = await this.googleAuthService.handleCallback(code, state)
    if (!result.linked && !('requires2fa' in result)) {
      setAuthCookies(res, result.tokens)
    }

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
    if (!result.linked && 'requires2fa' in result && result.tempToken) {
      res.redirect(`${clientUrl}?auth=google_2fa&tempToken=${encodeURIComponent(result.tempToken)}`)
      return
    }
    const authQuery = result.linked ? 'google_linked' : 'google'
    res.redirect(`${clientUrl}?auth=${authQuery}`)
  }

  @Post('calendar/:eventId')
  @UseGuards(JwtGuard)
  addToCalendar(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.googleAuthService.addEventToCalendar(user.sub, eventId)
  }

  @Post('calendar/ticket/:ticketId')
  @UseGuards(JwtGuard)
  addTicketToCalendar(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
  ) {
    return this.googleAuthService.addTicketToCalendar(user.sub, ticketId)
  }
}
