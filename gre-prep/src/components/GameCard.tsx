import { Word, GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lightbulb, Type, HelpCircle } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id + mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-100 dark:border-neutral-800"
        >
          {/* Card Header (Hints) */}
          <div className="p-8 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3 text-emerald-500 mb-4 font-medium uppercase tracking-wider text-sm">
              <Lightbulb size={20} />
              <span>Definition</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 leading-tight">
              {currentWord.definition}
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-2">
               {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                <div className="flex-1 bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4">
                  <div className="text-violet-600 dark:text-violet-400 text-xs font-bold uppercase mb-2">Synonyms</div>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.synonyms.map((syn, i) => (
                      <span key={i} className="bg-white dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-violet-100 dark:border-violet-800/50">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
               )}
               <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4">
                  <div className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase mb-2">Français</div>
                  <div className="text-amber-800 dark:text-amber-200 font-medium">{currentWord.french}</div>
               </div>
            </div>
          </div>

          {/* Interaction Area */}
          <div className="p-8 bg-neutral-50 dark:bg-neutral-950/50">
            {/* Multiple Choice Mode */}
            {mode === 'mcq' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map((option, i) => {
                  let btnClass = "relative overflow-hidden group bg-white dark:bg-neutral-800 border-2 rounded-2xl p-4 text-center font-bold text-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20";
                  let isSelectedCorrect = false;
                  let isSelectedWrong = false;

                  if (!answered) {
                    btnClass += " border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md hover:-translate-y-1";
                  } else {
                    if (option.id === currentWord.id) {
                      isSelectedCorrect = true;
                      btnClass += " border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400";
                    } else if (isCorrect === false) {
                       // We don't know exactly which they clicked without tracking, but we highlight all wrong as faded, correct as brilliant
                       btnClass += " border-neutral-200 dark:border-neutral-700 opacity-50 dark:opacity-40 text-neutral-400";
                    } else {
                       btnClass += " border-neutral-200 dark:border-neutral-700 opacity-50 dark:opacity-40 text-neutral-400";
                    }
                  }

                  return (
                    <button
                      key={option.id + i}
                      disabled={answered}
                      onClick={() => onAnswer(option.word)}
                      className={btnClass}
                    >
                      {option.word}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Typing Mode */}
            {mode === 'typing' && (
              <form onSubmit={handleSubmitTyping} className="w-full max-w-md mx-auto">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Type className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={answered}
                      placeholder="Type the English word..."
                      className={`w-full pl-12 pr-4 py-4 text-xl font-bold bg-white dark:bg-neutral-800 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all ${
                        !answered 
                          ? 'border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-400 text-neutral-800 dark:text-neutral-100'
                          : isCorrect
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20'
                      }`}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                 </div>
                 {answered && !isCorrect && (
                   <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                     <ShieldAlert className="text-emerald-500 shrink-0" />
                     <div>
                       <div className="text-sm text-emerald-600 font-medium">Correct answer:</div>
                       <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{currentWord.word}</div>
                     </div>
                   </div>
                 )}
                 {!answered && (
                   <button type="submit" disabled={!inputValue.trim()} className="mt-4 w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                     Check Answer
                   </button>
                 )}
              </form>
            )}

            {/* Flashcard Mode */}
            {mode === 'flashcard' && (
              <div className="flex flex-col items-center justify-center">
                {!flipped ? (
                  <button 
                    onClick={onFlip}
                    className="w-full max-w-xs h-32 bg-white dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl flex flex-col items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer"
                  >
                    <HelpCircle size={32} />
                    <span className="font-medium">Reveal Word</span>
                  </button>
                ) : (
                  <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="text-5xl font-black text-neutral-800 dark:text-neutral-100 mb-8 tracking-tight">
                      {currentWord.word}
                    </div>
                    {!answered && (
                      <div className="w-full grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => onAnswer(false)}
                          className="bg-white dark:bg-neutral-800 border-2 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 py-4 rounded-2xl font-bold text-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          I didn't know it
                        </button>
                        <button 
                          onClick={() => onAnswer(true)}
                          className="bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-50 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1"
                        >
                          I knew it!
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Next Button Overlay */}
            {answered && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-end"
              >
                <button
                  onClick={onNextTurn}
                  autoFocus
                  className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  Continuar →
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
