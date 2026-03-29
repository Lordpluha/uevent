import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { TicketsService } from './tickets.service'
import { CreateTicketDto, CreateTicketDtoSchema } from './dto/create-ticket.dto'
import { UpdateTicketDto, UpdateTicketDtoSchema } from './dto/update-ticket.dto'
import { GetTicketsParams, GetTicketsParamsSchema } from './params/get-tickets.params'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body(new ZodValidationPipe(CreateTicketDtoSchema)) dto: CreateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.create(dto, user)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetTicketsParamsSchema)) query: GetTicketsParams) {
    return this.ticketsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTicketDtoSchema)) dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id)
  }
}
