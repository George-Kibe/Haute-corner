import { beforeEach, describe, expect, it } from 'vitest';
import { GET as getSeller } from '@/app/api/v1/sellers/[id]/route';
import { createSeller, get, params, resetDatabase } from './helpers';

const fetchSeller = (id: string) => getSeller(get(`/api/v1/sellers/${id}`), params({ id }));

beforeEach(resetDatabase);

describe('GET /sellers/{id}', () => {
  it('returns only public details of an approved seller', async () => {
    const seller = await createSeller({ returnsNote: 'Unworn items within 7 days' });

    const response = await fetchSeller(String(seller._id));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: String(seller._id),
      name: 'Nairobi Soles',
      deliveryFee: 250,
      deliveryAreas: 'Nairobi',
      returnsNote: 'Unworn items within 7 days',
    });
  });

  it.each(['applied', 'rejected', 'suspended'] as const)('hides a seller who is %s', async (status) => {
    const seller = await createSeller({ status });

    const response = await fetchSeller(String(seller._id));

    expect(response.status).toBe(404);
  });

  it('returns 404 for a malformed ID', async () => {
    const response = await fetchSeller('not-an-id');

    expect(response.status).toBe(404);
  });
});
