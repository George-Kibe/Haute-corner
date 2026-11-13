import { site, trader } from '@/lib/site';

// The business behind HauteCorner, as declared to Google Play and Apple. Lines
// with no value yet are left out.
export function TraderDetails() {
  const rows: [string, React.ReactNode][] = [
    ['Trading as', site.name],
    ['Operated by', trader.legalName],
    ['Registration number', trader.registrationNumber],
    ['Address', trader.address],
    ['Phone', trader.phone ? <a href={`tel:${trader.phone.replace(/\s/g, '')}`}>{trader.phone}</a> : ''],
    ['Email', <a key="email" href={`mailto:${trader.email}`}>{trader.email}</a>],
  ];

  return (
    <dl className="not-prose mt-4 grid gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-5 py-4 text-sm sm:grid-cols-[max-content_1fr]">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-bold text-ink">{label}</dt>
            <dd className="text-muted [&_a]:font-bold [&_a]:text-brand [&_a]:underline">{value}</dd>
          </div>
        ))}
    </dl>
  );
}
