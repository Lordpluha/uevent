import { Button } from '@shared/components'
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { Link } from 'react-router'

export type VerificationStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected'

export type OrgVerificationSummary =
  | {
      status: VerificationStatus
    }
  | undefined

export type OrgWalletTransaction = {
  id: string
  type: 'sale' | 'refund' | 'withdrawal_request'
  amount: number
  currency: string
  eventTitle: string | null
  ticketTitle: string | null
  quantity: number | null
  note: string | null
  createdAt: string
}

export type OrgWithdrawalRequest = {
  id: string
  amount: number
  currency: string
  destination: string
  comment: string | null
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  createdAt: string
}

export type OrgWalletPayload = {
  balance: {
    currency: string
    available: number
    totalEarned: number
    totalWithdrawn: number
  }
  transactions: OrgWalletTransaction[]
  withdrawals: OrgWithdrawalRequest[]
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)

const transactionTitle = (tx: OrgWalletTransaction) => {
  if (tx.type === 'sale') return tx.eventTitle ? `Sale • ${tx.eventTitle}` : 'Sale income'
  if (tx.type === 'refund') return tx.eventTitle ? `Refund • ${tx.eventTitle}` : 'Refund'
  return 'Withdrawal request'
}

export function OrgWalletSection({
  wallet,
  verification,
  onRefresh: _onRefresh,
}: {
  wallet: OrgWalletPayload | undefined
  verification: OrgVerificationSummary
  onRefresh: () => Promise<void>
}) {
  const currency = wallet?.balance.currency ?? 'USD'
  const isVerified = verification?.status === 'approved'

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">Wallet and payouts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ticket sales are credited to your internal balance. Request withdrawals from this balance.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</p>
          <p className="mt-2 text-2xl font-semibold">{money(wallet?.balance.available ?? 0, currency)}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total earned</p>
          <p className="mt-2 text-xl font-semibold">{money(wallet?.balance.totalEarned ?? 0, currency)}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total withdrawn/requested</p>
          <p className="mt-2 text-xl font-semibold">{money(wallet?.balance.totalWithdrawn ?? 0, currency)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        {!isVerified && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            {verification?.status === 'rejected' ? (
              <ShieldX className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {verification?.status === 'submitted'
              ? 'Verification pending'
              : verification?.status === 'rejected'
                ? 'Verification rejected'
                : 'Not verified'}
          </div>
        )}
        {isVerified && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Verified
          </div>
        )}
        <Link to="/withdrawal">
          <Button
            variant="outline"
            disabled={!isVerified}
            title={!isVerified ? 'Complete verification first' : undefined}
          >
            Request withdrawal
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Transaction history</h3>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Details</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(wallet?.transactions ?? []).map((tx) => {
                const isPositive = tx.amount >= 0
                const details = [tx.ticketTitle, tx.quantity ? `x${tx.quantity}` : null, tx.note]
                  .filter(Boolean)
                  .join(' • ')

                return (
                  <tr key={tx.id} className="border-t border-border/60">
                    <td className="px-3 py-2 text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{transactionTitle(tx)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{details || '—'}</td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isPositive ? '+' : '-'}
                      {money(Math.abs(tx.amount), tx.currency)}
                    </td>
                  </tr>
                )
              })}

              {(wallet?.transactions ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
