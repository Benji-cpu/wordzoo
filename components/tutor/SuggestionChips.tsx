'use client';

interface SuggestionChipsProps {
  options: string[];
  onSelect: (text: string) => void;
}

export function SuggestionChips({ options, onSelect }: SuggestionChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 min-w-0">
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="px-3 py-2 rounded-xl border border-card-border bg-card-surface text-sm text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer animate-slide-up min-h-[44px]"
          style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
