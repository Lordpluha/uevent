import { app } from '@/_server/app';
import { client } from '@/_server/data-sources/postgres-db';

const controller = app.defineCustomController({
  listOrganizations: async (input: { search?: string; banned?: boolean }) => {
    const query = client('organizations').select(
      'id',
      'name',
      'email',
      'category',
      client.raw('"is_banned"'),
      client.raw('"verified"'),
      client.raw('"created_at"'),
    );

    if (input?.search) {
      const s = `%${input.search}%`;
      query.where(function () {
        this.where('name', 'ilike', s).orWhere('email', 'ilike', s);
      });
    }

    if (typeof input?.banned === 'boolean') query.where('is_banned', input.banned);

    return query.orderByRaw('"is_banned" DESC, "created_at" DESC');
  },

  banOrganization: async (input: { id: string }) => {
    if (!input?.id) throw new Error('Organization id is required');
    await client('organizations').where('id', input.id).update({ is_banned: true });
    await client('organization_sessions').where('organization_id', input.id).delete();
    return { success: true };
  },

  unbanOrganization: async (input: { id: string }) => {
    if (!input?.id) throw new Error('Organization id is required');
    await client('organizations').where('id', input.id).update({ is_banned: false });
    return { success: true };
  },
});

export type Procedures = typeof controller.procedures;
export default controller;
