import { config } from 'dotenv'
import { resolve } from 'node:path'
config({ path: resolve(__dirname, '..', '.env') })

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Express 5 defaults to 'simple' query parser which doesn't handle bracket arrays (tags[]=x).
  // Switch to 'extended' (qs) to support tags[]=x&tags[]=y → { tags: ['x','y'] }
  app.getHttpAdapter().getInstance().set('query parser', 'extended')
  app.use(cookieParser())
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
