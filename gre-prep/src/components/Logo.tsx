import { useId } from 'react';

/* The SAR Prep mark: a white S on a violet tile with a small spark. Inline so
 * it works offline and takes the size of its container. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="SAR Prep" className={className}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.25" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill={`url(#${id}-bg)`} />
      <rect width="512" height="512" rx="118" fill={`url(#${id}-glow)`} />
      <path
        d="M344 170C336 128 298 108 256 108C204 108 168 138 168 180C168 226 206 240 256 254C306 268 346 284 346 334C346 378 308 404 256 404C210 404 172 382 164 336"
        fill="none" stroke="#fff" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M396 74l10 26 26 10-26 10-10 26-10-26-26-10 26-10z" fill="#fbbf24" />
    </svg>
  );
}

/** Mark plus the name: "SAR" heavy, "Prep" lighter. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-lg leading-none tracking-tight">
        <span className="font-black">SAR</span>
        <span className="ml-1 font-semibold text-muted">Prep</span>
      </span>
    </span>
  );
}
