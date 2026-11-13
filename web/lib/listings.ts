import { Types, type QueryFilter } from 'mongoose';
import type { z } from 'zod';
import { fetchAsset, sellerMediaFolder } from '@/lib/cloudinary';
import { ApiError, notFound } from '@/lib/http';
import { serializeProduct } from '@/lib/serializers';
import type { StoredSeller } from '@/lib/sellers';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '@/lib/settings';
import { isObjectId } from '@/lib/validation';
import { Product, type Media, type ProductAttributes } from '@/models/Product';
import type { createProductBody, sellerProductsQuery, updateProductBody } from '@/schemas/seller';

type StoredProduct = ProductAttributes & { _id: Types.ObjectId };

const mediaError = (message: string) => new ApiError(400, 'validation_failed', 'The request is not valid', { media: message });

// Durations are rounded by the camera and by Cloudinary, so allow a moment over.
const DURATION_TOLERANCE_SECONDS = 0.5;

// Every new file must be one this seller uploaded, and its size and length are
// read from Cloudinary, never trusted from the app. Files already on the
// product keep the details checked when they were added.
async function verifyMedia(seller: StoredSeller, items: { kind: Media['kind']; publicId: string }[], current: Media[] = []) {
  const folder = `${sellerMediaFolder(String(seller._id))}/`;
  const known = new Map(current.map((item) => [`${item.kind}:${item.publicId}`, item]));

  return Promise.all(
    items.map(async ({ kind, publicId }): Promise<Media> => {
      const existing = known.get(`${kind}:${publicId}`);
      if (existing) return existing;

      if (!publicId.startsWith(folder)) throw mediaError('Upload your photos and video again');
      const asset = await fetchAsset(kind, publicId);
      if (!asset || asset.type !== 'upload') throw mediaError('Upload your photos and video again');

      if (kind === 'image') {
        if (asset.bytes > MAX_IMAGE_BYTES) throw mediaError('Each photo must be under 20 MB');
        return { kind, publicId, width: asset.width, height: asset.height };
      }
      if (asset.bytes > MAX_VIDEO_BYTES) throw mediaError('The video must be under 100 MB');
      if (asset.duration === undefined || asset.duration > MAX_VIDEO_SECONDS + DURATION_TOLERANCE_SECONDS) {
        throw mediaError(`The video must be ${MAX_VIDEO_SECONDS} seconds or shorter`);
      }
      return { kind, publicId, width: asset.width, height: asset.height, durationSeconds: Math.round(asset.duration) };
    }),
  );
}

// Includes the removal reason, which only the seller and admins see.
export function serializeOwnProduct(product: StoredProduct, seller: StoredSeller) {
  return { ...serializeProduct(product, seller), removedReason: product.removedReason ?? null };
}

export async function listOwnProducts(seller: StoredSeller, query: z.output<typeof sellerProductsQuery>) {
  const filter: QueryFilter<ProductAttributes> = { sellerId: seller._id };
  if (query.status) filter.status = query.status;
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const found = await Product.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1)
    .lean();
  const page = found.slice(0, query.limit);
  const nextCursor = found.length > query.limit ? String(page[page.length - 1]._id) : null;
  return { data: page.map((product) => serializeOwnProduct(product, seller)), nextCursor };
}

// A seller only ever finds their own products. Anything else is 404, so IDs
// of other sellers' products are not confirmed.
export async function findOwnProduct(seller: StoredSeller, id: string) {
  if (!isObjectId(id)) throw notFound();
  const product = await Product.findOne({ _id: id, sellerId: seller._id }).lean();
  if (!product) throw notFound();
  return product;
}

export async function createListing(seller: StoredSeller, body: z.output<typeof createProductBody>) {
  const media = await verifyMedia(seller, body.media);
  const product = await Product.create({ ...body, media, sellerId: seller._id, status: 'active' });
  return product.toObject();
}

export async function updateListing(seller: StoredSeller, id: string, changes: z.output<typeof updateProductBody>) {
  const product = await findOwnProduct(seller, id);
  if (product.status === 'removed') {
    throw new ApiError(409, 'conflict', 'This listing was removed by HauteCorner and cannot be changed');
  }

  const { media, status, ...fields } = changes;
  const set: Partial<ProductAttributes> = { ...fields };
  if (media) set.media = await verifyMedia(seller, media, product.media);
  // While a shop is not approved its listings stay hidden, and archiving or
  // restoring one only changes it once the shop is approved again.
  if (status && product.status !== 'hidden') set.status = status;

  const updated = await Product.findOneAndUpdate(
    { _id: product._id, sellerId: seller._id, status: { $ne: 'removed' } },
    { $set: set },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!updated) throw new ApiError(409, 'conflict', 'This listing changed. Refresh and try again');
  return updated;
}

// Archiving keeps the product, so past orders still point to it.
export async function archiveListing(seller: StoredSeller, id: string) {
  const product = await findOwnProduct(seller, id);
  if (product.status === 'archived') return;
  if (product.status !== 'active') throw new ApiError(409, 'conflict', 'Only a listing on sale can be archived');
  await Product.updateOne({ _id: product._id, sellerId: seller._id, status: 'active' }, { $set: { status: 'archived' } });
}
