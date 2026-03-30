import { useEffect, useMemo, useRef } from 'react';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import { BadgeCheck, Search } from 'lucide-react';
import { OrgCard, useOrgs } from '@entities/Organization';
import {
  Input,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components';
import { useAppContext } from '@shared/lib';

const PAGE_SIZE = 12;

function getPaginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export function OrgsPage() {
  const { t } = useAppContext();
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'));
  const [verifiedOnly, setVerifiedOnly] = useQueryState('verified', parseAsBoolean.withDefault(false));
  const [pageParam, setPageParam] = useQueryState('page', parseAsString.withDefault('1'));
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);

  const { data: orgsResult } = useOrgs({
    ...(query ? { search: query } : {}),
    ...(category !== 'all' ? { category } : {}),
    ...(verifiedOnly ? { verified: true } : {}),
    page,
    limit: PAGE_SIZE,
  });
  const allOrgs = orgsResult?.data ?? [];
  const total = orgsResult?.total ?? allOrgs.length;
  const totalPages = Math.max(1, orgsResult?.totalPages ?? 1);
  const hasMeta = typeof orgsResult?.totalPages === 'number';

  const filtersSignature = `${query}::${category}::${verifiedOnly ? '1' : '0'}`;
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

  const allCategories = useMemo(
    () => [
      { value: 'all', label: t.filters.all },
      ...[...new Set(allOrgs.map((org) => org.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .map((item) => ({ value: item, label: item })),
    ],
    [allOrgs, t.filters.all],
  );

  const filtered = allOrgs;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.organizations.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.organizations.subtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.organizations.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full pl-9"
          />
        </div>

        {/* Category pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
          {allCategories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
              }`}
            >
              {cat.label}
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
          {t.common.verified}
        </button>
      </div>

      {/* Results count */}
      <p className="mb-6 text-xs text-muted-foreground">
        {total} {t.organizations.found}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <span className="text-5xl">🏛️</span>
          <p className="text-base font-semibold text-foreground">{t.organizations.noOrgs}</p>
          <p className="text-sm text-muted-foreground">{t.organizations.noOrgsTip}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => (
              <OrgCard key={org.id} {...org} />
            ))}
          </div>

          {totalPages > 1 && (
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
        </>
      )}
    </main>
  );
}
