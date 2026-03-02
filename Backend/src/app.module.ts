import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { TelnyxModule } from './modules/telnyx/telnyx.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    TelnyxModule,
    PhoneNumbersModule,
    WebhooksModule,
  ],
})
export class AppModule {}
