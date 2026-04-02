import { app } from '@/_server/app';
import { client } from '@/_server/data-sources/postgres-db';

const controller = app.defineCustomController({
  listUsers: async (input: { search?: string; banned?: boolean }) => {
    const query = client('users').select(
      'id',
      'username',
      'email',
      client.raw('"first_name"'),
      client.raw('"last_name"'),
      client.raw('"is_banned"'),
      client.raw('"created_at"'),
    );

    if (input?.search) {
      const s = `%${input.search}%`;
      query.where(function () {
        this.where('username', 'ilike', s)
          .orWhere('email', 'ilike', s)
          .orWhere(client.raw('"first_name"'), 'ilike', s)
          .orWhere(client.raw('"last_name"'), 'ilike', s);
      });
    }

    if (typeof input?.banned === 'boolean') {
      query.where('is_banned', input.banned);
    }

    return query.orderByRaw('"is_banned" DESC, "created_at" DESC');
  },

  banUser: async (input: { id: string }) => {
    if (!input?.id) throw new Error('User id is required');
    await client('users').where('id', input.id).update({ is_banned: true });
    await client('user_sessions').where('user_id', input.id).delete();
    return { success: true };
  },

  unbanUser: async (input: { id: string }) => {
    if (!input?.id) throw new Error('User id is required');
    await client('users').where('id', input.id).update({ is_banned: false });
    return { success: true };
  },
});

export type Procedures = typeof controller.procedures;
export default controller;
