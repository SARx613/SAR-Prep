'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripHorizontal, X } from 'lucide-react';
import { initialCalc, press, transferValue, type CalcState, type Key } from '@/lib/calculator';

/* The on-screen calculator (behaviour in lib/calculator.ts, from the ETS
 * guidelines). A draggable window from the lg breakpoint, a bottom sheet
 * below it so it never covers the question on a phone. */

const rows: { label: string; key: Key; aria?: string; wide?: boolean; tone?: 'op' | 'fn' | 'eq' }[][] = [
  [
    { label: 'MC', key: { k: 'mc' }, tone: 'fn', aria: 'Memory clear' },
    { label: 'MR', key: { k: 'mr' }, tone: 'fn', aria: 'Memory recall' },
    { label: 'M+', key: { k: 'mplus' }, tone: 'fn', aria: 'Memory sum' },
    { label: 'C', key: { k: 'clear' }, tone: 'fn', aria: 'Clear' },
  ],
  [
    { label: '(', key: { k: 'paren', p: '(' }, tone: 'fn' },
    { label: ')', key: { k: 'paren', p: ')' }, tone: 'fn' },
    { label: '√', key: { k: 'sqrt' }, tone: 'fn', aria: 'Square root' },
    { label: '÷', key: { k: 'op', op: '/' }, tone: 'op', aria: 'Divide' },
  ],
  [
    { label: '7', key: { k: 'digit', d: '7' } },
    { label: '8', key: { k: 'digit', d: '8' } },
    { label: '9', key: { k: 'digit', d: '9' } },
    { label: '×', key: { k: 'op', op: '*' }, tone: 'op', aria: 'Multiply' },
  ],
  [
    { label: '4', key: { k: 'digit', d: '4' } },
    { label: '5', key: { k: 'digit', d: '5' } },
    { label: '6', key: { k: 'digit', d: '6' } },
    { label: '−', key: { k: 'op', op: '-' }, tone: 'op', aria: 'Subtract' },
  ],
  [
    { label: '1', key: { k: 'digit', d: '1' } },
    { label: '2', key: { k: 'digit', d: '2' } },
    { label: '3', key: { k: 'digit', d: '3' } },
    { label: '+', key: { k: 'op', op: '+' }, tone: 'op', aria: 'Add' },
  ],
  [
    { label: '±', key: { k: 'sign' }, tone: 'fn', aria: 'Change sign' },
    { label: '0', key: { k: 'digit', d: '0' } },
    { label: '.', key: { k: 'dot' }, aria: 'Decimal point' },
    { label: '=', key: { k: 'equals' }, tone: 'eq', aria: 'Equals' },
  ],
];

interface Props {
  onClose: () => void;
  /** Present only when a single-box Numeric Entry question is on screen. */
  onTransfer?: (value: string) => void;
}

export function Calculator({ onClose, onTransfer }: Props) {
  const [state, setState] = useState<CalcState>(initialCalc);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const send = useCallback((k: Key) => setState((s) => press(s, k)), []);

  // Keyboard entry while the calculator is open and no text field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable]')) return;
      const map: Record<string, Key> = {
        '+': { k: 'op', op: '+' }, '-': { k: 'op', op: '-' }, '*': { k: 'op', op: '*' }, '/': { k: 'op', op: '/' },
        '(': { k: 'paren', p: '(' }, ')': { k: 'paren', p: ')' }, '.': { k: 'dot' }, '=': { k: 'equals' }, Enter: { k: 'equals' },
        Escape: { k: 'clear' },
      };
      const key = /^\d$/.test(e.key) ? ({ k: 'digit', d: e.key } as Key) : map[e.key];
      if (key) {
        if (e.key === 'Enter' && t.closest('button')) return;
        e.preventDefault();
        send(key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send]);

  const shown = state.shown;
  const transferable = onTransfer && transferValue(state) !== null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Calculator"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-surface shadow-2xl lg:inset-x-auto lg:bottom-auto lg:w-[280px] lg:rounded-lg lg:border"
      style={
        pos
          ? { left: pos.x, top: pos.y }
          : { paddingBottom: 'var(--sab)', right: undefined }
      }
    >
      <div
        className="flex cursor-default select-none items-center gap-2 border-b border-line px-3 py-2 lg:cursor-grab"
        onPointerDown={(e) => {
          if (window.innerWidth < 1024) return;
          const r = panel.current!.getBoundingClientRect();
          drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPos({
            x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - drag.current.dx)),
            y: Math.max(0, Math.min(window.innerHeight - 380, e.clientY - drag.current.dy)),
          });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <GripHorizontal size={16} className="hidden text-faint lg:block" aria-hidden />
        <span className="text-sm font-semibold">Calculator</span>
        {state.memory !== 0 && <span className="rounded bg-surface-2 px-1.5 text-[10px] font-bold text-muted">M</span>}
        <button type="button" onClick={onClose} aria-label="Close calculator" className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2">
          <X size={16} />
        </button>
      </div>

      <div className="mx-auto max-w-[320px] p-3 lg:max-w-none">
        <output
          aria-live="polite"
          className={`mb-2 block rounded-md border border-line bg-surface-2 px-3 py-2 text-right font-mono text-2xl tabular-nums ${state.error ? 'text-bad' : 'text-fg'}`}
        >
          {shown}
        </output>
        <div className="grid grid-cols-4 gap-1.5">
          {rows.flat().map((b, i) => (
            <button
              key={i}
              type="button"
              aria-label={b.aria}
              onClick={() => send(b.key)}
              className={`h-11 rounded-md border text-lg font-semibold active:translate-y-px ${
                b.tone === 'eq' ? 'border-accent bg-accent text-accent-fg'
                : b.tone === 'op' ? 'border-line-strong bg-accent-soft text-accent'
                : b.tone === 'fn' ? 'border-line bg-surface-2 text-sm text-muted'
                : 'border-line bg-surface text-fg'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        {onTransfer && (
          <button
            type="button"
            disabled={!transferable}
            onClick={() => {
              const v = transferValue(state);
              if (v !== null) onTransfer(v);
            }}
            className="mt-2 h-10 w-full rounded-md border border-line-strong text-sm font-semibold text-fg enabled:hover:bg-surface-2 disabled:opacity-40"
          >
            Transfer Display
          </button>
        )}
      </div>
    </div>
  );
}
