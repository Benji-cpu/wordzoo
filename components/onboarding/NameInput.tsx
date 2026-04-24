'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface NameInputProps {
  onSubmit: (name: string) => void;
}

export default function NameInput({ onSubmit }: NameInputProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    onSubmit(name.trim());
  };

  return (
    <div className="flex flex-col items-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-2"
      >
        What should we call you?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary text-center mb-8"
      >
        So we can personalise your experience.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Your first name"
          autoFocus
          className="w-full rounded-[16px] border border-[color:var(--border-default)] bg-[color:var(--card-surface)] px-4 py-3 text-lg font-bold text-[color:var(--foreground)] placeholder:text-[color:var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--nav-active)]"
        />
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-[16px] bg-[color:var(--accent-indonesian)] text-white text-lg font-extrabold tracking-wide shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_30%,transparent)] active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
