import { Injectable } from '@nestjs/common';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import { ProfilesService, type ProfileRow } from './profiles.service';

function getPrimaryEmail(
  emailAddresses: { id: string; email_address: string }[],
  primaryId: string | null,
): string | null {
  if (!emailAddresses?.length) return null;
  if (primaryId) {
    const primary = emailAddresses.find((e) => e.id === primaryId);
    if (primary) return primary.email_address;
  }
  return emailAddresses[0]?.email_address ?? null;
}

function mapClerkUserToProfile(data: {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string }[];
  updated_at: number;
}): ProfileRow {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
  return {
    id: data.id,
    email: getPrimaryEmail(data.email_addresses ?? [], data.primary_email_address_id),
    username: data.username ?? null,
    full_name: fullName || null,
    avatar_url: data.image_url || null,
    updated_at: new Date(data.updated_at).toISOString(),
  };
}

@Injectable()
export class WebhooksService {
  constructor(private readonly profiles: ProfilesService) {}

  async handleClerkEvent(evt: WebhookEvent): Promise<{ ok: boolean; action?: string; error?: string }> {
    const supabase = this.profiles.getClient();
    if (!supabase) {
      return { ok: false, error: 'Supabase not configured' };
    }

    if (evt.type === 'user.created') {
      const profile = mapClerkUserToProfile(evt.data);
      const { error } = await this.profiles.upsertProfile(profile);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'created' };
    }

    if (evt.type === 'user.updated') {
      const profile = mapClerkUserToProfile(evt.data);
      const { error } = await this.profiles.upsertProfile(profile);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'updated' };
    }

    if (evt.type === 'user.deleted') {
      const id = 'id' in evt.data ? evt.data.id : null;
      if (!id) return { ok: false, error: 'user.deleted payload missing id' };
      const { error } = await this.profiles.deleteProfile(id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'deleted' };
    }

    return { ok: true };
  }
}
