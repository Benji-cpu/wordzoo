'use client';

import { motion } from 'framer-motion';

interface SwipeIndicatorsProps {
  swipeX: number;
  threshold?: number;
}

export function SwipeIndicators({ swipeX, threshold = 80 }: SwipeIndicatorsProps) {
  const progress = Math.min(Math.abs(swipeX) / threshold, 1);
  const isRight = swipeX > 0;
  const isLeft = swipeX < 0;

  if (progress < 0.05) return null;

  return (
    <>
      {/* Got it — checkmark on left side (appears when swiping right) */}
      {isRight && (
        <motion.div
          className="absolute top-6 left-4 z-10 flex flex-col items-center gap-1 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: progress, scale: 0.5 + 0.5 * progress }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Got it</span>
        </motion.div>
      )}

      {/* Forgot — X on right side (appears when swiping left) */}
      {isLeft && (
        <motion.div
          className="absolute top-6 right-4 z-10 flex flex-col items-center gap-1 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: progress, scale: 0.5 + 0.5 * progress }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="w-14 h-14 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg shadow-red-500/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <span className="text-xs font-bold text-red-400 tracking-wider uppercase">Forgot</span>
        </motion.div>
      )}
    </>
  );
}

/** Returns a dynamic border/ring style based on swipe direction and progress */
export function getSwipeBorderStyle(swipeX: number, threshold = 80) {
  const progress = Math.min(Math.abs(swipeX) / threshold, 1);
  if (progress < 0.05) return {};

  const color = swipeX > 0
    ? `rgba(16, 185, 129, ${progress * 0.6})`   // emerald-500
    : `rgba(239, 68, 68, ${progress * 0.6})`;    // red-500

  return {
    boxShadow: `0 0 0 2px ${color}, 0 0 ${12 * progress}px ${color}`,
  };
}
