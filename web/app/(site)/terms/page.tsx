import type { Metadata } from 'next';
import Link from 'next/link';
import { site, trader } from '@/lib/site';
import { LegalPage } from '../legal-page';
import { TraderDetails } from '../trader-details';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${site.name}, and the business that runs it.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms apply when you use the ${site.name} app or website to browse, buy or sell. By using ${site.name}, you agree to them.`}
    >
      <h2 id="who-we-are">Who we are</h2>
      <p>
        {site.name} is run by {trader.legalName}, which acts as a trader when it offers the app and its services. You can
        reach us using the details below.
      </p>
      <TraderDetails />

      <h2>What {site.name} is</h2>
      <p>
        {site.name} is a marketplace. Independent sellers list products and sell them to you. {trader.legalName} runs the
        app, takes payment on the sellers&apos; behalf and helps resolve problems, but it is not the seller of the goods. Each
        listing shows the seller&apos;s name, and each seller is a business that {site.name} has reviewed and approved
        before it can list.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You can browse without an account. You need one to buy, to save items across devices, and to sell.</li>
        <li>You can sign in with Google, with Apple on iPhone and iPad, or with your email address and a password.</li>
        <li>Keep access to your account secure, and give accurate contact and delivery details.</li>
        <li>
          You can delete your account at any time in the app, or as described on the{' '}
          <Link href="/delete-account">delete your account</Link> page.
        </li>
      </ul>

      <h2>Buying</h2>
      <ul>
        <li>Prices are in Kenyan shillings. You see the product prices and each seller&apos;s delivery fee before you pay.</li>
        <li>
          One checkout can include several sellers. Each seller&apos;s items become a separate order, with its own delivery
          and status.
        </li>
        <li>You can pay by M-Pesa or by card. Card details are entered on our payment provider&apos;s page and never reach us.</li>
        <li>Items are reserved for you for a short time while you pay. If payment does not complete, they are released.</li>
      </ul>

      <h2>Delivery</h2>
      <p>Each seller arranges their own delivery, and sets their own fee and delivery areas, shown before you pay.</p>

      <h2>How your payment is held</h2>
      <p>
        {site.name} holds your payment while your order is in progress. Once the seller marks an order as delivered, you can
        confirm it in the app. If you take no action and have not raised a problem within the period shown on your order,
        the order completes automatically and the seller is paid.
      </p>

      <h2>Cancellations, problems and refunds</h2>
      <p>
        You can cancel an order before it is sent, and you will be refunded. If something is wrong, raise it in the app within
        the window shown on your order. This pauses the seller&apos;s payout. You and the seller can try to resolve it first,
        and either of you can ask {site.name} to step in. Our decision on how the held money is handled is final, without
        affecting your rights under Kenyan law, including the Consumer Protection Act. Each seller&apos;s returns note is
        shown on their profile.
      </p>

      <h2>Selling</h2>
      <p>
        Sellers apply in the app and can list only after approval. Selling is also covered by the{' '}
        <Link href="/seller-terms">seller terms</Link>.
      </p>

      <h2>Listings and reports</h2>
      <p>
        Sellers are responsible for their listings. If a listing looks wrong, counterfeit, unsafe or illegal, report it from
        the product page in the app, or email us. We review reports and may remove a listing or suspend a seller.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use {site.name} for fraud, to harass anyone, to break the law, or to interfere with the app or other
        people&apos;s use of it. We may suspend or close accounts that break these terms.
      </p>

      <h2>Our content</h2>
      <p>
        The {site.name} name, logo and app belong to {trader.legalName}. Photos, videos and descriptions in listings belong
        to their sellers, who give us permission to show them in the app and website.
      </p>

      <h2>Our responsibility</h2>
      <p>
        We work to keep {site.name} available and accurate, but we cannot promise it will always be free of interruptions.
        Nothing in these terms limits any right you have under Kenyan law that cannot be limited.
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
