import { NextResponse } from 'next/server';
import { verifyWebhook, type WebhookEvent } from '@clerk/backend/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Profile row synced from Clerk (table: public.profiles) */
type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

function getPrimaryEmail(
  emailAddresses: { id: string; email_address: string }[],
  primaryId: string | null
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

export async function POST(req: Request) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    console.error('CLERK_WEBHOOK_SIGNING_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook signing secret not configured' },
      { status: 500 }
    );
  }

  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error('Supabase admin client not available (missing env)');
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    if (evt.type === 'user.created') {
      const profile = mapClerkUserToProfile(evt.data);
      const { error } = await supabase.from('profiles').upsert(profile, {
        onConflict: 'id',
      });
      if (error) {
        console.error('profiles insert/upsert error:', error);
        return NextResponse.json(
          { error: 'Failed to sync profile', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: 'created' });
    }

    if (evt.type === 'user.updated') {
      const profile = mapClerkUserToProfile(evt.data);
      const { error } = await supabase.from('profiles').upsert(profile, {
        onConflict: 'id',
      });
      if (error) {
        console.error('profiles upsert error:', error);
        return NextResponse.json(
          { error: 'Failed to sync profile', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: 'updated' });
    }

    if (evt.type === 'user.deleted') {
      const id = 'id' in evt.data ? evt.data.id : null;
      if (!id) {
        return NextResponse.json(
          { error: 'user.deleted payload missing id' },
          { status: 400 }
        );
      }
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        console.error('profiles delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete profile', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: 'deleted' });
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
