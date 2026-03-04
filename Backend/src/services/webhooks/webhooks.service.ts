import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import type { UserJSON } from '@clerk/types';
import { mapClerkUserToProfile } from '../../helpers/clerk.helper';
import { TelnyxClientService } from '../telnyx/telnyx-client.service';
import { UserService } from '../userService/user.service';

/** Telnyx SIP user_name: 4–32 chars, letters and numbers only (no spaces, no underscores). */
const SIP_USER_NAME_MIN = 4;
const SIP_USER_NAME_MAX = 32;
const ALPHANUMERIC_ONLY = /[^a-zA-Z0-9]/g;

function toSipUserName(username: string | undefined | null, clerkId: string): string {
  const raw = (username ?? clerkId).replace(ALPHANUMERIC_ONLY, '').slice(0, SIP_USER_NAME_MAX);
  if (raw.length >= SIP_USER_NAME_MIN) return raw;
  const fromId = clerkId.replace(ALPHANUMERIC_ONLY, '').slice(0, SIP_USER_NAME_MAX - 1);
  return 'u' + fromId;
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly userService: UserService,
    private readonly telnyx: TelnyxClientService,
    private readonly config: ConfigService,
  ) {}

  async handleClerkEvent(evt: WebhookEvent): Promise<{ ok: boolean; action?: string; error?: string }> {
    if (evt.type === 'user.created') {
      const userData = mapClerkUserToProfile(evt.data as unknown as UserJSON);
      const { error } = await this.userService.upsertUser(userData);
      if (error) return { ok: false, error: error.message };
      const sipUserName = toSipUserName(userData.username, userData.id);
      try {
        const templateId = this.config.get<string>('TELNYX_CONNECTION_TEMPLATE_A_ID');
        const { data } = await this.telnyx.createSipConnection({
          connection_name: sipUserName,
          user_name: sipUserName,
          password: this.telnyx.getPasswordFromUsername(sipUserName),
          ...(templateId && { templateConnectionId: templateId }),
        });
        await this.userService.updateCredentialConnectionId(userData.id, data.id ?? null);
      } catch (err) {
        console.error('WebhooksService: create SIP connection failed', err);
      }
      return { ok: true, action: 'created' };
    }

    if (evt.type === 'user.updated') {
      const userData = mapClerkUserToProfile(evt.data as unknown as UserJSON);
      const { error } = await this.userService.upsertUser(userData);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'updated' };
    }

    if (evt.type === 'user.deleted') {
      const payload = evt.data as { id?: string | null };
      const id = payload?.id ?? null;
      if (!id || typeof id !== 'string') {
        return { ok: false, error: 'user.deleted payload missing id' };
      }
      let telnyxConnectionId: string | null = null;
      try {
        const user = await this.userService.findById(id);
        telnyxConnectionId = user?.telnyxCredentialConnectionId ?? null;
      } catch (err) {
        console.error('WebhooksService: findById failed (will still delete user)', err);
      }
      if (telnyxConnectionId) {
        try {
          await this.telnyx.deleteSipConnection(telnyxConnectionId);
        } catch (err) {
          console.error('WebhooksService: delete SIP connection failed', err);
        }
      }
      try {
        const { error } = await this.userService.deleteUser(id);
        if (error) return { ok: false, error: error.message };
      } catch (err) {
        console.error('WebhooksService: deleteUser failed', err);
        return { ok: false, error: err instanceof Error ? err.message : 'deleteUser failed' };
      }
      return { ok: true, action: 'deleted' };
    }

    return { ok: true };
  }
}
