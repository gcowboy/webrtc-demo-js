import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client with service role key. Bypasses RLS.
 * Use only for trusted server operations (webhooks, cron, internal APIs).
 */
@Injectable()
export class SupabaseAdminService {
  private client: SupabaseClient | null = null;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }
}
