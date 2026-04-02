import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ChevronLeft, Clock, ShieldCheck, ShieldX, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@shared/api';
import { useAuth } from '@shared/lib/auth-context';
import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Textarea,
} from '@shared/components';
import type { OrgWalletPayload } from '@pages/OrgAccount/ui/OrgWalletSection';
import { OrgVerificationSection } from '@pages/OrgAccount/ui/OrgVerificationSection';

type VerificationStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';
type OrganizationVerification = {
  id: string;
  status: VerificationStatus;
  additionalInformation: string | null;
  documentUrls: string[] | null;
  reviewerComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export function WithdrawalPage() {
  const { isAuthenticated, accountType, isReady } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: walletLoading } = useQuery<OrgWalletPayload>({
    queryKey: ['organization-wallet'],
    queryFn: async () => (await api.get('/payments/organization/wallet')).data,
    enabled: isAuthenticated && accountType === 'organization',
  });

  const { data: verification, isLoading: verificationLoading } = useQuery<OrganizationVerification>({
    queryKey: ['organization-verification'],
    queryFn: async () => (await api.get('/payments/organization/verification')).data,
    enabled: isAuthenticated && accountType === 'organization',
  });

  const [form, setForm] = useState({ amount: '', destination: '', comment: '' });

  const currency = wallet?.balance.currency ?? 'USD';
  const amountValue = useMemo(() => Number.parseFloat(form.amount || '0'), [form.amount]);

  const isVerified = verification?.status === 'approved';
  const isSubmitted = verification?.status === 'submitted';
  const isRejected = verification?.status === 'rejected';

  const invalidateVerification = async () => {
    await queryClient.invalidateQueries({ queryKey: ['organization-verification'] });
  };

  const cancelVerificationMutation = useMutation({
    mutationFn: () => api.delete('/payments/organization/verification'),
    onSuccess: async () => {
      toast.success('Verification request cancelled.');
      await invalidateVerification();
    },
    onError: () => {
      toast.error('Failed to cancel verification request.');
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const amount = Number.parseFloat(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid positive amount.');
      if (!form.destination.trim()) throw new Error('Destination is required.');
      return api.post('/payments/organization/withdrawals', {
        amount,
        destination: form.destination.trim(),
        comment: form.comment.trim() || undefined,
        currency,
      });
    },
    onSuccess: async () => {
      toast.success('Withdrawal request created.');
      setForm({ amount: '', destination: '', comment: '' });
      await queryClient.invalidateQueries({ queryKey: ['organization-wallet'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create withdrawal request.';
      toast.error(message);
    },
  });

  if (!isReady) return null;
  if (!isAuthenticated || accountType !== 'organization') return <Navigate to="/" replace />;

  if (walletLoading || verificationLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Request withdrawal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Withdraw from your internal balance to an external account.
      </p>

      {isVerified && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Organization verified — withdrawals enabled
        </div>
      )}

      {/* Submitted — processing screen */}
      {isSubmitted && (
        <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-400/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Verification under review</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your documents have been submitted and are being reviewed by our team. This usually takes 1–3 business days.
              </p>
              {verification?.submittedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Submitted: {new Date(verification.submittedAt).toLocaleString()}
                </p>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={cancelVerificationMutation.isPending}
                  onClick={() => cancelVerificationMutation.mutate()}
                >
                  <XCircle className="h-4 w-4" />
                  {cancelVerificationMutation.isPending ? 'Cancelling…' : 'Cancel verification request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejected — re-submit */}
      {isRejected && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold">Verification rejected</p>
              {verification?.reviewerComment && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Reason: {verification.reviewerComment}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Balance summary — always show when verified */}
      {isVerified && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</p>
              <p className="mt-2 text-2xl font-semibold">{money(wallet?.balance.available ?? 0, currency)}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total earned</p>
              <p className="mt-2 text-xl font-semibold">{money(wallet?.balance.totalEarned ?? 0, currency)}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total withdrawn</p>
              <p className="mt-2 text-xl font-semibold">{money(wallet?.balance.totalWithdrawn ?? 0, currency)}</p>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4 rounded-xl border border-border/60 bg-card p-5"
            onSubmit={(e) => {
              e.preventDefault();
              createWithdrawalMutation.mutate();
            }}
          >
            <h2 className="text-base font-semibold">New withdrawal request</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="withdraw-amount">Amount</FieldLabel>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
                <FieldDescription>
                  Available: {money(wallet?.balance.available ?? 0, currency)}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="withdraw-destination">Destination</FieldLabel>
                <Input
                  id="withdraw-destination"
                  value={form.destination}
                  onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                  placeholder="Card / IBAN / account details"
                />
                <FieldDescription>Example: IBAN, card number, bank account.</FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="withdraw-comment">Comment (optional)</FieldLabel>
              <Textarea
                id="withdraw-comment"
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Additional payout info"
                rows={3}
              />
            </Field>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                You are requesting: {money(Number.isFinite(amountValue) ? amountValue : 0, currency)}
              </p>
              <Button type="submit" disabled={createWithdrawalMutation.isPending}>
                {createWithdrawalMutation.isPending ? 'Submitting…' : 'Submit withdrawal request'}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Not verified / rejected — show verification form */}
      {!isVerified && !isSubmitted && (
        <OrgVerificationSection verification={verification} onRefresh={invalidateVerification} />
      )}

      {/* Withdrawal history */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Withdrawal history</h2>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Destination</th>
                <th className="px-3 py-2 font-medium">Comment</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(wallet?.withdrawals ?? []).map((request) => (
                <tr key={request.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{request.destination}</td>
                  <td className="px-3 py-2 text-muted-foreground">{request.comment ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">{request.status}</td>
                  <td className="px-3 py-2 text-right font-medium">{money(request.amount, request.currency)}</td>
                </tr>
              ))}
              {(wallet?.withdrawals ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-muted-foreground">
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

