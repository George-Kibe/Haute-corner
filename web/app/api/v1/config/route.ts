import { ok, route } from '@/lib/http';
import { MINIMUM_APP_VERSION } from '@/lib/site';

export const GET = route(async () => {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudinaryCloudName) throw new Error('CLOUDINARY_CLOUD_NAME is not set');

  return ok(
    { minimumAppVersion: MINIMUM_APP_VERSION, cloudinaryCloudName },
    { cache: 'public, s-maxage=300, stale-while-revalidate=3600' },
  );
});
