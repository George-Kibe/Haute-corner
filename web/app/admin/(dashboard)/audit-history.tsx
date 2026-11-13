import type { Types } from 'mongoose';
import { AuditLog, type AuditLogAttributes } from '@/models/AuditLog';
import { User } from '@/models/User';
import { formatDate } from '../ui';

// Who did what to one record, newest first.
export async function AuditHistory({ targetType, targetId }: { targetType: AuditLogAttributes['targetType']; targetId: Types.ObjectId }) {
  const entries = await AuditLog.find({ targetType, targetId }).sort({ _id: -1 }).limit(50).lean();
  if (entries.length === 0) return <p className="text-sm text-muted">No admin actions yet.</p>;
  const actors = await User.find({ _id: { $in: entries.map((entry) => entry.actorId) } }).lean();
  const nameById = new Map(actors.map((actor) => [String(actor._id), actor.email ?? actor.name ?? 'Admin']));

  return (
    <ol className="grid gap-3 text-sm">
      {entries.map((entry) => (
        <li key={String(entry._id)}>
          <p className="font-bold text-ink">{entry.action.replace(/[._]/g, ' ')}</p>
          <p className="text-muted">
            {nameById.get(String(entry.actorId)) ?? 'Admin'}, {formatDate(entry.createdAt)}
          </p>
          {entry.reason ? <p className="mt-1 text-ink">“{entry.reason}”</p> : null}
        </li>
      ))}
    </ol>
  );
}
