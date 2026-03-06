import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APIError } from "telnyx";
import type {
  CountryItem,
  ListNumberItem,
  OrderNumberInput,
  SearchNumbersQuery,
} from "@nuropad/shared-dto";
import { FALLBACK_COUNTRIES } from "../../constants/phone-number.constants";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionService } from "../subscription/subscription.service";
import { TelnyxClientService } from "../telnyx/telnyx-client.service";
import {
  AvailablePhoneNumberListParams,
  AvailablePhoneNumberListResponse,
} from "telnyx/resources/available-phone-numbers";

@Injectable()
export class PhoneNumberService {
  constructor(
    private readonly telnyx: TelnyxClientService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async getCountries(): Promise<CountryItem[]> {
    try {
      const res = await this.telnyx.getClient().countryCoverage.retrieve();
      const data = res.data ?? {};
      const fallbackByName = new Map(
        FALLBACK_COUNTRIES.map((c) => [c.code, c.name]),
      );
      const items: CountryItem[] = [];
      for (const [key, cov] of Object.entries(data)) {
        const raw = cov as { code?: string; numbers?: boolean };
        const isoCode = raw?.code?.trim();
        if (!isoCode || isoCode.length !== 2) continue;
        const displayName =
          key.length > 2
            ? key.trim()
            : (fallbackByName.get(isoCode) ?? isoCode);
        items.push({ code: isoCode.toUpperCase(), name: displayName });
      }
      if (items.length === 0) return FALLBACK_COUNTRIES;
      return items.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      const status = err instanceof APIError ? err.status : undefined;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        "Telnyx country coverage not available, using fallback list.",
        status != null ? `Telnyx status: ${status}.` : "",
        msg,
      );
      return FALLBACK_COUNTRIES;
    }
  }

