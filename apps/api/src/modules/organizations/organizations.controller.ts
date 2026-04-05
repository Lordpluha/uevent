import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBadRequestResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { memoryStorage } from 'multer'
import { ZodValidationPipe } from 'nestjs-zod'
import { ALLOWED_IMAGE_MIMES, mimeToExt } from '../../common/file-upload.util'
import {
  ApiAcceptLanguageHeader,
  ApiAccessCookieAuth,
  ApiMultipartFile,
  ApiUuidParam,
  ApiZodBody,
  messageSchema,
  organizationResponseSchema,
  paginatedResponseSchema,
} from '../../common/swagger/openapi.util'
import { ApiConfigService } from '../../config/api-config.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { UpdateOrganizationDto, UpdateOrganizationDtoSchema } from './dto'
import { Organization } from './entities/organization.entity'
import { OrganizationsService } from './organizations.service'
import { GetOrganizationsParams, GetOrganizationsParamsSchema } from './params'

const STORAGE_ROOT = process.env.VERCEL ? '/tmp/storage' : join(process.cwd(), 'storage')

@Controller('organizations')
@ApiTags('Organizations')
@ApiExtraModels(Organization)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiAcceptLanguageHeader()
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiQuery({ name: 'category', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'verified', required: false, schema: { type: 'boolean' } })
  @ApiQuery({ name: 'search', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'tags', required: false, isArray: true, schema: { type: 'array', items: { type: 'string' } } })
  @ApiQuery({ name: 'city', required: false, schema: { type: 'string' } })
  @ApiOkResponse({
    description: 'Paginated list of organizations.',
    schema: paginatedResponseSchema(organizationResponseSchema),
  })
  findAll(
    @Query(new ZodValidationPipe(GetOrganizationsParamsSchema)) query: GetOrganizationsParams,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.organizationsService.findAll(query, acceptLanguage)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by id' })
  @ApiUuidParam('id', 'Organization id')
  @ApiAcceptLanguageHeader()
  @ApiOkResponse({ description: 'Organization details.', schema: organizationResponseSchema })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Headers('accept-language') acceptLanguage?: string) {
    return this.organizationsService.findOne(id, undefined, acceptLanguage)
  }

  @Get(':id/following')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Check whether current user follows organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({
    description: 'Follow state.',
    schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] },
  })
  isFollowing(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (user.type !== 'user') return { followed: false }
    return this.organizationsService.isFollowing(id, user.sub)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update organization profile' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiZodBody(UpdateOrganizationDtoSchema)
  @ApiOkResponse({ description: 'Updated organization.', schema: organizationResponseSchema })
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
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({ description: 'Organization deleted.', schema: messageSchema('Organization deleted') })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (user.type !== 'organization' || user.sub !== id) {
      throw new ForbiddenException('You can delete only your organization profile')
    }
    return this.organizationsService.remove(id)
  }

  @Post(':id/logo')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Upload organization logo' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiMultipartFile('logo', false, 'Organization logo image.')
  @ApiBadRequestResponse({ description: 'Invalid file payload.' })
  @ApiOkResponse({
    description: 'Organization logo URL.',
    schema: { type: 'object', properties: { avatarUrl: { type: 'string' } }, required: ['avatarUrl'] },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, GIF, WEBP and AVIF files are allowed'), false)
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

    const dir = join(STORAGE_ROOT, 'organizations')
    mkdirSync(dir, { recursive: true })
    const filename = `${randomUUID()}${mimeToExt(file.mimetype)}`
    writeFileSync(join(dir, filename), file.buffer)
    const base = this.apiConfig.apiUrl
    const avatarUrl = `${base}/storage/organizations/${filename}`
    await this.organizationsService.setAvatar(id, avatarUrl)
    return { avatarUrl }
  }

  @Post(':id/cover')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Upload organization cover' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiMultipartFile('cover', false, 'Organization cover image.')
  @ApiBadRequestResponse({ description: 'Invalid file payload.' })
  @ApiOkResponse({
    description: 'Organization cover URL.',
    schema: { type: 'object', properties: { coverUrl: { type: 'string' } }, required: ['coverUrl'] },
  })
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, GIF, WEBP and AVIF files are allowed'), false)
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

    const dir = join(STORAGE_ROOT, 'organizations')
    mkdirSync(dir, { recursive: true })
    const filename = `${randomUUID()}${mimeToExt(file.mimetype)}`
    writeFileSync(join(dir, filename), file.buffer)
    const base = this.apiConfig.apiUrl
    const coverUrl = `${base}/storage/organizations/${filename}`
    await this.organizationsService.setCover(id, coverUrl)
    return { coverUrl }
  }

  @Post(':id/follow')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Follow organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({
    description: 'Updated follow state.',
    schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] },
  })
  follow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only users can follow organizations')
    }
    return this.organizationsService.follow(id, user.sub)
  }

  @Delete(':id/follow')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Unfollow organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({
    description: 'Updated follow state.',
    schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] },
  })
  unfollow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only users can follow organizations')
    }
    return this.organizationsService.unfollow(id, user.sub)
  }
}
