import { Controller, Get, Param, Delete, ParseUUIDPipe, Query, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Patch, Body, ForbiddenException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { UsersService } from './users.service'
import { GetUsersParams, GetUsersParamsSchema } from './params'
import { UpdateUserDto, UpdateUserDtoSchema } from './dto/update-user.dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(GetUsersParamsSchema)) query: GetUsersParams) {
    return this.usersService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
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
  @UseInterceptors(
    FileInterceptor('avatar', {
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
  async uploadMyAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.type !== 'user') {
      throw new BadRequestException('Only user accounts can upload profile avatars')
    }
    if (!file) throw new BadRequestException('No file uploaded')

    const base = process.env.API_URL ?? 'http://localhost:3000'
    const avatarUrl = `${base}/uploads/${file.filename}`
    await this.usersService.setAvatar(user.sub, avatarUrl)
    return { avatarUrl }
  }
}
