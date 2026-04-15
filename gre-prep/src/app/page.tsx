'use client';

import { useEffect, useState } from 'react';
import { Word } from '@/types';
import { useGameLoop } from '@/hooks/useGameLoop';
import { Dashboard } from '@/components/Dashboard';
import { GameCard } from '@/components/GameCard';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const { progress, state, queueSize, handleAnswer, nextTurn, flipCard } = useGameLoop(words);

  useEffect(() => {
    fetch('/words.json')
      .then(res => res.json())
      .then(data => {
        setWords(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load words", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Loader2 size={48} color="var(--emerald)" />
        </motion.div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h1 style={{ color: 'var(--rose)', fontSize: '2rem', marginBottom: '1rem' }}>Error loading data</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Could not load the vocabulary words. Please make sure words.json is in the public directory.</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', paddingTop: '3rem', paddingBottom: '6rem', position: 'relative' }}>

      {/* Dynamic background elements */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '30vh', height: '30vh', background: 'var(--emerald)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '40vh', height: '40vh', background: 'var(--violet)', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.08, zIndex: -1, animationDelay: '-3s' }} className="animate-float" />

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', padding: '0 1.5rem' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="glow-emerald" style={{ width: 56, height: 56, background: 'var(--emerald)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit color="#fff" size={32} />
            </div>
            <div>
              <h1 className="text-gradient-hero" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                GRE Mastery
              </h1>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0.2rem 0 0 0' }}>Adaptive Learning</p>
            </div>
          </div>

          {progress && (
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1.25rem', borderRadius: 99 }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--emerald)', borderRadius: '50%', boxShadow: '0 0 10px var(--emerald)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                {queueSize} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Queued</span>
              </span>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div style={{ width: '100%' }}>
          {progress ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Dashboard progress={progress} totalWords={words.length} streak={state.streak} />
              <GameCard
                state={state}
                onAnswer={handleAnswer}
                onNextTurn={nextTurn}
                onFlip={flipCard}
              />
            </motion.div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
              <Loader2 size={32} color="var(--emerald)" className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
