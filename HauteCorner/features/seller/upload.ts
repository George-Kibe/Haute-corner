import { authRequest } from '@/features/auth/session';
import type { UploadKind, UploadSignature } from '@/features/seller/types';

export type LocalFile = { uri: string; mimeType?: string | null; fileName?: string | null };

function guessName(file: LocalFile, kind: UploadKind) {
  if (file.fileName) return file.fileName;
  const extension = file.uri.split('?')[0].split('.').pop();
  return `${kind}.${extension && extension.length <= 5 ? extension : kind === 'video' ? 'mp4' : 'jpg'}`;
}

// Uploads a file from the phone straight to Cloudinary with a signature from
// our server, so files never pass through the API. Reports progress from 0 to 1.
export async function uploadFile(kind: UploadKind, file: LocalFile, onProgress?: (fraction: number) => void) {
  const { data: signed } = await authRequest<UploadSignature>('/uploads/sign', { method: 'POST', body: { kind } });

  const form = new FormData();
  for (const [key, value] of Object.entries(signed.params)) form.append(key, String(value));
  form.append('api_key', signed.apiKey);
  form.append('signature', signed.signature);
  // React Native's FormData takes a file as { uri, name, type }.
  form.append('file', {
    uri: file.uri,
    name: guessName(file, kind),
    type: file.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
  } as unknown as Blob);

  // fetch does not report upload progress, so this uses XMLHttpRequest.
  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', signed.uploadUrl);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => {
      let body: { public_id?: string; error?: { message?: string } } | null = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {}
      if (request.status >= 200 && request.status < 300 && body?.public_id) resolve(body as { public_id: string });
      else reject(new Error(body?.error?.message ?? 'The upload did not finish. Try again'));
    };
    request.onerror = () => reject(new Error('Check your connection and try again'));
    request.send(form);
  });
  onProgress?.(1);
  return result.public_id;
}
