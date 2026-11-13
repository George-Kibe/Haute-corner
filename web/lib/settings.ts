// Values that shape listings and orders. They live in code until the admin
// settings screen arrives with the Phase 6 decisions.

// Decided 13 November 2026: one video per product, up to 30 seconds and 100 MB,
// chosen from the phone's library (no microphone permission).
export const MAX_VIDEO_SECONDS = 30;
export const MAX_VIDEO_BYTES = 100 * 1000 * 1000;
export const MAX_VIDEOS_PER_PRODUCT = 1;
export const MAX_IMAGES_PER_PRODUCT = 10;
export const MAX_IMAGE_BYTES = 20 * 1000 * 1000;

// Not decided. The commission rate is an open item before Phase 6, so orders
// record 0 until it is set. Each order keeps the rate it was placed with.
export const COMMISSION_RATE = 0;

// Recommended (R-11): unpaid checkouts hold stock for this long.
export const RESERVATION_MINUTES = 15;
