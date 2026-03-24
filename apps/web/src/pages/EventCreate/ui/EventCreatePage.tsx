import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { EventCreate } from '@features/EventCreate';

export function EventCreatePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to events
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Create event</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Organizer flow scaffold. Basic event creation fields are connected.
      </p>

      <EventCreate />
    </main>
  );
}
