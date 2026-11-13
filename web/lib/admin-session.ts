import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { isObjectId } from '@/lib/validation';
import { User } from '@/models/User';

// The dashboard signs admins in with Google and keeps them signed in with an
// HttpOnly cookie for one working day (R-8). The cookie holds only the user
// ID; the admin role is checked in the database on every request, so removing
// it takes effect at once.
export const ADMIN_COOKIE = 'hc_admin';
const LIFETIME_SECONDS = 8 * 60 * 60;
const ISSUER = 'hautecorner';
const AUDIENCE = 'hautecorner-admin';

function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set to at least 32 random characters');
  return new TextEncoder().encode(secret);
}

export function signAdminToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${LIFETIME_SECONDS}s`)
    .sign(signingKey());
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: ISSUER, audience: AUDIENCE, algorithms: ['HS256'] });
    return payload.sub && isObjectId(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: LIFETIME_SECONDS,
};

// The signed-in admin, or null. Reads the request's cookies.
export async function currentAdmin() {
  const userId = await verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!userId) return null;
  await dbConnect();
  return User.findOne({ _id: userId, role: 'admin', deletedAt: { $exists: false } }).lean();
}

// For dashboard pages and actions: the admin, or a trip to the sign-in page.
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/sign-in');
  return admin;
}
