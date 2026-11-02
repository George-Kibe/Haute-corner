import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as getConfig } from '@/app/api/v1/config/route';
import { GET as getHealth } from '@/app/api/v1/health/route';
import * as db from '@/lib/db';
import { MINIMUM_APP_VERSION } from '@/lib/site';
import { get } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /health', () => {
  it('confirms the database is reachable', async () => {
    const response = await getHealth(get('/api/v1/health'), undefined);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ data: { status: 'ok', database: 'reachable' } });
  });

  it('returns 503 without internal details when the database is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(db, 'dbConnect').mockRejectedValue(new Error('secret connection detail'));

    const response = await getHealth(get('/api/v1/health'), undefined);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain('service_unavailable');
    expect(body).not.toContain('secret connection detail');
  });
});

describe('GET /config', () => {
  it('returns the app configuration and allows CDN caching', async () => {
    const response = await getConfig(get('/api/v1/config'), undefined);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage');
    expect(await response.json()).toEqual({
      data: { minimumAppVersion: MINIMUM_APP_VERSION, cloudinaryCloudName: 'test-cloud' },
    });
  });

  it('hides the reason when configuration is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '');

    const response = await getConfig(get('/api/v1/config'), undefined);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('internal_error');
    expect(JSON.stringify(body)).not.toContain('CLOUDINARY');
    vi.unstubAllEnvs();
  });
});
