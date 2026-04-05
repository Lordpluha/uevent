import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Event } from '../events/entities/event.entity'
import { Ticket } from './entities/ticket.entity'
import { TicketsController } from './tickets.controller'
import { TicketsService } from './tickets.service'
import { TicketsPrivateService } from './tickets-private.service'

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Event])],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsPrivateService],
  exports: [TicketsService, TicketsPrivateService, TypeOrmModule],
})
export class TicketsModule {}
