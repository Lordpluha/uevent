import { Navigate } from 'react-router';
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@shared/lib/auth-context';
import { OrgPromoCodesSection } from '@pages/OrgAccount/ui/OrgPromoCodesSection';

export function PromoCodesPage() {
  const { isAuthenticated, accountType, isReady } = useAuth();

  if (!isReady) return null;
  if (!isAuthenticated || accountType !== 'organization') return <Navigate to="/" replace />;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Promo codes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create and manage discount promo codes for your organization.
      </p>

      <OrgPromoCodesSection onChanged={async () => {}} />
    </main>
  );
}
