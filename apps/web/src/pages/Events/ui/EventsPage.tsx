import { useMemo } from 'react';
import { useEvents } from '@entities/Event';
import { useEventsFilters } from '../model/useEventsFilters';
import { EventsFilterBar } from './EventsFilterBar';
import { EventsMobileFilters } from './EventsMobileFilters';
import { EventsGrid } from './EventsGrid';

export function EventsPage() {
  const f = useEventsFilters();
  const { data: allEvents = [] } = useEvents(f.apiParams);

  /* client-side location filter (not yet in EventListParams) */
  const events = useMemo(
    () =>
      allEvents.filter((e) => {
        const matchesLocFrom =
          !f.locFrom ||
          e.locationFrom?.toLowerCase().includes(f.locFrom.toLowerCase()) ||
          e.location?.toLowerCase().includes(f.locFrom.toLowerCase());
        const matchesLocTo =
          !f.locTo ||
          e.locationTo?.toLowerCase().includes(f.locTo.toLowerCase()) ||
          e.location?.toLowerCase().includes(f.locTo.toLowerCase());
        return matchesLocFrom && matchesLocTo;
      }),
    [allEvents, f.locFrom, f.locTo],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Events</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover upcoming meetups, workshops &amp; conferences.
        </p>
      </div>

      <EventsFilterBar
        query={f.query} onQueryChange={f.setQuery}
        format={f.format} onFormatChange={f.setFormat}
        selectedTags={f.selectedTags} onTagsChange={f.setSelectedTags}
        dateRange={f.dateRange} onDateRangeChange={f.setDateRange}
        locFrom={f.locFrom} onLocFromChange={f.setLocFrom}
        locTo={f.locTo} onLocToChange={f.setLocTo}
        tagsAnchor={f.tagsAnchor}
        locFromAnchor={f.locFromAnchor}
        locToAnchor={f.locToAnchor}
      />

      <EventsMobileFilters
        query={f.query} onQueryChange={f.setQuery}
        format={f.format} onFormatChange={f.setFormat}
        selectedTags={f.selectedTags} onTagsChange={f.setSelectedTags}
        dateRange={f.dateRange} onDateRangeChange={f.setDateRange}
        locFrom={f.locFrom} onLocFromChange={f.setLocFrom}
        locTo={f.locTo} onLocToChange={f.setLocTo}
        activeFilterCount={f.activeFilterCount}
        onClearAll={f.clearAllFilters}
        resultCount={events.length}
        tagsAnchor={f.sheetTagsAnchor}
        locFromAnchor={f.sheetLocFromAnchor}
        locToAnchor={f.sheetLocToAnchor}
      />

      <EventsGrid
        events={events}
        bookmarked={f.bookmarked}
        onBookmark={f.toggleBookmark}
      />
    </main>
  );
}
