import { z } from 'zod';

const token = z.string().min(1).max(8192);

export const googleSignInBody = z.object({ idToken: token });

// Apple gives the app the person's name only on their first sign-in, with
// missing parts as null.
export const appleSignInBody = z.object({
  identityToken: token,
  fullName: z
    .object({
      givenName: z.string().trim().max(50).nullish(),
      familyName: z.string().trim().max(50).nullish(),
    })
    .nullish(),
});

export const refreshTokenBody = z.object({ refreshToken: z.string().min(1).max(200) });
