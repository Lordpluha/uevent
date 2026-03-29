import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { EventsService } from './events.service'
import { CreateEventDto, CreateEventDtoSchema, UpdateEventDto, UpdateEventDtoSchema } from './dto'
import { GetEventsParams, GetEventsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateEventDtoSchema)) dto: CreateEventDto) {
    return this.eventsService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetEventsParamsSchema)) query: GetEventsParams) {
    return this.eventsService.findAll(query)
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEventDtoSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.remove(id)
  }

  @Post(':id/cover')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`)
        },
      }),
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
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded')
    const base = process.env.API_URL ?? 'http://localhost:3000'
    const imageUrls = files.map((f) => `${base}/uploads/${f.filename}`)
    return this.eventsService.addGalleryImages(id, imageUrls)
  }
}
