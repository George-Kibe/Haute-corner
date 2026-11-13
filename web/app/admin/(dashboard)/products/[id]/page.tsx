import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { isObjectId } from '@/lib/validation';
import { Product } from '@/models/Product';
import { Report } from '@/models/Report';
import { Seller } from '@/models/Seller';
import { ActionForm } from '../../../action-form';
import { productAction } from '../../../actions';
import { Badge, Card, formatDate, formatKes, imageUrl, Loading, PageTitle, videoMp4Url, videoPosterUrl } from '../../../ui';
import { AuditHistory } from '../../audit-history';

export const metadata: Metadata = { title: 'Listing' };

async function ProductDetails({ params }: { params: PageProps<'/admin/products/[id]'>['params'] }) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const product = await Product.findById(id).lean();
  if (!product) notFound();
  const [seller, reports] = await Promise.all([
    Seller.findById(product.sellerId).lean(),
    Report.find({ productId: product._id }).sort({ _id: -1 }).limit(50).lean(),
  ]);

  return (
    <>
      <PageTitle back={{ href: '/admin/products', label: 'Listings' }}>{product.title}</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.media.map((item) => (
                <li key={item.publicId}>
                  {item.kind === 'image' ? (
                    <a href={imageUrl(item.publicId, 1600)} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl(item.publicId, 400)} alt="" className="aspect-square w-full rounded-lg bg-surface object-cover" />
                    </a>
                  ) : (
                    <video
                      controls
                      preload="none"
                      poster={videoPosterUrl(item.publicId)}
                      src={videoMp4Url(item.publicId)}
                      className="aspect-square w-full rounded-lg bg-black object-contain"
                    />
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Details">
            <p className="text-lg font-black">{formatKes(product.price)}</p>
            <p className="mt-1 text-sm text-muted">
              {product.type} · {product.audience} · {product.stock} in stock
              {product.options.length ? ` · sizes ${product.options.join(', ')}` : ''}
            </p>
            <p className="mt-4 whitespace-pre-line">{product.description}</p>
            <p className="mt-4 text-sm text-muted">
              Sold by{' '}
              {seller ? (
                <Link href={`/admin/sellers/${seller._id}`} className="font-bold text-brand underline">
                  {seller.businessName}
                </Link>
              ) : (
                'an unknown seller'
              )}
              , listed {formatDate(product.createdAt)}
            </p>
          </Card>
          <Card title={`Reports (${reports.length})`}>
            {reports.length === 0 ? (
              <p className="text-muted">No reports.</p>
            ) : (
              <ul className="grid gap-3 text-sm">
                {reports.map((report) => (
                  <li key={String(report._id)}>
                    <Badge>{report.status}</Badge> <span className="font-bold">{report.reason}</span>{' '}
                    <span className="text-muted">{formatDate(report.createdAt)}</span>
                    {report.details ? <p className="mt-1">{report.details}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="grid content-start gap-6">
          <Card title="Status">
            <Badge>{product.status}</Badge>
            {product.removedReason ? <p className="mt-2 text-sm">“{product.removedReason}”</p> : null}
            <div className="mt-4 grid gap-4">
              {product.status === 'removed' ? (
                <ActionForm action={productAction} id={id} intent="restore" label="Restore listing" tone="primary" />
              ) : (
                <ActionForm action={productAction} id={id} intent="remove" label="Remove listing" tone="danger" reason="required" />
              )}
            </div>
          </Card>
          <Card title="History">
            <AuditHistory targetType="product" targetId={product._id} />
          </Card>
        </div>
      </div>
    </>
  );
}

export default function ProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}
