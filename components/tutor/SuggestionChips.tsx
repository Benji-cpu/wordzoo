'use client';

interface SuggestionChipsProps {
  options: string[];
  onSelect: (text: string) => void;
}

export function SuggestionChips({ options, onSelect }: SuggestionChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto hide-scrollbar px-4 pb-2">
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="shrink-0 px-3 py-1.5 rounded-full border border-card-border bg-card-surface text-sm text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer animate-slide-up"
          style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards', minHeight: 36 }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
