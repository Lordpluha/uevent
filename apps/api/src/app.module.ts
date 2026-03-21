import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './modules/users/users.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { TagsModule } from './modules/tags/tags.module'
import { EventsModule } from './modules/events/events.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'uevent',
      password: 'uevent',
      database: 'uevent',
      synchronize: true,
      autoLoadEntities: true,
    }),
    UsersModule,
    NotificationsModule,
    TagsModule,
    EventsModule,
    OrganizationsModule,
    PaymentsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
