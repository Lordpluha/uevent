import { KnexPgAdapter } from '@kottster/server';
import knex from 'knex';

/**
 * Replace the following with your connection options.
 * Learn more at https://knexjs.org/guide/#configuration-options
 */
const databaseUrl = process.env.DATABASE_URL;

const client = knex({
  client: 'pg',
  connection: databaseUrl
    ? { connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT) || 5434,
        user: process.env.POSTGRES_USER ?? 'uevent',
        password: process.env.POSTGRES_PASSWORD ?? 'uevent',
        database: process.env.POSTGRES_DB ?? 'uevent',
      },
  searchPath: ['public'],
});

export { client };
export default new KnexPgAdapter(client);
