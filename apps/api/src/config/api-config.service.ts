import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EnvConfig } from './env.schema'

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get port(): number {
    return this.configService.get('PORT', { infer: true })
  }

  get clientUrl(): string {
    return this.configService.get('CLIENT_URL', { infer: true })
  }

  get apiUrl(): string {
    return this.configService.get('API_URL', { infer: true })
  }

  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true })
  }

  get googleConfig() {
    return {
      clientId: this.configService.get('GOOGLE_CLIENT_ID', { infer: true }) ?? '',
      clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET', { infer: true }) ?? '',
      callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL', { infer: true }),
    }
  }

  get stripeConfig() {
    return {
      secretKey: this.configService.get('STRIPE_SECRET_KEY', { infer: true }) ?? '',
      webhookSecret: this.configService.get('STRIPE_WEBHOOK_SECRET', { infer: true }) ?? '',
    }
  }

  get paymentCurrency(): string {
    return this.configService.get('PAYMENT_CURRENCY', { infer: true }).toLowerCase()
  }

  get paymentFeeCents(): number {
    return 100 // $1 fixed fee
  }

  get smtpConfig() {
    return {
      host: this.configService.get('SMTP_HOST', { infer: true }),
      port: this.configService.get('SMTP_PORT', { infer: true }),
      user: this.configService.get('SMTP_USER', { infer: true }),
      pass: this.configService.get('SMTP_PASS', { infer: true }),
      fromEmail: this.configService.get('SMTP_FROM_EMAIL', { infer: true }),
    }
  }

  get nodeEnv(): EnvConfig['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true })
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production'
  }

  get dbConfig() {
    return {
      host: this.configService.get('POSTGRES_HOST', { infer: true }),
      port: this.configService.get('POSTGRES_PORT', { infer: true }),
      username: this.configService.get('POSTGRES_USER', { infer: true }),
      password: this.configService.get('POSTGRES_PASSWORD', { infer: true }),
      database: this.configService.get('POSTGRES_DB', { infer: true }),
      synchronize: this.configService.get('DB_SYNCHRONIZE', { infer: true }),
    }
  }
}