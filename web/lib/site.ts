const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: 'HauteCorner',
  // The public contact, and where replies to our emails go.
  email: 'info@realhiveconsultants.com',
  // Automated emails, such as sign-in codes, come from here.
  noReplyEmail: 'no-reply@realhiveconsultants.com',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (productionHost ? `https://${productionHost}` : 'http://localhost:3000'),
  description:
    "Shoes and clothing from Kenya's independent sellers, in one app. Pay by M-Pesa or card, and your money reaches the seller only after your order arrives.",
  legalUpdated: '13 November 2026',
};

// The business that runs HauteCorner, shown on the Terms page and in the
// stores as the trader. The address and phone must match the details verified
// in Google Play Console. Empty values are left off the page.
export const trader = {
  legalName: 'Realhive Consultants',
  address: 'Off Mombasa Road, Nairobi, Kenya',
  phone: '+254704817466',
  email: site.email,
  registrationNumber: '',
};

export const MINIMUM_APP_VERSION = '1.0.0';
