import { BarChart3, CalendarDays, BookOpen, ClipboardCheck, Dumbbell, Home, Layers, MoreHorizontal, PencilRuler, PenLine, Repeat, Settings, Timer, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. */
  tab?: boolean;
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, tab: true },
  { href: '/learn', label: 'Learn', icon: BookOpen, tab: true },
  { href: '/practice', label: 'Practice', icon: Dumbbell, tab: true },
  { href: '/review', label: 'Review', icon: Repeat, tab: true },
  { href: '/mock', label: 'Mock tests', icon: Timer },
  { href: '/plan', label: 'Study plan', icon: CalendarDays },
  { href: '/writing', label: 'Writing', icon: PenLine },
  { href: '/flashcards', label: 'Vocabulary', icon: Layers },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Shown only to users allowed by /api/private-access (ETS's own tests and exercises; see private-access.ts). */
export const PRIVATE_NAV: NavItem[] = [
  { href: '/official-tests', label: 'Official tests', icon: ClipboardCheck },
  { href: '/math-review', label: 'Math Review', icon: PencilRuler },
];

export const MORE_TAB: NavItem = { href: '/more', label: 'More', icon: MoreHorizontal, tab: true };

export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/flashcards') return pathname.startsWith('/flashcards') || pathname.startsWith('/games') || pathname.startsWith('/vocabulary');
  return pathname === href || pathname.startsWith(href + '/');
}
