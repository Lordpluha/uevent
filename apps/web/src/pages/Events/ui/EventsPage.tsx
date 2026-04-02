import { useEffect, useMemo, useRef } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { useEvents } from '@entities/Event';
import { useTags } from '@shared/hooks/useTags';
import { useEventsFilters } from '../model/useEventsFilters';
import { EventsFilterBar, EventsMobileFilters } from '@features/EventsFilter';
import { useAppContext } from '@shared/lib';
import { EventsGrid } from './EventsGrid';
import { JsonLd,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components';
import { SITE_URL } from '@shared/config/app';

const PAGE_SIZE = 12;

function getPaginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export function EventsPage() {
  const { t } = useAppContext();
  const f = useEventsFilters();
  const [pageParam, setPageParam] = useQueryState('page', parseAsString.withDefault('1'));
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);
  const { data: result, isLoading } = useEvents({ ...f.apiParams, page, limit: PAGE_SIZE });
  const allEvents = result?.data ?? [];
  const total = result?.total ?? allEvents.length;
  const totalPages = Math.max(1, result?.totalPages ?? 1);
  const hasMeta = typeof result?.totalPages === 'number';

  const filtersSignature = useMemo(
    () => JSON.stringify({
      query: f.query,
      format: f.format,
      selectedTags: [...f.selectedTags].sort(),
      dateFrom: f.dateRange?.from?.toISOString() ?? null,
      dateTo: f.dateRange?.to?.toISOString() ?? null,
      location: f.location,
    }),
    [f.query, f.format, f.selectedTags, f.dateRange?.from, f.dateRange?.to, f.location],
  );
  const previousFiltersSignature = useRef(filtersSignature);

  useEffect(() => {
    if (hasMeta && page > totalPages) {
      setPageParam(String(totalPages));
    }
  }, [hasMeta, page, setPageParam, totalPages]);

  useEffect(() => {
    if (previousFiltersSignature.current === filtersSignature) return;
    previousFiltersSignature.current = filtersSignature;
    if (page !== 1) setPageParam('1');
  }, [filtersSignature, page, setPageParam]);

  const { data: tagsResult } = useTags({ limit: 100 });
  const filterTags = tagsResult?.data ?? [];

  const filterCities = useMemo(
    () =>
      [
        ...new Set(
          allEvents.flatMap((event) =>
            [event.locationFrom, event.locationTo, event.location].filter(Boolean) as string[],
          ),
        ),
      ].sort(),
    [allEvents],
  );

  const events = allEvents;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Events',
          url: `${SITE_URL}/events`,
          numberOfItems: total,
          itemListElement: allEvents.map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/events/${event.id}`,
            name: event.title,
          })),
        }}
      />
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.events.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.events.subtitle}
        </p>
      </div>

      <EventsFilterBar
        query={f.query} onQueryChange={f.setQuery}
        format={f.format} onFormatChange={f.setFormat}
        selectedTags={f.selectedTags} onTagsChange={f.setSelectedTags}
        dateRange={f.dateRange} onDateRangeChange={f.setDateRange}
        location={f.location} onLocationChange={f.setLocation}
        tagsAnchor={f.tagsAnchor}
        locationAnchor={f.locationAnchor}
        tags={filterTags}
        cities={filterCities}
      />

      <EventsMobileFilters
        query={f.query} onQueryChange={f.setQuery}
        format={f.format} onFormatChange={f.setFormat}
        selectedTags={f.selectedTags} onTagsChange={f.setSelectedTags}
        dateRange={f.dateRange} onDateRangeChange={f.setDateRange}
        location={f.location} onLocationChange={f.setLocation}
        activeFilterCount={f.activeFilterCount}
        onClearAll={f.clearAllFilters}
        resultCount={total}
        tagsAnchor={f.sheetTagsAnchor}
        locationAnchor={f.sheetLocationAnchor}
        tags={filterTags}
        cities={filterCities}
      />

      <EventsGrid
        events={events}
        isLoading={isLoading}
      />

      {!isLoading && events.length > 0 && totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPageParam(String(page - 1));
                }}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>

            {getPaginationItems(page, totalPages).map((item, index) => (
              <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
                {item === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPageParam(String(item));
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPageParam(String(page + 1));
                }}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {!isLoading && events.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t.events.pagination.replace('{{page}}', String(page)).replace('{{totalPages}}', String(totalPages)).replace('{{total}}', String(total))}
        </p>
      )}
    </main>
  );
}
