'use client';

import { useEffect, useState } from 'react';
import { Word } from '@/types';
import { useGameLoop, PlayMode } from '@/hooks/useGameLoop';
import { GameCard } from '@/components/GameCard';
import { BrainCircuit, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type GameToggleMode = 'mcq' | 'typing' | 'mix';

const MODES: { id: GameToggleMode; label: string; desc: string }[] = [
  { id: 'mcq', label: 'QCM', desc: 'Choix multiple' },
  { id: 'typing', label: 'Frappe', desc: 'Tape le mot' },
  { id: 'mix', label: 'Mix', desc: 'Les deux au hasard' },
];

export default function GamesPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<GameToggleMode>('mix');

  const { progress, state, queueSize, handleAnswer, nextTurn, flipCard } =
    useGameLoop(words, selectedMode as PlayMode);

  useEffect(() => {
    fetch('/words.json')
      .then(res => res.json())
      .then((data: Word[]) => { setWords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 size={48} color="var(--emerald)" />
        </motion.div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '6rem', position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '30vh', height: '30vh', background: 'var(--emerald)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '40vh', height: '40vh', background: 'var(--violet)', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.08, zIndex: -1, animationDelay: '-3s' }} className="animate-float" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }} className="animate-fade-up">

          {/* Back + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              href="/"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--text-muted)', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem',
                border: '1px solid var(--border)', borderRadius: 99,
                padding: '0.4rem 0.9rem',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BrainCircuit size={22} color="var(--emerald)" />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>S&apos;entraîner</span>
            </div>
          </div>

          {/* Mode Toggle pill */}
          <div className="glass" style={{ display: 'flex', gap: '0.2rem', padding: '0.3rem', borderRadius: 99 }}>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                title={m.desc}
                style={{
                  padding: '0.5rem 1.3rem',
                  borderRadius: 99,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  background: selectedMode === m.id ? 'var(--emerald)' : 'transparent',
                  color: selectedMode === m.id ? '#000' : 'var(--text-secondary)',
                  boxShadow: selectedMode === m.id ? '0 0 14px rgba(16,185,129,0.4)' : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Queue counter */}
          {progress && (
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 1.15rem', borderRadius: 99 }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, background: 'var(--emerald)', borderRadius: '50%', boxShadow: '0 0 10px var(--emerald)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                {queueSize} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>en file</span>
              </span>
            </div>
          )}
        </header>

        {/* Game Card */}
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameCard
              state={state}
              onAnswer={handleAnswer}
              onNextTurn={nextTurn}
              onFlip={flipCard}
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}
