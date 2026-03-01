import { Injectable } from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';

export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

@Injectable()
export class ProfilesService {
  constructor(private readonly supabaseAdmin: SupabaseAdminService) {}

  getClient() {
    return this.supabaseAdmin.getClient();
  }

  async upsertProfile(row: ProfileRow): Promise<{ error: Error | null }> {
    const client = this.supabaseAdmin.getClient();
    if (!client) return { error: new Error('Supabase not configured') };
    const { error } = await client.from('profiles').upsert(row, {
      onConflict: 'id',
    });
    return { error: error ?? null };
  }

  async deleteProfile(id: string): Promise<{ error: Error | null }> {
    const client = this.supabaseAdmin.getClient();
    if (!client) return { error: new Error('Supabase not configured') };
    const { error } = await client.from('profiles').delete().eq('id', id);
    return { error: error ?? null };
  }
}
