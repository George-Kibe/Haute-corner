import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms for shopping on HauteCorner.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" intro="These terms apply when you use HauteCorner to browse and buy.">
      <h2>What HauteCorner is</h2>
      <p>
        HauteCorner is a marketplace. Independent sellers list products and sell them to you. HauteCorner runs the app,
        takes payment and helps resolve problems, but it is not the seller of the goods.
      </p>

      <h2>Your account</h2>
      <p>
        You sign in with Google or Apple. Keep access to your account secure, and give accurate contact and delivery
        details. You can browse without an account.
      </p>

      <h2>Buying</h2>
      <ul>
        <li>Prices are in Kenyan shillings. You see the product prices and each seller&apos;s delivery fee before you pay.</li>
        <li>One checkout can include several sellers. Each seller&apos;s items become a separate order, with its own delivery and status.</li>
        <li>You can pay by M-Pesa or by card.</li>
      </ul>

      <h2>Delivery</h2>
      <p>Each seller arranges their own delivery and sets their own fee and delivery areas.</p>

      <h2>How your payment is held</h2>
      <p>
        HauteCorner holds your payment while your order is in progress. Once the seller marks an order as delivered, you can
        confirm it in the app. If you take no action and have not raised a problem within the period shown on your order, the
        order completes automatically and the seller is paid.
      </p>

      <h2>Problems, returns and refunds</h2>
      <p>
        If something is wrong, raise it in the app within the window shown on your order. This pauses the seller&apos;s payout.
        You and the seller can try to resolve it first, and either of you can ask HauteCorner to step in. Our decision on
        how the held money is handled is final, without affecting your rights under Kenyan law. You can cancel an order
        before it is sent, and you will be refunded. Each seller&apos;s returns note is shown on their profile.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use HauteCorner for fraud, to harass anyone, or to break the law. You can report a listing that seems wrong. We
        may suspend accounts that break these terms.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms and will tell you about important changes before they apply.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya.</p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a>, or see <Link href="/support">support</Link>.
      </p>
    </LegalPage>
  );
}
