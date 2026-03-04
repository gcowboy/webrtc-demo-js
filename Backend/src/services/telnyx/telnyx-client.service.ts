import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Telnyx from 'telnyx';

/** Parameters to create a SIP credential connection (username/password auth). */
export interface CreateSipConnectionParams {
  /** Connection display name. */
  connection_name: string;
  /** SIP username (4–32 alphanumeric characters). */
  user_name: string;
  /** SIP password (8–128 characters). */
  password: string;
  /** Whether the connection is active. Defaults to true. */
  active?: boolean;
  /** If set, fetch this connection and apply its config (e.g. outbound_voice_profile_id) to the new connection. */
  templateConnectionId?: string;
}

const SIP_PASSWORD_LENGTH = 32;

/** Keys from a retrieved credential connection that are valid when creating a new one (excluding outbound, which we build explicitly). */
const CREATE_CONFIG_KEYS = [
  'active',
  'inbound',
  'sip_uri_calling_preference',
  'default_on_hold_comfort_noise_enabled',
  'dtmf_type',
  'encode_contact_header_enabled',
  'encrypted_media',
  'onnet_t38_passthrough_enabled',
  'webhook_event_url',
  'webhook_event_failover_url',
  'webhook_api_version',
  'webhook_timeout_secs',
  'call_cost_in_webhooks',
  'rtcp_settings',
  'noise_suppression',
  'noise_suppression_details',
  'jitter_buffer',
  'anchorsite_override',
] as const;

/** Build outbound payload for create from template. API expects snake_case; SDK may return camelCase. */
function outboundFromTemplate(templateOutbound: unknown): Record<string, unknown> | null {
  if (!templateOutbound || typeof templateOutbound !== 'object') return null;
  const ob = templateOutbound as Record<string, unknown>;
  const profileId =
    ob.outbound_voice_profile_id ?? ob.outboundVoiceProfileId;
  if (profileId == null || typeof profileId !== 'string') return null;
  const outbound: Record<string, unknown> = {
    outbound_voice_profile_id: profileId,
  };
  const optional: { api: string; sdk?: string }[] = [
    { api: 'call_parking_enabled', sdk: 'callParkingEnabled' },
    { api: 'ani_override', sdk: 'aniOverride' },
    { api: 'ani_override_type', sdk: 'aniOverrideType' },
    { api: 'channel_limit', sdk: 'channelLimit' },
    { api: 'instant_ringback_enabled', sdk: 'instantRingbackEnabled' },
    { api: 'generate_ringback_tone', sdk: 'generateRingbackTone' },
    { api: 'localization' },
    { api: 't38_reinvite_source', sdk: 't38ReinviteSource' },
  ];
  for (const { api, sdk } of optional) {
    const val = ob[api] ?? (sdk && ob[sdk]);
    if (val !== undefined && val !== null) outbound[api] = val;
  }
  return outbound;
}

function pickCreateConfig(
  template: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of CREATE_CONFIG_KEYS) {
    if (template[key] !== undefined && template[key] !== null) {
      out[key] = template[key];
    }
  }
  const outbound = outboundFromTemplate(template.outbound);
  if (outbound) out.outbound = outbound;
  return out;
}

function derivePasswordFromUsername(user_name: string): string {
  // const raw = createHash('sha256').update(user_name, 'utf8').digest('base64url');
  // return raw.slice(0, SIP_PASSWORD_LENGTH);

  return user_name;
}

/**
 * Returns the same password for a given user_name every time (deterministic).
 * Password is derived from user_name only; use when creating a credential connection and when you need to tell the client the password.
 */
export function getPasswordFromUsername(user_name: string): string {
  return derivePasswordFromUsername(user_name);
}

@Injectable()
export class TelnyxClientService {
  private readonly client: Telnyx;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('TELNYX_API_KEY') || '';
    this.client = new Telnyx({ apiKey });
  }

  getClient(): Telnyx {
    return this.client;
  }

  /**
   * Returns the password for a given SIP user_name (same user_name → same password).
   */
  getPasswordFromUsername(user_name: string): string {
    return derivePasswordFromUsername(user_name);
  }

  /**
   * Creates a SIP credential connection (username/password) in Telnyx.
   * If templateConnectionId is provided, fetches that connection and applies its config (outbound, inbound, webhooks, etc.) to the new connection.
   * @returns The created credential connection data.
   */
  async createSipConnection(
    params: CreateSipConnectionParams,
  ): Promise<{ data: Telnyx.CredentialConnections.CredentialConnection }> {
    const basePayload = {
      connection_name: params.connection_name,
      user_name: params.user_name,
      password: params.password,
      ...(params.active !== undefined && { active: params.active }),
    };

    if (!params.templateConnectionId) {
      const result = await this.client.credentialConnections.create(basePayload);
      return result as { data: Telnyx.CredentialConnections.CredentialConnection };
    }

    const { data: template } = await this.fetchSipConnection(params.templateConnectionId);
    const configFromTemplate = pickCreateConfig(template as Record<string, unknown>);
    const result = await this.client.credentialConnections.create({
      ...basePayload,
      ...configFromTemplate,
    });
    return result as { data: Telnyx.CredentialConnections.CredentialConnection };
  }

  /**
   * Gets a JWT token for a SIP credential connection. Use this token for WebRTC or client auth instead of sending username/password.
   * @param credentialConnectionId - The credential connection id (e.g. from create response or user.telnyxCredentialConnectionId).
   * @returns The JWT token string.
   */
  async getSipConnectionToken(credentialConnectionId: string): Promise<string> {
    const client = this.client as Telnyx & { telephonyCredentials?: { createToken: (id: string) => Promise<string | { data?: string }> } };
    if (!client.telephonyCredentials?.createToken) {
      throw new Error('Telnyx SDK telephonyCredentials.createToken not available');
    }
    const response = await client.telephonyCredentials.createToken(credentialConnectionId);
    const token = typeof response === 'string' ? response : (response as { data?: string })?.data ?? '';
    if (!token) throw new Error('Telnyx returned an empty SIP connection token');
    return token;
  }

  /**
   * Fetches a SIP credential connection by id.
   * @param id - The credential connection id.
   * @returns The credential connection data.
   */
  async fetchSipConnection(
    id: string,
  ): Promise<{ data: Telnyx.CredentialConnections.CredentialConnection }> {
    const result = await this.client.credentialConnections.retrieve(id);
    return result as { data: Telnyx.CredentialConnections.CredentialConnection };
  }

  /**
   * Deletes a SIP credential connection by id.
   * @param id - The credential connection id (e.g. from create response).
   * @returns The deleted credential connection data.
   */
  async deleteSipConnection(
    id: string,
  ): Promise<{ data: Telnyx.CredentialConnections.CredentialConnection }> {
    const result = await this.client.credentialConnections.delete(id);
    return result as { data: Telnyx.CredentialConnections.CredentialConnection };
  }

  /**
   * Assigns a purchased phone number to a user's SIP (credential) connection.
   * Inbound and outbound voice for that number will use the given connection.
   * @param phoneNumberId - Telnyx phone number resource id (e.g. from order response or user's telnyxNumberId).
   * @param credentialConnectionId - The SIP credential connection id (e.g. user.telnyxCredentialConnectionId).
   * @returns The updated phone number data from Telnyx.
   */
  async assignPhoneNumberToSipConnection(
    phoneNumberId: string,
    credentialConnectionId: string,
  ): Promise<{ data: unknown }> {
    const result = await this.client.phoneNumbers.update(phoneNumberId, {
      connection_id: credentialConnectionId,
    });
    return result as { data: unknown };
  }
}
