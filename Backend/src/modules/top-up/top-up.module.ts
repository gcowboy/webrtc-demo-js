import { Module } from '@nestjs/common';
import { TopUpController } from './top-up.controller';
import { TopUpService } from '../../services/topUp/top-up.service';

@Module({
  controllers: [TopUpController],
  providers: [TopUpService],
  exports: [TopUpService],
})
export class TopUpModule {}
