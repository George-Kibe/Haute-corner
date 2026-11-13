import { imageUrl, pickImageWidth, previewImageUrl, videoPosterUrl, videoStreamUrl } from '@/lib/media';

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

describe('video URLs', () => {
  it('streams adaptively at up to 720p from an .m3u8 address', () => {
    expect(videoStreamUrl('demo', 'hautecorner/sellers/s1/products/v1')).toBe(
      'https://res.cloudinary.com/demo/video/upload/sp_auto:maxres_720p/hautecorner/sellers/s1/products/v1.m3u8',
    );
  });

  it('uses the first frame as the poster', () => {
    expect(videoPosterUrl('demo', 'v1', 800)).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_0,c_scale,w_800/q_auto/f_jpg/v1.jpg',
    );
  });
});
