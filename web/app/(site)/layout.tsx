import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/lib/site';
import logoMark from '@/public/logo-mark.png';
import wordmark from '@/public/wordmark.png';

const navigation = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#protection', label: 'Buyer protection' },
  { href: '/#sellers', label: 'Sell' },
  { href: '/#questions', label: 'Questions' },
];

const footerLinks = [
  { href: '/support', label: 'Support' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms' },
  { href: '/seller-terms', label: 'Seller terms' },
  { href: '/delete-account', label: 'Delete your account' },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label={`${site.name} home`}>
      <Image src={logoMark} alt="" className="h-9 w-auto" priority />
      <Image src={wordmark} alt={site.name} className="h-4 w-auto sm:h-5" priority />
    </Link>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Brand />
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-bold text-muted md:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-brand">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/#get-the-app"
            className="rounded-full bg-brand px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-brand-dark"
          >
            Get the app
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Fashion from Kenya&apos;s independent sellers, in one app. Questions? Email{' '}
              <a href={`mailto:${site.email}`} className="font-bold text-brand underline underline-offset-2">
                {site.email}
              </a>
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-bold text-muted sm:flex sm:flex-wrap">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-brand">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">
          © {site.name}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
