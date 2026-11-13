import type { Types } from 'mongoose';
import { createSession } from '@/lib/auth';
import type { VerifiedIdentity } from '@/lib/identity';
import { syncListingsWithSellerStatus } from '@/lib/sellers';
import { serializeUser } from '@/lib/serializers';
import { ApiError } from '@/lib/http';
import { EmailCode } from '@/models/EmailCode';
import { Order } from '@/models/Order';
import { Purchase } from '@/models/Purchase';
import { Seller } from '@/models/Seller';
import { Session } from '@/models/Session';
import { User, type UserAttributes } from '@/models/User';

type StoredUser = UserAttributes & { _id: Types.ObjectId };

const isDuplicateKey = (error: unknown) => (error as { code?: number }).code === 11000;

export async function profile(user: StoredUser) {
  const seller = await Seller.findOne({ userId: user._id }).lean();
  return serializeUser(user, seller);
}

// Starts a session and returns what the sign-in endpoints send back.
export async function sessionFor(user: StoredUser) {
  const tokens = await createSession(user);
  return { ...tokens, user: await profile(user) };
}

// Finds the account for a Google or Apple identity. One already linked comes
// first. Otherwise an account with the same verified email is linked to it,
// and only then is a new account created. Apple's private relay addresses
// never match another account, so those stay separate.
async function findOrCreateForIdentity(
  identity: VerifiedIdentity,
  firstSignInName?: string,
  retried = false,
): Promise<StoredUser> {
  const { provider, providerId, email, avatarUrl } = identity;
  const name = identity.name ?? firstSignInName;
  const active = { deletedAt: { $exists: false } };

  const linked = await User.findOne({ identities: { $elemMatch: { provider, providerId } }, ...active }).lean();
  if (linked) return linked;

  if (email) {
    const byEmail = await User.findOneAndUpdate(
      { email, ...active },
      { $addToSet: { identities: { provider, providerId } } },
      { returnDocument: 'after' },
    ).lean();
    if (byEmail) return byEmail;
  }

  try {
    const created = await User.create({ identities: [{ provider, providerId }], email, name, avatarUrl });
    return created.toObject();
  } catch (error) {
    // Another request created or linked it at the same moment. Retry once.
    if (isDuplicateKey(error) && !retried) return findOrCreateForIdentity(identity, firstSignInName, true);
    throw error;
  }
}

// The provider's photo is kept current. The name is only set when missing, so
// changes made in the app are kept, and the email never changes here.
export async function signInWithIdentity(identity: VerifiedIdentity, firstSignInName?: string) {
  let user = await findOrCreateForIdentity(identity, firstSignInName);
  const name = identity.name ?? firstSignInName;
  const updates = {
    ...(identity.avatarUrl && identity.avatarUrl !== user.avatarUrl && { avatarUrl: identity.avatarUrl }),
    ...(!user.name && name && { name }),
  };
  if (Object.keys(updates).length > 0) {
    user = (await User.findByIdAndUpdate(user._id, { $set: updates }, { returnDocument: 'after' }).lean())!;
  }
  return sessionFor(user);
}

// Removes sessions, codes, the wish list and personal details. The document
// stays with only its ID and role, so records such as orders can still point
// to it. With its identities and email gone, signing in again with the same
// Google, Apple or email account creates a new, empty account.
// Orders in these states still need the buyer or seller, so the account stays.
const OPEN_ORDER_STATUSES = ['paid', 'confirmed', 'dispatched', 'delivered', 'disputed'] as const;

export async function deleteAccount(user: StoredUser) {
  const seller = await Seller.findOne({ userId: user._id }).lean();
  const openOrders = await Order.exists({
    $or: [{ buyerId: user._id }, ...(seller ? [{ sellerId: seller._id }] : [])],
    status: { $in: OPEN_ORDER_STATUSES },
  });
  if (openOrders) {
    throw new ApiError(409, 'conflict', 'You have orders in progress. You can delete your account once they are complete');
  }

  await Session.deleteMany({ userId: user._id });
  // A deleted account's shop stops selling. Its record stays for past orders.
  if (seller && seller.status !== 'rejected') {
    await Seller.updateOne(
      { _id: seller._id },
      { $set: { status: 'suspended', review: { by: user._id, at: new Date(), reason: 'Account deleted' } } },
    );
    await syncListingsWithSellerStatus(seller._id, 'suspended');
  }
  // Past orders are kept for records, without the buyer's personal details.
  const removed = {
    $unset: { buyerId: 1 },
    $set: { contact: { name: 'Deleted account', phone: 'Removed' }, deliveryAddress: { line1: 'Removed', city: 'Removed' } },
  };
  await Order.updateMany({ buyerId: user._id }, removed);
  await Purchase.updateMany({ buyerId: user._id }, { ...removed, $unset: { buyerId: 1, 'payment.phone': 1 } });
  if (user.email) await EmailCode.deleteMany({ email: user.email });
  await User.updateOne(
    { _id: user._id },
    {
      $set: { deletedAt: new Date(), identities: [], wishlist: [] },
      $unset: { email: 1, passwordHash: 1, name: 1, avatarUrl: 1, phone: 1, deliveryAddress: 1 },
    },
  );
}
