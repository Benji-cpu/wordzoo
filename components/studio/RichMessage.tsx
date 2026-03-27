'use client';

import { useState, useRef } from 'react';
import type { StudioVisualElement, StudioChip, StudioCard, StudioConfirmation } from '@/types/database';

interface RichMessageProps {
  elements: StudioVisualElement[];
  onSelect: (elementIndex: number, selectedIds: string[]) => void;
}

export function RichMessage({ elements, onSelect }: RichMessageProps) {
  return (
    <div className="space-y-3">
      {elements.map((element, index) => {
        if (element.type === 'chips') {
          return (
            <ChipsElement
              key={index}
              chips={element.data as StudioChip[]}
              multiSelect={element.multi_select ?? false}
              onSelect={(ids) => onSelect(index, ids)}
            />
          );
        }
        if (element.type === 'cards') {
          return (
            <CardsElement
              key={index}
              cards={element.data as StudioCard[]}
              onSelect={(id) => onSelect(index, [id])}
            />
          );
        }
        if (element.type === 'confirmation') {
          return (
            <ConfirmationElement
              key={index}
              confirmation={element.data as StudioConfirmation}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

// --- Chips ---

interface ChipsElementProps {
  chips: StudioChip[];
  multiSelect: boolean;
  onSelect: (ids: string[]) => void;
}

function ChipsElement({ chips, multiSelect, onSelect }: ChipsElementProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const pre = new Set<string>();
    chips.forEach((c) => { if (c.selected) pre.add(c.id); });
    return pre;
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChipToggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiSelect) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        next.clear();
        next.add(id);
      }

      // Debounce auto-send
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSelect(Array.from(next));
      }, multiSelect ? 500 : 0);

      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => handleChipToggle(chip.id)}
          className={`px-3 py-2 rounded-full text-sm border transition-all ${
            selected.has(chip.id)
              ? 'border-accent-default bg-accent-default/10 text-accent-default'
              : 'border-card-border bg-card-surface text-foreground hover:border-accent-default/50'
          }`}
        >
          {chip.emoji && <span className="mr-1">{chip.emoji}</span>}
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// --- Cards ---

interface CardsElementProps {
  cards: StudioCard[];
  onSelect: (id: string) => void;
}

function CardsElement({ cards, onSelect }: CardsElementProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(() => {
    return cards.find((c) => c.selected)?.id ?? null;
  });

  function handleCardSelect(id: string) {
    setSelectedCard(id);
    onSelect(id);
  }

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => handleCardSelect(card.id)}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCard === card.id
              ? 'border-accent-default bg-accent-default/10'
              : 'border-card-border bg-card-surface hover:border-accent-default/50'
          }`}
        >
          <p className="text-sm font-medium text-foreground">{card.title}</p>
          <p className="text-xs text-text-secondary mt-1">{card.description}</p>
        </button>
      ))}
    </div>
  );
}

// --- Confirmation ---

interface ConfirmationElementProps {
  confirmation: StudioConfirmation;
}

function ConfirmationElement({ confirmation }: ConfirmationElementProps) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-card-surface border border-card-border">
      <h4 className="text-sm font-medium text-foreground mb-2">{confirmation.title}</h4>
      {Object.entries(confirmation.summary).map(([key, value]) => (
        <div key={key} className="flex justify-between text-sm py-1">
          <span className="text-text-secondary">{key}</span>
          <span className="text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}
