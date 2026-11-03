export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiResponse<T> = {
  data: T;
  meta?: { nextCursor?: string | null };
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
};

function buildUrl(path: string, query: RequestOptions['query'] = {}) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new ApiError(0, 'not_configured', 'The app is not set up to reach the server');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const queryString = params.toString();
  return `${baseUrl.replace(/\/+$/, '')}${path}${queryString ? `?${queryString}` : ''}`;
}

// Sends a request and returns the response body, or null for 204 No Content.
export async function apiRequest<T>(
  path: string,
  { method = 'GET', query, body, accessToken, signal }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, 'network_error', 'Check your connection and try again');
  }

  if (response.status === 204) return null as unknown as ApiResponse<T>;

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      json?.error?.code ?? 'unknown_error',
      json?.error?.message ?? 'Something went wrong. Please try again',
      json?.error?.details,
    );
  }
  if (!json) throw new ApiError(response.status, 'invalid_response', 'Something went wrong. Please try again');
  return json;
}

export function apiGet<T>(path: string, options: Pick<RequestOptions, 'query' | 'signal'> = {}) {
  return apiRequest<T>(path, options);
}
