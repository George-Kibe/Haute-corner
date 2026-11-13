import type { Types } from 'mongoose';
import type { z } from 'zod';
import { applicationFolder, fetchAsset } from '@/lib/cloudinary';
import { ApiError } from '@/lib/http';
import { Product } from '@/models/Product';
import { Seller, type SellerAttributes, type SellerDocument } from '@/models/Seller';
import type { UserAttributes } from '@/models/User';
import type { applicationBody, sellerProfileBody } from '@/schemas/seller';

type StoredUser = UserAttributes & { _id: Types.ObjectId };
export type StoredSeller = SellerAttributes & { _id: Types.ObjectId };

const conflict = (message: string) => new ApiError(409, 'conflict', message);

// Only ever returned to the seller themselves. Document IDs stay on the server;
// the seller sees which kinds they sent.
export function serializeOwnSeller(seller: StoredSeller) {
  return {
    id: String(seller._id),
    status: seller.status,
    businessName: seller.businessName,
    phone: seller.phone,
    payoutMpesaNumber: seller.payoutMpesaNumber,
    payoutNumberUnderReview: !!seller.payoutNumberChangedAt,
    deliveryFee: seller.deliveryFee,
    deliveryAreas: seller.deliveryAreas,
    returnsNote: seller.returnsNote ?? null,
    documents: seller.documents.map((document) => ({ kind: document.kind })),
    // A rejection or suspension reason, so the seller knows what to fix.
    reviewReason: seller.status === 'rejected' || seller.status === 'suspended' ? (seller.review?.reason ?? null) : null,
    createdAt: seller.createdAt.toISOString(),
  };
}

// Documents must be private files in this user's application folder.
async function verifyDocuments(userId: Types.ObjectId, documents: { kind: SellerDocument['kind']; publicId: string }[]) {
  const folder = `${applicationFolder(String(userId))}/`;
  return Promise.all(
    documents.map(async ({ kind, publicId }) => {
      const invalid = new ApiError(400, 'validation_failed', 'The request is not valid', {
        documents: 'Upload your documents again',
      });
      if (!publicId.startsWith(folder)) throw invalid;
      const asset = await fetchAsset('image', publicId, 'private');
      if (!asset) throw invalid;
      return { kind, publicId, format: asset.format };
    }),
  );
}

// A first application, or a new one after a rejection. Anyone already
// applying, approved or suspended is refused.
export async function applyToSell(user: StoredUser, body: z.output<typeof applicationBody>) {
  const existing = await Seller.findOne({ userId: user._id }).lean();
  if (existing && existing.status !== 'rejected') {
    throw conflict(existing.status === 'applied' ? 'Your application is already being reviewed' : 'You already have a shop');
  }

  const documents = await verifyDocuments(user._id, body.documents);
  const fields = { ...body, documents, status: 'applied' as const };

  if (existing) {
    const updated = await Seller.findOneAndUpdate(
      { _id: existing._id, status: 'rejected' },
      { $set: fields, $unset: { review: 1, payoutNumberChangedAt: 1, ...(!body.returnsNote && { returnsNote: 1 }) } },
      { returnDocument: 'after', runValidators: true },
    ).lean();
    if (!updated) throw conflict('Your application changed. Refresh and try again');
    return updated;
  }

  try {
    return (await Seller.create({ userId: user._id, ...fields })).toObject();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw conflict('Your application is already being reviewed');
    throw error;
  }
}

// A new payout number pauses payouts until an admin checks it, as changing
// it is a common route for fraud.
export async function updateSellerProfile(seller: StoredSeller, changes: z.output<typeof sellerProfileBody>) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  // Only fields that were sent are present. null, or an empty returns note, clears.
  for (const [field, value] of Object.entries(changes)) {
    if (value === null || value === undefined) unset[field] = 1;
    else set[field] = value;
  }
  if (changes.payoutMpesaNumber && changes.payoutMpesaNumber !== seller.payoutMpesaNumber) {
    set.payoutNumberChangedAt = new Date();
  }

  const updated = await Seller.findOneAndUpdate({ _id: seller._id }, { $set: set, $unset: unset }, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  return updated!;
}

// Listings follow the seller: hidden while not approved, back on sale once
// approved again. Archived and removed listings stay as they are.
export async function syncListingsWithSellerStatus(sellerId: Types.ObjectId, status: SellerAttributes['status']) {
  if (status === 'approved') {
    await Product.updateMany({ sellerId, status: 'hidden' }, { $set: { status: 'active' } });
  } else {
    await Product.updateMany({ sellerId, status: 'active' }, { $set: { status: 'hidden' } });
  }
}
