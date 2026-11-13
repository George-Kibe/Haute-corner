import Link from 'next/link';
import { Suspense } from 'react';
import { currentAdmin } from '@/lib/admin-session';
import { SignOutButton } from './sign-out-button';

// Pages read the admin's cookie inside Suspense boundaries, so the shell can
// still be prerendered. Setting instant = false here made the dev server
// reload these pages in a loop.

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/sellers', label: 'Sellers' },
  { href: '/admin/products', label: 'Listings' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/audit', label: 'Audit log' },
];

async function SignedInAs() {
  const admin = await currentAdmin();
  return admin ? <span className="hidden text-sm text-muted sm:inline">{admin.email ?? admin.name}</span> : null;
}

export default function DashboardLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-black text-brand">
            HauteCorner admin
          </Link>
          <nav aria-label="Admin" className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-muted">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-brand">
                {link.label}
              </Link>
            ))}
          </nav>
          <Suspense>
            <SignedInAs />
          </Suspense>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
