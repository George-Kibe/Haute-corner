import type { Types } from 'mongoose';
import { createSession } from '@/lib/auth';
import type { VerifiedIdentity } from '@/lib/identity';
import { serializeUser } from '@/lib/serializers';
import { Seller } from '@/models/Seller';
import { Session } from '@/models/Session';
import { User, type UserAttributes } from '@/models/User';

export async function profile(user: UserAttributes & { _id: Types.ObjectId }) {
  const seller = await Seller.findOne({ userId: user._id }).lean();
  return serializeUser(user, seller);
}

// Finds or creates the user for a verified identity, then starts a session.
// The provider's email and photo are refreshed each time, but the name is only
// set once, so that changes the user makes in the app are kept.
export async function signIn(identity: VerifiedIdentity, firstSignInName?: string) {
  const { provider, providerId, email, avatarUrl } = identity;
  const name = identity.name ?? firstSignInName;

  const user = await User.findOneAndUpdate(
    { provider, providerId },
    {
      $setOnInsert: name ? { name } : {},
      $set: { ...(email && { email }), ...(avatarUrl && { avatarUrl }) },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
  ).lean();

  const tokens = await createSession(user);
  return { ...tokens, user: await profile(user) };
}

// Removes sessions, the wish list and personal details. The document stays,
// with only its ID, provider and role, so that records such as orders can still
// point to it. Its providerId is replaced, so signing in again creates a new
// account rather than restoring this one.
export async function deleteAccount(userId: Types.ObjectId) {
  await Session.deleteMany({ userId });
  await User.updateOne(
    { _id: userId },
    {
      $set: { deletedAt: new Date(), providerId: `deleted:${userId}`, wishlist: [] },
      $unset: { email: 1, name: 1, avatarUrl: 1, phone: 1, deliveryAddress: 1 },
    },
  );
}
