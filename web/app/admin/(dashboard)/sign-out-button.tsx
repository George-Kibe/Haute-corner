'use client';

import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/sign-in');
  };
  return (
    <button type="button" onClick={signOut} className="text-sm font-bold text-brand hover:underline">
      Sign out
    </button>
  );
}
