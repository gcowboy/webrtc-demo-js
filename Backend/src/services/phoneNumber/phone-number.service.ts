import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError } from 'telnyx';
import type {
  CountryItem,
  ListNumberItem,
  OrderNumberInput,
  SearchNumbersQuery,
} from '@nuropad/shared-dto';
import {
  FALLBACK_COUNTRIES
} from '../../constants/phone-number.constants';

import { NOTIFICATIONS_TABLE, PHONE_NUMBERS_TABLE } from '../../constants/supabase.constants';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { TelnyxClientService } from '../telnyx/telnyx-client.service';
import { AvailablePhoneNumberListResponse } from 'telnyx/resources/available-phone-numbers';

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
    try {
      const res = await this.telnyx.getClient().countryCoverage.retrieve();
      const data = res.data ?? {};
      // Telnyx returns { [countryName]: { code: 'SN', numbers, features, ... } } — use value.code for API, key for display
      const fallbackByName = new Map(FALLBACK_COUNTRIES.map((c) => [c.code, c.name]));
      const items: CountryItem[] = [];
      for (const [key, cov] of Object.entries(data)) {
        const raw = cov as { code?: string; numbers?: boolean };
        const isoCode = raw?.code?.trim();
        if (!isoCode || isoCode.length !== 2) continue;
        const displayName =
          key.length > 2 ? key.trim() : (fallbackByName.get(isoCode) ?? isoCode);
        items.push({ code: isoCode.toUpperCase(), name: displayName });
      }
      if (items.length === 0) return FALLBACK_COUNTRIES;
      return items.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.warn(
        'Telnyx country coverage not available, using fallback list',
        err,
      );
      return FALLBACK_COUNTRIES;
    }
  }

  private assignCustomCostForNumbers(data: AvailablePhoneNumberListResponse.Data[] | undefined): OrderNumberInput[] {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      phoneNumber: item.phone_number ?? '',
      price: 2,
      monthlyPrice: 3
    }));
  }

  async searchNumbers(query: SearchNumbersQuery): Promise<OrderNumberInput[]> {
    const { countryCode, features, type, limit } = query;
    const filter: {
      country_code: string;
      features?: ('sms' | 'mms' | 'voice' | 'fax' | 'emergency' | 'hd_voice' | 'international_sms' | 'local_calling')[];
      phone_number_type?: 'local' | 'toll_free' | 'mobile' | 'national' | 'shared_cost';
      limit?: number;
    } = { 
      country_code: countryCode, 
      features: ['local_calling', 'sms', 'voice'],
      phone_number_type: 'local', 
      limit: 30 
    };
    if (features) {
      filter.features = (Array.isArray(features) ? features : [features]) as typeof filter.features;
    }
    if (type) filter.phone_number_type = type as typeof filter.phone_number_type;
    if (limit != null && limit > 0) filter.limit = limit;

    try {
      const { data: numbers } = await this.telnyx.getClient().availablePhoneNumbers.list({
        filter,
      });
      var orderNumberInputData = this.assignCustomCostForNumbers(numbers);
      return orderNumberInputData ?? [];
    } catch (e: unknown) {
      console.error('Telnyx available numbers error', e);
      if (e instanceof APIError) {
        console.error('Status:', e.status);
        console.error('Error:', e.error);
      }
      return [];
    }
  }

  async orderNumber(userId: string, input: OrderNumberInput): Promise<{ data?: unknown; error?: string }> {
    const { phoneNumber, countryCode = '', price = 0, monthlyPrice = 0 } = input;
    let orderData: { phone_numbers?: { id?: string }[] };
    try {
      const orderResult = await this.telnyx.getClient().numberOrders.create({
        phone_numbers: [{ phone_number: phoneNumber }],
      });
      orderData = orderResult.data ?? {};
    } catch (err) {
      console.error('Telnyx number order error', err);
      return { error: 'Error ordering phone number from Telnyx' };
    }
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
      monthly_cost: monthlyPrice,
      raw_telnyx_data: orderData ?? null,
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
          try {
            const page = await this.telnyx.getClient().phoneNumbers.list({
              filter: { phone_number: phoneNumber },
            });
            const list = page.data ?? [];
            if (list.length > 0) {
              const first = list[0];
              phone_number_status = first.status ?? null;
              phone_number_connection_id = first.connection_id ?? null;
            }
          } catch {
            // ignore per-number lookup errors
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

    const client = this.telnyx.getClient();
    let resourceId: string;
    try {
      const page = await client.phoneNumbers.list({
        filter: { phone_number: phoneNumber },
      });
      const list = page.data ?? [];
      if (list.length === 0) return { ok: false, error: 'Phone number not found' };
      resourceId = list[0].id;
      if (!resourceId) return { ok: false, error: 'Phone number ID not found in response' };
    } catch (err) {
      console.error('Enable voice call list error', err);
      return { ok: false, error: 'Phone number not found' };
    }

    try {
      await client.phoneNumbers.update(resourceId, { connection_id: connectionId });
    } catch (err) {
      console.error('Enable voice call error', err);
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
    const client = this.telnyx.getClient();
    let resourceId: string;
    try {
      const page = await client.phoneNumbers.list({
        filter: { phone_number: phoneNumber },
      });
      const list = page.data ?? [];
      if (list.length === 0) return { ok: false, error: 'Phone number not found' };
      const resource = list[0];
      if (resource.status !== 'active') {
        return {
          ok: false,
          error:
            "This phone number is still not assigned to your account, after it's assigned, you can delete it.",
        };
      }
      resourceId = resource.id;
      if (!resourceId) return { ok: false, error: 'Phone number ID not found in response' };
    } catch (err) {
      console.error('Telnyx list number error', err);
      return { ok: false, error: 'Phone number not found' };
    }

    try {
      await client.phoneNumbers.delete(resourceId);
    } catch (err) {
      console.error('Telnyx delete number error', err);
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
