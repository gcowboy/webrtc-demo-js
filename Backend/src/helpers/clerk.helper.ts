import type { UserJSON } from '@clerk/types';

/** Profile shape used when syncing Clerk users to the database. */
export interface ClerkProfile {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at: string;
}

export function getPrimaryEmail(
  emailAddresses: { id: string; email_address: string }[],
  primaryId: string | null,
): string | undefined {
  if (!emailAddresses?.length) return undefined;
  if (primaryId) {
    const primary = emailAddresses.find((e) => e.id === primaryId);
    if (primary) return primary.email_address;
  }
  return emailAddresses[0]?.email_address ?? undefined;
}

export function mapClerkUserToProfile(data: UserJSON): ClerkProfile {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
  return {
    id: data.id,
    email: getPrimaryEmail(data.email_addresses ?? [], data.primary_email_address_id ?? null),
    username: data.username ?? undefined,
    full_name: fullName ?? undefined,
    avatar_url: data.image_url ?? undefined,
    updated_at: new Date(data.updated_at).toISOString(),
  };
}
