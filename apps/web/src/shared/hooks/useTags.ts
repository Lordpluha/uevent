import { type TagsListParams, tagsApi } from '@shared/api/tags.api'
import { useQuery } from '@tanstack/react-query'

export function useTags(params?: TagsListParams) {
  return useQuery({
    queryKey: ['tags', params ?? {}],
    queryFn: () => tagsApi.getAll(params),
    select: (raw) => ({
      data: raw.data.map((t) => t.name),
      total: raw.meta.total,
      page: raw.meta.page,
      limit: raw.meta.limit,
      totalPages: raw.meta.total_pages,
    }),
  })
}
