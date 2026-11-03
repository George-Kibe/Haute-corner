import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

import { authRequest, endSession, signOutSession, startSession } from '@/features/auth/session';
import type { SignInResult } from '@/features/auth/types';
import { apiRequest, ApiError } from '@/lib/api-client';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Starting Google sign-in without its client IDs crashes the app on iOS.
export const isGoogleSignInConfigured = !!webClientId && (process.env.EXPO_OS !== 'ios' || !!iosClientId);

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  // The ID token is issued for the web client, which is the audience the API checks.
  GoogleSignin.configure({ webClientId, iosClientId });
  googleConfigured = true;
}

// Each returns false if the person cancelled.
export async function signInWithGoogle() {
  if (!isGoogleSignInConfigured) {
    throw new ApiError(0, 'not_configured', 'Google sign-in is not set up in this build yet');
  }
  configureGoogle();

  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return false;
    idToken = response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return false;
    throw error;
  }
  if (!idToken) throw new ApiError(0, 'no_token', 'Google did not confirm who you are. Please try again');

  const { data } = await apiRequest<SignInResult>('/auth/google', { method: 'POST', body: { idToken } });
  await startSession(data);
  return true;
}

export async function signInWithApple() {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw error;
  }
  if (!credential.identityToken) throw new ApiError(0, 'no_token', 'Apple did not confirm who you are. Please try again');

  // Apple shares the name only the first time someone signs in to the app.
  const fullName = credential.fullName
    ? { givenName: credential.fullName.givenName, familyName: credential.fullName.familyName }
    : null;
  const { data } = await apiRequest<SignInResult>('/auth/apple', {
    method: 'POST',
    body: { identityToken: credential.identityToken, fullName },
  });
  await startSession(data);
  return true;
}

export async function signOut() {
  if (isGoogleSignInConfigured) {
    configureGoogle();
    // Without this, Google signs straight back in to the same account next time.
    await GoogleSignin.signOut().catch(() => undefined);
  }
  await signOutSession();
}

export async function deleteAccount() {
  await authRequest('/me', { method: 'DELETE' });
  if (isGoogleSignInConfigured) {
    configureGoogle();
    await GoogleSignin.revokeAccess().catch(() => undefined);
  }
  await endSession();
}

// Email sign-up, sign-in and password reset. Codes arrive by email.
export type CodeSent = { email: string; expiresInSeconds: number; resendAfterSeconds: number };
export type CodePurpose = 'signup' | 'reset';

const post = <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body }).then((response) => response.data);

export const startEmailSignUp = (details: { name: string; email: string; password: string }) =>
  post<CodeSent>('/auth/email/signup', details);

export async function verifyEmail(email: string, code: string) {
  await startSession(await post<SignInResult>('/auth/email/verify', { email, code }));
}

export async function signInWithEmail(email: string, password: string) {
  await startSession(await post<SignInResult>('/auth/email/sign-in', { email, password }));
}

export const requestPasswordReset = (email: string) => post<CodeSent>('/auth/password/forgot', { email });

// Signs out other devices, and signs in this one with the new password.
export async function resetPassword(email: string, code: string, password: string) {
  await startSession(await post<SignInResult>('/auth/password/reset', { email, code, password }));
}

export const resendCode = (email: string, purpose: CodePurpose) =>
  post<CodeSent>('/auth/email/resend', { email, purpose });
