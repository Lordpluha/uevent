import { Link } from 'react-router';
import { ArrowRight, Briefcase, Camera, CheckCircle2, Code2, Globe, Landmark, MonitorPlay, Music2, Search, Ticket, Users } from 'lucide-react';
import { EventCard } from '@entities/Event';
import { useEvents } from '@entities/Event';
import { useOrgs, OrgCard } from '@entities/Organization';
import { useAppContext } from '@shared/lib';
import { Badge, buttonVariants } from '@shared/components';
import { cn } from '@shared/lib/utils';
import { useCountUp } from '@shared/hooks/useCountUp';
/* ── static data ──────────────────────────────────────────── */

const CATEGORIES = [
  { label: 'Technology', icon: Code2, color: 'text-violet-400' },
  { label: 'Design', icon: MonitorPlay, color: 'text-blue-400' },
  { label: 'Music', icon: Music2, color: 'text-pink-400' },
  { label: 'Business', icon: Briefcase, color: 'text-amber-400' },
  { label: 'Photography', icon: Camera, color: 'text-red-400' },
  { label: 'Networking', icon: Users, color: 'text-green-400' },
  { label: 'Culture', icon: Landmark, color: 'text-orange-400' },
  { label: 'Online', icon: Globe, color: 'text-cyan-400' },
] as const;

const HOW_ICONS = [Search, Users, Ticket] as const;



/* ── animated stat counter ──────────────────────────────────── */

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { value: displayed, ref } = useCountUp<HTMLSpanElement>(value, { duration: 1600 });
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        ref={ref}
        className="tabular-nums text-4xl font-extrabold tracking-tight text-primary transition-all"
      >
        {displayed.toLocaleString()}{suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export { HomePage };

function HomePage() {
  const { t } = useAppContext();
  const h = t.home;
  const { data: eventsResult, isLoading: eventsLoading } = useEvents({ page: 1, limit: 5 });
  const events = eventsResult?.data ?? [];

  const { data: orgsResult, isLoading: orgsLoading } = useOrgs({ page: 1, limit: 6 });
  const orgs = orgsResult?.data ?? [];

  const stats = {
    events: eventsResult?.total ?? 0,
    organizations: orgsResult?.total ?? 0,
    members: events.reduce((sum, event) => sum + (event.attendeeCount ?? 0), 0),
  };

  return (
    <main className="flex flex-col">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-28 pt-32 text-center">
        {/* layered gradient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-b from-primary/20 via-background/60 to-background" />
          <div className="absolute left-1/2 top-0 h-160 w-250 -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <Badge variant="secondary" className="mb-6 px-3 py-1 text-xs font-semibold tracking-widest uppercase">
          🎉 uevent — the event platform
        </Badge>

        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          {h.hero.headline}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{h.hero.subheadline}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/events"
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'gap-2 px-8 text-sm font-semibold')}
          >
            {h.hero.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/events/create"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-8 text-sm font-semibold')}
          >
            {h.hero.ctaHost}
          </Link>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-card/40 px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-around gap-8">
          {eventsLoading || orgsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-10 w-20 animate-pulse rounded-md bg-border/40" />
                <div className="h-3 w-16 animate-pulse rounded bg-border/30" />
              </div>
            ))
          ) : (
            <>
              <StatCounter value={stats.events} suffix="+" label={h.stats.events} />
              <StatCounter value={stats.organizations} suffix="+" label={h.stats.organizations} />
              <StatCounter value={stats.members} suffix="+" label={h.stats.attendees} />
            </>
          )}
        </div>
      </section>

      {/* ── TRENDING EVENTS ──────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{h.trending.title}</h2>
            <Link to="/events" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {h.trending.browseAll}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* horizontal scroll row */}
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {eventsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-56 w-64 shrink-0 animate-pulse rounded-xl bg-border/30" />
              ))
            ) : events.length === 0 ? (
              <div className="flex w-full flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 opacity-30" />
                <p className="text-sm">No events yet — be the first to create one!</p>
              </div>
            ) : (
              events.slice(0, 5).map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="shrink-0">
                  <EventCard {...event} size="compact" />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="bg-card/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">{h.categories.title}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(({ label, icon: Icon, color }) => (
              <Link
                key={label}
                to="/events"
                className={cn(
                  'flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5',
                  'text-sm font-medium text-foreground transition-colors',
                  'hover:border-primary/40 hover:bg-accent',
                )}
              >
                <Icon className={cn('h-4 w-4', color)} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight">{h.howItWorks.title}</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {h.howItWorks.steps.map((step, i) => {
              const Icon = HOW_ICONS[i];
              return (
                <div key={step.title} className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED ORGANIZATIONS ───────────────────────── */}
      <section className="bg-card/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{h.featuredOrgs.title}</h2>
            <Link to="/organizations" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {h.featuredOrgs.browseAll}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl bg-border/30" />
                ))
              : orgs.map((org) => <OrgCard key={org.id} {...org} />)}
          </div>
        </div>
      </section>

      {/* ── HOST CTA ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-12 text-center shadow-xl shadow-primary/5">
          <div className="mb-4 text-5xl">🚀</div>
          <h2 className="text-3xl font-extrabold tracking-tight">{h.hostCta.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">{h.hostCta.subtitle}</p>
          <Link
            to="/events/create"
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'mt-8 gap-2 px-10 text-sm font-semibold')}
          >
            {h.hostCta.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}




