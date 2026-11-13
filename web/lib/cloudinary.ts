import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from '@/lib/http';

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

export const ROOT_FOLDER = 'hautecorner';
export const sellerMediaFolder = (sellerId: string) => `${ROOT_FOLDER}/sellers/${sellerId}/products`;
export const applicationFolder = (userId: string) => `${ROOT_FOLDER}/applications/${userId}`;

export type UploadKind = 'image' | 'video' | 'document';

const ALLOWED_FORMATS: Record<UploadKind, string> = {
  image: 'jpg,jpeg,png,webp,heic,heif',
  video: 'mp4,mov,m4v,webm,3gp',
  document: 'jpg,jpeg,png,webp,heic,heif,pdf',
};

// Prepares adaptive streaming at upload, capped at 720p to save credits.
export const VIDEO_EAGER = 'sp_auto:maxres_720p/m3u8';

// Parameters for one direct upload from the app. The server chooses the public
// ID, so a file can only land in the folder it was signed for, and the app must
// send these values unchanged. Identity documents upload as private assets.
export function uploadParams(kind: UploadKind, folder: string, account = cloudinaryAccount()) {
  const resourceType = kind === 'video' ? 'video' : 'image';
  const params: Record<string, string | number> = {
    timestamp: Math.floor(Date.now() / 1000),
    public_id: `${folder}/${randomBytes(12).toString('hex')}`,
    asset_folder: folder,
    allowed_formats: ALLOWED_FORMATS[kind],
    ...(kind === 'document' && { type: 'private' }),
    ...(kind === 'video' && { eager: VIDEO_EAGER, eager_async: 'true' }),
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${account.cloudName}/${resourceType}/upload`,
    apiKey: account.apiKey,
    params,
    signature: signParams(params, account.apiSecret),
  };
}

export type CloudinaryAsset = {
  publicId: string;
  resourceType: 'image' | 'video';
  type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
};

function adminAuth(account: CloudinaryAccount) {
  return `Basic ${Buffer.from(`${account.apiKey}:${account.apiSecret}`).toString('base64')}`;
}

// Looks up an uploaded file with the Admin API, so its size, length and
// location come from Cloudinary rather than from the app. Returns null if
// there is no such file.
export async function fetchAsset(
  resourceType: 'image' | 'video',
  publicId: string,
  type: 'upload' | 'private' = 'upload',
  account = cloudinaryAccount(),
): Promise<CloudinaryAsset | null> {
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/${resourceType}/${type}/${publicId
        .split('/')
        .map(encodeURIComponent)
        .join('/')}${resourceType === 'video' ? '?media_metadata=true' : ''}`,
      // Video length is only returned with media metadata.
      { headers: { Authorization: adminAuth(account) }, cache: 'no-store' },
    );
  } catch {
    throw new ApiError(503, 'service_unavailable', 'Media storage is not reachable. Try again shortly');
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(503, 'service_unavailable', 'Media storage is not reachable. Try again shortly');

  const body = (await response.json()) as {
    public_id: string;
    resource_type: 'image' | 'video';
    type: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  return {
    publicId: body.public_id,
    resourceType: body.resource_type,
    type: body.type,
    format: body.format,
    bytes: body.bytes,
    width: body.width,
    height: body.height,
    duration: body.duration,
  };
}

// A link to a private file that works for a few minutes, for admins reviewing
// identity documents.
export function privateDownloadUrl(publicId: string, format: string, minutes = 10, account = cloudinaryAccount()) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, format, type: 'private', timestamp, expires_at: timestamp + minutes * 60 };
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
    api_key: account.apiKey,
    signature: signParams(params, account.apiSecret),
  });
  return `https://api.cloudinary.com/v1_1/${account.cloudName}/image/download?${query}`;
}
