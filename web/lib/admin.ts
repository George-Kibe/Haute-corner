import type { Types } from 'mongoose';
import {
  listingRemovedEmail,
  sellerApprovedEmail,
  sellerRejectedEmail,
  sellerReinstatedEmail,
  sellerSuspendedEmail,
} from '@/lib/email-templates';
import { ApiError, notFound } from '@/lib/http';
import { sendAfterResponse } from '@/lib/mail';
import { syncListingsWithSellerStatus } from '@/lib/sellers';
import { isObjectId } from '@/lib/validation';
import { AuditLog, type AuditLogAttributes } from '@/models/AuditLog';
import { Product } from '@/models/Product';
import { Report } from '@/models/Report';
import { Seller, type SellerAttributes } from '@/models/Seller';
import { User } from '@/models/User';

// Every function here takes the admin's user ID, which the caller has already
// confirmed with requireAdmin, and records what was done.

type SellerStatus = SellerAttributes['status'];

const conflict = (message: string) => new ApiError(409, 'conflict', message);

function requireReason(reason: string | undefined) {
  const trimmed = reason?.trim();
  if (!trimmed) throw new ApiError(400, 'validation_failed', 'Give a reason', { reason: 'Give a reason' });
  if (trimmed.length > 500) throw new ApiError(400, 'validation_failed', 'Keep the reason under 500 characters');
  return trimmed;
}

async function audit(entry: Omit<AuditLogAttributes, 'createdAt' | 'updatedAt'>) {
  await AuditLog.create(entry);
}

async function emailSellerOwner(userId: Types.ObjectId, build: (name: string | undefined) => { subject: string; html: string; text: string }) {
  const user = await User.findOne({ _id: userId, deletedAt: { $exists: false } }).lean();
  if (user?.email) sendAfterResponse({ to: user.email, ...build(user.name) });
}

// Moves a seller from one status to another, only if it is still in the
// expected status, so two admins cannot act on stale screens.
async function moveSeller(
  adminId: Types.ObjectId,
  sellerId: string,
  from: SellerStatus[],
  to: SellerStatus,
  action: string,
  reason?: string,
) {
  if (!isObjectId(sellerId)) throw notFound();
  const seller = await Seller.findOneAndUpdate(
    { _id: sellerId, status: { $in: from } },
    { $set: { status: to, review: { by: adminId, at: new Date(), ...(reason && { reason }) } } },
    { returnDocument: 'after' },
  ).lean();
  if (!seller) {
    if (!(await Seller.exists({ _id: sellerId }))) throw notFound();
    throw conflict('This seller changed. Refresh and try again');
  }
  await syncListingsWithSellerStatus(seller._id, to);
  await audit({ actorId: adminId, action, targetType: 'seller', targetId: seller._id, reason });
  return seller;
}

export async function approveSeller(adminId: Types.ObjectId, sellerId: string) {
  const seller = await moveSeller(adminId, sellerId, ['applied'], 'approved', 'seller.approve');
  await emailSellerOwner(seller.userId, (name) => sellerApprovedEmail(name, seller.businessName));
  return seller;
}

export async function rejectSeller(adminId: Types.ObjectId, sellerId: string, reason: string | undefined) {
  const why = requireReason(reason);
  const seller = await moveSeller(adminId, sellerId, ['applied'], 'rejected', 'seller.reject', why);
  await emailSellerOwner(seller.userId, (name) => sellerRejectedEmail(name, seller.businessName, why));
  return seller;
}

export async function suspendSeller(adminId: Types.ObjectId, sellerId: string, reason: string | undefined) {
  const why = requireReason(reason);
  const seller = await moveSeller(adminId, sellerId, ['approved'], 'suspended', 'seller.suspend', why);
  await emailSellerOwner(seller.userId, (name) => sellerSuspendedEmail(name, seller.businessName, why));
  return seller;
}

export async function reinstateSeller(adminId: Types.ObjectId, sellerId: string) {
  const seller = await moveSeller(adminId, sellerId, ['suspended'], 'approved', 'seller.reinstate');
  await emailSellerOwner(seller.userId, (name) => sellerReinstatedEmail(name, seller.businessName));
  return seller;
}

// Confirms a changed payout number, which lets payouts resume.
export async function confirmPayoutNumber(adminId: Types.ObjectId, sellerId: string) {
  if (!isObjectId(sellerId)) throw notFound();
  const seller = await Seller.findOneAndUpdate(
    { _id: sellerId, payoutNumberChangedAt: { $exists: true } },
    { $unset: { payoutNumberChangedAt: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (!seller) throw conflict('There is no payout number change to confirm');
  await audit({ actorId: adminId, action: 'seller.confirm_payout_number', targetType: 'seller', targetId: seller._id });
  return seller;
}

export async function removeProduct(adminId: Types.ObjectId, productId: string, reason: string | undefined) {
  const why = requireReason(reason);
  if (!isObjectId(productId)) throw notFound();
  const product = await Product.findOneAndUpdate(
    { _id: productId, status: { $ne: 'removed' } },
    { $set: { status: 'removed', removedReason: why } },
    { returnDocument: 'after' },
  ).lean();
  if (!product) {
    if (!(await Product.exists({ _id: productId }))) throw notFound();
    throw conflict('This listing is already removed');
  }
  // Open reports about it are dealt with by the removal.
  await Report.updateMany(
    { productId: product._id, status: 'open' },
    { $set: { status: 'actioned', review: { by: adminId, at: new Date(), note: 'Listing removed' } } },
  );
  await audit({ actorId: adminId, action: 'product.remove', targetType: 'product', targetId: product._id, reason: why });

  const seller = await Seller.findById(product.sellerId).lean();
  if (seller) await emailSellerOwner(seller.userId, (name) => listingRemovedEmail(name, product.title, why));
  return product;
}

// Puts a removed listing back. It goes on sale only if its seller is approved.
export async function restoreProduct(adminId: Types.ObjectId, productId: string) {
  if (!isObjectId(productId)) throw notFound();
  const existing = await Product.findOne({ _id: productId, status: 'removed' }).lean();
  if (!existing) {
    if (!(await Product.exists({ _id: productId }))) throw notFound();
    throw conflict('Only a removed listing can be restored');
  }
  const seller = await Seller.findById(existing.sellerId).lean();
  const status = seller?.status === 'approved' ? 'active' : 'hidden';
  const product = await Product.findOneAndUpdate(
    { _id: existing._id, status: 'removed' },
    { $set: { status }, $unset: { removedReason: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (!product) throw conflict('This listing changed. Refresh and try again');
  await audit({ actorId: adminId, action: 'product.restore', targetType: 'product', targetId: product._id });
  return product;
}

export async function dismissReport(adminId: Types.ObjectId, reportId: string, note?: string) {
  if (!isObjectId(reportId)) throw notFound();
  const trimmed = note?.trim() || undefined;
  const report = await Report.findOneAndUpdate(
    { _id: reportId, status: 'open' },
    { $set: { status: 'dismissed', review: { by: adminId, at: new Date(), ...(trimmed && { note: trimmed }) } } },
    { returnDocument: 'after' },
  ).lean();
  if (!report) throw conflict('This report is already closed');
  await audit({ actorId: adminId, action: 'report.dismiss', targetType: 'report', targetId: report._id, reason: trimmed });
  return report;
}
