import { Link, Navigate } from 'react-router';
import { Building2, ChevronLeft } from 'lucide-react';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@shared/components';
import { useMyOrg } from '@entities/Organization';
import { useAuth } from '@shared/lib/auth-context';
import { useAppContext } from '@shared/lib';
import { OrgBrandingSection } from '@pages/OrgAccount/ui/OrgBrandingSection';
import { OrgProfileSection } from '@pages/OrgAccount/ui/OrgProfileSection';
import { OrgAccountSettings } from '@pages/OrgAccount/ui/OrgAccountSettings';
import { OrgSecuritySection } from '@pages/OrgAccount/ui/OrgSecuritySection';

export function OrgEditPage() {
  const { t } = useAppContext();
  const { isAuthenticated, accountType } = useAuth();
  const { data: myOrg, isLoading } = useMyOrg();

  if (!isAuthenticated || accountType !== 'organization') return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!myOrg) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.orgEdit.notFound}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className="text-sm text-primary hover:underline">
              {t.common.backToHome}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.orgAccount.backToPublic.replace('Back to public org page', 'Dashboard')}
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">{t.profileSettings.title}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">{myOrg.title}</p>

      <OrgBrandingSection />
      <OrgProfileSection />
      <OrgAccountSettings />
      <OrgSecuritySection />
    </main>
  );
}

