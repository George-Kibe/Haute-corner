import { formatPrice } from '@/lib/format';

describe('formatPrice', () => {
  it.each([
    [0, 'Kshs. 0'],
    [800, 'Kshs. 800'],
    [4800, 'Kshs. 4,800'],
    [1250000, 'Kshs. 1,250,000'],
  ])('formats %d', (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected);
  });
});
