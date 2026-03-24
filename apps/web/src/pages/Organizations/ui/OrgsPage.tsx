import { useMemo } from 'react';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import { BadgeCheck, Search } from 'lucide-react';
import { OrgCard, useOrgs } from '@entities/Organization';

export function OrgsPage() {
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('All'));
  const [verifiedOnly, setVerifiedOnly] = useQueryState('verified', parseAsBoolean.withDefault(false));

  const { data: catalogOrgs = [] } = useOrgs();
  const { data: allOrgs = [] } = useOrgs({
    ...(query ? { search: query } : {}),
    ...(category !== 'All' ? { category } : {}),
  });

  const allCategories = useMemo(
    () =>
      ['All', ...new Set(catalogOrgs.map((org) => org.category).filter(Boolean))].sort((a, b) =>
        a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b),
      ),
    [catalogOrgs],
  );

  /* client-side verified filter (not in OrganizationListParams) */
  const filtered = useMemo(
    () => (verifiedOnly ? allOrgs.filter((o) => o.verified) : allOrgs),
    [allOrgs, verifiedOnly],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover communities, clubs and groups organizing events near you.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verified toggle */}
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            verifiedOnly
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified
        </button>
      </div>

      {/* Results count */}
      <p className="mb-6 text-xs text-muted-foreground">
        {filtered.length} organization{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <span className="text-5xl">🏛️</span>
          <p className="text-base font-semibold text-foreground">No organizations found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <OrgCard key={org.id} {...org} />
          ))}
        </div>
      )}
    </main>
  );
}
