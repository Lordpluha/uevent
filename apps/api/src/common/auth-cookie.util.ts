import type { Response } from 'express'

const ACCESS_MAX_AGE = 15 * 60 * 1000        // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

const buildCookieOptions = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
})

export const setAuthCookies = (
  res: Response,
  tokens: { access_token: string; refresh_token: string },
  isProd: boolean,
) => {
  const cookieOptions = buildCookieOptions(isProd)
  res.cookie('access_token', tokens.access_token, {
    ...cookieOptions,
    maxAge: ACCESS_MAX_AGE,
  })
  res.cookie('refresh_token', tokens.refresh_token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  })
}

export const clearAuthCookies = (res: Response, isProd: boolean) => {
  const cookieOptions = buildCookieOptions(isProd)
  res.clearCookie('access_token', cookieOptions)
  res.clearCookie('refresh_token', cookieOptions)
}
