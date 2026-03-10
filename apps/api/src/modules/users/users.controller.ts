import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto, CreateUserDtoSchema, UpdateUserDto, UpdateUserDtoSchema } from './dto'
import { GetUsersParams, GetUsersParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateUserDtoSchema)) dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetUsersParamsSchema)) query: GetUsersParams) {
    return this.usersService.findAll(query)
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
