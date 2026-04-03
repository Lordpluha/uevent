import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { ApiConfigService } from './config/api-config.service'
import { MODULE_OPENAPI_SCHEMAS } from './common/swagger/openapi.schemas'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })
  const apiConfig = app.get(ApiConfigService)
  const storageDir = join(process.cwd(), 'storage')
  const staticDirs = [
    storageDir,
    join(storageDir, 'events'),
    join(storageDir, 'users'),
    join(storageDir, 'organizations'),
    join(storageDir, 'verifications'),
  ]
  for (const dir of staticDirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
  app.useStaticAssets(storageDir, { prefix: '/storage' })
  // Express 5 defaults to 'simple' query parser which doesn't handle bracket arrays (tags[]=x).
  // Switch to 'extended' (qs) to support tags[]=x&tags[]=y → { tags: ['x','y'] }
  app.getHttpAdapter().getInstance().set('query parser', 'extended')
  app.use(cookieParser())
  // biome-ignore lint/suspicious/noExplicitAny: helmet CJS module callable via require
  app.use((require('helmet') as any)())
  app.useBodyParser('json', { limit: '1mb' })
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' })
  app.enableCors({
    origin: apiConfig.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })

  if (!apiConfig.isProd) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UEvent API')
    .setDescription(
      'OpenAPI documentation for the UEvent API. Protected endpoints primarily use HTTP-only cookies: access_token for authenticated requests and refresh_token for token rotation. Bearer JWT auth remains available as a fallback for API clients.',
    )
    .setVersion('1.0')
    .addCookieAuth(
      'access_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Primary HTTP-only access token cookie used by protected endpoints.',
      },
      'access-cookie',
    )
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description: 'HTTP-only refresh token cookie used by refresh endpoints.',
      },
      'refresh-cookie',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Fallback auth mechanism for API clients. Browser sessions primarily rely on HTTP-only cookies.',
      },
      'bearer-auth',
    )
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
  swaggerDocument.components = swaggerDocument.components ?? {}
  swaggerDocument.components.schemas = {
    ...(swaggerDocument.components.schemas ?? {}),
    ...MODULE_OPENAPI_SCHEMAS,
  }
  SwaggerModule.setup('swagger', app, swaggerDocument, {
    jsonDocumentUrl: 'swagger/json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  }  // end if (!apiConfig.isProd)

  await app.listen(apiConfig.port)
}
bootstrap()
