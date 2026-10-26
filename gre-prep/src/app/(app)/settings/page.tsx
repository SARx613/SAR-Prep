'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { ATTEMPTS_KEY } from '@/lib/attempts';
import { PROGRESS_KEY, resetProgress } from '@/lib/storage';
import { resetSeriesStats, SERIES_STATS_KEY } from '@/lib/series';
import {
  EXAM_DATE_KEY, REASONS_KEY, THEME_KEY, TRANSLATION_KEY, WEEKLY_HOURS_KEY,
  applyTheme, writePref, type Theme,
} from '@/lib/prefs';
import { useExamDate, useShowTranslation, useTheme, useWeeklyHours } from '@/hooks/usePrefs';

const row = 'flex flex-col gap-3 rounded-[var(--radius)] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between';

export default function SettingsPage() {
  const theme = useTheme();
  const showFr = useShowTranslation();
  const examDate = useExamDate();
  const hours = useWeeklyHours();
  const { data: session, status } = useSession();

  const setTheme = (t: Theme) => {
    writePref(THEME_KEY, t === 'system' ? null : t);
    applyTheme(t);
  };

  const exportData = () => {
    const dump: Record<string, unknown> = {};
    for (const k of [ATTEMPTS_KEY, PROGRESS_KEY, SERIES_STATS_KEY, REASONS_KEY, EXAM_DATE_KEY, WEEKLY_HOURS_KEY]) {
      const raw = localStorage.getItem(k);
      if (raw) { try { dump[k] = JSON.parse(raw); } catch { dump[k] = raw; } }
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'sar-prep-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!confirm('Erase all progress stored on this device (questions, vocabulary, error log)? This cannot be undone.')) return;
    for (const k of [ATTEMPTS_KEY, REASONS_KEY]) localStorage.removeItem(k);
    resetProgress();
    resetSeriesStats();
    window.dispatchEvent(new Event('gre-prep:storage'));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <section className="mt-8 space-y-3" aria-labelledby="s-look">
        <h2 id="s-look" className="text-sm font-bold uppercase tracking-wide text-faint">Appearance</h2>
        <div className={row}>
          <div><p className="font-semibold">Theme</p><p className="text-sm text-muted">Practice screens always use the light, exam-style look.</p></div>
          <div role="radiogroup" aria-label="Theme" className="inline-flex overflow-hidden rounded-[var(--radius)] border border-line-strong">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button key={t} role="radio" aria-checked={theme === t} onClick={() => setTheme(t)}
                className={`h-10 px-4 text-sm font-semibold capitalize ${theme === t ? 'bg-accent text-accent-fg' : 'bg-surface text-muted hover:bg-surface-2'}`}>{t}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="s-plan">
        <h2 id="s-plan" className="text-sm font-bold uppercase tracking-wide text-faint">Study plan</h2>
        <label className={row}>
          <span><span className="block font-semibold">Test date</span><span className="text-sm text-muted">Used to build your weekly plan.</span></span>
          <input type="date" value={examDate} onChange={(e) => writePref(EXAM_DATE_KEY, e.target.value)} className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-3" />
        </label>
        <label className={row}>
          <span><span className="block font-semibold">Hours per week</span><span className="text-sm text-muted">What you can realistically study.</span></span>
          <input type="number" min={1} max={60} inputMode="numeric" value={hours || ''} onChange={(e) => writePref(WEEKLY_HOURS_KEY, e.target.value)} className="h-10 w-24 rounded-[var(--radius)] border border-line-strong bg-surface px-3" />
        </label>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="s-vocab">
        <h2 id="s-vocab" className="text-sm font-bold uppercase tracking-wide text-faint">Vocabulary</h2>
        <label className={row}>
          <span><span className="block font-semibold">Show French translations</span><span className="text-sm text-muted">Off by default: the GRE is entirely in English.</span></span>
          <input type="checkbox" checked={showFr} onChange={(e) => writePref(TRANSLATION_KEY, e.target.checked ? '1' : null)} className="h-6 w-6 accent-[var(--accent)]" />
        </label>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="s-acct">
        <h2 id="s-acct" className="text-sm font-bold uppercase tracking-wide text-faint">Account &amp; sync</h2>
        <div className={row}>
          {session?.user ? (
            <>
              <div><p className="font-semibold">{session.user.name ?? 'Signed in'}</p><p className="text-sm text-muted">{session.user.email} · progress syncs across devices.</p></div>
              <button onClick={() => signOut({ redirectTo: '/' })} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-line-strong px-4 text-sm font-semibold"><LogOut size={16} />Sign out</button>
            </>
          ) : (
            <>
              <div><p className="font-semibold">Not signed in</p><p className="text-sm text-muted">Everything works offline on this device. Sign in to keep progress across devices.</p></div>
              <button disabled={status === 'loading'} onClick={() => signIn('google')} className="h-10 rounded-[var(--radius)] bg-accent px-4 text-sm font-semibold text-accent-fg">Continue with Google</button>
            </>
          )}
        </div>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="s-data">
        <h2 id="s-data" className="text-sm font-bold uppercase tracking-wide text-faint">Your data</h2>
        <div className={row}>
          <div><p className="font-semibold">Export</p><p className="text-sm text-muted">Download everything stored on this device as JSON.</p></div>
          <button onClick={exportData} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-line-strong px-4 text-sm font-semibold"><Download size={16} />Export</button>
        </div>
        <div className={row}>
          <div><p className="font-semibold text-bad">Reset progress</p><p className="text-sm text-muted">Erases questions, vocabulary and error log on this device.</p></div>
          <button onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-bad px-4 text-sm font-semibold text-bad"><Trash2 size={16} />Reset</button>
        </div>
      </section>
    </div>
  );
}
