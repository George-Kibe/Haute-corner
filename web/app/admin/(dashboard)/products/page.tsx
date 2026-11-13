import type { Metadata } from 'next';
import Link from 'next/link';
import type { QueryFilter } from 'mongoose';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { isObjectId } from '@/lib/validation';
import { Product, PRODUCT_STATUSES, type ProductAttributes } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { Badge, Empty, formatDate, formatKes, imageUrl, Loading, PageTitle } from '../../ui';

export const metadata: Metadata = { title: 'Listings' };

const FILTERS = ['all', ...PRODUCT_STATUSES];

type SearchParams = PageProps<'/admin/products'>['searchParams'];

async function ProductList({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === 'string' && FILTERS.includes(params.status) ? params.status : 'active';
  const sellerId = typeof params.seller === 'string' && isObjectId(params.seller) ? params.seller : undefined;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';

  const filter: QueryFilter<ProductAttributes> = {};
  if (status !== 'all') filter.status = status as ProductAttributes['status'];
  if (sellerId) filter.sellerId = sellerId;
  if (q) filter.$text = { $search: q };
  const products = await Product.find(filter).sort({ _id: -1 }).limit(100).lean();
  const sellers = await Seller.find({ _id: { $in: products.map((product) => product.sellerId) } }).lean();
  const sellerById = new Map(sellers.map((seller) => [String(seller._id), seller]));

  const link = (next: Record<string, string>) => {
    const query = new URLSearchParams({ status, ...(sellerId && { seller: sellerId }), ...(q && { q }), ...next });
    return `/admin/products?${query}`;
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={link({ status: option })}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${option === status ? 'bg-brand text-white' : 'border border-line bg-white text-muted hover:text-brand'}`}
          >
            {option}
          </Link>
        ))}
        <form action="/admin/products" className="ml-auto flex gap-2">
          <input type="hidden" name="status" value={status} />
          {sellerId ? <input type="hidden" name="seller" value={sellerId} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search titles"
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm"
          />
        </form>
      </div>
      {sellerId ? (
        <p className="mb-4 text-sm text-muted">
          Showing one seller.{' '}
          <Link href={`/admin/products?status=${status}`} className="font-bold text-brand underline">
            Show all sellers
          </Link>
        </p>
      ) : null}
      {products.length === 0 ? (
        <Empty>No listings here.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Listed</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const image = product.media.find((item) => item.kind === 'image');
                const seller = sellerById.get(String(product.sellerId));
                return (
                  <tr key={String(product._id)} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${product._id}`} className="flex items-center gap-3 font-bold text-brand hover:underline">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl(image.publicId, 200)} alt="" className="size-12 rounded-lg bg-surface object-cover" />
                        ) : null}
                        <span className="line-clamp-2">{product.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {seller ? (
                        <Link href={`/admin/sellers/${seller._id}`} className="hover:text-brand">
                          {seller.businessName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2">{formatKes(product.price)}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <Badge>{product.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted">{formatDate(product.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  return (
    <>
      <PageTitle>Listings</PageTitle>
      <Suspense fallback={<Loading />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
