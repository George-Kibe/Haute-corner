import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// scrypt with one of OWASP's recommended settings: N=2^15, r=8, p=3, about
// 32 MiB per hash. The settings are stored with each hash so they can change.
type Settings = { N: number; r: number; p: number };
const SETTINGS: Settings = { N: 2 ** 15, r: 8, p: 3 };
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, { N, r, p }: Settings) {
  const options: ScryptOptions = { N, r, p, maxmem: 256 * N * r };
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SETTINGS);
  return ['scrypt', SETTINGS.N, SETTINGS.r, SETTINGS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, key] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), { N: Number(N), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Takes as long as a real check, so a missing account cannot be told apart
// from a wrong password by how long the answer takes.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string) {
  dummyHash ??= hashPassword('a password that never matches');
  await verifyPassword(password, await dummyHash);
  return false;
}
