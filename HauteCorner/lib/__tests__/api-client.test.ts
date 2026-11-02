import { apiGet, ApiError } from '@/lib/api-client';

const respondWith = (status: number, body: unknown) =>
  jest.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://example.test/api/v1/';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('apiGet', () => {
  it('builds the URL, leaving out undefined query values', async () => {
    const fetchMock = respondWith(200, { data: [] });
    globalThis.fetch = fetchMock;

    await apiGet('/products', { query: { type: 'shoes', q: undefined, limit: 20 } });

    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/api/v1/products?type=shoes&limit=20');
  });

  it('returns data and meta', async () => {
    globalThis.fetch = respondWith(200, { data: [{ id: '1' }], meta: { nextCursor: 'abc' } });

    const result = await apiGet('/products');

    expect(result).toEqual({ data: [{ id: '1' }], meta: { nextCursor: 'abc' } });
  });

  it('turns API errors into ApiError', async () => {
    globalThis.fetch = respondWith(404, { error: { code: 'not_found', message: 'Not found' } });

    await expect(apiGet('/products/1')).rejects.toMatchObject({ status: 404, code: 'not_found', message: 'Not found' });
  });

  it('survives an error response that is not JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(apiGet('/products')).rejects.toMatchObject({ status: 502, code: 'unknown_error' });
  });

  it('reports a failed connection as a network error', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    const error = await apiGet('/products').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('network_error');
  });

  it('passes on cancellation rather than reporting a network error', async () => {
    const controller = new AbortController();
    controller.abort();
    const aborted = new DOMException('Aborted', 'AbortError');
    globalThis.fetch = jest.fn().mockRejectedValue(aborted);

    await expect(apiGet('/products', { signal: controller.signal })).rejects.toBe(aborted);
  });

  it('fails clearly when the API address is not set', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    await expect(apiGet('/products')).rejects.toMatchObject({ code: 'not_configured' });
  });
});
