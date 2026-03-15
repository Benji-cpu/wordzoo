'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ModeSelectorProps {
  onSelect: (mode: string, scenario?: string) => void;
  disabled?: boolean;
}

const MODES = [
  {
    id: 'free_chat',
    label: 'Free Chat',
    description: 'Open conversation on any topic',
    icon: '💬',
  },
  {
    id: 'role_play',
    label: 'Role Play',
    description: 'Practice real-world scenarios',
    icon: '🎭',
    hasScenario: true,
  },
  {
    id: 'word_review',
    label: 'Word Review',
    description: 'Practice vocabulary in context',
    icon: '📝',
  },
  {
    id: 'grammar_glimpse',
    label: 'Grammar',
    description: 'Learn grammar through conversation',
    icon: '📐',
  },
  {
    id: 'pronunciation_coach',
    label: 'Pronunciation',
    description: 'Improve your pronunciation',
    icon: '🗣️',
  },
];

export function ModeSelector({ onSelect, disabled }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [scenario, setScenario] = useState('');

  const selected = MODES.find((m) => m.id === selectedMode);
  const showScenarioInput = selected?.hasScenario;

  function handleStart() {
    if (!selectedMode) return;
    onSelect(selectedMode, showScenarioInput ? scenario || undefined : undefined);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Choose a mode</h2>
      <div className="grid grid-cols-2 gap-3">
        {MODES.map((mode, i) => (
          <Card
            key={mode.id}
            className={`text-center transition-all ${
              i === MODES.length - 1 && MODES.length % 2 !== 0 ? 'col-span-2' : ''
            } ${
              selectedMode === mode.id
                ? 'ring-2 ring-accent-default'
                : ''
            }`}
            onClick={() => setSelectedMode(mode.id)}
          >
            <div className="text-2xl mb-1">{mode.icon}</div>
            <div className="font-medium text-sm text-foreground">{mode.label}</div>
            <div className="text-xs text-text-secondary mt-0.5">{mode.description}</div>
          </Card>
        ))}
      </div>

      {showScenarioInput && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Describe the scenario
          </label>
          <input
            type="text"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g. Ordering food at a restaurant"
            className="w-full px-4 py-3 rounded-xl bg-card-surface border border-card-border text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-default"
          />
        </div>
      )}

      <Button
        onClick={handleStart}
        disabled={!selectedMode || disabled}
        className="w-full"
      >
        {disabled ? 'Starting...' : 'Start Session'}
      </Button>
    </div>
  );
}
