import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mascot } from './UI';
import { useTheme } from '../services/theme';

interface WelcomeProps {
  onComplete: () => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Wait a bit before finishing
          return 100;
        }
        return prev + 2; // Adjust speed here
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-main)] transition-colors duration-500">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8 relative">
           <motion.div
             animate={{ y: [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 2 }}
           >
             <Mascot mood="excited" size="lg" />
           </motion.div>
           {/* Decorative elements based on theme */}
           {theme === 'doodle' && (
             <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-200/50 rounded-full blur-xl"></div>
           )}
           {theme === 'cyber' && (
             <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
           )}
        </div>

        <h1 className="text-4xl font-bold font-handwriting text-[var(--text-heading)] mb-2">
          AI Study Buddy
        </h1>
        <p className="text-[var(--text-main)] font-handwriting opacity-80 mb-8">
          เพื่อนคู่คิด ติววิชา พกพาไปได้ทุกที่ 🚀
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-4 bg-[var(--color-surface)] rounded-full overflow-hidden border-2 border-[var(--border-color)]/20 mx-auto relative">
          <motion.div
            className="h-full bg-[var(--color-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-bold font-handwriting text-[var(--color-primary)]">
          Loading... {progress}%
        </p>
      </motion.div>
    </div>
  );
}
