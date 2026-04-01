import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { TagsService } from './tags.service'
import { CreateTagDto, CreateTagDtoSchema, UpdateTagDto, UpdateTagDtoSchema, FindOrCreateTagsDto, FindOrCreateTagsDtoSchema } from './dto'
import { GetTagsParams, GetTagsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { ApiAccessCookieAuth, ApiUuidParam, ApiZodBody, messageSchema, paginatedResponseSchema, tagResponseSchema } from '../../common/swagger/openapi.util'
import { Tag } from './entities/tag.entity'

@Controller('tags')
@ApiTags('Tags')
@ApiExtraModels(Tag)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create tag' })
  @ApiAccessCookieAuth()
  @ApiZodBody(CreateTagDtoSchema)
  @ApiOkResponse({ description: 'Created tag.', schema: tagResponseSchema })
  create(@Body(new ZodValidationPipe(CreateTagDtoSchema)) dto: CreateTagDto) {
    return this.tagsService.create(dto)
  }

  @Post('find-or-create')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Find existing tags or create missing ones' })
  @ApiAccessCookieAuth()
  @ApiZodBody(FindOrCreateTagsDtoSchema)
  @ApiOkResponse({ description: 'Resolved tags.', schema: { type: 'array', items: tagResponseSchema } })
  findOrCreate(@Body(new ZodValidationPipe(FindOrCreateTagsDtoSchema)) dto: FindOrCreateTagsDto) {
    return this.tagsService.findOrCreateByNames(dto.names)
  }

  @Get()
  @ApiOperation({ summary: 'List tags' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiQuery({ name: 'search', required: false, schema: { type: 'string' } })
  @ApiOkResponse({ description: 'Paginated list of tags.', schema: paginatedResponseSchema(tagResponseSchema) })
  findAll(@Query(new ZodValidationPipe(GetTagsParamsSchema)) query: GetTagsParams) {
    return this.tagsService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by id' })
  @ApiUuidParam('id', 'Tag id')
  @ApiOkResponse({ description: 'Tag details.', schema: tagResponseSchema })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update tag' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Tag id')
  @ApiZodBody(UpdateTagDtoSchema)
  @ApiOkResponse({ description: 'Updated tag.', schema: tagResponseSchema })
  update(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(UpdateTagDtoSchema)) dto: UpdateTagDto) {
    return this.tagsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete tag' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Tag id')
  @ApiOkResponse({ description: 'Tag removed.', schema: messageSchema('Tag removed') })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id)
  }
}
