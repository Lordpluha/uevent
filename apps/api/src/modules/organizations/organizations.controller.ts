import { Controller, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards, ForbiddenException, Get, Body, Post, UseInterceptors, UploadedFile, BadRequestException, Headers } from '@nestjs/common'
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
import { ApiBadRequestResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { ApiConfigService } from '../../config/api-config.service'
import { ApiAcceptLanguageHeader, ApiAccessCookieAuth, ApiMultipartFile, ApiUuidParam, ApiZodBody, messageSchema, organizationResponseSchema, paginatedResponseSchema } from '../../common/swagger/openapi.util'
import { Organization } from './entities/organization.entity'

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
  @ApiOkResponse({ description: 'Paginated list of organizations.', schema: paginatedResponseSchema(organizationResponseSchema) })
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
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.organizationsService.findOne(id, undefined, acceptLanguage)
  }

  @Get(':id/following')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Check whether current user follows organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({ description: 'Follow state.', schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] } })
  isFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
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
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
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
  @ApiOkResponse({ description: 'Organization logo URL.', schema: { type: 'object', properties: { avatarUrl: { type: 'string' } }, required: ['avatarUrl'] } })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'storage', 'organizations'),
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

    const base = this.apiConfig.apiUrl
    const avatarUrl = `${base}/storage/organizations/${file.filename}`
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
  @ApiOkResponse({ description: 'Organization cover URL.', schema: { type: 'object', properties: { coverUrl: { type: 'string' } }, required: ['coverUrl'] } })
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: join(process.cwd(), 'storage', 'organizations'),
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

    const base = this.apiConfig.apiUrl
    const coverUrl = `${base}/storage/organizations/${file.filename}`
    await this.organizationsService.setCover(id, coverUrl)
    return { coverUrl }
  }

  @Post(':id/follow')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Follow organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({ description: 'Updated follow state.', schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] } })
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
  @ApiOperation({ summary: 'Unfollow organization' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Organization id')
  @ApiOkResponse({ description: 'Updated follow state.', schema: { type: 'object', properties: { followed: { type: 'boolean' } }, required: ['followed'] } })
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
