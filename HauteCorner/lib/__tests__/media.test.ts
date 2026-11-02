import { imageUrl, pickImageWidth, previewImageUrl } from '@/lib/media';

describe('pickImageWidth', () => {
  it('rounds up to the next fixed size', () => {
    expect(pickImageWidth(150)).toBe(200);
    expect(pickImageWidth(400)).toBe(400);
    expect(pickImageWidth(401)).toBe(800);
  });

  it('never asks for more than the largest size', () => {
    expect(pickImageWidth(5000)).toBe(1600);
  });
});

describe('imageUrl', () => {
  it('requests a scaled image in an automatic format and quality', () => {
    expect(imageUrl('demo', 'samples/shoe', 400)).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_scale,w_400/q_auto/f_auto/samples/shoe',
    );
  });

  it('keeps folders but encodes unsafe characters', () => {
    expect(imageUrl('demo', 'sellers/a b/shoe', 200)).toContain('/sellers/a%20b/shoe');
  });
});

describe('previewImageUrl', () => {
  it('requests a tiny low-quality placeholder', () => {
    expect(previewImageUrl('demo', 'shoes')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_scale,w_50/q_auto:low/f_auto/shoes',
    );
  });
});
