import { Global, Module } from '@nestjs/common';
import { Clock } from './clock';
import { ClockService } from './clock.service';

@Global()
@Module({
  providers: [
    ClockService,
    {
      provide: Clock,
      useExisting: ClockService,
    },
  ],
  exports: [Clock, ClockService],
})
export class ClockModule {}
