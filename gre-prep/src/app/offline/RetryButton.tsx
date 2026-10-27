'use client';

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex h-11 items-center rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg"
    >
      Try again
    </button>
  );
}
