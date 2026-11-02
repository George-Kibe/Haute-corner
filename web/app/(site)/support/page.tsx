import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Support',
  description: 'How to get help with HauteCorner.',
};

const topics = [
  {
    title: 'A problem with an order',
    body: 'Raise a problem from the order in the app. This pauses the seller’s payout while it is sorted out.',
  },
  {
    title: 'A payment question',
    body: 'Email us with your order reference and the M-Pesa message or card payment date.',
  },
  {
    title: 'Selling on HauteCorner',
    body: 'Email us about your application, listings or payouts.',
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-black text-brand-deep sm:text-4xl">How can we help?</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Email us at{' '}
        <a href={`mailto:${site.email}`} className="font-extrabold text-brand underline underline-offset-2">
          {site.email}
        </a>
        . Include your order reference if your question is about an order.
      </p>
      <ul className="mt-8 grid gap-4">
        {topics.map((topic) => (
          <li key={topic.title} className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-extrabold text-ink">{topic.title}</h2>
            <p className="mt-2 leading-relaxed text-muted">{topic.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 leading-relaxed text-muted">
        Looking to remove your data?{' '}
        <Link href="/delete-account" className="font-extrabold text-brand underline underline-offset-2">
          Delete your account
        </Link>
        .
      </p>
    </div>
  );
}
