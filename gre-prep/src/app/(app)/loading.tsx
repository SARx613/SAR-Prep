/* Instant feedback while the next tab's page arrives. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }} aria-busy="true" aria-label="Loading">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 space-y-3" aria-hidden>
        <div className="h-20 animate-pulse rounded-[var(--radius)] bg-surface-2" />
        <div className="h-20 animate-pulse rounded-[var(--radius)] bg-surface-2" />
        <div className="h-20 animate-pulse rounded-[var(--radius)] bg-surface-2" />
      </div>
    </div>
  );
}
