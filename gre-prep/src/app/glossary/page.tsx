'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Word } from '@/types';
import { AlphabetRail } from '@/components/AlphabetRail';
import { BookMarked, Loader2, ArrowLeft, Shuffle, ArrowDownAZ } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const definitionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(0.9rem, 3.2vw, 1rem)',
  lineHeight: 1.55,
  color: 'var(--text-secondary)',
};

const wordStyle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)',
  fontWeight: 900,
  letterSpacing: '-0.01em',
  color: '#fff',
  overflowWrap: 'anywhere',
};

/** Première lettre normalisée d'un mot (A–Z, sinon '#'). */
function initial(word: string): string {
  const c = word.trim().charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

/** Mélange de Fisher–Yates — renvoie un nouveau tableau. */
function shuffleArray<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function GlossaryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffled, setShuffled] = useState<Word[] | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  /** false = mot puis définition ; true = définition puis mot (mode auto-test). */
  const [definitionFirst, setDefinitionFirst] = useState(true);

  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch('/words.json')
      .then(res => res.json())
      .then((data: Word[]) => { setWords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Liste alphabétique (source de vérité pour la navigation par lettre) ──
  const alphabetical = useMemo(
    () => [...words].sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' })),
    [words]
  );

  const displayed = shuffled ?? alphabetical;
  const isShuffled = shuffled !== null;

  // Lettres réellement présentes dans le jeu de données
  const available = useMemo(
    () => new Set(alphabetical.map(w => initial(w.word))),
    [alphabetical]
  );

  // Index de la première entrée de chaque lettre, pour poser les ancres
  const firstIndexOfLetter = useMemo(() => {
    const map: Record<string, number> = {};
    alphabetical.forEach((w, i) => {
      const l = initial(w.word);
      if (map[l] === undefined) map[l] = i;
    });
    return map;
  }, [alphabetical]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    setShuffled(shuffleArray(alphabetical));
    setActiveLetter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [alphabetical]);

  const handleRestoreOrder = useCallback(() => {
    setShuffled(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToLetter = useCallback((letter: string, smooth: boolean) => {
    const target = letterRefs.current[letter];
    if (!target) return;
    setActiveLetter(letter);
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }, []);

  // ── Lettre active pendant le défilement ─────────────────────────────────
  useEffect(() => {
    if (isShuffled || alphabetical.length === 0) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        let current: string | null = null;
        for (const letter of LETTERS) {
          const el = letterRefs.current[letter];
          if (!el) continue;
          // 140px ≈ hauteur de la barre collante + marge de confort
          if (el.getBoundingClientRect().top <= 140) current = letter;
          else break;
        }
        setActiveLetter(current ?? LETTERS.find(l => letterRefs.current[l]) ?? null);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isShuffled, alphabetical.length]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 size={48} color="var(--amber)" />
        </motion.div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', paddingTop: 'clamp(1.25rem, 4vw, 2rem)', paddingBottom: '5rem', position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '8%', left: '5%', width: '30vh', height: '30vh', background: 'var(--amber)', borderRadius: '50%', filter: 'blur(130px)', opacity: 0.07, zIndex: -1 }} className="animate-float" />
      <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: '35vh', height: '35vh', background: 'var(--violet)', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.07, zIndex: -1, animationDelay: '-3s' }} className="animate-float" />

      <div className="page-shell glossary-shell">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="game-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div className="game-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <Link
              href="/"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--text-muted)', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem',
                border: '1px solid var(--border)', borderRadius: 99,
                padding: '0.5rem 0.9rem', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <BookMarked size={22} color="var(--amber)" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', whiteSpace: 'nowrap' }}>Glossaire</span>
            </div>
          </div>

          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
              {displayed.length} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>mots</span>
            </span>
          </div>
        </header>

        {/* ── Barre d'actions collante ───────────────────────────────────── */}
        <div className="glossary-toolbar glass" style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          padding: '0.7rem', borderRadius: 18, marginBottom: '1.25rem',
        }}>
          <button
            type="button"
            onClick={handleShuffle}
            className="btn-block-mobile"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
              flex: '1 1 auto', minHeight: 48, padding: '0.7rem 1.25rem',
              borderRadius: 14, border: '1px solid rgba(245,158,11,0.35)',
              background: 'rgba(245,158,11,0.16)', color: '#fcd34d',
              fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Shuffle size={17} />
            {isShuffled ? 'Remélanger' : 'Mélanger'}
          </button>

          {isShuffled && (
            <button
              type="button"
              onClick={handleRestoreOrder}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                flex: '1 1 auto', minHeight: 48, padding: '0.7rem 1.1rem',
                borderRadius: 14, border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
                fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <ArrowDownAZ size={17} /> Ordre A–Z
            </button>
          )}

          <button
            type="button"
            onClick={() => setDefinitionFirst(v => !v)}
            title="Inverser l'ordre d'affichage dans chaque fiche"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              flex: '1 1 auto', minHeight: 48, padding: '0.7rem 1.1rem',
              borderRadius: 14, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {definitionFirst ? 'Définition → Mot' : 'Mot → Définition'}
          </button>
        </div>

        {/* ── Liste ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {displayed.map((word, index) => {
            const letter = initial(word.word);
            const isAnchor = !isShuffled && firstIndexOfLetter[letter] === index;

            return (
              <div
                key={word.word}
                ref={isAnchor ? (el) => { letterRefs.current[letter] = el; } : undefined}
                className="glossary-entry glass"
                style={{
                  borderRadius: 18,
                  padding: 'clamp(0.9rem, 3vw, 1.25rem)',
                  scrollMarginTop: '5.5rem',
                }}
              >
                {isAnchor && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 28, height: 28, padding: '0 0.5rem', marginBottom: '0.7rem',
                    borderRadius: 9, background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: 'var(--amber)', fontSize: '0.85rem', fontWeight: 900,
                  }}>
                    {letter}
                  </div>
                )}

                {definitionFirst ? (
                  <>
                    <p style={definitionStyle}>{word.definition}</p>
                    <h2 style={{ ...wordStyle, margin: '0.6rem 0 0' }}>{word.word}</h2>
                  </>
                ) : (
                  <>
                    <h2 style={{ ...wordStyle, margin: '0 0 0.6rem' }}>{word.word}</h2>
                    <p style={definitionStyle}>{word.definition}</p>
                  </>
                )}

                {/* Traduction + synonymes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.7rem' }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, color: '#fcd34d',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)',
                    borderRadius: 99, padding: '0.25rem 0.7rem',
                  }}>
                    {word.french}
                  </span>
                  {word.synonyms?.slice(0, 3).map((syn, i) => (
                    <span key={i} style={{
                      fontSize: '0.75rem', fontWeight: 500, color: '#c4b5fd',
                      background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                      borderRadius: 99, padding: '0.25rem 0.7rem',
                    }}>
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Espace de fin : permet aux dernières lettres (X, Y, Z) de
              remonter en haut de l'écran quand on les vise dans le rail. */}
          <div aria-hidden style={{ minHeight: '65vh' }} />
        </div>
      </div>

      {/* ── Rail alphabétique ────────────────────────────────────────────── */}
      <AlphabetRail
        available={available}
        active={activeLetter}
        onSelect={scrollToLetter}
        disabled={isShuffled}
      />
    </main>
  );
}
