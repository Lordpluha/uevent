import { Controller, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards, ForbiddenException, Get, Body, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { OrganizationsService } from './organizations.service'
import {
  UpdateOrganizationDto,
  UpdateOrganizationDtoSchema,
} from './dto'
import { GetOrganizationsParams, GetOrganizationsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(GetOrganizationsParamsSchema)) query: GetOrganizationsParams) {
    return this.organizationsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id)
  }

  @Get(':id/following')
  @UseGuards(JwtGuard)
  isFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') return { followed: false }
    return this.organizationsService.isFollowing(id, user.sub)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrganizationDtoSchema)) dto: UpdateOrganizationDto,
  ) {
    if (user.type !== 'organization' || user.sub !== id) {
      throw new ForbiddenException('You can update only your organization profile')
    }
    return this.organizationsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id)
  }

  @Post(':id/logo')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.type !== 'organization' || user.sub !== id) {
      throw new ForbiddenException('You can update only your organization assets')
    }
    if (!file) throw new BadRequestException('No file uploaded')

    const base = process.env.API_URL ?? 'http://localhost:3000'
    const avatarUrl = `${base}/uploads/${file.filename}`
    await this.organizationsService.setAvatar(id, avatarUrl)
    return { avatarUrl }
  }

  @Post(':id/cover')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCover(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.type !== 'organization' || user.sub !== id) {
      throw new ForbiddenException('You can update only your organization assets')
    }
    if (!file) throw new BadRequestException('No file uploaded')

    const base = process.env.API_URL ?? 'http://localhost:3000'
    const coverUrl = `${base}/uploads/${file.filename}`
    await this.organizationsService.setCover(id, coverUrl)
    return { coverUrl }
  }

  @Post(':id/follow')
  @UseGuards(JwtGuard)
  follow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only users can follow organizations')
    }
    return this.organizationsService.follow(id, user.sub)
  }

  @Delete(':id/follow')
  @UseGuards(JwtGuard)
  unfollow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only users can follow organizations')
    }
    return this.organizationsService.unfollow(id, user.sub)
  }
}
