/**
 * Shared DTOs for phone numbers API (backend + frontend).
 */

export interface CountryItem {
  code: string;
  name: string;
}

export interface SearchNumbersQuery {
  countryCode: string;
  features?: string | string[];
  type?: string;
  areaCode?: string;
  limit?: number;
}

export interface OrderNumberInput {
  phoneNumber: string;
  countryCode?: string;
  price: number;
  monthlyPrice: number;
}

/** Item returned from GET /numbers/search (available number to purchase). */
export interface AvailableNumberItem {
  phoneNumber?: string;
  region_information?: Array<{ region_type?: string; region_name?: string }>;
  cost_information?: { monthly_cost?: string; currency?: string };
  features?: Array<{ name?: string }>;
  price?: number;
  monthlyPrice?: number;
}

/** Item returned from GET /numbers/mine (user's owned number). */
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

/** Request body for POST /numbers/order */
export interface OrderNumberRequestDto {
  phoneNumber: string;
  countryCode?: string;
  monthlyCost?: number;
  rawNumberDetails?: Record<string, unknown> | null;
}
