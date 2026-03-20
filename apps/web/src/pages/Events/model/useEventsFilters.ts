import { useRef, useState } from 'react';
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

const FORMAT_VALUES = ['all', 'online', 'offline'] as const;

export type Format = (typeof FORMAT_VALUES)[number];

export const FORMAT_OPTIONS: { label: string; value: Format }[] = [
  { label: 'All', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
];



export function useAllTags() {
  const { data } = useEvents();
  const events = Array.isArray(data) ? data : [];
  return [...new Set(events.flatMap((e) => e.tags))].sort();
}


export function useAllCities() {
  const { data } = useEvents();
  const events = Array.isArray(data) ? data : [];
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
  const [locFrom, setLocFrom] = useQueryState('locFrom', parseAsString.withDefault(''));
  const [locTo, setLocTo] = useQueryState('locTo', parseAsString.withDefault(''));

  /* ── Local state ────────────────────────────────────────────────── */
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

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
    ...(dateFrom ? { dateFrom: dateFrom.toISOString() } : {}),
    ...(dateTo ? { dateTo: dateTo.toISOString() } : {}),
  };

  /* ── Desktop combobox anchors ───────────────────────────────────── */
  const tagsAnchor = useComboboxAnchor();
  const locFromAnchor = useRef<HTMLDivElement>(null);
  const locToAnchor = useRef<HTMLDivElement>(null);

  /* ── Mobile sheet combobox anchors ─────────────────────────────── */
  const sheetTagsAnchor = useComboboxAnchor();
  const sheetLocFromAnchor = useRef<HTMLDivElement>(null);
  const sheetLocToAnchor = useRef<HTMLDivElement>(null);

  /* ── Derived: active filter badge count ─────────────────────────── */
  const activeFilterCount = [
    format !== 'all',
    selectedTags.length > 0,
    !!dateRange?.from,
    locFrom !== '',
    locTo !== '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFormat('all');
    setSelectedTags([]);
    setDateFrom(null);
    setDateTo(null);
    setLocFrom('');
    setLocTo('');
  };

  const toggleBookmark = (id: string) =>
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return {
    /* URL state */
    query, setQuery,
    format, setFormat,
    selectedTags, setSelectedTags,
    dateRange, setDateRange,
    locFrom, setLocFrom,
    locTo, setLocTo,
    /* local state */
    bookmarked,
    /* derived */
    apiParams,
    activeFilterCount,
    clearAllFilters,
    toggleBookmark,
    /* anchors */
    tagsAnchor, locFromAnchor, locToAnchor,
    sheetTagsAnchor, sheetLocFromAnchor, sheetLocToAnchor,
  };
}
