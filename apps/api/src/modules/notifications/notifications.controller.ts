import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import {
  CreateNotificationDto,
  CreateNotificationDtoSchema,
  UpdateNotificationDto,
  UpdateNotificationDtoSchema,
} from './dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { GetNotificationsParamsDto, GetNotificationsParamsSchema } from './params'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateNotificationDtoSchema)) dto: CreateNotificationDto) {
    return this.notificationsService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetNotificationsParamsSchema)) query: GetNotificationsParamsDto) {
    return this.notificationsService.findAll(query)
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
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id)
  }
}
