import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import {
  CreateOrganizationDto,
  CreateOrganizationDtoSchema,
  UpdateOrganizationDto,
  UpdateOrganizationDtoSchema,
} from './dto'
import { GetOrganizationsParams, GetOrganizationsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateOrganizationDtoSchema)) dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetOrganizationsParamsSchema)) query: GetOrganizationsParams) {
    return this.organizationsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrganizationDtoSchema)) dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id)
  }
}
