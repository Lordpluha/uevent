import type { Response } from 'express'

const IS_PROD = process.env.NODE_ENV === 'production'
const ACCESS_MAX_AGE = 15 * 60 * 1000        // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
}

export const setAuthCookies = (
  res: Response,
  tokens: { access_token: string; refresh_token: string },
) => {
  res.cookie('access_token', tokens.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  })
  res.cookie('refresh_token', tokens.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  })
}

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', COOKIE_OPTIONS)
  res.clearCookie('refresh_token', COOKIE_OPTIONS)
}
