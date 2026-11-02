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

type GetOptions = {
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query: GetOptions['query'] = {}) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new ApiError(0, 'not_configured', 'The app is not set up to reach the server');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const queryString = params.toString();
  return `${baseUrl.replace(/\/+$/, '')}${path}${queryString ? `?${queryString}` : ''}`;
}

export async function apiGet<T>(path: string, { query, signal }: GetOptions = {}): Promise<ApiResponse<T>> {
  const url = buildUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, 'network_error', 'Check your connection and try again');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'unknown_error',
      body?.error?.message ?? 'Something went wrong. Please try again',
      body?.error?.details,
    );
  }
  if (!body) throw new ApiError(response.status, 'invalid_response', 'Something went wrong. Please try again');
  return body;
}
