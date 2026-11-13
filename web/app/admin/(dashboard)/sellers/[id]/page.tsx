import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { privateDownloadUrl } from '@/lib/cloudinary';
import { isObjectId } from '@/lib/validation';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { User } from '@/models/User';
import { ActionForm } from '../../../action-form';
import { sellerAction } from '../../../actions';
import { Badge, Card, formatDate, formatKes, imageUrl, Loading, PageTitle } from '../../../ui';
import { AuditHistory } from '../../audit-history';

export const metadata: Metadata = { title: 'Seller' };

const DOCUMENT_NAMES: Record<string, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  business_registration: 'Business registration',
  kra_pin: 'KRA PIN certificate',
  other: 'Other document',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

async function SellerDetails({ params }: { params: PageProps<'/admin/sellers/[id]'>['params'] }) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const seller = await Seller.findById(id).lean();
  if (!seller) notFound();

  const [user, products, counts] = await Promise.all([
    User.findById(seller.userId).lean(),
    Product.find({ sellerId: seller._id }).sort({ _id: -1 }).limit(12).lean(),
    Product.aggregate<{ _id: string; count: number }>([
      { $match: { sellerId: seller._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  const hasCloudinary = !!process.env.CLOUDINARY_URL;

  return (
    <>
      <PageTitle back={{ href: `/admin/sellers?status=${seller.status}`, label: 'Sellers' }}>{seller.businessName}</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card title="Application">
            <dl className="divide-y divide-line">
              <Row label="Status">
                <Badge>{seller.status}</Badge>
                {seller.review?.reason ? <span className="ml-2 text-sm text-muted">“{seller.review.reason}”</span> : null}
              </Row>
              <Row label="Account">
                {user?.deletedAt ? 'Deleted account' : `${user?.name ?? 'No name'} · ${user?.email ?? 'no email'}`}
              </Row>
              <Row label="Business phone">{seller.phone}</Row>
              <Row label="M-Pesa payout number">
                {seller.payoutMpesaNumber}
                {seller.payoutNumberChangedAt ? (
                  <span className="ml-2 font-bold text-amber-800">changed {formatDate(seller.payoutNumberChangedAt)}, payouts paused</span>
                ) : null}
              </Row>
              <Row label="Delivery fee">{formatKes(seller.deliveryFee)}</Row>
              <Row label="Delivery areas">{seller.deliveryAreas}</Row>
              <Row label="Returns note">{seller.returnsNote ?? '—'}</Row>
              <Row label="Applied">{formatDate(seller.createdAt)}</Row>
            </dl>
          </Card>

          <Card title="Documents">
            {seller.documents.length === 0 ? (
              <p className="text-muted">No documents.</p>
            ) : (
              <ul className="grid gap-2">
                {seller.documents.map((document) => (
                  <li key={document.publicId} className="flex items-center justify-between gap-3">
                    <span className="font-bold">{DOCUMENT_NAMES[document.kind] ?? document.kind}</span>
                    {hasCloudinary ? (
                      <a
                        href={privateDownloadUrl(document.publicId, document.format)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-brand underline"
                      >
                        Open (link works for 10 minutes)
                      </a>
                    ) : (
                      <span className="text-sm text-muted">CLOUDINARY_URL is not set</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Listings">
            <p className="mb-3 text-sm text-muted">
              {counts.length === 0 ? 'None yet.' : counts.map((count) => `${count.count} ${count._id}`).join(' · ')}{' '}
              {counts.length ? (
                <Link href={`/admin/products?seller=${seller._id}&status=all`} className="font-bold text-brand underline">
                  See all
                </Link>
              ) : null}
            </p>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {products.map((product) => {
                const image = product.media.find((item) => item.kind === 'image');
                return (
                  <li key={String(product._id)}>
                    <Link href={`/admin/products/${product._id}`} className="block text-sm hover:text-brand">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(image.publicId)} alt="" className="aspect-square w-full rounded-lg bg-surface object-cover" />
                      ) : null}
                      <span className="mt-1 line-clamp-1 font-bold">{product.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Actions">
            <div className="grid gap-5">
              {seller.status === 'applied' ? (
                <>
                  <ActionForm action={sellerAction} id={id} intent="approve" label="Approve" tone="primary" />
                  <ActionForm action={sellerAction} id={id} intent="reject" label="Reject" tone="danger" reason="required" />
                </>
              ) : null}
              {seller.status === 'approved' ? (
                <ActionForm
                  action={sellerAction}
                  id={id}
                  intent="suspend"
                  label="Suspend and hide listings"
                  tone="danger"
                  reason="required"
                />
              ) : null}
              {seller.status === 'suspended' ? (
                <ActionForm action={sellerAction} id={id} intent="reinstate" label="Reinstate" tone="primary" />
              ) : null}
              {seller.payoutNumberChangedAt ? (
                <ActionForm action={sellerAction} id={id} intent="confirm-payout" label="Confirm new payout number" />
              ) : null}
              {seller.status === 'rejected' ? <p className="text-sm text-muted">The seller can apply again from the app.</p> : null}
            </div>
          </Card>
          <Card title="History">
            <AuditHistory targetType="seller" targetId={seller._id} />
          </Card>
        </div>
      </div>
    </>
  );
}

export default function SellerPage({ params }: PageProps<'/admin/sellers/[id]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <SellerDetails params={params} />
    </Suspense>
  );
}
