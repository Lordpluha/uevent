import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/event.api';
import type { EventListParams } from '../model/dtos';

export function useEvents(params?: EventListParams) {
  return useQuery({
    queryKey: ['events', params ?? {}],
    queryFn: () => eventsApi.getAll(params),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getOne(id),
    enabled: !!id,
  });
}
