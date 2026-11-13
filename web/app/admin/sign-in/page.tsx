import type { Metadata } from 'next';
import { GoogleSignIn } from './google-sign-in';

export const metadata: Metadata = { title: 'Sign in' };

export default function AdminSignInPage() {
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID;

  return (
    <main className="mx-auto grid w-full max-w-md flex-1 content-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-3xl font-black text-brand-deep">HauteCorner admin</h1>
        <p className="mt-2 text-muted">Sign in with the Google account that has admin access.</p>
      </div>
      {clientId ? <GoogleSignIn clientId={clientId} /> : <p className="text-red-700">GOOGLE_WEB_CLIENT_ID is not set.</p>}
    </main>
  );
}
