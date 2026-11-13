import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as report } from '@/app/api/v1/products/[id]/reports/route';
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
import { signAdminToken, verifyAdminToken } from '@/lib/admin-session';
import { sentEmails } from '@/lib/mail';
import { AuditLog } from '@/models/AuditLog';
import { Product } from '@/models/Product';
import { Report } from '@/models/Report';
import { Seller } from '@/models/Seller';
import { createProduct, createSellerAccount, createUser, params, request, resetDatabase } from './helpers';

let adminId: import('mongoose').Types.ObjectId;

beforeEach(async () => {
  await resetDatabase();
  adminId = (await createUser({ role: 'admin', email: 'admin@example.com' })).user._id;
});
afterEach(() => vi.unstubAllGlobals());

const statusOf = async (id: unknown) => (await Seller.findById(id).lean())!.status;
const productStatus = async (id: unknown) => (await Product.findById(id).lean())!.status;

describe('reviewing sellers', () => {
  it('approves an application, puts hidden listings on sale, emails the seller and records it', async () => {
    const { user, seller } = await createSellerAccount({ status: 'applied' });
    const product = await createProduct(seller._id, { status: 'hidden' });

    await approveSeller(adminId, String(seller._id));

    expect(await statusOf(seller._id)).toBe('approved');
    expect(await productStatus(product._id)).toBe('active');
    expect(sentEmails.map((email) => [email.to, email.subject])).toEqual([[user.email, 'Your HauteCorner shop is approved']]);
    expect(await AuditLog.find().lean()).toMatchObject([{ actorId: adminId, action: 'seller.approve', targetType: 'seller' }]);
  });

  it('rejects with a reason the seller sees, and needs one', async () => {
    const { seller } = await createSellerAccount({ status: 'applied' });

    await expect(rejectSeller(adminId, String(seller._id), '  ')).rejects.toMatchObject({ status: 400 });
    await rejectSeller(adminId, String(seller._id), 'The ID photo is blurry');

    const stored = (await Seller.findById(seller._id).lean())!;
    expect(stored.status).toBe('rejected');
    expect(stored.review).toMatchObject({ by: adminId, reason: 'The ID photo is blurry' });
    expect(sentEmails[0].text).toContain('The ID photo is blurry');
  });

  it('suspends, hiding listings but not archived or removed ones, then reinstates', async () => {
    const { seller } = await createSellerAccount();
    const active = await createProduct(seller._id);
    const archived = await createProduct(seller._id, { status: 'archived' });
    const removed = await createProduct(seller._id, { status: 'removed' });

    await suspendSeller(adminId, String(seller._id), 'Counterfeit goods');
    expect(await productStatus(active._id)).toBe('hidden');
    expect(await productStatus(archived._id)).toBe('archived');
    expect(await productStatus(removed._id)).toBe('removed');

    await reinstateSeller(adminId, String(seller._id));
    expect(await statusOf(seller._id)).toBe('approved');
    expect(await productStatus(active._id)).toBe('active');
    expect(await productStatus(removed._id)).toBe('removed');
    expect((await AuditLog.find().sort({ _id: 1 }).lean()).map((entry) => entry.action)).toEqual(['seller.suspend', 'seller.reinstate']);
  });

  it('refuses moves from the wrong status, so stale screens cannot act', async () => {
    const { seller } = await createSellerAccount();

    await expect(approveSeller(adminId, String(seller._id))).rejects.toMatchObject({ status: 409 });
    await expect(reinstateSeller(adminId, String(seller._id))).rejects.toMatchObject({ status: 409 });
    await expect(approveSeller(adminId, 'nope')).rejects.toMatchObject({ status: 404 });
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('confirms a changed payout number once', async () => {
    const { seller } = await createSellerAccount({ payoutNumberChangedAt: new Date() });

    await confirmPayoutNumber(adminId, String(seller._id));

    expect((await Seller.findById(seller._id).lean())!.payoutNumberChangedAt).toBeUndefined();
    await expect(confirmPayoutNumber(adminId, String(seller._id))).rejects.toMatchObject({ status: 409 });
  });
});

describe('moderating listings', () => {
  it('removes a listing with a reason, closes its open reports and emails the seller', async () => {
    const { seller } = await createSellerAccount();
    const product = await createProduct(seller._id);
    const shopper = await createUser();
    await Report.create({ productId: product._id, sellerId: seller._id, reporterId: shopper.user._id, reason: 'counterfeit' });

    await removeProduct(adminId, String(product._id), 'Counterfeit branding');

    expect(await Product.findById(product._id).lean()).toMatchObject({ status: 'removed', removedReason: 'Counterfeit branding' });
    expect(await Report.findOne().lean()).toMatchObject({ status: 'actioned' });
    expect(sentEmails[0].subject).toBe('A listing was removed from HauteCorner');
    await expect(removeProduct(adminId, String(product._id), 'Again')).rejects.toMatchObject({ status: 409 });
  });

  it('restores a removed listing, on sale only if its seller is approved', async () => {
    const approved = await createSellerAccount();
    const suspended = await createSellerAccount({ status: 'suspended' });
    const one = await createProduct(approved.seller._id, { status: 'removed', removedReason: 'Mistake' });
    const two = await createProduct(suspended.seller._id, { status: 'removed', removedReason: 'Mistake' });

    await restoreProduct(adminId, String(one._id));
    await restoreProduct(adminId, String(two._id));

    expect(await Product.findById(one._id).lean()).toMatchObject({ status: 'active' });
    expect((await Product.findById(one._id).lean())!.removedReason).toBeUndefined();
    expect(await productStatus(two._id)).toBe('hidden');
  });
});

describe('reports', () => {
  const send = (token: string, id: string, body: unknown = { reason: 'counterfeit', details: 'Fake logo' }) =>
    report(request('POST', `/api/v1/products/${id}/reports`, { token, body }), params({ id }));

  it('accepts a report once per shopper while it is open', async () => {
    const { seller } = await createSellerAccount();
    const product = await createProduct(seller._id);
    const shopper = await createUser();

    expect((await send(shopper.token, String(product._id))).status).toBe(202);
    expect((await send(shopper.token, String(product._id))).status).toBe(202);

    expect(await Report.find().lean()).toMatchObject([{ reason: 'counterfeit', details: 'Fake logo', status: 'open' }]);
  });

  it('needs an account, a real reason and a listing on sale, and not your own', async () => {
    const { seller, token: sellerToken } = await createSellerAccount();
    const product = await createProduct(seller._id);
    const hidden = await createProduct(seller._id, { status: 'hidden' });
    const shopper = await createUser();

    expect((await report(request('POST', `/api/v1/products/${product._id}/reports`, { body: { reason: 'scam' } }), params({ id: String(product._id) }))).status).toBe(401);
    expect((await send(shopper.token, String(product._id), { reason: 'boring' })).status).toBe(400);
    expect((await send(shopper.token, String(hidden._id))).status).toBe(404);
    expect((await send(sellerToken, String(product._id))).status).toBe(409);
  });

  it('dismisses an open report once', async () => {
    const { seller } = await createSellerAccount();
    const product = await createProduct(seller._id);
    const shopper = await createUser();
    const open = await Report.create({ productId: product._id, sellerId: seller._id, reporterId: shopper.user._id, reason: 'other' });

    await dismissReport(adminId, String(open._id), 'Looks genuine');

    expect(await Report.findById(open._id).lean()).toMatchObject({ status: 'dismissed', review: { note: 'Looks genuine' } });
    await expect(dismissReport(adminId, String(open._id))).rejects.toMatchObject({ status: 409 });
  });
});

describe('admin session tokens', () => {
  it('round-trips a user ID and rejects tampering and app tokens', async () => {
    const token = await signAdminToken(String(adminId));

    expect(await verifyAdminToken(token)).toBe(String(adminId));
    expect(await verifyAdminToken(`${token}x`)).toBeNull();
    expect(await verifyAdminToken(undefined)).toBeNull();
    const { token: appToken } = await createUser({ role: 'admin' });
    expect(await verifyAdminToken(appToken)).toBeNull();
  });
});
