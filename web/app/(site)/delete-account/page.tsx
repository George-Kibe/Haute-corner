import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Delete your account',
  description: 'How to delete your HauteCorner account and what happens to your data.',
};

const subject = encodeURIComponent('Delete my HauteCorner account');

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Delete your HauteCorner account"
      intro="You can ask us to delete your HauteCorner account and its personal data at any time."
    >
      <h2>How to request deletion</h2>
      <ul>
        <li>In the app, go to Profile and choose Delete account.</li>
        <li>
          Or email <a href={`mailto:${site.email}?subject=${subject}`}>{site.email}</a> from the address on your account, with
          the subject &quot;Delete my HauteCorner account&quot;. We may ask you to confirm the request.
        </li>
      </ul>

      <h2>What is deleted</h2>
      <ul>
        <li>Your profile: name, email address, picture, phone number and saved delivery address</li>
        <li>Your signed-in sessions and notification tokens</li>
        <li>Your wish list</li>
      </ul>

      <h2>What is kept</h2>
      <p>
        Past orders and financial records are kept for business and legal reasons, with your personal details replaced so that
        they no longer identify you.
      </p>

      <h2>When deletion has to wait</h2>
      <p>
        We cannot delete an account with orders in progress, an open dispute, or, for sellers, an unpaid balance. Once these
        are settled, deletion can go ahead.
      </p>
    </LegalPage>
  );
}
