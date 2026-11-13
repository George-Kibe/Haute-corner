'use server';

import type { Types } from 'mongoose';
import { refresh } from 'next/cache';
import {
  approveSeller,
  confirmPayoutNumber,
  dismissReport,
  reinstateSeller,
  rejectSeller,
  removeProduct,
  restoreProduct,
  suspendSeller,
} from '@/lib/admin';
import { requireAdmin } from '@/lib/admin-session';
import { ApiError } from '@/lib/http';

export type ActionState = { error?: string; done?: string } | undefined;

// Checks the admin on every action, shows expected failures in the form, and
// redraws the page after a change.
async function run(work: (adminId: Types.ObjectId) => Promise<unknown>, done: string): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    await work(admin._id);
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) return { error: error.message };
    throw error;
  }
  refresh();
  return { done };
}

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === 'string' ? value : undefined;
};

export async function sellerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = text(formData, 'id') ?? '';
  const reason = text(formData, 'reason');
  switch (text(formData, 'intent')) {
    case 'approve':
      return run((adminId) => approveSeller(adminId, id), 'Approved. The seller has been emailed.');
    case 'reject':
      return run((adminId) => rejectSeller(adminId, id, reason), 'Rejected. The seller has been emailed.');
    case 'suspend':
      return run((adminId) => suspendSeller(adminId, id, reason), 'Suspended, and listings hidden.');
    case 'reinstate':
      return run((adminId) => reinstateSeller(adminId, id), 'Reinstated, and listings back on sale.');
    case 'confirm-payout':
      return run((adminId) => confirmPayoutNumber(adminId, id), 'Payout number confirmed.');
    default:
      return { error: 'Unknown action' };
  }
}

export async function productAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = text(formData, 'id') ?? '';
  switch (text(formData, 'intent')) {
    case 'remove':
      return run((adminId) => removeProduct(adminId, id, text(formData, 'reason')), 'Removed. The seller has been emailed.');
    case 'restore':
      return run((adminId) => restoreProduct(adminId, id), 'Restored.');
    default:
      return { error: 'Unknown action' };
  }
}

export async function reportAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = text(formData, 'id') ?? '';
  return run((adminId) => dismissReport(adminId, id, text(formData, 'reason')), 'Report dismissed.');
}
