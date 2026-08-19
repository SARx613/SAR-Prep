'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetRailProps {
  /** Lettres réellement présentes dans la liste (les autres sont grisées). */
  available: Set<string>;
  /** Lettre actuellement visible en haut de l'écran. */
  active: string | null;
  /** Appelé au clic ou pendant le glissement. */
  onSelect: (letter: string, smooth: boolean) => void;
  /** Désactivé quand la liste est mélangée (l'ordre n'est plus alphabétique). */
  disabled?: boolean;
}

export function AlphabetRail({ available, active, onSelect, disabled = false }: AlphabetRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastLetter = useRef<string | null>(null);

  /** Convertit une position verticale en lettre du rail. */
  const letterAtY = useCallback((clientY: number): string | null => {
    const rail = railRef.current;
    if (!rail) return null;
    const rect = rail.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const index = Math.min(LETTERS.length - 1, Math.max(0, Math.floor(ratio * LETTERS.length)));
    return LETTERS[index];
  }, []);

  const applyLetter = useCallback((letter: string | null, smooth: boolean) => {
    if (!letter || letter === lastLetter.current) return;
    lastLetter.current = letter;
    setHovered(letter);
    if (!available.has(letter)) return;
    onSelect(letter, smooth);
    // Retour haptique discret sur les appareils qui le supportent
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(6); } catch { }
    }
  }, [available, onSelect]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    railRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    lastLetter.current = null;
    applyLetter(letterAtY(e.clientY), false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !dragging) return;
    e.preventDefault();
    applyLetter(letterAtY(e.clientY), false);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try { railRef.current?.releasePointerCapture(e.pointerId); } catch { }
    setDragging(false);
    lastLetter.current = null;
    setHovered(null);
  };

  // Sécurité : si le pointeur est relâché hors du rail
  useEffect(() => {
    if (!dragging) return;
    const stop = () => { setDragging(false); lastLetter.current = null; setHovered(null); };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging]);

  const bubbleLetter = dragging ? hovered : null;

  return (
    <>
      {/* Bulle affichée pendant le glissement */}
      {bubbleLetter && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            right: 'calc(var(--rail-width) + 1.75rem)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 76,
            height: 76,
            borderRadius: 24,
            background: 'rgba(15,20,32,0.92)',
            border: '1px solid rgba(245,158,11,0.5)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.25rem',
            fontWeight: 900,
            color: 'var(--amber)',
            zIndex: 60,
            pointerEvents: 'none',
          }}
        >
          {bubbleLetter}
        </div>
      )}

      <div
        ref={railRef}
        role="navigation"
        aria-label="Navigation alphabétique"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="alphabet-rail"
        style={{
          position: 'fixed',
          right: 'max(0.35rem, env(safe-area-inset-right))',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'var(--rail-width)',
          /* Hauteur explicite : le glissement doit avoir assez de course
             pour viser une lettre précise au pouce. */
          height: 'min(76vh, 560px)',
          padding: '0.4rem 0',
          borderRadius: 99,
          background: dragging ? 'rgba(15,20,32,0.8)' : 'rgba(15,20,32,0.45)',
          border: `1px solid ${dragging ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.3 : 1,
          transition: 'opacity 0.25s, background 0.2s, border-color 0.2s',
        }}
        title={disabled ? 'Disponible en ordre alphabétique' : 'Clique ou glisse pour naviguer'}
      >
        {LETTERS.map(letter => {
          const isActive = active === letter;
          const exists = available.has(letter);
          return (
            <button
              key={letter}
              type="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Aller à la lettre ${letter}`}
              onClick={() => { if (!disabled && exists) onSelect(letter, true); }}
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                flex: 1,
                minHeight: 0,
                fontSize: 'clamp(0.55rem, 1.6vw, 0.68rem)',
                fontWeight: isActive ? 900 : 600,
                lineHeight: 1,
                color: isActive ? 'var(--amber)' : exists ? 'var(--text-secondary)' : 'var(--text-muted)',
                textShadow: isActive ? '0 0 10px rgba(245,158,11,0.6)' : 'none',
                transform: isActive ? 'scale(1.35)' : 'scale(1)',
                transition: 'color 0.15s, transform 0.15s',
                pointerEvents: 'none', /* le rail gère lui-même le pointeur */
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </>
  );
}
