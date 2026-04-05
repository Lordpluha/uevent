import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UserAuthSuccessModel {
  @ApiProperty({ enum: ['user'] })
  accountType: 'user'
}

export class OrganizationAuthSuccessModel {
  @ApiProperty({ enum: ['organization'] })
  accountType: 'organization'
}

export class TwoFaRequiredModel {
  @ApiProperty({ enum: [true] })
  requires2fa: true

  @ApiProperty()
  tempToken: string
}

export class TwoFaSetupModel {
  @ApiProperty()
  secret: string

  @ApiProperty()
  qrCodeDataUrl: string
}

export class TwoFaEnabledModel {
  @ApiProperty()
  enabled: boolean
}

export class CalendarEventCreateModel {
  @ApiPropertyOptional({ nullable: true })
  calendarEventId: string | null

  @ApiPropertyOptional({ nullable: true })
  htmlLink: string | null
}
