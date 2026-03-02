import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getInstanceIdUuid } from '../../helpers/uuid.helper';
import { SupabaseAdminService } from '../../modules/supabase/supabase-admin.service';
import { User } from '@supabase/supabase-js';

const CLERK_ID_METADATA_KEY = 'clerk_id';
export const INSTANCE_ID_METADATA_KEY = 'instance_id';

/** Default instance id when INSTANCE_ID env is unset or invalid. */
const DEFAULT_INSTANCE_ID_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class UserService {
  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly config: ConfigService,
  ) {}

  /** Returns a UUID to store as instance_id in user metadata. */
  private getInstanceId(): string {
    const env = this.config.get<string>('INSTANCE_ID');
    return getInstanceIdUuid(env, DEFAULT_INSTANCE_ID_UUID);
  }

  getClient() {
    return this.supabaseAdmin.getClient();
  }

  /** Find auth.users row by clerk_id in user_metadata (used when id is Clerk id). */
  private async findAuthUserIdByClerkId(clerkId: string): Promise<string | null> {
    const client = this.supabaseAdmin.getClient();
    if (!client) return null;
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users?.length) return null;
      const match = data.users.find(
        (u) => (u.user_metadata as Record<string, unknown>)?.[CLERK_ID_METADATA_KEY] === clerkId,
      );
      if (match) return match.id;
      if (data.users.length < perPage) return null;
      page += 1;
    }
  }

  async upsertProfile(row: User): Promise<{ error: Error | null }> {
    const client = this.supabaseAdmin.getClient();
    if (!client) return { error: new Error('Supabase not configured') };

    const r = row as User & { full_name?: string; avatar_url?: string; username?: string };
    const clerkId = r.id;
    const instanceIdUuid = this.getInstanceId();
    const userMetadata: Record<string, unknown> = {
      [CLERK_ID_METADATA_KEY]: clerkId,
      [INSTANCE_ID_METADATA_KEY]: instanceIdUuid,
      full_name: r.full_name ?? undefined,
      avatar_url: r.avatar_url ?? undefined,
      username: r.username ?? undefined,
    };

    const existingId = await this.findAuthUserIdByClerkId(clerkId);

    if (existingId) {
      const { error } = await client.auth.admin.updateUserById(existingId, {
        email: r.email ?? undefined,
        user_metadata: userMetadata,
      });
      return { error: error ?? null };
    }

    if (!r.email) {
      return { error: new Error('Email required to create auth user') };
    }
    const { error } = await client.auth.admin.createUser({
      email: r.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: userMetadata,
    });
    return { error: error ?? null };
  }

  async deleteProfile(id: string): Promise<{ error: Error | null }> {
    const client = this.supabaseAdmin.getClient();
    if (!client) return { error: new Error('Supabase not configured') };

    const authUserId = await this.findAuthUserIdByClerkId(id);
    if (!authUserId) {
      return { error: null };
    }
    const { error } = await client.auth.admin.deleteUser(authUserId);
    return { error: error ?? null };
  }
}
