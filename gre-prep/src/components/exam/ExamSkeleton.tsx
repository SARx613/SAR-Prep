/* Shown for the instant before the practice set is interactive. */
export function ExamSkeleton({ title }: { title: string }) {
  return (
    <div className="exam flex min-h-dvh flex-col" aria-busy="true">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold">{title}</div>
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 px-4 py-6" aria-hidden>
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-surface-2" />
        <div className="mt-6 h-12 animate-pulse rounded bg-surface-2" />
        <div className="h-12 animate-pulse rounded bg-surface-2" />
        <div className="h-12 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
