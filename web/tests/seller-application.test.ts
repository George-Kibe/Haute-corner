import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getApplication, POST as apply } from '@/app/api/v1/seller/application/route';
import { GET as getProfile, PATCH as patchProfile } from '@/app/api/v1/seller/profile/route';
import { POST as signUpload } from '@/app/api/v1/uploads/sign/route';
import { signParams } from '@/lib/cloudinary';
import { Seller } from '@/models/Seller';
import { createSellerAccount, createUser, fakeCloudinary, noParams, request, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterEach(() => vi.unstubAllGlobals());

const json = async (response: Response) => ({ status: response.status, body: await response.json().catch(() => null) });

const application = (documentId: string) => ({
  businessName: 'Kilimani Kicks',
  phone: '0712 345 678',
  payoutMpesaNumber: '0722 000 111',
  deliveryFee: 300,
  deliveryAreas: 'Nairobi',
  returnsNote: 'Unworn, within 7 days',
  documents: [{ kind: 'national_id', publicId: documentId }],
});

describe('POST /uploads/sign', () => {
  const sign = (kind: string, token?: string) =>
    signUpload(request('POST', '/api/v1/uploads/sign', { token, body: { kind } }), noParams);

  it('signs a private document upload into the user’s own application folder', async () => {
    const { user, token } = await createUser();

    const { status, body } = await json(await sign('document', token));

    expect(status).toBe(200);
    expect(body.data.uploadUrl).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/upload');
    expect(body.data.params.type).toBe('private');
    expect(body.data.params.public_id).toMatch(new RegExp(`^hautecorner/applications/${user._id}/[a-f0-9]{24}$`));
    expect(body.data.signature).toBe(signParams(body.data.params, 'test-secret'));
    expect(JSON.stringify(body)).not.toContain('test-secret');
  });

  it('signs product media only for approved sellers, into their own folder', async () => {
    const { seller, token } = await createSellerAccount();

    const image = await json(await sign('image', token));
    const video = await json(await sign('video', token));

    expect(image.body.data.params.public_id).toMatch(new RegExp(`^hautecorner/sellers/${seller._id}/products/`));
    expect(video.body.data.uploadUrl).toContain('/video/upload');
    expect(video.body.data.params.eager).toBe('sp_auto:maxres_720p/m3u8');
  });

  it('refuses product media for customers and sellers who are not approved', async () => {
    const customer = await createUser();
    const pending = await createSellerAccount({ status: 'applied' });

    expect((await sign('image', customer.token)).status).toBe(403);
    expect((await sign('video', pending.token)).status).toBe(403);
    expect((await sign('image')).status).toBe(401);
  });

  it('refuses an unknown kind', async () => {
    const { token } = await createUser();
    expect((await sign('audio', token)).status).toBe(400);
  });
});

describe('POST /seller/application', () => {
  const submit = (token: string, body: unknown) => apply(request('POST', '/api/v1/seller/application', { token, body }), noParams);

  it('creates an application with checked documents and normalised numbers', async () => {
    const { user, token } = await createUser();
    const documentId = `hautecorner/applications/${user._id}/abc`;
    fakeCloudinary({ [documentId]: { type: 'private', format: 'pdf' } });

    const { status, body } = await json(await submit(token, application(documentId)));

    expect(status).toBe(201);
    expect(body.data).toMatchObject({
      status: 'applied',
      businessName: 'Kilimani Kicks',
      phone: '+254712345678',
      payoutMpesaNumber: '+254722000111',
      documents: [{ kind: 'national_id' }],
      reviewReason: null,
    });
    const stored = await Seller.findOne({ userId: user._id }).lean();
    expect(stored!.documents).toEqual([{ kind: 'national_id', publicId: documentId, format: 'pdf' }]);
  });

  it('refuses documents from another user’s folder, or that were never uploaded', async () => {
    const { token } = await createUser();
    const other = await createUser();
    const foreign = `hautecorner/applications/${other.user._id}/abc`;
    fakeCloudinary({ [foreign]: { type: 'private' } });

    expect((await submit(token, application(foreign))).status).toBe(400);
    expect((await submit(token, application('hautecorner/applications/missing'))).status).toBe(400);
  });

  it('refuses a public upload passed off as a document', async () => {
    const { user, token } = await createUser();
    const documentId = `hautecorner/applications/${user._id}/public`;
    fakeCloudinary({ [documentId]: { type: 'upload' } });

    expect((await submit(token, application(documentId))).status).toBe(400);
  });

  it('refuses a second application, but allows one after a rejection', async () => {
    const { user, token } = await createUser();
    const documentId = `hautecorner/applications/${user._id}/abc`;
    fakeCloudinary({ [documentId]: { type: 'private' } });

    expect((await submit(token, application(documentId))).status).toBe(201);
    expect((await submit(token, application(documentId))).status).toBe(409);

    await Seller.updateOne({ userId: user._id }, { $set: { status: 'rejected', review: { reason: 'Blurry ID' } } });
    const rejected = await json(await getApplication(request('GET', '/api/v1/seller/application', { token }), noParams));
    expect(rejected.body.data.reviewReason).toBe('Blurry ID');

    const again = await json(await submit(token, { ...application(documentId), businessName: 'Kilimani Kicks Ltd' }));
    expect(again.status).toBe(201);
    expect(again.body.data).toMatchObject({ status: 'applied', businessName: 'Kilimani Kicks Ltd', reviewReason: null });
    expect(await Seller.countDocuments({ userId: user._id })).toBe(1);
  });

  it('refuses status and other fields a user must not set', async () => {
    const { user, token } = await createUser();
    const documentId = `hautecorner/applications/${user._id}/abc`;
    fakeCloudinary({ [documentId]: { type: 'private' } });

    const { status } = await json(await submit(token, { ...application(documentId), status: 'approved' }));

    expect(status).toBe(400);
    expect(await Seller.countDocuments()).toBe(0);
  });

  it('needs at least one document', async () => {
    const { token } = await createUser();
    const { status, body } = await json(await submit(token, { ...application('x'), documents: [] }));
    expect(status).toBe(400);
    expect(body.error.details.documents).toBe('Add a photo of your ID');
  });

  it('GET returns 404 before applying', async () => {
    const { token } = await createUser();
    expect((await getApplication(request('GET', '/api/v1/seller/application', { token }), noParams)).status).toBe(404);
  });
});

describe('/seller/profile', () => {
  const patch = (token: string, body: unknown) => patchProfile(request('PATCH', '/api/v1/seller/profile', { token, body }), noParams);

  it('updates delivery settings, and a new payout number waits for review', async () => {
    const { seller, token } = await createSellerAccount();

    const fee = await json(await patch(token, { deliveryFee: 400, returnsNote: '' }));
    expect(fee.body.data).toMatchObject({ deliveryFee: 400, returnsNote: null, payoutNumberUnderReview: false });

    const payout = await json(await patch(token, { payoutMpesaNumber: '0799 888 777' }));
    expect(payout.body.data).toMatchObject({ payoutMpesaNumber: '+254799888777', payoutNumberUnderReview: true });
    expect((await Seller.findById(seller._id).lean())!.payoutNumberChangedAt).toBeInstanceOf(Date);
  });

  it('keeps the same payout number out of review', async () => {
    const { token } = await createSellerAccount({ payoutMpesaNumber: '+254799888777' });
    const { body } = await json(await patch(token, { payoutMpesaNumber: '0799888777' }));
    expect(body.data.payoutNumberUnderReview).toBe(false);
  });

  it('refuses status changes and sellers who are not approved', async () => {
    const { token } = await createSellerAccount();
    const suspended = await createSellerAccount({ status: 'suspended' });

    expect((await patch(token, { status: 'approved' })).status).toBe(400);
    expect((await patch(suspended.token, { deliveryFee: 1 })).status).toBe(403);
    expect((await getProfile(request('GET', '/api/v1/seller/profile', { token: suspended.token }), noParams)).status).toBe(403);
  });
});
