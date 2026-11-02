const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: 'HauteCorner',
  email: 'buenasconsultants@gmail.com',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (productionHost ? `https://${productionHost}` : 'http://localhost:3000'),
  description:
    "Shoes and clothing from Kenya's independent sellers, in one app. Pay by M-Pesa or card, and your money reaches the seller only after your order arrives.",
  legalUpdated: '2 November 2026',
};

export const MINIMUM_APP_VERSION = '1.0.0';
