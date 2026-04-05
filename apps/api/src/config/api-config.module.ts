import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ApiConfigService } from './api-config.service'
import { validateEnv } from './env.schema'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
  ],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ApiConfigModule {}
