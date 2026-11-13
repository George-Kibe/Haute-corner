import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { Product } from '@/models/Product';
import { Report, REPORT_STATUSES, type ReportAttributes } from '@/models/Report';
import { User } from '@/models/User';
import { ActionForm } from '../../action-form';
import { reportAction } from '../../actions';
import { Badge, Empty, FilterTabs, formatDate, imageUrl, Loading, PageTitle } from '../../ui';

export const metadata: Metadata = { title: 'Reports' };

async function ReportList({ searchParams }: { searchParams: PageProps<'/admin/reports'>['searchParams'] }) {
  await requireAdmin();
  const requested = (await searchParams).status;
  const status = typeof requested === 'string' && (REPORT_STATUSES as readonly string[]).includes(requested) ? requested : 'open';
  const reports = await Report.find({ status: status as ReportAttributes['status'] }).sort({ _id: -1 }).limit(100).lean();
  const [products, reporters] = await Promise.all([
    Product.find({ _id: { $in: reports.map((report) => report.productId) } }).lean(),
    User.find({ _id: { $in: reports.map((report) => report.reporterId) } }).lean(),
  ]);
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const reporterById = new Map(reporters.map((user) => [String(user._id), user]));

  return (
    <>
      <FilterTabs base="/admin/reports" param="status" options={[...REPORT_STATUSES]} current={status} />
      {reports.length === 0 ? (
        <Empty>No reports here.</Empty>
      ) : (
        <ul className="grid gap-4">
          {reports.map((report) => {
            const product = productById.get(String(report.productId));
            const image = product?.media.find((item) => item.kind === 'image');
            const reporter = reporterById.get(String(report.reporterId));
            return (
              <li key={String(report._id)} className="grid gap-4 rounded-2xl border border-line bg-white p-5 md:grid-cols-[1fr_260px]">
                <div className="flex gap-4">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(image.publicId)} alt="" className="size-20 shrink-0 rounded-lg bg-surface object-cover" />
                  ) : null}
                  <div>
                    <Link href={`/admin/products/${report.productId}`} className="font-extrabold text-brand hover:underline">
                      {product?.title ?? 'Deleted listing'}
                    </Link>
                    <p className="mt-1">
                      <Badge>{report.reason}</Badge> {product ? <Badge>{product.status}</Badge> : null}
                    </p>
                    {report.details ? <p className="mt-2">{report.details}</p> : null}
                    <p className="mt-2 text-sm text-muted">
                      {reporter?.email ?? 'Deleted account'}, {formatDate(report.createdAt)}
                    </p>
                    {report.review?.note ? <p className="mt-1 text-sm text-muted">Note: {report.review.note}</p> : null}
                  </div>
                </div>
                {report.status === 'open' ? (
                  <div className="grid content-start gap-3">
                    <Link
                      href={`/admin/products/${report.productId}`}
                      className="rounded-full bg-red-700 px-4 py-2 text-center text-sm font-extrabold text-white hover:bg-red-800"
                    >
                      Review listing to remove
                    </Link>
                    <ActionForm
                      action={reportAction}
                      id={String(report._id)}
                      intent="dismiss"
                      label="Dismiss report"
                      reason="optional"
                      reasonLabel="Note (only admins see this)"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function ReportsPage({ searchParams }: PageProps<'/admin/reports'>) {
  return (
    <>
      <PageTitle>Reports</PageTitle>
      <Suspense fallback={<Loading />}>
        <ReportList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
