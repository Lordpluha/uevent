import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import {
  ApiAcceptLanguageHeader,
  ApiAccessCookieAuth,
  ApiUuidParam,
  ApiZodBody,
  messageSchema,
  paginatedResponseSchema,
  ticketResponseSchema,
} from '../../common/swagger/openapi.util'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { Event } from '../events/entities/event.entity'
import { CreateTicketDto, CreateTicketDtoSchema } from './dto/create-ticket.dto'
import { UpdateTicketDto, UpdateTicketDtoSchema } from './dto/update-ticket.dto'
import { Ticket } from './entities/ticket.entity'
import { GetTicketsParams, GetTicketsParamsSchema } from './params/get-tickets.params'
import { TicketsService } from './tickets.service'

@Controller('tickets')
@ApiTags('Tickets')
@ApiExtraModels(Ticket, Event)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create ticket' })
  @ApiAccessCookieAuth()
  @ApiZodBody(CreateTicketDtoSchema)
  @ApiOkResponse({ description: 'Created ticket.', schema: ticketResponseSchema })
  create(@Body(new ZodValidationPipe(CreateTicketDtoSchema)) dto: CreateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.create(dto, user)
  }

  @Get()
  @ApiOperation({ summary: 'List tickets' })
  @ApiAcceptLanguageHeader()
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1, minimum: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } })
  @ApiQuery({ name: 'event_id', required: false, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ name: 'user_id', required: false, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ name: 'status', required: false, schema: { type: 'string' } })
  @ApiOkResponse({ description: 'Paginated list of tickets.', schema: paginatedResponseSchema(ticketResponseSchema) })
  findAll(
    @Query(new ZodValidationPipe(GetTicketsParamsSchema)) query: GetTicketsParams,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.ticketsService.findAll(query, acceptLanguage)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by id' })
  @ApiUuidParam('id', 'Ticket id')
  @ApiAcceptLanguageHeader()
  @ApiOkResponse({ description: 'Ticket details.', schema: ticketResponseSchema })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Headers('accept-language') acceptLanguage?: string) {
    return this.ticketsService.findOne(id, acceptLanguage)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update ticket' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Ticket id')
  @ApiZodBody(UpdateTicketDtoSchema)
  @ApiOkResponse({ description: 'Updated ticket.', schema: ticketResponseSchema })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTicketDtoSchema)) dto: UpdateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.update(id, dto, user)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete ticket' })
  @ApiAccessCookieAuth()
  @ApiUuidParam('id', 'Ticket id')
  @ApiOkResponse({ description: 'Ticket removed.', schema: messageSchema('Ticket removed') })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.remove(id, user)
  }
}
