import { UserProgress } from '../types';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, BookOpen } from 'lucide-react';

interface DashboardProps {
  progress: UserProgress;
  totalWords: number;
  streak: number;
}

const stats = [
  {
    key: 'mastered' as const,
    label: 'Mastered',
    icon: Trophy,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
  },
  {
    key: 'review' as const,
    label: 'To Review',
    icon: Target,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.2)',
  },
  {
    key: 'streak' as const,
    label: 'Streak',
    icon: Zap,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    key: 'score' as const,
    label: 'Score',
    icon: BookOpen,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
  },
];

export function Dashboard({ progress, totalWords, streak }: DashboardProps) {
  const mastery = totalWords > 0 ? (progress.masteredIds.length / totalWords) * 100 : 0;

  const values: Record<string, number> = {
    mastered: progress.masteredIds.length,
    review: progress.reviewIds.length,
    streak,
    score: progress.sessionScore,
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 2rem' }}>

      {/* Stats row */}
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
                borderRadius: 20,
                padding: '1.25rem',
                background: stat.bg,
                borderColor: stat.border,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow bg */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80,
                background: stat.color,
                borderRadius: '50%',
                opacity: 0.07,
                filter: 'blur(20px)',
              }} />
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 12,
                background: stat.bg, border: `1px solid ${stat.border}`,
                marginBottom: '0.75rem',
              }}>
                <Icon size={20} color={stat.color} />
              </div>
              <div style={{
                fontSize: '1.875rem', fontWeight: 900,
                color: stat.color, lineHeight: 1,
                marginBottom: '0.25rem',
              }}>
                {values[stat.key].toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass card-depth"
        style={{ borderRadius: 20, padding: '1.25rem 1.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Path to mastery
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 800 }} className="text-gradient-emerald">
            {progress.masteredIds.length} / {totalWords}
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
    </div>
  );
}
