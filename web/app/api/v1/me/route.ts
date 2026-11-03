import { requireUser, unauthenticated } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { noContent, ok, parseBody, route } from '@/lib/http';
import { deleteAccount, profile } from '@/lib/users';
import { User } from '@/models/User';
import { updateMeBody } from '@/schemas/me';

export const GET = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  return ok(await profile(user));
});

export const PATCH = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  const changes = await parseBody(updateMeBody, request);

  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const [field, value] of Object.entries(changes)) {
    if (value === null) unset[field] = 1;
    else if (value !== undefined) set[field] = value;
  }

  const updated = await User.findOneAndUpdate(
    { _id: user._id, deletedAt: { $exists: false } },
    { $set: set, $unset: unset },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!updated) throw unauthenticated();
  return ok(await profile(updated));
});

// Open orders, disputes and seller balances will block deletion with 409 once
// they exist, from Phases 5 and 6.
export const DELETE = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  await deleteAccount(user._id);
  return noContent();
});
