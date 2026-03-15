'use client';

import { motion } from 'framer-motion';

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressDots({ totalSteps, currentStep }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4 pb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isPast = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <motion.div
            key={i}
            animate={{
              width: isCurrent ? 12 : 8,
              height: isCurrent ? 12 : 8,
              backgroundColor: isPast || isCurrent ? 'rgb(241, 245, 249)' : 'rgba(255, 255, 255, 0.15)',
              opacity: isPast || isCurrent ? 1 : 0.5,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-full"
          />
        );
      })}
    </div>
  );
}
