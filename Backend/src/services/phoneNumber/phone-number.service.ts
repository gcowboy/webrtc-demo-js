import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FALLBACK_COUNTRIES,
  NOTIFICATIONS_TABLE,
  PHONE_NUMBERS_TABLE,
} from '../../constants/phone-number.constants';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { TelnyxClientService } from '../telnyx/telnyx-client.service';

/** Telnyx API response wrapper (many endpoints return { data: T }) */
interface TelnyxResponse<T> {
  data?: T;
}

interface TelnyxCountryItem {
  country_code?: string;
  country_name?: string;
}

interface TelnyxPhoneNumberResource {
  id?: string;
  phone_number?: string;
  status?: string;
  connection_id?: string | null;
  [key: string]: unknown;
}

interface TelnyxOrderPayload {
  phone_numbers?: { id?: string }[];
}

export interface CountryItem {
  code: string;
  name: string;
}

export interface SearchNumbersQuery {
  countryCode: string;
  features?: string | string[];
  type?: string;
  limit?: number;
}

export interface OrderNumberInput {
  phoneNumber: string;
  countryCode?: string;
  monthlyCost?: number;
  rawNumberDetails?: Record<string, unknown> | null;
}

export interface ListNumberItem {
  id: string;
  phone_number: string;
  phone_number_id: string | null;
  phone_number_status: string | null;
  phone_number_connection_id: string | null;
  region_information: unknown[];
  features: { name: string }[];
  cost_information: { monthly_cost: string; currency: string };
  status: string;
  created_at: string;
  createdAt: string;
}

@Injectable()
export class PhoneNumberService {
  constructor(
    private readonly telnyx: TelnyxClientService,
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly config: ConfigService,
  ) {}

  private get client() {
    return this.supabaseAdmin.getClient();
  }

  async getCountries(): Promise<CountryItem[]> {
    const result = await this.telnyx.get<TelnyxResponse<TelnyxCountryItem[]>>(
      'available_phone_number_countries',
    );
    if (result.error) {
      console.warn(
        'Telnyx available countries endpoint not available, using fallback list',
        result.error,
      );
      return FALLBACK_COUNTRIES;
    }
    const data = (result.data as TelnyxResponse<TelnyxCountryItem[]>)?.data ?? [];
    const countries = data
      .map((c) => {
        const code = c?.country_code;
        if (!code) return null;
        return { code, name: c?.country_name ?? code };
      })
      .filter((c): c is CountryItem => c != null)
      .sort((a, b) => a.name.localeCompare(b.name));
    return countries.length > 0 ? countries : FALLBACK_COUNTRIES;
  }

  async searchNumbers(query: SearchNumbersQuery): Promise<unknown[]> {
    const { countryCode, features, type, limit } = query;
    const params: Record<string, string | number | undefined> = {
      'filter[country_code]': countryCode,
    };
    if (features) {
      const arr = Array.isArray(features) ? features : [features];
      if (arr.length > 0) params['filter[features]'] = arr.join(',');
    }
    if (type) params['filter[phone_number_type]'] = type;
    if (limit != null && limit > 0) params['filter[limit]'] = limit;

    const result = await this.telnyx.get<TelnyxResponse<unknown[]>>('available_phone_numbers', params);
    if (result.error) {
      console.error('Telnyx available numbers error', result.error);
      return [];
    }
    const wrapper = result.data as TelnyxResponse<unknown[]> | undefined;
    return wrapper?.data ?? [];
  }

  async orderNumber(userId: string, input: OrderNumberInput): Promise<{ data?: unknown; error?: string }> {
    const { phoneNumber, countryCode = '', monthlyCost = 0, rawNumberDetails = null } = input;
    const orderResult = await this.telnyx.post<TelnyxResponse<TelnyxOrderPayload>>('number_orders', {
      phone_numbers: [{ phone_number: phoneNumber }],
    });
    if (orderResult.error) {
      console.error('Telnyx number order error', orderResult.error);
      return { error: 'Error ordering phone number from Telnyx' };
    }
    const orderData = (orderResult.data as TelnyxResponse<TelnyxOrderPayload>)?.data;
    const telnyxNumberId = Array.isArray(orderData?.phone_numbers)
      ? orderData?.phone_numbers[0]?.id
      : undefined;

    const db = this.client;
    if (!db) return { error: 'Supabase not configured' };
    const { data: row, error: insertError } = await db.from(PHONE_NUMBERS_TABLE).insert({
      user_id: userId,
      telnyx_number_id: telnyxNumberId ?? null,
      phone_number: phoneNumber,
      country_code: countryCode,
      capabilities: [],
      monthly_cost: monthlyCost,
      raw_telnyx_data: orderData ?? orderResult.data ?? null,
      raw_number_details: rawNumberDetails,
    }).select().single();
    if (insertError) return { error: insertError.message };

    await db.from(NOTIFICATIONS_TABLE).insert({
      user_id: userId,
      type: 'number',
      title: 'Number purchased',
      message: `You purchased phone number ${phoneNumber}`,
      data: { phoneNumber },
    });

    return { data: row };
  }

