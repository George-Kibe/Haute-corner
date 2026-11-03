// Email sign-up, sign-in and password reset, with codes sent by email.
import type { Types } from 'mongoose';
import { passwordChangedEmail, resetCodeEmail, signUpCodeEmail, welcomeEmail } from '@/lib/email-templates';
import { ApiError } from '@/lib/http';
import { sendAfterResponse, sendEmail, type Email } from '@/lib/mail';
import { consumeCode, findPending, issueCode } from '@/lib/one-time-codes';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '@/lib/passwords';
import { EmailCode, type CodePurpose } from '@/models/EmailCode';
import { Session } from '@/models/Session';
import { User, type UserAttributes } from '@/models/User';

type StoredUser = UserAttributes & { _id: Types.ObjectId };

const active = { deletedAt: { $exists: false } };

// If the email cannot be sent, the code is still stored, so the person may ask
// again straight away instead of waiting out the minute between emails.
async function deliverCode(email: string, purpose: CodePurpose, message: Omit<Email, 'to'>) {
  try {
    await sendEmail({ to: email, ...message });
  } catch (error) {
    console.error('Sending a code failed', error);
    await EmailCode.updateOne({ email, purpose }, { $set: { sentAt: new Date(0) } });
    throw new ApiError(503, 'service_unavailable', 'We could not send the email. Please try again shortly');
  }
}

// Stores the sign-up until the address is confirmed, and emails a code. An
// address that already has a password must sign in or reset instead. One that
// only has Google or Apple can add a password this way.
export async function startSignUp({ name, email, password }: { name: string; email: string; password: string }) {
  const existing = await User.findOne({ email, ...active }).lean();
  if (existing?.passwordHash) {
    throw new ApiError(409, 'account_exists', 'An account with this email already exists. Sign in, or reset your password');
  }
  const passwordHash = await hashPassword(password);
  const code = await issueCode(email, 'signup', { name, passwordHash });
  await deliverCode(email, 'signup', signUpCodeEmail(code, name));
}

export async function resendSignUpCode(email: string) {
  const pending = await findPending(email, 'signup');
  if (!pending) throw new ApiError(400, 'invalid_code', 'This sign-up has expired. Please start again');
  const code = await issueCode(email, 'signup');
  await deliverCode(email, 'signup', signUpCodeEmail(code, pending.name));
}

// Confirms the address and returns the account: an existing one with this
// email gets the password, otherwise a new one is created and welcomed.
export async function completeSignUp(email: string, code: string): Promise<StoredUser> {
  const pending = await consumeCode(email, 'signup', code);

  const existing = await User.findOne({ email, ...active }).lean();
  if (existing) {
    return (await User.findByIdAndUpdate(
      existing._id,
      { $set: { passwordHash: pending.passwordHash, ...(!existing.name && pending.name && { name: pending.name }) } },
      { returnDocument: 'after' },
    ).lean())!;
  }

  try {
    const created = (await User.create({ email, name: pending.name, passwordHash: pending.passwordHash })).toObject();
    sendAfterResponse({ to: email, ...welcomeEmail(pending.name) });
    return created;
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    // Google or Apple created this account at the same moment.
    return (await User.findOneAndUpdate(
      { email, ...active },
      { $set: { passwordHash: pending.passwordHash } },
      { returnDocument: 'after' },
    ).lean())!;
  }
}

// The same answer for a wrong password and a missing account, taking the same time.
export async function signInWithPassword(email: string, password: string): Promise<StoredUser> {
  const user = await User.findOne({ email, ...active }).lean();
  const valid = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : await verifyAgainstDummy(password);
  if (!user || !valid) throw new ApiError(401, 'invalid_credentials', 'That email and password do not match');
  return user;
}

// Answers the same whether or not the account exists, so the endpoint cannot
// be used to find out who has an account. A reset also works for accounts
// that only used Google or Apple, and gives them a password.
export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email, ...active }).lean();
  if (!user) return;

  let code: string;
  try {
    code = await issueCode(email, 'reset');
  } catch (error) {
    // Asked again within the minute: say nothing different.
    if (error instanceof ApiError && error.status === 429) return;
    throw error;
  }
  await deliverCode(email, 'reset', resetCodeEmail(code, user.name));
}

// Sets the new password and signs out every device. The caller starts a new session.
export async function resetPassword(email: string, code: string, password: string): Promise<StoredUser> {
  await consumeCode(email, 'reset', code);
  const passwordHash = await hashPassword(password);
  const user = await User.findOneAndUpdate({ email, ...active }, { $set: { passwordHash } }, { returnDocument: 'after' }).lean();
  if (!user) throw new ApiError(400, 'invalid_code', 'This code has expired. Ask for a new one');

  await Session.deleteMany({ userId: user._id });
  sendAfterResponse({ to: email, ...passwordChangedEmail(user.name) });
  return user;
}
