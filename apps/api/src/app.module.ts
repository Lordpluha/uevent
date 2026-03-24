import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './modules/users/users.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { TagsModule } from './modules/tags/tags.module'
import { EventsModule } from './modules/events/events.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'

@Module({
  imports: [
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
  ],
  controllers: [AppController],
})
export class AppModule {}
