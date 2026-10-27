'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloudSync } from '@/components/CloudSync';
import { Logo } from '@/components/Logo';
import { MORE_TAB, NAV, isActive } from './nav';

/* Sidebar from 1024px, bottom tab bar below. The content column owns the
 * safe-area padding; the tab bar owns the home-indicator inset. */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [...NAV.filter((n) => n.tab), MORE_TAB];
  const moreActive = !NAV.filter((n) => n.tab).some((n) => isActive(pathname, n.href)) && pathname !== '/more' ? true : pathname === '/more';

  return (
    <div className="min-h-screen lg:flex">
      <CloudSync />
      <aside
        className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-line bg-surface/60 px-3 py-5"
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center px-3 pb-6" aria-label="SAR Prep home">
          <Logo size={38} />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                <Icon size={18} aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-3 text-[11px] leading-snug text-faint">
          GRE® is a registered trademark of ETS. SAR Prep is not affiliated with or endorsed by ETS.
        </p>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="pb-[calc(5.5rem+var(--sab))] lg:pb-10">{children}</main>
      </div>

      <nav
        aria-label="Primary"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
        style={{ paddingBottom: 'var(--sab)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href === '/more' ? moreActive : isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                    active ? 'text-accent-ink' : 'text-muted'
                  }`}
                >
                  <Icon size={21} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
