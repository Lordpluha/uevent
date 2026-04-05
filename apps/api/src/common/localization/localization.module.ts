import { Global, Module } from '@nestjs/common'
import { ContentLocalizationService } from './content-localization.service'

@Global()
@Module({
  providers: [ContentLocalizationService],
  exports: [ContentLocalizationService],
})
export class LocalizationModule {}