  async listMyNumbers(userId: string): Promise<{ data?: ListNumberItem[]; error?: string }> {
    const db = this.client;
    if (!db) return { error: 'Supabase not configured' };
    const { data: numbers, error } = await db
      .from(PHONE_NUMBERS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { error: error.message };
    if (!numbers?.length) return { data: [] };

    const items: ListNumberItem[] = await Promise.all(
      numbers.map(async (num: Record<string, unknown>) => {
        const rawNumberDetails = (num.raw_number_details as Record<string, unknown>) ?? {};
        let features: { name: string }[] = (rawNumberDetails.features as { name: string }[]) ?? [];
        if (features.length > 0 && typeof features[0] === 'string') {
          features = (features as unknown as string[]).map((f) => ({ name: f }));
        }
        if (features.length === 0 && Array.isArray(num.capabilities)) {
          features = (num.capabilities as string[]).map((cap) => ({ name: cap }));
        }
        let phone_number_status: string | null = null;
        let phone_number_connection_id: string | null = null;
        const phoneNumber = num.phone_number as string;
        if (phoneNumber) {
          const res = await this.telnyx.get<TelnyxResponse<TelnyxPhoneNumberResource[]>>(
            'phone_numbers',
            { 'filter[phone_number]': phoneNumber },
          );
          const list = (res.data as TelnyxResponse<TelnyxPhoneNumberResource[]>)?.data ?? [];
          if (list.length > 0) {
            phone_number_status = list[0].status ?? null;
            phone_number_connection_id = list[0].connection_id ?? null;
          }
        }
        const costInfo = (rawNumberDetails.cost_information as { monthly_cost?: string; currency?: string }) ?? {};
        return {
          id: num.id as string,
          phone_number: phoneNumber,
          phone_number_id: (num.telnyx_number_id as string) ?? null,
          phone_number_status,
          phone_number_connection_id,
          region_information: (rawNumberDetails.region_information as unknown[]) ?? [],
          features,
          cost_information: {
            monthly_cost: costInfo.monthly_cost ?? String(num.monthly_cost ?? '0'),
            currency: costInfo.currency ?? 'USD',
          },
          status: 'active',
          created_at: (num.created_at as string) ?? '',
          createdAt: (num.created_at as string) ?? '',
        };
      }),
    );
    return { data: items };
  }

  async enableVoiceCall(
    userId: string,
    phoneNumber: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const connectionId = this.config.get<string>('TELNYX_CONNECTION_ID');
    if (!connectionId) return { ok: false, error: 'TELNYX_CONNECTION_ID is not configured' };

    const res = await this.telnyx.get<TelnyxResponse<TelnyxPhoneNumberResource[]>>('phone_numbers', {
      'filter[phone_number]': phoneNumber,
    });
    const list = (res.data as TelnyxResponse<TelnyxPhoneNumberResource[]>)?.data ?? [];
    if (list.length === 0) return { ok: false, error: 'Phone number not found' };
    const resource = list[0];
    const resourceId = resource.id;
    if (!resourceId) return { ok: false, error: 'Phone number ID not found in response' };

    const patchResult = await this.telnyx.patch<TelnyxResponse<unknown>>(
      `phone_numbers/${resourceId}`,
      { connection_id: connectionId },
    );
    if (patchResult.error) {
      console.error('Enable voice call error', patchResult.error);
      return { ok: false, error: 'Error enabling voice call' };
    }

    const db = this.client;
    if (db) {
      await db.from(NOTIFICATIONS_TABLE).insert({
        user_id: userId,
        type: 'number',
        title: 'Voice call enabled',
        message: `Voice call has been enabled for ${phoneNumber}`,
        data: { phoneNumber, connectionId, phoneNumberResourceId: resourceId },
      });
    }
    return { ok: true };
  }

  async deleteNumber(
    userId: string,
    phoneNumber: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.telnyx.get<TelnyxResponse<TelnyxPhoneNumberResource[]>>('phone_numbers', {
      'filter[phone_number]': phoneNumber,
    });
    const list = (res.data as TelnyxResponse<TelnyxPhoneNumberResource[]>)?.data ?? [];
    if (list.length === 0) return { ok: false, error: 'Phone number not found' };
    const resource = list[0];
    if (resource.status !== 'active') {
      return {
        ok: false,
        error:
          "This phone number is still not assigned to your account, after it's assigned, you can delete it.",
      };
    }
    const resourceId = resource.id;
    if (!resourceId) return { ok: false, error: 'Phone number ID not found in response' };

    const delResult = await this.telnyx.delete(`phone_numbers/${resourceId}`);
    if (delResult.error) {
      console.error('Telnyx delete number error', delResult.error);
      return { ok: false, error: 'Error deleting phone number from Telnyx' };
    }

    const db = this.client;
    if (db) {
      await db.from(PHONE_NUMBERS_TABLE).delete().eq('user_id', userId).eq('phone_number', phoneNumber);
      await db.from(NOTIFICATIONS_TABLE).insert({
        user_id: userId,
        type: 'number',
        title: 'Number deleted',
        message: 'Phone number has been deleted',
        data: { phoneNumber, phoneNumberResourceId: resourceId },
      });
    }
    return { ok: true };
  }
}
