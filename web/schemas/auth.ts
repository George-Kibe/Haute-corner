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

// Addresses are compared in lower case everywhere.
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address').max(254));

// Length is the only rule, as NIST recommends, with room for passphrases.
const password = z.string().min(8, 'Use at least 8 characters').max(128, 'Use at most 128 characters');

const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from the email');

export const signUpBody = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email,
  password,
});

export const verifyEmailBody = z.object({ email, code });

export const resendCodeBody = z.object({ email, purpose: z.enum(['signup', 'reset']) });

export const passwordSignInBody = z.object({ email, password: z.string().min(1, 'Enter your password').max(128) });

export const forgotPasswordBody = z.object({ email });

export const resetPasswordBody = z.object({ email, code, password });
