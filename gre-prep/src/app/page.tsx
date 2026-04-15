'use client';

import { useEffect, useState } from 'react';
import { Word } from '@/types';
import { useGameLoop } from '@/hooks/useGameLoop';
import { Dashboard } from '@/components/Dashboard';
import { GameCard } from '@/components/GameCard';
import { Brain, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
         <h1 className="text-3xl font-bold text-rose-500 mb-4">Error loading data</h1>
         <p className="text-neutral-500">Could not load the vocabulary words. Please make sure words.json is in the public directory.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-8 md:pt-16 px-4 md:px-8 max-w-6xl mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 md:mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
              GRE Mastery
            </h1>
            <p className="text-sm font-medium text-neutral-500 tracking-wide uppercase">Vocabulary Builder</p>
          </div>
        </div>
        
        {progress && (
           <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
               {queueSize} <span className="font-medium text-neutral-400">in queue</span>
             </span>
           </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col pt-4">
        {progress ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
             className="w-full flex-1 flex flex-col"
           >
              <Dashboard progress={progress} totalWords={words.length} />
              <GameCard 
                state={state} 
                onAnswer={handleAnswer} 
                onNextTurn={nextTurn}
                onFlip={flipCard} 
              />
           </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}
      </div>
    </main>
  );
}