  private assignCustomCostForNumbers(
    data: AvailablePhoneNumberListResponse.Data[] | undefined,
  ): OrderNumberInput[] {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      phoneNumber: item.phone_number ?? "",
      price: 2,
      monthlyPrice: 3,
    }));
  }

  async searchNumbers(query: SearchNumbersQuery): Promise<OrderNumberInput[]> {
    const { countryCode, features, type, areaCode, limit } = query;
    const filter: AvailablePhoneNumberListParams.Filter = {
      country_code: countryCode,
      features: ["local_calling", "sms", "voice"],
      phone_number_type: "local",
      limit: 30,
    };
    if (areaCode?.trim()) {
      filter.national_destination_code = areaCode.trim();
    }
    if (features) {
      filter.features = (
        Array.isArray(features) ? features : [features]
      ) as typeof filter.features;
    }
    if (type)
      filter.phone_number_type = type as typeof filter.phone_number_type;
    if (limit != null && limit > 0) filter.limit = limit;

    try {
      const { data: numbers } = await this.telnyx
        .getClient()
        .availablePhoneNumbers.list({
          filter,
        });
      const orderNumberInputData = this.assignCustomCostForNumbers(numbers);
      return orderNumberInputData ?? [];
    } catch (e: unknown) {
      console.error("Telnyx available numbers error", e);
      if (e instanceof APIError) {
        console.error("Status:", e.status);
        console.error("Error:", e.error);
      }
      return [];
    }
  }

  async orderNumber(
    userId: string,
    input: OrderNumberInput,
  ): Promise<{ data?: unknown; error?: string }> {
    const {
      phoneNumber,
      countryCode = "",
      price = 0,
      monthlyPrice = 0,
      planId,
      profileName,
    } = input;

    if (!planId?.trim()) {
      return { error: "Plan is required. Select a subscription plan (e.g. basic, pro, business) for this number." };
    }

    try {
      await this.prisma.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
      });

      const subscriptionCheck =
        await this.subscriptionService.canAddPhoneNumberWithPlan(userId, planId.trim());
      if (!subscriptionCheck.allowed) {
        return { error: subscriptionCheck.error };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Database error";
      return { error: message };
    }

    let orderData: { phone_numbers?: { id?: string }[] };
    try {
      const orderResult = await this.telnyx.getClient().numberOrders.create({
        phone_numbers: [{ phone_number: phoneNumber }],
      });
      orderData = orderResult.data ?? {};
    } catch (err) {
      console.error("Telnyx number order error", err);
      return { error: "Error ordering phone number from Telnyx" };
    }
    const telnyxNumberId = Array.isArray(orderData?.phone_numbers)
      ? orderData?.phone_numbers[0]?.id
      : undefined;

    const selectedPlanId = planId!.trim();
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: selectedPlanId },
      select: { durationMonths: true },
    });
    const expiresAt = plan
      ? (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + plan.durationMonths);
          return d;
        })()
      : undefined;

    try {
      const row = await this.prisma.phoneNumber.create({
        data: {
          userId,
          subscriptionPlanId: selectedPlanId,
          expiresAt: expiresAt ?? undefined,
          telnyxNumberId: telnyxNumberId ?? null,
          phoneNumber,
          profileName: profileName?.trim() || null,
          countryCode,
          capabilities: [],
          monthlyCost: monthlyPrice,
          rawTelnyxData: orderData ?? undefined,
        },
      });

      const consumeResult =
        await this.subscriptionService.consumeBalanceForPlan(userId, selectedPlanId);
      if (!consumeResult.ok) {
        await this.prisma.phoneNumber.delete({ where: { id: row.id } });
        return { error: consumeResult.error };
      }

      await this.prisma.notification.create({
        data: {
          userId,
          type: "number",
          title: "Number purchased",
          message: `You purchased phone number ${phoneNumber}`,
          data: { phoneNumber },
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, telnyxCredentialConnectionId: true, telnyxMessagingProfileId: true },
      } as {
        where: { id: string };
        select: { id: true; telnyxCredentialConnectionId: true; telnyxMessagingProfileId: true };
      });
      if (user?.telnyxCredentialConnectionId || user?.telnyxMessagingProfileId) {
        await this.assignPurchasedNumberToUserConnections(
          phoneNumber,
          user.telnyxCredentialConnectionId ?? undefined,
          user.telnyxMessagingProfileId ?? undefined,
        );
      }

      return { data: row };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Database error";
      return { error: message };
    }
  }

  /**
   * Looks up the phone number by E.164 in Telnyx, then assigns it to the user's SIP connection
   * and messaging profile (if provided). Retries with delay because the number may not be in
   * Telnyx's list immediately after order.
   */
  private async assignPurchasedNumberToUserConnections(
    phoneNumber: string,
    credentialConnectionId?: string,
    messagingProfileId?: string,
  ): Promise<void> {
    const maxAttempts = 3;
    const delayMs = 2500;
    const client = this.telnyx.getClient();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const page = await client.phoneNumbers.list({
          filter: { phone_number: phoneNumber },
        });
        const list = page.data ?? [];
        const resource = list[0];
        const resourceId = resource?.id;
        if (resourceId) {
          if (credentialConnectionId) {
            await this.telnyx.assignPhoneNumberToSipConnection(
              resourceId,
              credentialConnectionId,
            );
          }
          if (messagingProfileId) {
            await this.telnyx.assignPhoneNumberToMessagingProfile(
              resourceId,
              messagingProfileId,
            );
          }
          return;
        }
      } catch (err) {
        if (attempt === maxAttempts) {
          console.error("Assign phone number to SIP/messaging failed", err);
          throw new Error("Failed to assign phone number to SIP connection and messaging profile after multiple attempts");
        }
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async listMyNumbers(
    userId: string,
  ): Promise<{ data?: ListNumberItem[]; error?: string }> {
    try {
      const numbers = await this.prisma.phoneNumber.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!numbers.length) return { data: [] };

      const items: ListNumberItem[] = await Promise.all(
        numbers.map(async (num: (typeof numbers)[number]) => {
          const rawNumberDetails =
            (num.rawNumberDetails as Record<string, unknown>) ?? {};
          let features: { name: string }[] =
            (rawNumberDetails.features as { name: string }[]) ?? [];
          if (features.length > 0 && typeof features[0] === "string") {
            features =
              (features as unknown as string[])?.map((f) => ({ name: f })) ??
              [];
          }
          if (features.length === 0 && Array.isArray(num.capabilities)) {
            features = (num.capabilities as string[]).map((cap) => ({
              name: cap,
            }));
          }
          let phone_number_status: string | null = null;
          let phone_number_connection_id: string | null = null;
          const phoneNumber = num.phoneNumber;
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
          const costInfo =
            (rawNumberDetails.cost_information as {
              monthly_cost?: string;
              currency?: string;
            }) ?? {};
          const monthlyCost =
            typeof num.monthlyCost === "object" &&
            num.monthlyCost !== null &&
            "toString" in num.monthlyCost
              ? (num.monthlyCost as { toString: () => string }).toString()
              : String(num.monthlyCost ?? "0");
          return {
            id: num.id,
            phone_number: phoneNumber,
            profile_name: num.profileName ?? null,
            phone_number_id: num.telnyxNumberId ?? null,
            phone_number_status,
            phone_number_connection_id,
            region_information:
              (rawNumberDetails.region_information as unknown[]) ?? [],
            features,
            cost_information: {
              monthly_cost: costInfo.monthly_cost ?? monthlyCost,
              currency: costInfo.currency ?? "USD",
            },
            status: "active",
            created_at: num.createdAt.toISOString(),
            createdAt: num.createdAt.toISOString(),
          };
        }),
      );
      return { data: items };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Database error";
      return { error: message };
    }
  }

  async enableVoiceCall(
    userId: string,
    phoneNumber: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const connectionId = this.config.get<string>("TELNYX_CONNECTION_ID");
    if (!connectionId)
      return { ok: false, error: "TELNYX_CONNECTION_ID is not configured" };

    const client = this.telnyx.getClient();
    let resourceId: string;
    try {
      const page = await client.phoneNumbers.list({
        filter: { phone_number: phoneNumber },
      });
      const list = page.data ?? [];
      if (list.length === 0)
        return { ok: false, error: "Phone number not found" };
      resourceId = list[0].id;
      if (!resourceId)
        return { ok: false, error: "Phone number ID not found in response" };
    } catch (err) {
      console.error("Enable voice call list error", err);
      return { ok: false, error: "Phone number not found" };
    }

    try {
      await client.phoneNumbers.update(resourceId, {
        connection_id: connectionId,
      });
    } catch (err) {
      console.error("Enable voice call error", err);
      return { ok: false, error: "Error enabling voice call" };
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: "number",
          title: "Voice call enabled",
          message: `Voice call has been enabled for ${phoneNumber}`,
          data: {
            phoneNumber,
            connectionId,
            phoneNumberResourceId: resourceId,
          },
        },
      });
    } catch {
      // non-fatal
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
      if (list.length === 0)
        return { ok: false, error: "Phone number not found" };
      const resource = list[0];
      if (resource.status !== "active") {
        return {
          ok: false,
          error:
            "This phone number is still not assigned to your account, after it's assigned, you can delete it.",
        };
      }
      resourceId = resource.id;
      if (!resourceId)
        return { ok: false, error: "Phone number ID not found in response" };
    } catch (err) {
      console.error("Telnyx list number error", err);
      return { ok: false, error: "Phone number not found" };
    }

    try {
      await client.phoneNumbers.delete(resourceId);
    } catch (err) {
      console.error("Telnyx delete number error", err);
      return { ok: false, error: "Error deleting phone number from Telnyx" };
    }

    try {
      await this.prisma.phoneNumber.deleteMany({
        where: { userId, phoneNumber },
      });
      await this.prisma.notification.create({
        data: {
          userId,
          type: "number",
          title: "Number deleted",
          message: "Phone number has been deleted",
          data: { phoneNumber, phoneNumberResourceId: resourceId },
        },
      });
    } catch {
      // non-fatal
    }
    return { ok: true };
  }
}
