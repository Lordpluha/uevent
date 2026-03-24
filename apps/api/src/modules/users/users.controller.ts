import { Controller, Get, Patch, Body, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { UpdateUserDto, UpdateUserDtoSchema } from './dto'
import { GetUsersParams, GetUsersParamsSchema } from './params'
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

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(Number(user.sub))
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(UpdateUserDtoSchema)) dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }
}
