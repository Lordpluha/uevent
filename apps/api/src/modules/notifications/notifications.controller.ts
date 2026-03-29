import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards, ForbiddenException } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import {
  CreateNotificationDto,
  CreateNotificationDtoSchema,
  UpdateNotificationDto,
  UpdateNotificationDtoSchema,
} from './dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { GetNotificationsParamsDto, GetNotificationsParamsSchema } from './params'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateNotificationDtoSchema)) dto: CreateNotificationDto) {
    return this.notificationsService.create(dto)
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(GetNotificationsParamsSchema)) query: GetNotificationsParamsDto,
  ) {
    const limit = query.limit ?? 20
    const safeLimit = Math.min(limit, 50)

    if (user.type === 'user') {
      return this.notificationsService.findLatestByUser(user.sub, safeLimit)
    }

    if (user.type === 'organization') {
      return this.notificationsService.findLatestByOrganization(user.sub, safeLimit)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Get('user/:id')
  findByUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findByUser(id)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateNotificationDtoSchema)) dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, dto)
  }

  @Patch(':id/read')
  @UseGuards(JwtGuard)
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type === 'user') {
      return this.notificationsService.markAsReadForUser(id, user.sub)
    }

    if (user.type === 'organization') {
      return this.notificationsService.markAsReadForOrganization(id, user.sub)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id)
  }
}
