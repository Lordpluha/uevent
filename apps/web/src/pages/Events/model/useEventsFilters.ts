import type { EventListParams } from '@entities/Event'
import { useEvents } from '@entities/Event'
import { FORMAT_VALUES, type Format } from '@features/EventsFilter'
import { useComboboxAnchor } from '@shared/components'
import { parseAsArrayOf, parseAsIsoDate, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useRef } from 'react'
import type { DateRange } from 'react-day-picker'

export { FORMAT_OPTIONS } from '@features/EventsFilter'
export type { Format }

const SORT_BY_VALUES = ['date', 'name', 'attendees'] as const
const SORT_ORDER_VALUES = ['asc', 'desc'] as const
export type SortBy = (typeof SORT_BY_VALUES)[number]
export type SortOrder = (typeof SORT_ORDER_VALUES)[number]

export function useAllTags() {
  const { data: result } = useEvents()
  const events = result?.data ?? []
  return [...new Set(events.flatMap((e) => e.tags))].sort()
}

export function useAllCities() {
  const { data: result } = useEvents()
  const events = result?.data ?? []
  return [...new Set(events.flatMap((e) => [e.locationFrom, e.locationTo].filter(Boolean) as string[]))].sort()
}

export function useEventsFilters() {
  /* ── URL state via nuqs ─────────────────────────────────────────── */
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''))
  const [format, setFormat] = useQueryState('format', parseAsStringLiteral(FORMAT_VALUES).withDefault('all'))
  const [selectedTags, setSelectedTags] = useQueryState('tags', parseAsArrayOf(parseAsString).withDefault([]))
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', parseAsIsoDate)
  const [dateTo, setDateTo] = useQueryState('dateTo', parseAsIsoDate)
  const [location, setLocation] = useQueryState('location', parseAsString.withDefault(''))
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsStringLiteral(SORT_BY_VALUES).withDefault('date'))
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsStringLiteral(SORT_ORDER_VALUES).withDefault('asc'),
  )

  /* ── Derived: DateRange for <Calendar> ─────────────────────────── */
  const dateRange: DateRange | undefined =
    dateFrom || dateTo ? { from: dateFrom ?? undefined, to: dateTo ?? undefined } : undefined

  const setDateRange = (range: DateRange | undefined) => {
    setDateFrom(range?.from ?? null)
    setDateTo(range?.to ?? null)
  }

  /* ── Derived: API params for useEvents() ────────────────────────── */
  const apiParams: EventListParams = {
    ...(query ? { search: query } : {}),
    ...(format !== 'all' ? { format } : {}),
    ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
    ...(dateFrom ? { date_from: dateFrom.toISOString() } : {}),
    ...(dateTo ? { date_to: dateTo.toISOString() } : {}),
    ...(location ? { location } : {}),
    sort_by: sortBy,
    sort_order: sortOrder,
  }

  /* ── Desktop combobox anchors ───────────────────────────────────── */
  const tagsAnchor = useComboboxAnchor()
  const locationAnchor = useRef<HTMLDivElement>(null)

  /* ── Mobile sheet combobox anchors ─────────────────────────────── */
  const sheetTagsAnchor = useComboboxAnchor()
  const sheetLocationAnchor = useRef<HTMLDivElement>(null)

  /* ── Derived: active filter badge count ─────────────────────────── */
  const activeFilterCount = [format !== 'all', selectedTags.length > 0, !!dateRange?.from, location !== ''].filter(
    Boolean,
  ).length

  const clearAllFilters = () => {
    setFormat('all')
    setSelectedTags([])
    setDateFrom(null)
    setDateTo(null)
    setLocation('')
    setSortBy('date')
    setSortOrder('asc')
  }

  return {
    /* URL state */
    query,
    setQuery,
    format,
    setFormat,
    selectedTags,
    setSelectedTags,
    dateRange,
    setDateRange,
    location,
    setLocation,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    /* derived */
    apiParams,
    activeFilterCount,
    clearAllFilters,
    /* anchors */
    tagsAnchor,
    locationAnchor,
    sheetTagsAnchor,
    sheetLocationAnchor,
  }
}
