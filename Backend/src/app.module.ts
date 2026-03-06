import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { TelnyxModule } from './modules/telnyx/telnyx.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TopUpModule } from './modules/top-up/top-up.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TelnyxModule,
    PhoneNumbersModule,
    WebhooksModule,
    TopUpModule,
    SubscriptionModule,
  ],
})
export class AppModule {}
