import { site } from '@/lib/site';

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-black text-brand-deep sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {site.legalUpdated}</p>
      <p className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
        <strong className="text-ink">Draft.</strong> HauteCorner has not launched yet, and this page is still under legal
        review. It will be finalised before launch.
      </p>
      {intro ? <p className="mt-6 text-lg leading-relaxed text-ink">{intro}</p> : null}
      <div className="legal">{children}</div>
    </article>
  );
}
