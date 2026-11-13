import { randomInt } from 'node:crypto';

// No 0, O, 1, I or L, so a reference read over the phone is not misheard.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// An 8-character reference such as K7P4M2QX, from a secure random source.
export function newRef() {
  let ref = '';
  for (let index = 0; index < 8; index++) ref += ALPHABET[randomInt(ALPHABET.length)];
  return ref;
}

export const isRef = (value: string) => new RegExp(`^[${ALPHABET}]{8}$`).test(value);
