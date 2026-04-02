import { app } from '@/_server/app';
import { client } from '@/_server/data-sources/postgres-db';

const controller = app.defineCustomController({
  listVerifications: async (input: { status?: string }) => {
    const query = client('organization_verifications as v')
      .joinRaw('JOIN organizations o ON v.organization_id = o.id')
      .select(
        'v.id',
        'v.status',
        client.raw('v.additional_information'),
        client.raw('v.document_urls'),
        client.raw('v.submitted_at'),
        client.raw('v.reviewed_at'),
        client.raw('v.reviewer_comment'),
        client.raw('v.created_at'),
        'o.name as organizationName',
        'o.email as organizationEmail',
        'o.id as organizationId',
      );

    if (input?.status && input.status !== 'all') {
      query.where('v.status', input.status);
    } else {
      query.whereNot('v.status', 'not_submitted');
    }

    return query.orderByRaw(
      `CASE WHEN v.status = 'submitted' THEN 0 ELSE 1 END, v.submitted_at DESC NULLS LAST, v.created_at DESC`,
    );
  },

  approveVerification: async (input: { id: string; reviewerComment?: string }) => {
    const updated = await client('organization_verifications')
      .where('id', input.id)
      .where('status', 'submitted')
      .update({
        status: 'approved',
        reviewer_comment: input.reviewerComment?.trim() || null,
        reviewed_at: new Date(),
      });

    if (!updated) throw new Error('Verification not found or not in submitted state');
    return { success: true };
  },

  rejectVerification: async (input: { id: string; reviewerComment: string }) => {
    if (!input.reviewerComment?.trim()) {
      throw new Error('A comment is required when rejecting verification');
    }

    const updated = await client('organization_verifications')
      .where('id', input.id)
      .where('status', 'submitted')
      .update({
        status: 'rejected',
        reviewer_comment: input.reviewerComment.trim(),
        reviewed_at: new Date(),
      });

    if (!updated) throw new Error('Verification not found or not in submitted state');
    return { success: true };
  },
});

export type Procedures = typeof controller.procedures;
export default controller;