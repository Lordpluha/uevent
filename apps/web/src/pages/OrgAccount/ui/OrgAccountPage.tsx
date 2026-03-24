import { Link, useParams } from 'react-router';
import { Building2, ChevronLeft, Pencil } from 'lucide-react';
import { useOrg } from '@entities/Organization';
import { Button } from '@shared/components';

export function OrgAccountPage() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, isError } = useOrg(id ?? '');

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading organization profile...</p>
      </main>
    );
  }

  if (!org || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization profile unavailable</h1>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          ← Back to organizations
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to={`/organizations/${org.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to public org page
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Organization account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Personal organization profile/dashboard scaffold.
      </p>

      <section className="mt-6 space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="h-4 w-4 text-primary" />
          {org.title}
        </div>
        <p className="text-sm text-muted-foreground">Category: {org.category}</p>
        <p className="text-sm text-muted-foreground">Location: {org.location ?? 'Not set'}</p>

        <div className="pt-2">
          <Link to={`/organizations/${org.id}/edit`}>
            <Button variant="outline" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit organization profile
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
