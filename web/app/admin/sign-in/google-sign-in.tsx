'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

// Google's own sign-in button. Its ID token goes to our server, which checks
// it and the admin role before setting the dashboard cookie.
export function GoogleSignIn({ clientId }: { clientId: string }) {
  const router = useRouter();
  const button = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [loaded, setLoaded] = useState(false);

  const signIn = useCallback(
    async ({ credential }: { credential: string }) => {
      setError(undefined);
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (response.ok) {
        router.replace('/admin');
        router.refresh();
        return;
      }
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? 'Sign-in failed. Try again');
    },
    [router],
  );

  useEffect(() => {
    if (!loaded || !window.google || !button.current) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: signIn });
    window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', shape: 'pill', width: 320 });
  }, [clientId, loaded, signIn]);

  return (
    <div className="grid gap-3">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <div ref={button} className="min-h-11" />
      {error ? <p className="text-sm font-bold text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
