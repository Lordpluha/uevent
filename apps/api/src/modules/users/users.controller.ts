import { Controller, Get, Param, Delete, ParseUUIDPipe, Query, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Patch, Body, ForbiddenException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { UsersService } from './users.service'
import { GetUsersParams, GetUsersParamsSchema } from './params'
import { UpdateUserDto, UpdateUserDtoSchema } from './dto/update-user.dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { ApiBadRequestResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { ApiConfigService } from '../../config/api-config.service'
import { ApiAccessCookieAuth, ApiMultipartFile, ApiUuidParam, ApiZodBody, messageSchema, paginatedResponseSchema, userResponseSchema } from '../../common/swagger/openapi.util'
import { User } from './entities/user.entity'

@Controller('users')
@ApiTags('Users')
@ApiExtraModels(User)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiOkResponse({ description: 'Paginated list of users.', schema: paginatedResponseSchema(userResponseSchema) })
  findAll(@Query(new ZodValidationPipe(GetUsersParamsSchema)) query: GetUsersParams) {
    return this.usersService.findAll(query)
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total user count' })
  @ApiOkResponse({ description: 'Total number of registered users.', schema: { type: 'object', properties: { count: { type: 'integer' } } } })
  count() {
    return this.usersService.count()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiUuidParam('id', 'User id')
  @ApiOkResponse({ description: 'User details.', schema: userResponseSchema })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete own user profile' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'User id')
  @ApiOkResponse({ description: 'User removed.', schema: messageSchema('User removed') })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user' || user.sub !== id) {
      throw new ForbiddenException('You can delete only your user profile')
    }
    return this.usersService.remove(id)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update own user profile' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'User id')
  @ApiZodBody(UpdateUserDtoSchema)
  @ApiOkResponse({ description: 'Updated user profile.', schema: userResponseSchema })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateUserDtoSchema)) dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user' || user.sub !== id) {
      throw new ForbiddenException('You can update only your user profile')
    }
    return this.usersService.update(id, dto)
  }

  @Post('me/avatar')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Upload own avatar' })
  @ApiAccessCookieAuth()
  @ApiMultipartFile('avatar', false, 'User avatar image.')
  @ApiBadRequestResponse({ description: 'Invalid file payload.' })
  @ApiOkResponse({ description: 'Avatar URL.', schema: { type: 'object', properties: { avatarUrl: { type: 'string' } }, required: ['avatarUrl'] } })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: join(process.cwd(), 'storage', 'users'),
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
  async uploadMyAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.type !== 'user') {
      throw new BadRequestException('Only user accounts can upload profile avatars')
    }
    if (!file) throw new BadRequestException('No file uploaded')

    const base = this.apiConfig.apiUrl
    const avatarUrl = `${base}/storage/users/${file.filename}`
    await this.usersService.setAvatar(user.sub, avatarUrl)
    return { avatarUrl }
  }
}
