import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DemoController } from './demo.controller';
import { DemoSeedService } from './demo-seed.service';
import { DemoService } from './demo.service';

@Module({
  imports: [AuthModule],
  controllers: [DemoController],
  providers: [DemoService, DemoSeedService],
})
export class DemoModule {}
