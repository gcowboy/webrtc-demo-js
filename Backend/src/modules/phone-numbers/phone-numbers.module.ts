import { Module } from '@nestjs/common';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumberService } from '../../services/phoneNumber/phone-number.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [PhoneNumbersController],
  providers: [PhoneNumberService],
  exports: [PhoneNumberService],
})
export class PhoneNumbersModule {}
