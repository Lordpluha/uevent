import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseInterceptors, UploadedFiles, BadRequestException, Headers, UseGuards, ForbiddenException } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { writeFileSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { EventsService } from './events.service'
import { CreateEventDto, CreateEventDtoSchema, UpdateEventDto, UpdateEventDtoSchema } from './dto'
import { GetEventsParams, GetEventsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'
import { ApiBadRequestResponse, ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiConfigService } from '../../config/api-config.service'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { ApiAcceptLanguageHeader, ApiAccessCookieAuth, ApiMultipartFile, ApiUuidParam, ApiZodBody, eventResponseSchema, messageSchema, paginatedResponseSchema } from '../../common/swagger/openapi.util'
import { Event } from './entities/event.entity'
import { Tag } from '../tags/entities/tag.entity'
import { Ticket } from '../tickets/entities/ticket.entity'

const STORAGE_ROOT = process.env.VERCEL ? '/tmp/storage' : join(process.cwd(), 'storage')

@Controller('events')
@ApiTags('Events')
@ApiExtraModels(Event, Tag, Ticket)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create event' })
  @ApiAccessCookieAuth()
  @ApiZodBody(CreateEventDtoSchema)
  @ApiCreatedResponse({ description: 'Event created successfully.', schema: eventResponseSchema })
  create(
    @Body(new ZodValidationPipe(CreateEventDtoSchema)) dto: CreateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organizations can create events')
    }

    return this.eventsService.create(dto, user)
  }

  @Get()
  @ApiOperation({ summary: 'List events' })
  @ApiAcceptLanguageHeader()
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiQuery({ name: 'search', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'format', required: false, enum: ['online', 'offline'] })
  @ApiQuery({ name: 'tags', required: false, isArray: true, schema: { type: 'array', items: { type: 'string' } } })
  @ApiQuery({ name: 'date_from', required: false, schema: { type: 'string', format: 'date-time' } })
  @ApiQuery({ name: 'date_to', required: false, schema: { type: 'string', format: 'date-time' } })
  @ApiQuery({ name: 'location', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'location_from', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'location_to', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'organization_id', required: false, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ name: 'user_id', required: false, schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ description: 'Paginated list of events.', schema: paginatedResponseSchema(eventResponseSchema) })
  findAll(
    @Query(new ZodValidationPipe(GetEventsParamsSchema)) query: GetEventsParams,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.eventsService.findAll(query, acceptLanguage)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiUuidParam('id', 'Event id')
  @ApiAcceptLanguageHeader()
  @ApiOkResponse({ description: 'Event details.', schema: eventResponseSchema })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.eventsService.findOne(id, acceptLanguage)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update event' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiZodBody(UpdateEventDtoSchema)
  @ApiOkResponse({ description: 'Updated event.', schema: eventResponseSchema })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEventDtoSchema)) dto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, dto, user)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete event' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiOkResponse({ description: 'Event deleted.', schema: messageSchema('Event deleted') })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.remove(id, user)
  }

  @Post(':id/cover')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Upload event images' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiMultipartFile('images', true, 'One or more event images.')
  @ApiBadRequestResponse({ description: 'Invalid file payload.' })
  @ApiOkResponse({ description: 'Updated event with gallery images.', schema: eventResponseSchema })
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    }),
  )
  uploadCover(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded')
    const dir = join(STORAGE_ROOT, 'events')
    mkdirSync(dir, { recursive: true })
    const base = this.apiConfig.apiUrl
    const imageUrls = files.map((f) => {
      const filename = `${randomUUID()}${extname(f.originalname)}`
      writeFileSync(join(dir, filename), f.buffer)
      return `${base}/storage/events/${filename}`
    })
    return this.eventsService.addGalleryImages(id, imageUrls, user)
  }

  @Post(':id/subscribe')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Subscribe to event notifications' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiCreatedResponse({ description: 'Subscribed.', schema: messageSchema('Subscribed') })
  subscribe(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.subscribe(id, user.sub)
  }

  @Delete(':id/subscribe')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Unsubscribe from event notifications' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiOkResponse({ description: 'Unsubscribed.', schema: messageSchema('Unsubscribed') })
  unsubscribe(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.unsubscribe(id, user.sub)
  }

  @Get(':id/subscription')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Check subscription status for event' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Event id')
  @ApiOkResponse({ description: 'Subscription status.', schema: { type: 'object', properties: { subscribed: { type: 'boolean' } } } })
  getSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.getSubscription(id, user.sub)
  }
}
