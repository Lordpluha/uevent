import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common'
import { TagsService } from './tags.service'
import { CreateTagDto, CreateTagDtoSchema, UpdateTagDto, UpdateTagDtoSchema } from './dto'
import { GetTagsParams, GetTagsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateTagDtoSchema)) dto: CreateTagDto) {
    return this.tagsService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetTagsParamsSchema)) query: GetTagsParams) {
    return this.tagsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(UpdateTagDtoSchema)) dto: UpdateTagDto) {
    return this.tagsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id)
  }
}
