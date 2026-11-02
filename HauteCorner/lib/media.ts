const IMAGE_WIDTHS = [200, 400, 800, 1080, 1600];

// A few fixed sizes mean more requests share Cloudinary's and the device's caches.
export function pickImageWidth(pixels: number) {
  return IMAGE_WIDTHS.find((width) => width >= pixels) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
}

function imageBase(cloudName: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload`;
}

export function imageUrl(cloudName: string, publicId: string, width: number) {
  return `${imageBase(cloudName)}/c_scale,w_${width}/q_auto/f_auto/${encodeURI(publicId)}`;
}

export function previewImageUrl(cloudName: string, publicId: string) {
  return `${imageBase(cloudName)}/c_scale,w_50/q_auto:low/f_auto/${encodeURI(publicId)}`;
}
