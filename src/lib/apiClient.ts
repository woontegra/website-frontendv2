import { config } from './config';

export type ApiError = {
  status: number;
  message: string;
  url?: string;
  method?: string;
  body?: unknown;
};

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = config.API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\//, '');
  return base ? `${base}/${normalizedPath}` : `/${normalizedPath}`;
}

/**
 * Backend fetch sarmalayıcı — GET ve PATCH aynı base URL / proxy üzerinden gider.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', headers = {}, body, signal } = options;
  const url = resolveApiUrl(path);

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  };

  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const error: ApiError = {
      status: 0,
      message: `Ağ hatası (${method} ${url}): ${detail}. Backend çalışıyor mu? CORS veya API adresini kontrol edin.`,
      url,
      method,
    };
    throw error;
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const apiMessage =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : null;

    const message = apiMessage
      ? `${apiMessage} (HTTP ${response.status})`
      : `İstek başarısız: HTTP ${response.status} — ${method} ${url}`;

    const error: ApiError = { status: response.status, message, url, method, body: data };
    throw error;
  }

  return data as T;
}

/** GET isteği — content-bundle gibi okuma endpointleri için */
export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', signal });
}
