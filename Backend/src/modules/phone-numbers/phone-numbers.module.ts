import { Module } from '@nestjs/common';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumberService } from '../../services/phoneNumber/phone-number.service';
import { UserService } from '../../services/userService/user.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [PhoneNumbersController],
  providers: [PhoneNumberService, UserService],
  exports: [PhoneNumberService],
})
export class PhoneNumbersModule {}
