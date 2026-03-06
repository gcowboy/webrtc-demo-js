export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? '';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export type GetToken = () => Promise<string | null>;

export async function fetchAdminApi(
  getToken: GetToken,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const base = getApiUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = base ? `${base}${normalizedPath}` : normalizedPath;
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

export type AdminStats = {
  users: number;
  phoneNumbers: number;
  topUpTransactions: number;
  totalTopUpVerified: number | string;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  accountType: string | null;
  status: string | null;
  balance: number | string;
  updatedAt: string;
  _count: { phoneNumbers: number; topUpTransactions: number };
};

export type AdminUsersResponse = { data: AdminUserRow[]; total: number };

export type AdminPhoneNumberRow = {
  id: string;
  userId: string;
  phoneNumber: string;
  countryCode: string;
  monthlyCost: number | string;
  createdAt: string;
  user: { id: string; email: string | null; fullName: string | null };
};

export type AdminPhoneNumbersResponse = {
  data: AdminPhoneNumberRow[];
  total: number;
};

export type AdminTransactionRow = {
  id: string;
  userId: string;
  txHash: string;
  amount: number | string;
  status: string;
  createdAt: string;
  user: { id: string; email: string | null; fullName: string | null };
};

export type AdminTransactionsResponse = {
  data: AdminTransactionRow[];
  total: number;
};
