'use client';

import { Word, GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lightbulb, Type, Eye, ArrowRight, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface GameCardProps {
  state: GameState;
  onAnswer: (answer: string | boolean) => void;
  onNextTurn: () => void;
  onFlip: () => void;
}

export function GameCard({ state, onAnswer, onNextTurn, onFlip }: GameCardProps) {
  const { currentWord, mode, answered, isCorrect, options, flipped } = state;
  const [inputValue, setInputValue] = useState('');
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showFrench, setShowFrench] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset reveal state when word changes
  useEffect(() => {
    setShowSynonyms(false);
    setShowFrench(false);
  }, [currentWord]);

  useEffect(() => {
    setInputValue('');
    if (mode === 'typing' && !answered) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentWord, mode, answered]);

  if (!currentWord) return null;

  const handleSubmitTyping = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAnswer(inputValue);
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'mcq': return 'Choix multiple';
      case 'typing': return 'Frappe';
      case 'flashcard': return 'Flashcard';
      default: return '';
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id + mode}
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, filter: 'blur(5px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass card-depth"
          style={{ borderRadius: 32, overflow: 'hidden', position: 'relative' }}
        >
          {/* Accent glow on top edge */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />

          {/* Header Area */}
          <div style={{ padding: '2.5rem 2.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--emerald)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} className="pulse-dot">
                <Lightbulb size={16} />
                <span>Définition</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: 99, border: '1px solid var(--border)' }}>
                {getModeLabel()}
              </div>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '2rem' }}>
              {currentWord.definition}
            </h2>

            {/* Synonyms & Translation — blur reveal */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>

              {/* Synonyms */}
              {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                <div style={{ flex: '1 1 200px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 20, padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ color: 'var(--violet)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Synonymes
                    </div>
                    <AnimatePresence>
                      {!showSynonyms && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setShowSynonyms(true)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                            borderRadius: 99, padding: '0.2rem 0.65rem', cursor: 'pointer',
                            color: 'var(--violet)', fontSize: '0.72rem', fontWeight: 700,
                          }}
                        >
                          <Eye size={12} /> Voir
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                    filter: showSynonyms ? 'none' : 'blur(7px)',
                    transition: 'filter 0.35s ease',
                    userSelect: showSynonyms ? 'auto' : 'none',
                    pointerEvents: showSynonyms ? 'auto' : 'none',
                  }}>
                    {currentWord.synonyms.slice(0, 4).map((syn, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 500, color: '#d1d5db' }}>
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* French translation */}
              <div style={{ flex: '1 1 200px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 20, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ color: 'var(--amber)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Français
                  </div>
                  <AnimatePresence>
                    {!showFrench && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setShowFrench(true)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                          borderRadius: 99, padding: '0.2rem 0.65rem', cursor: 'pointer',
                          color: 'var(--amber)', fontSize: '0.72rem', fontWeight: 700,
                        }}
                      >
                        <Eye size={12} /> Voir
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{
                  fontSize: '1rem', fontWeight: 600, color: '#fcd34d',
                  filter: showFrench ? 'none' : 'blur(7px)',
                  transition: 'filter 0.35s ease',
                  userSelect: showFrench ? 'auto' : 'none',
                  pointerEvents: showFrench ? 'auto' : 'none',
                }}>
                  {currentWord.french}
                </div>
              </div>
            </div>
          </div>

          {/* Interaction Area */}
          <div style={{ padding: '2.5rem', background: 'rgba(0,0,0,0.2)' }}>

            {/* Multiple Choice Mode */}
            {mode === 'mcq' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {options.map((option, i) => {
                  let className = "glass-hover answer-neutral";

                  if (answered) {
                    if (option.id === currentWord.id) {
                      className = "answer-correct glow-emerald";
                    } else if (isCorrect === false) {
                      className = "answer-neutral";
                    }
                  }

                  return (
                    <button
                      key={option.id + i}
                      disabled={answered}
                      onClick={() => onAnswer(option.word)}
                      className={className}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 20,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: answered && option.id !== currentWord.id ? 'var(--text-muted)' : '#fff',
                        cursor: answered ? 'default' : 'pointer',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        opacity: answered && option.id !== currentWord.id ? 0.5 : 1
                      }}
                    >
                      {option.word}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Typing Mode */}
            {mode === 'typing' && (
              <form onSubmit={handleSubmitTyping} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '1.25rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <Type size={20} color="var(--text-muted)" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={answered}
                    placeholder="Tape le mot..."
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.03)',
                      border: '2px solid',
                      borderColor: answered ? (isCorrect ? 'var(--emerald)' : 'var(--rose)') : 'var(--border)',
                      color: '#fff',
                      borderRadius: 20,
                      outline: 'none',
                      transition: 'all 0.3s',
                      boxShadow: answered && isCorrect ? '0 0 20px rgba(16,185,129,0.2)' : 'none'
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>

                {answered && !isCorrect && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert color="var(--emerald)" size={24} />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)' }}>Bonne réponse</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{currentWord.word}</div>
                    </div>
                  </motion.div>
                )}

                {!answered && (
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    style={{
                      marginTop: '1.5rem', width: '100%', padding: '1.25rem',
                      background: inputValue.trim() ? '#fff' : 'rgba(255,255,255,0.05)',
                      color: inputValue.trim() ? '#000' : 'var(--text-muted)',
                      fontWeight: 800, fontSize: '1rem', borderRadius: 20,
                      border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s'
                    }}
                  >
                    Valider
                  </button>
                )}
              </form>
            )}

            {/* Flashcard Mode */}
            {mode === 'flashcard' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                {!flipped ? (
                  <button
                    onClick={onFlip}
                    className="glass-hover"
                    style={{
                      width: '100%', maxWidth: 300, height: 160,
                      background: 'rgba(255,255,255,0.02)',
                      border: '2px dashed rgba(255,255,255,0.1)',
                      borderRadius: 32,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--emerald)';
                      e.currentTarget.style.color = 'var(--emerald)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <HelpCircle size={32} />
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Révéler le mot</span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', textAlign: 'center' }}>
                    <div className="text-gradient-hero" style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>
                      {currentWord.word}
                    </div>
                    {!answered && (
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => onAnswer(false)}
                          style={{
                            padding: '1.25rem 2rem', borderRadius: 20, fontSize: '1.1rem', fontWeight: 700,
                            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af',
                            cursor: 'pointer', transition: 'all 0.2s', flex: 1, maxWidth: 200
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                        >
                          Je savais pas
                        </button>
                        <button
                          onClick={() => onAnswer(true)}
                          className="glow-emerald"
                          style={{
                            padding: '1.25rem 2rem', borderRadius: 20, fontSize: '1.1rem', fontWeight: 700,
                            background: 'var(--emerald)', border: 'none', color: '#000',
                            cursor: 'pointer', transition: 'all 0.2s', flex: 1, maxWidth: 200
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          Je savais !
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Next Button */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}
              >
                <button
                  onClick={onNextTurn}
                  autoFocus
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: '#fff', color: '#000', padding: '1rem 2rem',
                    borderRadius: 99, fontSize: '1.1rem', fontWeight: 800, border: 'none',
                    cursor: 'pointer', transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
                >
                  Continuer
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
