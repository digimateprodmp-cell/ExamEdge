import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class SystemController {
  @Public()
  @Get('server-time')
  getServerTime() {
    return { serverTime: new Date().toISOString() };
  }
}
