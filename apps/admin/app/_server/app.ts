import { createApp, createIdentityProvider } from '@kottster/server';
import schema from '../../kottster-app.json';

export const app = createApp({
  schema,
  secretKey: process.env.KOTTSTER_SECRET_KEY!,
  kottsterApiToken: process.env.KOTTSTER_API_TOKEN!,

  /*
   * The identity provider configuration.
   * See https://kottster.app/docs/app-configuration/identity-provider
   */
  identityProvider: createIdentityProvider('sqlite', {
    fileName: 'app.db',

    passwordHashAlgorithm: 'bcrypt',
    jwtSecretSalt: process.env.JWT_SECRET_SALT!,

    /* The root admin user credentials */
    rootUsername: process.env.ROOT_USERNAME ?? 'admin',
    rootPassword: process.env.ROOT_PASSWORD!,
  }),
});