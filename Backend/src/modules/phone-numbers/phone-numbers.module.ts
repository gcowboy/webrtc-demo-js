import { Module } from '@nestjs/common';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumberService } from '../../services/phoneNumber/phone-number.service';

@Module({
  controllers: [PhoneNumbersController],
  providers: [PhoneNumberService],
  exports: [PhoneNumberService],
})
export class PhoneNumbersModule {}
