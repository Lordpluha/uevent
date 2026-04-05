import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../api/event.api'
import type { EventListParams } from '../model/dtos'
import { mapApiEvent } from '../model/eventEntity'

export function useEvents(params?: EventListParams, enabled = true) {
  return useQuery({
    queryKey: ['events', params ?? {}],
    queryFn: () => eventsApi.getAll(params),
    enabled,
    select: (raw) => {
      const results = raw.data.map(mapApiEvent)
      const total = raw.meta?.total ?? results.length
      const page = raw.meta?.page ?? 1
      const limit = raw.meta?.limit ?? results.length
      const totalPages = raw.meta?.total_pages ?? 1

      return { data: results, total, page, limit, totalPages }
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getOne(id),
    enabled: !!id,
    select: mapApiEvent,
  })
}
