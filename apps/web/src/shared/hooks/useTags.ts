import { useQuery } from '@tanstack/react-query';
import { tagsApi, type TagsListParams } from '@shared/api/tags.api';

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
  });
}
