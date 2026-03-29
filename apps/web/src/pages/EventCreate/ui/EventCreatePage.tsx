import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { EventCreate } from '@features/EventCreate';
import { useAuth } from '@shared/lib/auth-context';
import { useMyOrg } from '@entities/Organization';

export function EventCreatePage() {
  const { isAuthenticated, accountType } = useAuth();
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgFromQuery = searchParams.get('organizationId') ?? undefined;

  if (!isAuthenticated || accountType !== 'organization') {
    return <Navigate to="/" replace />;
  }

  if (myOrgLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  const defaultOrganizationId = orgFromQuery ?? myOrg?.id;

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
        Build the event in one flow: essentials, format details, map/online link and publishing metadata.
      </p>

      <EventCreate
        defaultOrganizationId={defaultOrganizationId}
        lockOrganization
        onSuccess={(eventId) => {
          toast.success('Event created');
          navigate(`/events/${eventId}`);
        }}
      />
    </main>
  );
}
