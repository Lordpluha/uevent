import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getHello() {
    return 'Welcome to @uevent/api! Please refer to the API documentation for usage details.'
  }

  @Get('health')
  health() {
    return { status: 'ok' }
  }
}
