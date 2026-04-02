import { useState, useEffect, useCallback } from 'react';
import { Page, Modal, useCallProcedure, notifications } from '@kottster/react';
import { type Procedures } from './api.server';

type Withdrawal = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  amount: string;
  currency: string;
  destination: string;
  comment: string | null;
  admin_comment: string | null;
  processed_at: string | null;
  createdAt: string;
  organizationName: string;
  organizationEmail: string;
  organizationId: string;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#3b82f6',
  rejected: '#ef4444',
  paid: '#22c55e',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: STATUS_COLORS[status] ?? '#6b7280',
        color: '#fff',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

type ModalState =
  | { open: false }
  | { open: true; type: 'reject'; item: Withdrawal }
  | { open: true; type: 'approve' | 'paid'; item: Withdrawal };

export default function OrganizationWithdrawalRequestsPage() {
  const callProcedure = useCallProcedure<Procedures>();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callProcedure('listWithdrawals', { status: statusFilter });
      setItems(data as Withdrawal[]);
    } catch (e: any) {
      notifications.error({ message: e?.message ?? 'Failed to load withdrawal requests' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (type: 'approve' | 'reject' | 'paid', item: Withdrawal) => {
    setAdminComment('');
    setModal({ open: true, type, item } as ModalState);
  };

  const closeModal = () => setModal({ open: false });

  const handleSubmit = async () => {
    if (!modal.open) return;
    setSubmitting(true);
    try {
      if (modal.type === 'approve') {
        await callProcedure('approveWithdrawal', { id: modal.item.id });
        notifications.success({ message: `Withdrawal for "${modal.item.organizationName}" approved` });
      } else if (modal.type === 'reject') {
        await callProcedure('rejectWithdrawal', { id: modal.item.id, adminComment: adminComment || undefined });
        notifications.success({ message: `Withdrawal for "${modal.item.organizationName}" rejected` });
      } else {
        await callProcedure('markAsPaid', { id: modal.item.id });
        notifications.success({ message: `Withdrawal for "${modal.item.organizationName}" marked as paid` });
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      notifications.error({ message: e?.message ?? 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (v: string | null) =>
    v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const formatAmount = (amount: string, currency: string) =>
    `${Number(amount).toFixed(2)} ${currency.toUpperCase()}`;

  const modalConfig = modal.open
    ? {
        approve: { title: 'Approve Withdrawal', btnLabel: 'Approve', btnColor: '#3b82f6' },
        reject:  { title: 'Reject Withdrawal',  btnLabel: 'Reject',  btnColor: '#ef4444' },
        paid:    { title: 'Mark as Paid',        btnLabel: 'Mark as Paid', btnColor: '#22c55e' },
      }[modal.type]
    : null;

  return (
    <Page>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
              borderColor: statusFilter === f.value ? '#3b82f6' : 'var(--app-color-border, #e5e7eb)',
              background: statusFilter === f.value ? '#3b82f6' : 'transparent',
              color: statusFilter === f.value ? '#fff' : 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No withdrawal requests found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--app-color-border, #e5e7eb)', textAlign: 'left' }}>
                {['Organization', 'Amount', 'Status', 'Destination', 'Comment', 'Admin Comment', 'Created', 'Processed', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap', color: '#6b7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--app-color-border, #f3f4f6)' }}>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{item.organizationName}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{item.organizationEmail}</div>
                  </td>
                  <td style={{ padding: '12px 12px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {formatAmount(item.amount, item.currency)}
                  </td>
                  <td style={{ padding: '12px 12px' }}><StatusBadge status={item.status} /></td>
                  <td style={{ padding: '12px 12px', maxWidth: 160 }}>
                    <span title={item.destination} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.destination}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', maxWidth: 160, color: '#6b7280', fontSize: 12 }}>
                    {item.comment ?? '—'}
                  </td>
                  <td style={{ padding: '12px 12px', maxWidth: 160, color: '#6b7280', fontSize: 12 }}>
                    {item.admin_comment ?? '—'}
                  </td>
                  <td style={{ padding: '12px 12px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {formatDate(item.createdAt)}
                  </td>
                  <td style={{ padding: '12px 12px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {formatDate(item.processed_at)}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModal('approve', item)}
                            style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal('reject', item)}
                            style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'approved' && (
                        <button
                          onClick={() => openModal('paid', item)}
                          style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action modal */}
      {modal.open && modalConfig && (
        <Modal
          isOpen
          onClose={closeModal}
          title={modalConfig.title}
          width={460}
          bottomSection={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 0 0' }}>
              <button onClick={closeModal} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid var(--app-color-border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: modalConfig.btnColor, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Processing…' : modalConfig.btnLabel}
              </button>
            </div>
          }
        >
          <div>
            <p style={{ marginBottom: 14, color: '#6b7280', fontSize: 13 }}>
              Organization: <strong style={{ color: 'inherit' }}>{modal.item.organizationName}</strong>
              {' · '}
              <strong style={{ color: 'inherit' }}>{formatAmount(modal.item.amount, modal.item.currency)}</strong>
            </p>
            {modal.type === 'reject' && (
              <>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Admin comment (optional)
                </label>
                <textarea
                  value={adminComment}
                  onChange={e => setAdminComment(e.target.value)}
                  placeholder="Reason for rejection…"
                  rows={3}
                  style={{ width: '100%', borderRadius: 6, border: '1px solid var(--app-color-border, #e5e7eb)', padding: '8px 10px', fontSize: 13, resize: 'vertical', background: 'transparent', color: 'inherit', boxSizing: 'border-box' }}
                />
              </>
            )}
            {modal.type === 'approve' && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                Destination: <strong style={{ color: 'inherit' }}>{modal.item.destination}</strong>
              </p>
            )}
            {modal.type === 'paid' && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                Confirm that the payout to <strong style={{ color: 'inherit' }}>{modal.item.destination}</strong> has been completed.
              </p>
            )}
          </div>
        </Modal>
      )}
    </Page>
  );
};