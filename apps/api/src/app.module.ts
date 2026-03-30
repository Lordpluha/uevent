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
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
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
