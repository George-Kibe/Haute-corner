import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { Product } from '@/models/Product';
import { Report } from '@/models/Report';
import { Seller } from '@/models/Seller';
import { Loading, PageTitle } from '../ui';

async function Overview() {
  await requireAdmin();
  const [applied, approved, payoutChanges, openReports, activeProducts] = await Promise.all([
    Seller.countDocuments({ status: 'applied' }),
    Seller.countDocuments({ status: 'approved' }),
    Seller.countDocuments({ payoutNumberChangedAt: { $exists: true } }),
    Report.countDocuments({ status: 'open' }),
    Product.countDocuments({ status: 'active' }),
  ]);

  const tiles = [
    { label: 'Applications to review', value: applied, href: '/admin/sellers?status=applied', urgent: applied > 0 },
    { label: 'Payout numbers to confirm', value: payoutChanges, href: '/admin/sellers?status=payout_changes', urgent: payoutChanges > 0 },
    { label: 'Open reports', value: openReports, href: '/admin/reports', urgent: openReports > 0 },
    { label: 'Approved sellers', value: approved, href: '/admin/sellers?status=approved' },
    { label: 'Listings on sale', value: activeProducts, href: '/admin/products?status=active' },
  ];

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <li key={tile.label}>
          <Link
            href={tile.href}
            className={`block rounded-2xl border bg-white p-5 transition-colors hover:border-brand ${tile.urgent ? 'border-amber-400' : 'border-line'}`}
          >
            <p className="text-sm font-bold text-muted">{tile.label}</p>
            <p className="mt-1 text-4xl font-black text-ink">{tile.value}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AdminHome() {
  return (
    <>
      <PageTitle>Overview</PageTitle>
      <Suspense fallback={<Loading />}>
        <Overview />
      </Suspense>
    </>
  );
}
