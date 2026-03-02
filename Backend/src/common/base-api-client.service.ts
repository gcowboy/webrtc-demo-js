export interface BaseApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: Record<string, unknown> | null;
  params?: Record<string, string | number | undefined> | null;
  headers?: Record<string, string>;
}

import { DEFAULT_TIMEOUT_MS } from '../constants/api.constants';

export interface BaseApiClientOptions {
  baseUrl: string;
  timeout?: number;
  /** Return extra headers (e.g. Authorization). Called per request. */
  getHeaders?: () => Record<string, string>;
}

/**
 * Base API client using fetch. Subclass and pass options (baseUrl, timeout, getHeaders)
 * to implement API-specific clients (e.g. Telnyx).
 */
export abstract class BaseApiClientService {
  protected readonly baseUrl: string;
  protected readonly timeout: number;
  private readonly getHeaders: () => Record<string, string>;

  protected constructor(options: BaseApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.getHeaders = options.getHeaders ?? (() => ({}));
  }

  protected buildUrl(path: string, params?: Record<string, string | number | undefined> | null): string {
    const normalized = path.replace(/^\//, '');
    const url = `${this.baseUrl}/${normalized}`;
    if (!params || Object.keys(params).length === 0) return url;
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') searchParams.set(k, String(v));
    }
    const query = searchParams.toString();
    return query ? `${url}?${query}` : url;
  }

  protected async request<T = unknown>(
    endpoint: string,
    options: BaseApiRequestOptions = {},
  ): Promise<{ data?: T; error?: unknown }> {
    const { method = 'GET', data = null, params = null, headers = {} } = options;

    const url = this.buildUrl(endpoint, params);
    const config: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.getHeaders(),
        ...headers,
      },
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && data != null) {
      config.body = JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const res = await fetch(url, config);
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      let result: unknown;
      if (contentType?.includes('application/json')) {
        result = await res.json();
      } else {
        result = await res.text();
      }

      if (!res.ok) {
        return { error: result };
      }
      return { data: result as T };
    } catch (err) {
      clearTimeout(timeoutId);
      return { error: err };
    }
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, string | number | undefined> | null,
  ): Promise<{ data?: T; error?: unknown }> {
    return this.request<T>(path, { method: 'GET', params });
  }

  async post<T = unknown>(
    path: string,
    data?: Record<string, unknown> | null,
  ): Promise<{ data?: T; error?: unknown }> {
    return this.request<T>(path, { method: 'POST', data });
  }

  async put<T = unknown>(
    path: string,
    data?: Record<string, unknown> | null,
  ): Promise<{ data?: T; error?: unknown }> {
    return this.request<T>(path, { method: 'PUT', data });
  }

  async patch<T = unknown>(
    path: string,
    data?: Record<string, unknown> | null,
  ): Promise<{ data?: T; error?: unknown }> {
    return this.request<T>(path, { method: 'PATCH', data });
  }

  async delete<T = unknown>(path: string): Promise<{ data?: T; error?: unknown }> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
