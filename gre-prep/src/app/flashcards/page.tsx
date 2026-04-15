'use client';

import { useEffect, useState } from 'react';
import { Word } from '@/types';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GameCard } from '@/components/GameCard';
import { Layers, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FlashcardsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const { progress, state, queueSize, handleAnswer, nextTurn, flipCard } =
    useGameLoop(words, 'flashcard');

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
          <Loader2 size={48} color="var(--violet)" />
        </motion.div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '6rem', position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: '35vh', height: '35vh', background: 'var(--violet)', borderRadius: '50%', filter: 'blur(130px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />
      <div style={{ position: 'fixed', bottom: '15%', left: '8%', width: '30vh', height: '30vh', background: 'var(--emerald)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.07, zIndex: -1, animationDelay: '-2s' }} className="animate-float" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }} className="animate-fade-up">

          {/* Back + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <a
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
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={22} color="var(--violet)" />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>Flashcards</span>
            </div>
          </div>

          {/* Queue counter */}
          {progress && (
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 1.15rem', borderRadius: 99 }}>
              <span style={{ width: 7, height: 7, background: 'var(--violet)', borderRadius: '50%', boxShadow: '0 0 10px var(--violet)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                {queueSize} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>en file</span>
              </span>
            </div>
          )}
        </header>

        {/* Flashcard */}
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
