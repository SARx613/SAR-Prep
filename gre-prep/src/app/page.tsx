'use client';

import { useEffect, useState } from 'react';
import { UserProgress } from '@/types';
import { loadProgress, resetProgress } from '@/lib/storage';
import {
  BrainCircuit, Trophy, Target, BookOpen, Layers,
  Gamepad2, ChevronRight, RefreshCcw, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [totalWords, setTotalWords] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setProgress(loadProgress());
    fetch('/words.json')
      .then(r => r.json())
      .then((data: unknown[]) => setTotalWords(data.length))
      .catch(() => {});
  }, []);

  const handleReset = () => {
    if (confirm('Réinitialiser toute la progression ?')) {
      resetProgress();
      setProgress(loadProgress());
    }
  };

  const mastery = progress && totalWords > 0
    ? (progress.masteredIds.length / totalWords) * 100
    : 0;

  const stats = [
    {
      key: 'mastered', label: 'Maîtrisés', icon: Trophy,
      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)',
      value: progress?.masteredIds.length ?? 0,
    },
    {
      key: 'review', label: 'À revoir', icon: Target,
      color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)',
      value: progress?.reviewIds.length ?? 0,
    },
    {
      key: 'seen', label: 'Vus', icon: Eye,
      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',
      value: progress?.totalSeen ?? 0,
    },
    {
      key: 'score', label: 'Score', icon: BookOpen,
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)',
      value: progress?.sessionScore ?? 0,
    },
  ];

  const navCards = [
    {
      title: 'Flashcards',
      description: 'Révise les mots un par un avec des cartes à retourner. Idéal pour mémoriser.',
      icon: Layers,
      color: 'var(--violet)',
      bg: 'rgba(139,92,246,0.08)',
      accentBg: 'rgba(139,92,246,0.18)',
      accentBorder: 'rgba(139,92,246,0.35)',
      glowColor: 'var(--violet)',
      cta: 'Commencer',
      href: '/flashcards',
      delay: 0.5,
    },
    {
      title: "S'entraîner",
      description: 'QCM, frappe au clavier ou mix des deux pour tester tes connaissances en conditions réelles.',
      icon: Gamepad2,
      color: 'var(--emerald)',
      bg: 'rgba(16,185,129,0.08)',
      accentBg: 'rgba(16,185,129,0.18)',
      accentBorder: 'rgba(16,185,129,0.35)',
      glowColor: 'var(--emerald)',
      cta: 'Jouer',
      href: '/games',
      delay: 0.6,
    },
  ];

  return (
    <main style={{ minHeight: '100vh', paddingTop: '3rem', paddingBottom: '6rem', position: 'relative' }}>

      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '30vh', height: '30vh', background: 'var(--emerald)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '40vh', height: '40vh', background: 'var(--violet)', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.08, zIndex: -1, animationDelay: '-3s' }} className="animate-float" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="glow-emerald" style={{ width: 56, height: 56, background: 'var(--emerald)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit color="#fff" size={32} />
            </div>
            <div>
              <h1 className="text-gradient-hero" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                GRE Mastery
              </h1>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0.2rem 0 0 0' }}>
                Tableau de bord
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--text-muted)', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 99,
              padding: '0.5rem 1rem', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.color = 'var(--rose)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <RefreshCcw size={14} /> Réinitialiser
          </button>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass card-depth"
                style={{
                  borderRadius: 20, padding: '1.25rem',
                  background: stat.bg, borderColor: stat.border,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: stat.color, borderRadius: '50%', opacity: 0.07, filter: 'blur(20px)' }} />
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: stat.bg, border: `1px solid ${stat.border}`, marginBottom: '0.75rem' }}>
                  <Icon size={20} color={stat.color} />
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: '0.25rem' }}>
                  {stat.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass card-depth"
          style={{ borderRadius: 20, padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Progression globale
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 800 }} className="text-gradient-emerald">
              {progress?.masteredIds.length ?? 0} / {totalWords}
            </span>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mastery}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
              className="progress-shine"
              style={{ height: '100%', borderRadius: 99 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald)' }}>{mastery.toFixed(1)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{totalWords}</span>
          </div>
        </motion.div>

        {/* Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.delay }}
                onClick={() => router.push(card.href)}
                className="glass card-depth"
                style={{
                  borderRadius: 28, padding: '2.5rem', textAlign: 'left',
                  cursor: 'pointer', border: '1px solid var(--border)',
                  background: card.bg, position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                whileHover={{ y: -4, boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 40px ${card.glowColor}22` }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glow blob */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: card.color, borderRadius: '50%', opacity: 0.1, filter: 'blur(40px)', pointerEvents: 'none' }} />

                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 18, background: card.accentBg, border: `1px solid ${card.accentBorder}`, marginBottom: '1.5rem' }}>
                  <Icon size={30} color={card.color} />
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '0.6rem' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  {card.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: card.color, fontWeight: 700, fontSize: '0.9rem' }}>
                  {card.cta} <ChevronRight size={18} />
                </div>
              </motion.button>
            );
          })}
        </div>

      </div>
    </main>
  );
}
