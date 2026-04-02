import { useState, useEffect, useCallback } from 'react';
import { Page, Modal, useCallProcedure, notifications } from '@kottster/react';
import { type Procedures } from './api.server';

type Verification = {
  id: string;
  status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  additional_information: string | null;
  document_urls: string[] | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_comment: string | null;
  createdAt: string;
  organizationName: string;
  organizationEmail: string;
  organizationId: string;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  submitted: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
  not_submitted: '#6b7280',
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
      {status.replace('_', ' ')}
    </span>
  );
}

export default function OrganizationVerificationPage() {
  const callProcedure = useCallProcedure<Procedures>();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(false);

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    item: Verification | null;
  }>({ open: false, type: 'approve', item: null });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callProcedure('listVerifications', { status: statusFilter });
      setItems(data as Verification[]);
    } catch (e: any) {
      notifications.error({ message: e?.message ?? 'Failed to load verifications' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (type: 'approve' | 'reject', item: Verification) => {
    setComment('');
    setActionModal({ open: true, type, item });
  };

  const closeModal = () => setActionModal(prev => ({ ...prev, open: false }));

  const handleSubmit = async () => {
    if (!actionModal.item) return;
    if (actionModal.type === 'reject' && !comment.trim()) {
      notifications.error({ message: 'A comment is required when rejecting' });
      return;
    }
    setSubmitting(true);
    try {
      if (actionModal.type === 'approve') {
        await callProcedure('approveVerification', { id: actionModal.item.id, reviewerComment: comment || undefined });
        notifications.success({ message: `Verification for "${actionModal.item.organizationName}" approved` });
      } else {
        await callProcedure('rejectVerification', { id: actionModal.item.id, reviewerComment: comment });
        notifications.success({ message: `Verification for "${actionModal.item.organizationName}" rejected` });
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
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No verifications found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--app-color-border, #e5e7eb)', textAlign: 'left' }}>
                {['Organization', 'Status', 'Submitted', 'Additional Info', 'Documents', 'Reviewer Comment', 'Actions'].map(h => (
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
                  <td style={{ padding: '12px 12px' }}><StatusBadge status={item.status} /></td>
                  <td style={{ padding: '12px 12px', whiteSpace: 'nowrap', color: '#6b7280' }}>{formatDate(item.submitted_at)}</td>
                  <td style={{ padding: '12px 12px', maxWidth: 200 }}>
                    {item.additional_information
                      ? <span title={item.additional_information} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.additional_information}</span>
                      : <span style={{ color: '#6b7280' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    {item.document_urls?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {item.document_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 12 }}>
                            Document {i + 1}
                          </a>
                        ))}
                      </div>
                    ) : <span style={{ color: '#6b7280' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 12px', maxWidth: 180, color: '#6b7280', fontSize: 12 }}>
                    {item.reviewer_comment ?? '—'}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    {item.status === 'submitted' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openModal('approve', item)}
                          style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openModal('reject', item)}
                          style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={closeModal}
        title={actionModal.type === 'approve' ? 'Approve Verification' : 'Reject Verification'}
        width={460}
        bottomSection={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 0 0' }}>
            <button onClick={closeModal} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid var(--app-color-border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                border: 'none',
                background: actionModal.type === 'approve' ? '#22c55e' : '#ef4444',
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Processing…' : actionModal.type === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        }
      >
        {actionModal.item && (
          <div>
            <p style={{ marginBottom: 14, color: '#6b7280', fontSize: 13 }}>
              Organization: <strong style={{ color: 'inherit' }}>{actionModal.item.organizationName}</strong>
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              {actionModal.type === 'approve' ? 'Comment (optional)' : 'Rejection reason *'}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={actionModal.type === 'approve' ? 'Approval note…' : 'Reason for rejection…'}
              rows={4}
              style={{
                width: '100%',
                borderRadius: 6,
                border: '1px solid var(--app-color-border, #e5e7eb)',
                padding: '8px 10px',
                fontSize: 13,
                resize: 'vertical',
                background: 'transparent',
                color: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </Modal>
    </Page>
  );
};