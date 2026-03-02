/**
 * Backend API base URL. Set NEXT_PUBLIC_API_URL (e.g. http://localhost:3001) or leave empty for same-origin.
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? '';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export type GetToken = () => Promise<string | null>;

export async function fetchNumbersApi(
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
