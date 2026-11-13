import { requireSeller, requireUser } from '@/lib/auth';
import { applicationFolder, sellerMediaFolder, uploadParams } from '@/lib/cloudinary';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { uploadSignBody } from '@/schemas/seller';

// Signs one direct upload to Cloudinary. Any signed-in user can upload
// application documents, which are private. Only approved sellers can upload
// product photos and videos, into their own folder.
export const POST = route(async (request) => {
  await dbConnect();
  const { kind } = await parseBody(uploadSignBody, request);

  let ownerId: string;
  let folder: string;
  if (kind === 'document') {
    const user = await requireUser(request);
    ownerId = String(user._id);
    folder = applicationFolder(ownerId);
  } else {
    const { user, seller } = await requireSeller(request);
    ownerId = String(user._id);
    folder = sellerMediaFolder(String(seller._id));
  }
  await rateLimit('uploadSigns:user', ownerId, LIMITS.uploadSignsPerUser);

  return ok(uploadParams(kind, folder));
});
