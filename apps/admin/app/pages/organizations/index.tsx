import { useState, useEffect, useCallback } from 'react';
import { Page, Modal, useCallProcedure, notifications } from '@kottster/react';
import { type Procedures } from './api.server';

type OrgRow = {
  id: string;
  name: string;
  email: string;
  category: string | null;
  is_banned: boolean;
  verified: boolean;
  created_at: string;
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
] as const;

type FilterValue = typeof FILTER_OPTIONS[number]['value'];

function StatusBadge({ banned, verified }: { banned: boolean; verified: boolean }) {
  if (banned) {
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#ef4444', color: '#fff' }}>
        Banned
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: verified ? '#22c55e' : '#f59e0b', color: '#fff' }}>
      {verified ? 'Verified' : 'Active'}
    </span>
  );
}

export default function OrganizationsPage() {
  const callProcedure = useCallProcedure<Procedures>();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: 'ban' | 'unban';
    org: OrgRow | null;
  }>({ open: false, action: 'ban', org: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const banned = filter === 'all' ? undefined : filter === 'banned';
      const data = await callProcedure('listOrganizations', { search: search || undefined, banned });
      setItems(data as OrgRow[]);
    } catch (e: any) {
      notifications.error({ message: e?.message ?? 'Failed to load organizations' });
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleAction = async () => {
    if (!confirmModal.org) return;
    setSubmitting(true);
    try {
      if (confirmModal.action === 'ban') {
        await callProcedure('banOrganization', { id: confirmModal.org.id });
        notifications.success({ message: `Organization "${confirmModal.org.name}" has been banned` });
      } else {
        await callProcedure('unbanOrganization', { id: confirmModal.org.id });
        notifications.success({ message: `Organization "${confirmModal.org.name}" has been unbanned` });
      }
      setConfirmModal({ open: false, action: 'ban', org: null });
      fetchData();
    } catch (e: any) {
      notifications.error({ message: e?.message ?? 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Organizations">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filter === opt.value ? '#3b82f6' : '#d1d5db',
                background: filter === opt.value ? '#3b82f6' : 'transparent',
                color: filter === opt.value ? '#fff' : 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No organizations found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Name</th>
                <th style={{ padding: '8px 12px' }}>Email</th>
                <th style={{ padding: '8px 12px' }}>Category</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th style={{ padding: '8px 12px' }}>Registered</th>
                <th style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{o.name}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{o.email}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{o.category || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusBadge banned={o.is_banned} verified={o.verified} />
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {o.is_banned ? (
                      <button
                        onClick={() => setConfirmModal({ open: true, action: 'unban', org: o })}
                        style={{
                          padding: '4px 14px',
                          borderRadius: 6,
                          border: '1px solid #22c55e',
                          background: 'transparent',
                          color: '#22c55e',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmModal({ open: true, action: 'ban', org: o })}
                        style={{
                          padding: '4px 14px',
                          borderRadius: 6,
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: 'ban', org: null })}
        title={confirmModal.action === 'ban' ? 'Ban Organization' : 'Unban Organization'}
      >
        <p style={{ marginBottom: 16 }}>
          {confirmModal.action === 'ban'
            ? <>Are you sure you want to ban <strong>"{confirmModal.org?.name}"</strong>? All active sessions will be terminated immediately.</>
            : <>Are you sure you want to unban <strong>"{confirmModal.org?.name}"</strong>? They will be able to log in again.</>}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setConfirmModal({ open: false, action: 'ban', org: null })}
            disabled={submitting}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={submitting}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: confirmModal.action === 'ban' ? '#ef4444' : '#22c55e',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Processing…' : confirmModal.action === 'ban' ? 'Ban Organization' : 'Unban Organization'}
          </button>
        </div>
      </Modal>
    </Page>
  );
}
