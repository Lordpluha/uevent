import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards, ForbiddenException } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { PushNotificationService } from './push-notification.service'
import {
  CreateNotificationDto,
  CreateNotificationDtoSchema,
  UpdateNotificationDto,
  UpdateNotificationDtoSchema,
} from './dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { GetNotificationsParamsDto, GetNotificationsParamsSchema } from './params'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { ApiAccessCookieAuth, ApiUuidParam, ApiZodBody, messageSchema, notificationResponseSchema } from '../../common/swagger/openapi.util'
import { Notification } from './entities/notification.entity'

@Controller('notifications')
@ApiTags('Notifications')
@ApiExtraModels(Notification)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushNotificationService,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create notification for current account' })
  @ApiAccessCookieAuth()
  @ApiZodBody(CreateNotificationDtoSchema)
  @ApiOkResponse({ description: 'Created notification.', schema: notificationResponseSchema })
  create(
    @Body(new ZodValidationPipe(CreateNotificationDtoSchema)) dto: CreateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type === 'user') {
      if (dto.user_id && dto.user_id !== user.sub) {
        throw new ForbiddenException('You can create notifications only for your account')
      }

      if (dto.organization_id) {
        throw new ForbiddenException('User accounts cannot create organization notifications')
      }

      return this.notificationsService.create({
        ...dto,
        user_id: user.sub,
        organization_id: null,
      })
    }

    if (user.type === 'organization') {
      if (dto.organization_id && dto.organization_id !== user.sub) {
        throw new ForbiddenException('You can create notifications only for your organization account')
      }

      if (dto.user_id) {
        throw new ForbiddenException('Organization accounts cannot create user notifications')
      }

      return this.notificationsService.create({
        ...dto,
        user_id: null,
        organization_id: user.sub,
      })
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'List notifications for current account' })
  @ApiAccessCookieAuth()
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiOkResponse({ description: 'Notifications for current account.', schema: { type: 'object', properties: { data: { type: 'array', items: notificationResponseSchema }, meta: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, total_pages: { type: 'integer' } } } } } })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(GetNotificationsParamsSchema)) query: GetNotificationsParamsDto,
  ) {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const safeLimit = Math.min(limit, 50)

    if (user.type === 'user') {
      return this.notificationsService.findLatestByUser(user.sub, safeLimit, page)
    }

    if (user.type === 'organization') {
      return this.notificationsService.findLatestByOrganization(user.sub, safeLimit, page)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Get('user/:id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'List notifications for the current user account by id' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'User id')
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiOkResponse({ description: 'Notifications for the user.', schema: { type: 'object', properties: { data: { type: 'array', items: notificationResponseSchema }, meta: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, total_pages: { type: 'integer' } } } } } })
  findByUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(GetNotificationsParamsSchema)) query: GetNotificationsParamsDto,
  ) {
    if (user.type !== 'user' || user.sub !== id) {
      throw new ForbiddenException('You can view only your notifications')
    }

    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const safeLimit = Math.min(limit, 50)

    return this.notificationsService.findLatestByUser(id, safeLimit, page)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get notification by id' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Notification id')
  @ApiOkResponse({ description: 'Notification details.', schema: notificationResponseSchema })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type === 'user') {
      return this.notificationsService.findOneForUser(id, user.sub)
    }

    if (user.type === 'organization') {
      return this.notificationsService.findOneForOrganization(id, user.sub)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update notification' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Notification id')
  @ApiZodBody(UpdateNotificationDtoSchema)
  @ApiOkResponse({ description: 'Updated notification.', schema: notificationResponseSchema })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateNotificationDtoSchema)) dto: UpdateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type === 'user') {
      return this.notificationsService.updateForUser(id, user.sub, dto)
    }

    if (user.type === 'organization') {
      return this.notificationsService.updateForOrganization(id, user.sub, dto)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  @Patch(':id/read')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Notification id')
  @ApiOkResponse({ description: 'Updated notification.', schema: notificationResponseSchema })
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
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Notification id')
  @ApiOkResponse({ description: 'Notification removed.', schema: messageSchema('Notification removed') })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type === 'user') {
      return this.notificationsService.removeForUser(id, user.sub)
    }

    if (user.type === 'organization') {
      return this.notificationsService.removeForOrganization(id, user.sub)
    }

    throw new ForbiddenException('Unsupported account type')
  }

  // ── Push subscription ─────────────────────────────────────

  @Get('push/vapid-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiOkResponse({ description: 'VAPID public key.', schema: { type: 'object', properties: { publicKey: { type: 'string', nullable: true } } } })
  getVapidPublicKey() {
    return { publicKey: this.pushService.vapidPublicKey }
  }

  @Post('push/subscription')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Register a browser push subscription' })
  @ApiAccessCookieAuth()
  @ApiOkResponse({ description: 'Subscription saved.', schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
  async savePushSubscription(
    @Body() body: { endpoint: string; p256dh: string; auth: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') throw new ForbiddenException('Only user accounts can register push subscriptions')
    await this.pushService.saveSubscription(user.sub, body.endpoint, body.p256dh, body.auth)
    return { success: true }
  }

  @Delete('push/subscription')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Unregister a browser push subscription' })
  @ApiAccessCookieAuth()
  @ApiOkResponse({ description: 'Subscription removed.', schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
  async deletePushSubscription(
    @Body() body: { endpoint: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') throw new ForbiddenException('Only user accounts can unregister push subscriptions')
    await this.pushService.deleteSubscription(user.sub, body.endpoint)
    return { success: true }
  }
}
