import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    WebhooksModule,
  ],
})
export class AppModule {}
