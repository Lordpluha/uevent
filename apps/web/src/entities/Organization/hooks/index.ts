import { useAuth } from '@shared/lib/auth-context'
import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organization.api'
import type { OrganizationListParams } from '../model/dtos'
import { mapApiOrganization } from '../model/organizationEntity'

export function useOrgs(params?: OrganizationListParams, enabled = true) {
  return useQuery({
    queryKey: ['organizations', params ?? {}],
    queryFn: () => organizationsApi.getAll(params),
    enabled,
    select: (raw) => {
      const results = raw.data.map(mapApiOrganization)
      const total = raw.meta?.total ?? results.length
      const page = raw.meta?.page ?? 1
      const limit = raw.meta?.limit ?? results.length
      const totalPages = raw.meta?.total_pages ?? 1

      return { data: results, total, page, limit, totalPages }
    },
  })
}

export function useOrg(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsApi.getOne(id),
    enabled: !!id,
    select: mapApiOrganization,
  })
}

export function useMyOrg() {
  const { isAuthenticated, accountType } = useAuth()
  return useQuery({
    queryKey: ['myOrg'],
    queryFn: () => organizationsApi.getMe(),
    enabled: isAuthenticated && accountType === 'organization',
    select: mapApiOrganization,
  })
}
