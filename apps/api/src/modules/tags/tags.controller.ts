import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import {
  ApiAccessCookieAuth,
  ApiUuidParam,
  ApiZodBody,
  paginatedResponseSchema,
  tagResponseSchema,
} from '../../common/swagger/openapi.util'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CreateTagDto, CreateTagDtoSchema, FindOrCreateTagsDto, FindOrCreateTagsDtoSchema } from './dto'
import { Tag } from './entities/tag.entity'
import { GetTagsParams, GetTagsParamsSchema } from './params'
import { TagsService } from './tags.service'

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
}
