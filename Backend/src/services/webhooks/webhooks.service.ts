import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import type { UserJSON } from '@clerk/types';
import { mapClerkUserToProfile } from '../../helpers/clerk.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { TelnyxClientService } from '../telnyx/telnyx-client.service';
import { UserService } from '../userService/user.service';

/** Telnyx webhook event envelope. */
export interface TelnyxWebhookEnvelope {
  data?: {
    event_type?: string;
    id?: string;
    occurred_at?: string;
    payload?: TelnyxMessagePayload;
    record_type?: string;
  };
  meta?: { attempt?: number; delivered_to?: string };
}

/** Payload for message.received (inbound SMS/MMS). */
export interface TelnyxMessagePayload {
  from?: { phone_number?: string } | string;
  to?: { phone_number?: string } | string;
  text?: string;
  body?: string;
  type?: string;
  direction?: string;
  sms_id?: string;
  media?: Array<{ url?: string; content_type?: string }>;
}

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

const TELNYX_SIGNATURE_MAX_AGE_SEC = 300;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly userService: UserService,
    private readonly telnyx: TelnyxClientService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verifies the X-Telnyx-Signature header (format: t=timestamp,h=base64_hmac).
   * Uses TELNYX_WEBHOOK_SECRET from env (messaging profile webhook secret).
   */
  verifyTelnyxSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    const secret = this.config.get<string>('TELNYX_WEBHOOK_SECRET');
    if (!secret || !signatureHeader?.trim()) return false;
    const match = /t=(\d+),h=([^,]+)/.exec(signatureHeader.trim());
    if (!match) return false;
    const [, ts, sig] = match;
    const timestamp = parseInt(ts ?? '', 10);
    if (Number.isNaN(timestamp)) return false;
    const age = Math.abs(Date.now() / 1000 - timestamp);
    if (age > TELNYX_SIGNATURE_MAX_AGE_SEC) return false;
    const message = `${ts}.${rawBody.toString('utf8')}`;
    const expected = createHmac('sha256', secret).update(message, 'utf8').digest('base64');
    const actual = (sig ?? '').trim();
    if (expected.length !== actual.length) return false;
    try {
      return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(actual, 'utf8'));
    } catch {
      return false;
    }
  }

  /**
   * Handles Telnyx webhook events (e.g. message.received). Returns quickly; processing is best-effort.
   */
  async handleTelnyxEvent(body: TelnyxWebhookEnvelope): Promise<{ ok: boolean }> {
    const eventType = body?.data?.event_type;
    const payload = body?.data?.payload;
    if (eventType === 'message.received' && payload) {
      try {
        await this.handleMessageReceived(payload);
      } catch (err) {
        console.error('WebhooksService: handleMessageReceived failed', err);
      }
    }
    return { ok: true };
  }

  private async handleMessageReceived(payload: TelnyxMessagePayload): Promise<void> {
    const to =
      typeof payload.to === 'string'
        ? payload.to
        : (payload.to as { phone_number?: string })?.phone_number;
    const from =
      typeof payload.from === 'string'
        ? payload.from
        : (payload.from as { phone_number?: string })?.phone_number;
    const text = payload.text ?? payload.body ?? '';
    if (!to?.trim()) return;
    const number = await this.prisma.phoneNumber.findFirst({
      where: { phoneNumber: to.trim() },
      select: { userId: true },
    });
    if (!number?.userId) return;
    const title = `SMS from ${from ?? 'unknown'}`;
    const message = text.slice(0, 500) || '(no text)';
    await this.prisma.notification.create({
      data: {
        userId: number.userId,
        type: 'message',
        title,
        message,
        data: { from, to, text, smsId: payload.sms_id, direction: 'inbound' },
      },
    });
  }

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

        const { data: profileData } = await this.telnyx.createMessagingProfile(
          `Messaging for ${sipUserName}`,
          ['*'],
        );
        await this.userService.updateMessagingProfileId(
          userData.id,
          profileData?.id ?? null,
        );
      } catch (err) {
        console.error('WebhooksService: create SIP connection or messaging profile failed', err);
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
      let telnyxMessagingProfileId: string | null = null;
      try {
        const user = await this.userService.findById(id);
        telnyxConnectionId = user?.telnyxCredentialConnectionId ?? null;
        telnyxMessagingProfileId = user?.telnyxMessagingProfileId ?? null;
      } catch (err) {
        console.error('WebhooksService: findById failed (will still delete user)', err);
      }
      if (telnyxMessagingProfileId) {
        try {
          const phoneNumberIds =
            await this.telnyx.listPhoneNumberIdsByMessagingProfileId(telnyxMessagingProfileId);
          for (const phoneNumberId of phoneNumberIds) {
            try {
              await this.telnyx.unassignPhoneNumberFromMessagingProfile(phoneNumberId);
            } catch (err) {
              console.error('WebhooksService: unassign phone number from messaging profile failed', phoneNumberId, err);
            }
          }
          await this.telnyx.deleteMessagingProfile(telnyxMessagingProfileId);
        } catch (err) {
          console.error('WebhooksService: delete messaging profile failed', err);
        }
      }
      if (telnyxConnectionId) {
        try {
          const phoneNumberIds = await this.telnyx.listPhoneNumberIdsByConnectionId(telnyxConnectionId);
          for (const phoneNumberId of phoneNumberIds) {
            try {
              await this.telnyx.unassignPhoneNumberFromConnection(phoneNumberId);
            } catch (err) {
              console.error('WebhooksService: unassign phone number failed', phoneNumberId, err);
            }
          }
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
