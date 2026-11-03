import { createHash } from 'node:crypto';

export type CloudinaryAccount = { cloudName: string; apiKey: string; apiSecret: string };

// Reads CLOUDINARY_URL, in the form cloudinary://<api key>:<api secret>@<cloud name>.
export function cloudinaryAccount(url = process.env.CLOUDINARY_URL): CloudinaryAccount {
  const match = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) throw new Error('CLOUDINARY_URL is not set, or is not in the form cloudinary://key:secret@cloud');
  const [, apiKey, apiSecret, cloudName] = match;
  return { cloudName, apiKey, apiSecret };
}

// Cloudinary's signature: the parameters sorted by name, joined as a query string
// without encoding, followed by the API secret, then hashed with SHA-1.
// https://cloudinary.com/documentation/authentication_signatures
export function signParams(params: Record<string, string | number | boolean>, apiSecret: string) {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== '' && params[key] !== undefined)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
