import { UserProgress } from '../types';
import { Target, Zap, LayoutList, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  progress: UserProgress;
  totalWords: number;
}

export function Dashboard({ progress, totalWords }: DashboardProps) {
  const masteryPercentage = totalWords > 0 ? (progress.masteredIds.length / totalWords) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Mastery */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl mb-3">
            <Trophy size={24} />
          </div>
          <div className="text-3xl font-black text-neutral-800 dark:text-neutral-100">{progress.masteredIds.length}</div>
          <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1">Mastered / {totalWords}</div>
        </motion.div>

        {/* To Review */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-2xl mb-3">
            <Target size={24} />
          </div>
          <div className="text-3xl font-black text-neutral-800 dark:text-neutral-100">{progress.reviewIds.length}</div>
          <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1">To Review</div>
        </motion.div>

        {/* Seen */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-2xl mb-3">
            <LayoutList size={24} />
          </div>
          <div className="text-3xl font-black text-neutral-800 dark:text-neutral-100">{progress.totalSeen}</div>
          <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1">Times Played</div>
        </motion.div>

        {/* Score */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 opacity-5 bg-amber-500 rounded-full w-24 h-24 blur-xl"></div>
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-3 rounded-2xl mb-3 relative z-10">
            <Zap size={24} />
          </div>
          <div className="text-3xl font-black text-neutral-800 dark:text-neutral-100 relative z-10">{progress.sessionScore}</div>
          <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1 relative z-10">Score</div>
        </motion.div>

      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-neutral-500">Progress to 1000</span>
          <span className="text-emerald-600 dark:text-emerald-400">{masteryPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-4 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${masteryPercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
