'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CustomPathInputProps {
  onSubmit: (topic: string) => void;
}

export function CustomPathInput({ onSubmit }: CustomPathInputProps) {
  const [topic, setTopic] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setIsOpen(true)}>
        + Create Custom Path
      </Button>
    );
  }

  return (
    <Card className="animate-slide-up">
      <h3 className="text-base font-medium text-foreground mb-2">
        What do you want to learn about?
      </h3>
      <p className="text-sm text-text-secondary mb-3">
        e.g. &ldquo;surfing vocabulary&rdquo; or &ldquo;ordering coffee&rdquo;
      </p>
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter a topic..."
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-card-border text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent-id/50 transition-colors mb-3"
        maxLength={200}
        autoFocus
      />
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (topic.trim()) {
              onSubmit(topic.trim());
              setTopic('');
              setIsOpen(false);
            }
          }}
          disabled={!topic.trim()}
          className="flex-1"
        >
          Create Path
        </Button>
      </div>
    </Card>
  );
}
