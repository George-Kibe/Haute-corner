import { describe, expect, it } from 'vitest';
import { cloudinaryAccount, signParams } from '@/lib/cloudinary';

describe('cloudinaryAccount', () => {
  it('reads the key, secret and cloud name', () => {
    expect(cloudinaryAccount('cloudinary://123:abc-DEF@my-cloud')).toEqual({
      apiKey: '123',
      apiSecret: 'abc-DEF',
      cloudName: 'my-cloud',
    });
  });

  it('rejects a missing or malformed URL', () => {
    expect(() => cloudinaryAccount('')).toThrow('CLOUDINARY_URL');
    expect(() => cloudinaryAccount('https://example.com')).toThrow('CLOUDINARY_URL');
  });
});

describe('signParams', () => {
  // The worked example in Cloudinary's authentication signature documentation.
  it('matches Cloudinary’s documented example', () => {
    const params = {
      timestamp: 1315060510,
      public_id: 'sample_image',
      eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
    };
    expect(signParams(params, 'abcd')).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e');
  });

  it('leaves out empty values', () => {
    expect(signParams({ public_id: 'sample_image', tags: '' }, 'abcd')).toBe(
      signParams({ public_id: 'sample_image' }, 'abcd'),
    );
  });
});

describe('privateDownloadUrl', () => {
  it('signs a link that expires', async () => {
    const { privateDownloadUrl } = await import('@/lib/cloudinary');
    const account = { cloudName: 'c', apiKey: 'k', apiSecret: 's' };

    const url = new URL(privateDownloadUrl('hautecorner/applications/u/id', 'pdf', 10, account));
    const query = Object.fromEntries(url.searchParams);

    expect(url.origin + url.pathname).toBe('https://api.cloudinary.com/v1_1/c/image/download');
    expect(Number(query.expires_at) - Number(query.timestamp)).toBe(600);
    const { signature, api_key: apiKey, ...signed } = query;
    expect(apiKey).toBe('k');
    expect(signature).toBe(signParams(signed, 's'));
  });
});
