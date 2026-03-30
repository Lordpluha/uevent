import { useRef } from 'react';
import {
  parseAsArrayOf,
  parseAsIsoDate,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import type { DateRange } from 'react-day-picker';
import { useComboboxAnchor } from '@shared/components';
import { useEvents } from '@entities/Event';
import type { EventListParams } from '@entities/Event';
import { FORMAT_VALUES, type Format } from '@features/EventsFilter';

export type { Format };
export { FORMAT_OPTIONS } from '@features/EventsFilter';



export function useAllTags() {
  const { data: result } = useEvents();
  const events = result?.data ?? [];
  return [...new Set(events.flatMap((e) => e.tags))].sort();
}


export function useAllCities() {
  const { data: result } = useEvents();
  const events = result?.data ?? [];
  return [
    ...new Set(
      events.flatMap((e) => [e.locationFrom, e.locationTo].filter(Boolean) as string[]),
    ),
  ].sort();
}

export function useEventsFilters() {
  /* ── URL state via nuqs ─────────────────────────────────────────── */
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [format, setFormat] = useQueryState(
    'format',
    parseAsStringLiteral(FORMAT_VALUES).withDefault('all'),
  );
  const [selectedTags, setSelectedTags] = useQueryState(
    'tags',
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', parseAsIsoDate);
  const [dateTo, setDateTo] = useQueryState('dateTo', parseAsIsoDate);
  const [location, setLocation] = useQueryState('location', parseAsString.withDefault(''));

  /* ── Derived: DateRange for <Calendar> ─────────────────────────── */
  const dateRange: DateRange | undefined =
    dateFrom || dateTo
      ? { from: dateFrom ?? undefined, to: dateTo ?? undefined }
      : undefined;

  const setDateRange = (range: DateRange | undefined) => {
    setDateFrom(range?.from ?? null);
    setDateTo(range?.to ?? null);
  };

  /* ── Derived: API params for useEvents() ────────────────────────── */
  const apiParams: EventListParams = {
    ...(query ? { search: query } : {}),
    ...(format !== 'all' ? { format } : {}),
    ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
    ...(dateFrom ? { date_from: dateFrom.toISOString() } : {}),
    ...(dateTo ? { date_to: dateTo.toISOString() } : {}),
    ...(location ? { location } : {}),
  };

  /* ── Desktop combobox anchors ───────────────────────────────────── */
  const tagsAnchor = useComboboxAnchor();
  const locationAnchor = useRef<HTMLDivElement>(null);

  /* ── Mobile sheet combobox anchors ─────────────────────────────── */
  const sheetTagsAnchor = useComboboxAnchor();
  const sheetLocationAnchor = useRef<HTMLDivElement>(null);

  /* ── Derived: active filter badge count ─────────────────────────── */
  const activeFilterCount = [
    format !== 'all',
    selectedTags.length > 0,
    !!dateRange?.from,
    location !== '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFormat('all');
    setSelectedTags([]);
    setDateFrom(null);
    setDateTo(null);
    setLocation('');
  };

  return {
    /* URL state */
    query, setQuery,
    format, setFormat,
    selectedTags, setSelectedTags,
    dateRange, setDateRange,
    location, setLocation,
    /* derived */
    apiParams,
    activeFilterCount,
    clearAllFilters,
    /* anchors */
    tagsAnchor, locationAnchor,
    sheetTagsAnchor, sheetLocationAnchor,
  };
}
