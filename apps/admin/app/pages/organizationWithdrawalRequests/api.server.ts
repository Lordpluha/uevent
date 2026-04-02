import { app } from '@/_server/app';
import { client } from '@/_server/data-sources/postgres-db';

const controller = app.defineCustomController({
  listWithdrawals: async (input: { status?: string }) => {
    const query = client('organization_withdrawal_requests as w')
      .joinRaw('JOIN organizations o ON w."organizationId" = o.id')
      .select(
        'w.id',
        'w.status',
        'w.amount',
        'w.currency',
        'w.destination',
        'w.comment',
        client.raw('w."adminComment"'),
        client.raw('w."processedAt"'),
        client.raw('w."createdAt"'),
        'o.name as organizationName',
        'o.email as organizationEmail',
        'o.id as organizationId',
      );

    if (input?.status && input.status !== 'all') {
      query.where('w.status', input.status);
    }

    return query.orderByRaw(
      `CASE WHEN w.status = 'pending' THEN 0 WHEN w.status = 'approved' THEN 1 ELSE 2 END, w."createdAt" DESC`,
    );
  },

  approveWithdrawal: async (input: { id: string }) => {
    const updated = await client('organization_withdrawal_requests')
      .where('id', input.id)
      .where('status', 'pending')
      .update({
        status: 'approved',
        processedAt: new Date(),
      });

    if (!updated) throw new Error('Withdrawal request not found or not in pending state');
    return { success: true };
  },

  rejectWithdrawal: async (input: { id: string; adminComment?: string }) => {
    const updated = await client('organization_withdrawal_requests')
      .where('id', input.id)
      .where('status', 'pending')
      .update({
        status: 'rejected',
        adminComment: input.adminComment?.trim() || null,
        processedAt: new Date(),
      });

    if (!updated) throw new Error('Withdrawal request not found or not in pending state');
    return { success: true };
  },

  markAsPaid: async (input: { id: string }) => {
    const updated = await client('organization_withdrawal_requests')
      .where('id', input.id)
      .where('status', 'approved')
      .update({
        status: 'paid',
        processedAt: new Date(),
      });

    if (!updated) throw new Error('Withdrawal request not found or not in approved state');
    return { success: true };
  },
});

export type Procedures = typeof controller.procedures;
export default controller;