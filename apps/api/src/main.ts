import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { json, raw } from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use('/api/payments/webhook', raw({ type: 'application/json' }))
  app.use(json())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
