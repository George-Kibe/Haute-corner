import type { Metadata } from 'next';
import Link from 'next/link';
import type { QueryFilter } from 'mongoose';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { Seller, SELLER_STATUSES, type SellerAttributes } from '@/models/Seller';
import { User } from '@/models/User';
import { Badge, Empty, FilterTabs, formatDate, formatKes, Loading, PageTitle } from '../../ui';

export const metadata: Metadata = { title: 'Sellers' };

const FILTERS = [...SELLER_STATUSES, 'payout_changes'];

async function SellerList({ searchParams }: { searchParams: PageProps<'/admin/sellers'>['searchParams'] }) {
  await requireAdmin();
  const requested = (await searchParams).status;
  const status = typeof requested === 'string' && FILTERS.includes(requested) ? requested : 'applied';

  const filter: QueryFilter<SellerAttributes> =
    status === 'payout_changes' ? { payoutNumberChangedAt: { $exists: true } } : { status: status as SellerAttributes['status'] };
  const sellers = await Seller.find(filter).sort({ _id: -1 }).limit(100).lean();
  const users = await User.find({ _id: { $in: sellers.map((seller) => seller.userId) } }).lean();
  const emailByUser = new Map(users.map((user) => [String(user._id), user.email]));

  return (
    <>
      <FilterTabs base="/admin/sellers" param="status" options={FILTERS} current={status} />
      {sellers.length === 0 ? (
        <Empty>No sellers here.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Delivery fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={String(seller._id)} className="border-b border-line last:border-0 hover:bg-surface">
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/admin/sellers/${seller._id}`} className="text-brand hover:underline">
                      {seller.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{emailByUser.get(String(seller.userId)) ?? 'No account'}</td>
                  <td className="px-4 py-3">{formatKes(seller.deliveryFee)}</td>
                  <td className="px-4 py-3">
                    <Badge>{seller.status}</Badge> {seller.payoutNumberChangedAt ? <Badge>payout_changed</Badge> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(seller.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function SellersPage({ searchParams }: PageProps<'/admin/sellers'>) {
  return (
    <>
      <PageTitle>Sellers</PageTitle>
      <Suspense fallback={<Loading />}>
        <SellerList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
