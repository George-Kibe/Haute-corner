import { ok, route } from '@/lib/http';
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '@/lib/settings';
import { MINIMUM_APP_VERSION } from '@/lib/site';

export const GET = route(async () => {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudinaryCloudName) throw new Error('CLOUDINARY_CLOUD_NAME is not set');

  return ok(
    {
      minimumAppVersion: MINIMUM_APP_VERSION,
      cloudinaryCloudName,
      // The app checks these before uploading. The server checks them again.
      maxVideoSeconds: MAX_VIDEO_SECONDS,
      maxVideoBytes: MAX_VIDEO_BYTES,
      maxImagesPerProduct: MAX_IMAGES_PER_PRODUCT,
      maxImageBytes: MAX_IMAGE_BYTES,
    },
    { cache: 'public, s-maxage=300, stale-while-revalidate=3600' },
  );
});
