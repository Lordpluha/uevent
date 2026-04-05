import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { Building2, ChevronLeft, ShieldCheck } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { OrgChartsSection } from './OrgChartsSection'
import { OrgWalletSection } from './OrgWalletSection'
import { useOrgAccountData } from './useOrgAccountData'

export function OrgAccountPage() {
  const { t } = useAppContext()
  const {
    id,
    isAuthenticated,
    accountType,
    isReady,
    org,
    myOrg,
    myOrgLoading,
    isLoading,
    isError,
    orgEvents,
    wallet,
    verification,
    invalidateOrgQueries,
  } = useOrgAccountData()

  if (!isReady) return null
  if (!isAuthenticated || accountType !== 'organization') return <Navigate to="/" replace />

  if (myOrgLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    )
  }

  if (id && myOrg?.id !== id) return <Navigate to={myOrg ? `/profile/organization/${myOrg.id}` : '/'} replace />

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.orgAccount.loading}</p>
      </main>
    )
  }

  if (!org || isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.orgAccount.unavailable}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/organizations" className="text-sm text-primary hover:underline">
              {t.common.backToOrganizations}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  const twoFactorEnabled = org.twoFactorEnabled ?? false

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to={`/organizations/${org.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.orgAccount.backToPublic}
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">{t.orgAccount.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.orgAccount.subtitle}</p>

      {/* Stats */}
      <section className="mt-5 grid gap-4 rounded-xl border border-border/60 bg-card p-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.orgAccount.stats.organization}</p>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary" /> {org.title}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.orgAccount.stats.publishedEvents}</p>
          <p className="mt-2 text-2xl font-semibold">{orgEvents.length}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.orgAccount.stats.security}</p>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {twoFactorEnabled ? t.orgAccount.stats.twoFaEnabled : t.orgAccount.stats.twoFaDisabled}
          </div>
        </div>
      </section>

      <OrgChartsSection wallet={wallet} orgEvents={orgEvents} />
      <OrgWalletSection wallet={wallet} verification={verification} onRefresh={invalidateOrgQueries} />
    </main>
  )
}
