import { useState } from 'react';
import { Link } from 'react-router';
import { Search } from 'lucide-react';
import { EventCard } from '@entities/Event';
import { MOCK_EVENTS } from '@shared/mocks/mock-events';

type Format = 'all' | 'online' | 'offline';

const FILTERS: { label: string; value: Format }[] = [
  { label: 'All', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
];

export function EventsPage() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<Format>('all');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchesFormat = format === 'all' || e.format === format;
    const matchesQuery =
      e.title.toLowerCase().includes(query.toLowerCase()) || e.organizer.toLowerCase().includes(query.toLowerCase());
    return matchesFormat && matchesQuery;
  });

  const toggleBookmark = (id: string) =>
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Events</h1>
        <p className="mt-2 text-sm text-muted-foreground">Discover upcoming meetups, workshops &amp; conferences.</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                format === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-base font-semibold text-foreground">No events found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="group block">
              <EventCard
                {...event}
                isBookmarked={bookmarked.has(event.id) || event.isBookmarked}
                onBookmark={() => toggleBookmark(event.id)}
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
