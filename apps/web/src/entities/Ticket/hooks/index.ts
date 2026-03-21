import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticket.api';
import type { TicketListParams } from '../model/dtos';

export function useTickets(params?: TicketListParams) {
  return useQuery({
    queryKey: ['tickets', params ?? {}],
    queryFn: () => ticketsApi.getAll(params),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getOne(id),
    enabled: !!id,
  });
}
