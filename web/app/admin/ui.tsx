import Link from 'next/link';

const cloud = () => process.env.CLOUDINARY_CLOUD_NAME ?? '';

export const imageUrl = (publicId: string, width = 200) =>
  `https://res.cloudinary.com/${cloud()}/image/upload/c_scale,w_${width}/q_auto/f_auto/${publicId}`;
export const videoUrl = (publicId: string) => `https://res.cloudinary.com/${cloud()}/video/upload/sp_auto:maxres_720p/${publicId}.m3u8`;
export const videoMp4Url = (publicId: string) => `https://res.cloudinary.com/${cloud()}/video/upload/q_auto/${publicId}.mp4`;
export const videoPosterUrl = (publicId: string, width = 400) =>
  `https://res.cloudinary.com/${cloud()}/video/upload/so_0,c_scale,w_${width}/q_auto/f_jpg/${publicId}.jpg`;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(date);

export const formatKes = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`;

const badgeTones: Record<string, string> = {
  applied: 'bg-amber-100 text-amber-900',
  approved: 'bg-green-100 text-green-900',
  active: 'bg-green-100 text-green-900',
  open: 'bg-amber-100 text-amber-900',
  rejected: 'bg-red-100 text-red-900',
  removed: 'bg-red-100 text-red-900',
  suspended: 'bg-red-100 text-red-900',
};

export function Badge({ children }: { children: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ${badgeTones[children] ?? 'bg-tint text-brand-deep'}`}>
      {children.replace(/_/g, ' ')}
    </span>
  );
}

export function PageTitle({ children, back }: { children: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back ? (
        <Link href={back.href} className="text-sm font-bold text-brand hover:underline">
          ← {back.label}
        </Link>
      ) : null}
      <h1 className="mt-1 text-2xl font-black text-brand-deep sm:text-3xl">{children}</h1>
    </div>
  );
}

export function Loading() {
  return <p className="animate-pulse py-10 text-muted">Loading…</p>;
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      {title ? <h2 className="mb-3 text-lg font-extrabold text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}

// Tabs that set one search parameter.
export function FilterTabs({ base, param, options, current }: { base: string; param: string; options: string[]; current: string }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter">
      {options.map((option) => (
        <Link
          key={option}
          href={`${base}?${param}=${option}`}
          aria-current={option === current ? 'page' : undefined}
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${option === current ? 'bg-brand text-white' : 'border border-line bg-white text-muted hover:text-brand'}`}
        >
          {option.replace(/_/g, ' ')}
        </Link>
      ))}
    </nav>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-muted">{children}</p>;
}
