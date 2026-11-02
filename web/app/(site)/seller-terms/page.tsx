import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Seller terms',
  description: 'The terms for selling on HauteCorner.',
};

export default function SellerTermsPage() {
  return (
    <LegalPage title="Seller terms" intro="These terms apply if you sell on HauteCorner, in addition to the general terms.">
      <h2>Applying</h2>
      <p>
        You apply in the app with your business details and M-Pesa payout number, plus any identity documents we ask for. Our
        team reviews each application, and you can list only after approval.
      </p>

      <h2>Your listings</h2>
      <ul>
        <li>Describe your products honestly, using your own photos and videos, and keep stock and prices accurate.</li>
        <li>Do not list counterfeit, stolen or illegal goods.</li>
        <li>We may remove a listing that breaks these terms, or suspend your account. Suspending hides your listings.</li>
      </ul>

      <h2>Orders and delivery</h2>
      <p>
        You arrange delivery, and set your own delivery fee and areas. Confirm or reject each order promptly, and update its
        status as it moves. Use customer contact details only to fulfil that order.
      </p>

      <h2>Getting paid</h2>
      <ul>
        <li>HauteCorner holds each payment until delivery is settled.</li>
        <li>An order is settled when the buyer confirms delivery, or when the period shown on the order passes with no problem raised.</li>
        <li>HauteCorner deducts a commission from each completed sale. We will tell you the rate before you are approved, and the rate on an order does not change after it is placed.</li>
        <li>The rest is paid to your approved M-Pesa number. Changing that number pauses payouts until our team has reviewed the change.</li>
      </ul>

      <h2>Returns and disputes</h2>
      <p>
        Publish your returns note on your profile. If a buyer raises a problem, the payout for that order is paused. You can
        accept a refund or respond. If you cannot agree, HauteCorner makes the final decision on how the held money is handled.
      </p>

      <h2>Your responsibilities</h2>
      <p>You are responsible for your goods, for meeting the laws that apply to your business, and for your own taxes.</p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
