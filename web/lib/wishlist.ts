import { Types } from 'mongoose';
import { ApiError, notFound } from '@/lib/http';
import { Product } from '@/models/Product';
import { User, WISHLIST_LIMIT } from '@/models/User';

const ids = (list: Types.ObjectId[]) => list.map(String);

// Saved product IDs, newest first.
export async function wishlistIds(userId: Types.ObjectId) {
  const user = await User.findById(userId, { wishlist: 1 }).lean();
  return ids(user?.wishlist ?? []);
}

// Saves a product at the top of the list. Saving it again changes nothing.
export async function saveProduct(userId: Types.ObjectId, productId: string) {
  if (!(await Product.exists({ _id: productId, status: 'active' }))) throw notFound();

  const id = new Types.ObjectId(productId);
  const result = await User.updateOne(
    { _id: userId, wishlist: { $ne: id, $not: { $size: WISHLIST_LIMIT } } },
    { $push: { wishlist: { $each: [id], $position: 0 } } },
  );
  if (result.modifiedCount === 0 && !(await User.exists({ _id: userId, wishlist: id }))) {
    throw new ApiError(409, 'wishlist_full', `Your wish list holds up to ${WISHLIST_LIMIT} items. Remove some to save more`);
  }
}

export async function removeProduct(userId: Types.ObjectId, productId: string) {
  await User.updateOne({ _id: userId }, { $pull: { wishlist: new Types.ObjectId(productId) } });
}

// Adds likes made on the device before signing in. New ones go to the top in
// the order given, unknown or unavailable products are skipped, and the list
// keeps its newest 200.
export async function mergeProducts(userId: Types.ObjectId, productIds: string[]) {
  const current = await wishlistIds(userId);
  const candidates = [...new Set(productIds)].filter((id) => !current.includes(id));
  const available = new Set(
    ids((await Product.find({ _id: { $in: candidates }, status: 'active' }, { _id: 1 }).lean()).map((p) => p._id)),
  );
  const merged = [...candidates.filter((id) => available.has(id)), ...current].slice(0, WISHLIST_LIMIT);

  await User.updateOne({ _id: userId }, { $set: { wishlist: merged.map((id) => new Types.ObjectId(id)) } });
  return merged;
}
