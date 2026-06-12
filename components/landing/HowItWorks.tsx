import { Card } from '@/components/ui/Card';

const STEPS = [
  {
    emoji: '🗺️',
    title: 'Discover',
    body: 'Learn words inside real-life scenes — ordering coffee, finding your hotel, making friends — not random flashcard lists.',
  },
  {
    emoji: '💬',
    title: 'Practice',
    body: 'Chat with an AI tutor that adapts to your level, drills you on what you just learned, and speaks your target language.',
  },
  {
    emoji: '🔁',
    title: 'Review',
    body: 'Spaced repetition brings each word back right before you forget it, until it sticks for good.',
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-12 max-w-3xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-foreground text-center mb-8">
        A learning loop, not a word list
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step, i) => (
          <Card key={step.title}>
            <div className="text-3xl mb-3">{step.emoji}</div>
            <h3 className="font-bold text-foreground mb-1">
              <span className="text-[color:var(--text-secondary)] mr-1.5">{i + 1}.</span>
              {step.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{step.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
