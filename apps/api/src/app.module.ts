import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { UsersModule } from './modules/users/users.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { TagsModule } from './modules/tags/tags.module'
import { EventsModule } from './modules/events/events.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { AuthModule } from './modules/auth/auth.module'
import { TicketsModule } from './modules/tickets/tickets.module'
import { LocalizationModule } from './common/localization/localization.module'
import { ApiConfigModule } from './config/api-config.module'
import { ApiConfigService } from './config/api-config.service'

@Module({
  imports: [
    ApiConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: (apiConfig: ApiConfigService) => {
        const dbUrl = apiConfig.databaseUrl
        if (dbUrl) {
          return {
            type: 'postgres' as const,
            url: dbUrl,
            ssl: { rejectUnauthorized: false },
            synchronize: apiConfig.dbConfig.synchronize,
            autoLoadEntities: true,
          }
        }
        return {
          type: 'postgres' as const,
          host: apiConfig.dbConfig.host,
          port: apiConfig.dbConfig.port,
          username: apiConfig.dbConfig.username,
          password: apiConfig.dbConfig.password,
          database: apiConfig.dbConfig.database,
          synchronize: apiConfig.dbConfig.synchronize,
          autoLoadEntities: true,
        }
      },
    }),
    UsersModule,
    NotificationsModule,
    TagsModule,
    EventsModule,
    OrganizationsModule,
    PaymentsModule,
    AuthModule,
    TicketsModule,
    LocalizationModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
