import { Controller, Post, Get, UseGuards, Res, Req, Param, Query } from '@nestjs/common'
import { Request, Response } from 'express'
import { GoogleAuthService } from './google-auth.service'
import { JwtGuard } from './guards/jwt.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { JwtPayload } from './types/jwt-payload.interface'
import { setAuthCookies } from '../../common/auth-cookie.util'
import { ApiConfigService } from '../../config/api-config.service'
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiAccessCookieAuth, calendarEventCreateResponseSchema } from '../../common/swagger/openapi.util'

@Controller('auth/google')
@ApiTags('Auth: Google')
export class GoogleAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Start Google OAuth flow' })
  @ApiOkResponse({ description: 'Redirects to Google consent screen. May use existing HTTP-only auth cookies to link an account.' })
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
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiQuery({ name: 'code', required: true, schema: { type: 'string' } })
  @ApiQuery({ name: 'state', required: false, schema: { type: 'string' } })
  @ApiOkResponse({ description: 'Processes Google callback and redirects back to the client application.' })
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    if (!code) {
      const clientUrl = this.apiConfig.clientUrl
      res.redirect(`${clientUrl}?auth_error=no_code`)
      return
    }

    const result = await this.googleAuthService.handleCallback(code, state)
    if (!result.linked && !('requires2fa' in result)) {
      setAuthCookies(res, result.tokens, this.apiConfig.isProd)
    }

    const clientUrl = this.apiConfig.clientUrl
    if (!result.linked && 'requires2fa' in result && result.tempToken) {
      res.redirect(`${clientUrl}?auth=google_2fa&tempToken=${encodeURIComponent(result.tempToken)}`)
      return
    }
    const authQuery = result.linked ? 'google_linked' : 'google'
    res.redirect(`${clientUrl}?auth=${authQuery}`)
  }

  @Post('calendar/:eventId')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Add event to Google Calendar' })
  @ApiAccessCookieAuth()
  @ApiParam({ name: 'eventId', description: 'Event id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ description: 'Calendar event creation result.', schema: calendarEventCreateResponseSchema })
  addToCalendar(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.googleAuthService.addEventToCalendar(user.sub, eventId)
  }

  @Post('calendar/ticket/:ticketId')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Add ticket to Google Calendar' })
  @ApiAccessCookieAuth()
  @ApiParam({ name: 'ticketId', description: 'Ticket id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ description: 'Calendar event creation result.', schema: calendarEventCreateResponseSchema })
  addTicketToCalendar(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
  ) {
    return this.googleAuthService.addTicketToCalendar(user.sub, ticketId)
  }
}
