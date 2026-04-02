import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
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
    TypeOrmModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: (apiConfig: ApiConfigService) => ({
        type: 'postgres' as const,
        host: apiConfig.dbConfig.host,
        port: apiConfig.dbConfig.port,
        username: apiConfig.dbConfig.username,
        password: apiConfig.dbConfig.password,
        database: apiConfig.dbConfig.database,
        synchronize: apiConfig.dbConfig.synchronize,
        autoLoadEntities: true,
      }),
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
})
export class AppModule {}
