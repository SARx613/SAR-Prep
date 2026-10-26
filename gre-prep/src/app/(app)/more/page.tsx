import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { NAV } from '@/components/shell/nav';

export const metadata: Metadata = { title: 'More' };

/* The five-tab bar has no room for everything; this is the rest. */
export default function MorePage() {
  const items = NAV.filter((n) => !n.tab);
  return (
    <div className="mx-auto max-w-xl px-4 pb-10" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">More</h1>
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-[56px] items-center gap-3 px-4 hover:bg-surface-2">
              <Icon size={20} className="text-accent-ink" aria-hidden />
              <span className="flex-1 font-semibold">{label}</span>
              <ChevronRight size={18} className="text-faint" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs leading-relaxed text-faint">
        GRE® is a registered trademark of ETS. SAR Prep is not affiliated with or endorsed by ETS. Lessons follow public ETS
        documents; every question is original.
      </p>
    </div>
  );
}
