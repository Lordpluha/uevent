import { z } from 'zod'

export const DEFAULT_API_PORT = 3000
export const DEFAULT_WEB_PORT = 5173
export const DEFAULT_API_URL = `http://localhost:${DEFAULT_API_PORT}`
export const DEFAULT_CLIENT_URL = `http://localhost:${DEFAULT_WEB_PORT}`
export const DEFAULT_GOOGLE_CALLBACK_PATH = '/auth/google/callback'
export const DEFAULT_GOOGLE_CALLBACK_URL = `${DEFAULT_API_URL}${DEFAULT_GOOGLE_CALLBACK_PATH}`
export const DEFAULT_JWT_SECRET = 'changeme'
export const DEFAULT_PAYMENT_CURRENCY = 'usd'
export const DEFAULT_PAYMENT_FEE_CENTS = 100 // $1 fee
export const DEFAULT_SMTP_FROM_EMAIL = 'noreply@uevent.app'

const toNumber = (fallback: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return fallback
    if (typeof value === 'number') return value
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }, z.number().int().positive())

const toBoolean = (fallback: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return fallback
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
    return value
  }, z.boolean())

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: toNumber(DEFAULT_API_PORT),
  CLIENT_URL: z.url().default(DEFAULT_CLIENT_URL),
  API_URL: z.url().default(DEFAULT_API_URL),

  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: toNumber(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  DB_SYNCHRONIZE: toBoolean(true),

  JWT_SECRET: z.string().min(1).default(DEFAULT_JWT_SECRET),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default(DEFAULT_GOOGLE_CALLBACK_URL),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_CURRENCY: z.string().min(1).default(DEFAULT_PAYMENT_CURRENCY),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().default(DEFAULT_SMTP_FROM_EMAIL),
})
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET === DEFAULT_JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be set to a strong non-default value in production',
        })
      }

      if (env.DB_SYNCHRONIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DB_SYNCHRONIZE'],
          message: 'DB_SYNCHRONIZE must be false in production',
        })
      }
    }
  })

export type EnvConfig = z.infer<typeof envSchema>

export const validateEnv = (config: Record<string, unknown>): EnvConfig => envSchema.parse(config)