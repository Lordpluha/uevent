import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TicketsController } from './tickets.controller'
import { TicketsService } from './tickets.service'
import { TicketsPrivateService } from './tickets-private.service'
import { Ticket } from './entities/ticket.entity'
import { Event } from '../events/entities/event.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Event])],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsPrivateService],
  exports: [TicketsService, TicketsPrivateService, TypeOrmModule],
})
export class TicketsModule {}
