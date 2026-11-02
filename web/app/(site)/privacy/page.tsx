import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What personal information HauteCorner collects, why, and the choices you have.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This explains what personal information HauteCorner collects, how it is used, who it is shared with, and the choices you have."
    >
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and profile picture from Google or Apple when you sign in. Apple lets you hide your email address.</li>
        <li><strong>Contact and delivery details:</strong> your phone number and delivery address.</li>
        <li><strong>Orders:</strong> what you buy, from whom, amounts, delivery status, and any disputes.</li>
        <li><strong>Payment information:</strong> the payment method, status and reference, and your M-Pesa number if you pay by M-Pesa. Card numbers are entered directly with our card provider. We never receive or store them.</li>
        <li><strong>Device information:</strong> a notification token, so we can send you updates, and your device type.</li>
        <li><strong>Seller information:</strong> if you apply to sell, your business details, M-Pesa payout number and any identity documents we ask for.</li>
        <li><strong>Things you upload:</strong> product photos and videos, and evidence you add to a dispute.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, process your orders and arrange payment.</li>
        <li>To send you updates about orders, disputes, seller applications and payouts.</li>
        <li>To review sellers, resolve disputes, and prevent fraud.</li>
        <li>To keep the records that business and legal obligations require.</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Sellers:</strong> a seller sees your name, phone number and delivery address only for orders you place with them, so they can deliver.</li>
        <li><strong>Service providers</strong> who run parts of HauteCorner for us: Google and Apple (sign-in), Safaricom (M-Pesa), Paystack (cards), Vercel (hosting), MongoDB (database), Cloudinary (images and videos), and Expo (notifications and app updates).</li>
        <li><strong>Authorities,</strong> when the law requires it.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account information while your account is open. Order and payment records are kept after that, for as
        long as business and legal obligations require.
      </p>

      <h2>Deleting your account</h2>
      <p>
        You can <Link href="/delete-account">delete your account</Link> at any time. This removes your profile, sessions,
        notification tokens and wish list. Past orders and financial records are kept, with your personal details replaced.
      </p>

      <h2>Your rights</h2>
      <p>
        Under Kenya&apos;s Data Protection Act, you can ask to access, correct or delete your personal information, and object
        to some uses of it. To make a request, email <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>

      <h2>Contact</h2>
      <p>
        {site.name}, <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </LegalPage>
  );
}
