import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-session';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { Empty, formatDate, Loading, PageTitle } from '../../ui';

export const metadata: Metadata = { title: 'Audit log' };

const targetHref = (type: string, id: string) =>
  type === 'seller' ? `/admin/sellers/${id}` : type === 'product' ? `/admin/products/${id}` : '/admin/reports?status=dismissed';

async function AuditList() {
  await requireAdmin();
  const entries = await AuditLog.find().sort({ _id: -1 }).limit(200).lean();
  const actors = await User.find({ _id: { $in: entries.map((entry) => entry.actorId) } }).lean();
  const nameById = new Map(actors.map((actor) => [String(actor._id), actor.email ?? actor.name ?? 'Admin']));

  if (entries.length === 0) return <Empty>No admin actions yet.</Empty>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Who</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={String(entry._id)} className="border-b border-line last:border-0">
              <td className="px-4 py-2 whitespace-nowrap text-muted">{formatDate(entry.createdAt)}</td>
              <td className="px-4 py-2">{nameById.get(String(entry.actorId)) ?? 'Admin'}</td>
              <td className="px-4 py-2">
                <Link href={targetHref(entry.targetType, String(entry.targetId))} className="font-bold text-brand hover:underline">
                  {entry.action.replace(/[._]/g, ' ')}
                </Link>
              </td>
              <td className="px-4 py-2">{entry.reason ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditPage() {
  return (
    <>
      <PageTitle>Audit log</PageTitle>
      <Suspense fallback={<Loading />}>
        <AuditList />
      </Suspense>
    </>
  );
}
