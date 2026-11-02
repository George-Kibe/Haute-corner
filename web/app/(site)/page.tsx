import Image from 'next/image';
import { site } from '@/lib/site';
import logoMark from '@/public/logo-mark.png';

const highlights = [
  { title: 'M-Pesa and cards', body: 'Pay the way you already do.' },
  { title: 'Paid after delivery', body: 'Sellers get your money once your order arrives.' },
  { title: 'Reviewed sellers', body: 'Every seller is approved before they can list.' },
];

const shoppingSteps = [
  { title: 'Browse freely', body: 'Explore shoes and clothing without creating an account. Sign in only when you want to buy.' },
  { title: 'One cart, many sellers', body: 'Add items from different sellers and check out once. Each seller delivers their part of your order.' },
  { title: 'Pay by M-Pesa or card', body: 'Approve the M-Pesa prompt on your phone, or pay by card on a secure payment page.' },
  { title: 'Follow your order', body: 'Get a notification as your order is confirmed, sent and delivered.' },
];

const protectionSteps = [
  { label: 'You pay', body: 'HauteCorner holds your payment. The seller has not been paid yet.' },
  { label: 'The seller delivers', body: 'They send your order and mark it as delivered.' },
  { label: 'You confirm', body: 'All good? Confirm in the app. Something wrong? Raise it and the payout stops.' },
  { label: 'The seller gets paid', body: 'Once delivery is settled, the money goes to the seller.' },
];

const sellerPoints = [
  { title: 'List from your phone', body: 'Add photos and a short video of each product right from the app.' },
  { title: 'Set your own delivery', body: 'You choose how you deliver, where, and what the fee is.' },
  { title: 'Pay only when you sell', body: 'HauteCorner earns a commission on each sale, with the rate shared before you join.' },
  { title: 'Get paid to M-Pesa', body: 'Your earnings are released after delivery, and you can follow every shilling in the app.' },
];

const questions = [
  {
    question: 'When can I download the app?',
    answer: "We're putting the finishing touches on it now. iOS and Android versions are both on the way, and download links will appear on this page.",
  },
  {
    question: 'Do I need an account to browse?',
    answer: 'No. Browse as much as you like. You sign in with Google, or Apple on iPhone, when you want to buy, save items or see your orders.',
  },
  {
    question: 'What if my order is wrong or never arrives?',
    answer: "Raise a problem in the app within the time shown on your order. The seller's payout stops while you and the seller try to sort it out, and our team makes the final decision if you can't agree.",
  },
  {
    question: 'How much is delivery?',
    answer: 'Each seller sets their own delivery fee and areas. You see the fees for every seller before you pay.',
  },
  {
    question: 'How do I become a seller?',
    answer: `Applications open in the app. To hear when they do, email ${site.email}. You'll share your business and payout details, and our team reviews each application before you can list.`,
  },
];

function StoreButton({ store }: { store: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-3 text-left" aria-label={`${store}: coming soon`}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Coming soon</p>
      <p className="text-lg font-extrabold text-ink">{store}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, intro, light }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`text-sm font-extrabold uppercase tracking-widest ${light ? 'text-[#a9c6fb]' : 'text-brand'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black leading-tight sm:text-4xl ${light ? 'text-white' : 'text-brand-deep'}`}>{title}</h2>
      {intro ? <p className={`mt-4 text-lg leading-relaxed ${light ? 'text-[#d6e3fb]' : 'text-muted'}`}>{intro}</p> : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section id="get-the-app" className="relative overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="inline-block rounded-full bg-tint px-3 py-1 text-sm font-extrabold text-brand">
              Launching soon on iOS and Android
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] text-brand-deep sm:text-6xl">
              Kenya&apos;s independent fashion sellers, in one app.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Find shoes and clothing you won&apos;t see everywhere. Pay by M-Pesa or card, and your money reaches the
              seller only after your order arrives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <StoreButton store="App Store" />
              <StoreButton store="Google Play" />
            </div>
            <a href="#sellers" className="mt-6 inline-block font-extrabold text-brand underline underline-offset-4 hover:text-brand-dark">
              Want to sell on HauteCorner?
            </a>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-full bg-white shadow-[0_30px_80px_-30px_rgba(14,75,180,0.45)]">
            <Image src={logoMark} alt="" className="w-3/5" priority />
          </div>
        </div>
      </section>

      <section aria-label="Why HauteCorner" className="border-y border-line bg-white">
        <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {highlights.map((item) => (
            <li key={item.title}>
              <p className="font-black text-brand-deep">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="How it works" title="Shop many sellers without the hassle." />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {shoppingSteps.map((step, index) => (
            <li key={step.title}>
              <span className="flex size-10 items-center justify-center rounded-full bg-tint font-black text-brand">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-ink">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="protection" className="bg-brand-deep">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            light
            eyebrow="Buyer protection"
            title="Your money waits until your order arrives."
            intro="Buying from someone new shouldn't feel like a gamble. Sellers are paid after delivery is settled, not before."
          />
          <ol className="mt-12 grid gap-8 lg:grid-cols-4 lg:gap-0">
            {protectionSteps.map((step, index) => (
              <li key={step.label} className="relative pl-14 lg:pl-0 lg:pr-8 lg:pt-14">
                {index < protectionSteps.length - 1 ? (
                  <span aria-hidden className="absolute bottom-[-2rem] left-[1.15rem] top-10 w-0.5 bg-brand-light/50 lg:bottom-auto lg:left-10 lg:right-0 lg:top-[1.15rem] lg:h-0.5 lg:w-auto" />
                ) : null}
                <span aria-hidden className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full bg-brand-light font-black text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-extrabold text-white">{step.label}</h3>
                <p className="mt-2 leading-relaxed text-[#d6e3fb]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="sellers" className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="For sellers"
              title="Reach new customers from your phone."
              intro="Bring your shop to HauteCorner. We handle the storefront and payments, so you can focus on what you sell."
            />
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent('I want to sell on HauteCorner')}`}
              className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-extrabold text-white transition-colors hover:bg-brand-dark"
            >
              Tell me when applications open
            </a>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {sellerPoints.map((point) => (
              <li key={point.title} className="rounded-2xl border border-line bg-white p-6">
                <h3 className="font-extrabold text-ink">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="questions" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Questions" title="Good to know" />
        <div className="mt-8 divide-y divide-line border-y border-line">
          {questions.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-ink">
                {item.question}
                <span aria-hidden className="text-2xl font-bold leading-none text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
