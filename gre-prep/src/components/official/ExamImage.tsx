'use client';

import type { ReactNode } from 'react';
import type { Img } from '@/types/official';
import type { FigureTheme } from '@/lib/figure-theme';

/* Images cropped from the book are cut at a fixed scale (2 px per point of
 * the printed page, a 1000 px column). Sizing them in `cqw` — a percentage of
 * the paper's own width — keeps every crop of one question at the same scale,
 * stem and choices alike, whatever the screen. The paper has a minimum width
 * and scrolls sideways below it rather than shrinking print to illegibility. */

const COLUMN_PX = 1000;

export function Paper({
  children,
  theme,
  className = '',
}: {
  children: ReactNode;
  theme: FigureTheme;
  className?: string;
}) {
  return (
    <div className={`exam-paper ${theme === 'dark' ? 'exam-paper-dark' : ''} ${className}`}>
      <div className="exam-paper-inner">{children}</div>
    </div>
  );
}

export function ExamImg({ img, className = '' }: { img: Img; className?: string }) {
  return (
    // Plain <img>: the crops are already WebP at their final size.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      alt=""
      width={img.w}
      height={img.h}
      loading="lazy"
      draggable={false}
      className={`exam-img ${className}`}
      style={{ width: `${(img.w / COLUMN_PX) * 100}cqw`, maxWidth: 'none', height: 'auto' }}
    />
  );
}

/** A cropped figure or graph at a comfortable on-screen size (the files are
 *  2 px per printed point; 0.75 maps that to a readable size). */
export function FigureCard({ img, theme }: { img: Img; theme: FigureTheme }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className={`exam-figure ${theme === 'dark' ? 'exam-figure-dark' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt="Figure for the question"
          width={img.w}
          height={img.h}
          draggable={false}
          className="block"
          style={{ width: img.w * 0.75, maxWidth: 'none', height: 'auto' }}
        />
      </div>
    </div>
  );
}
