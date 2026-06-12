import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function PricingTeaser() {
  return (
    <section className="px-6 py-12 max-w-lg mx-auto w-full">
      <Card className="text-center">
        <h2 className="text-xl font-bold text-foreground mb-1">Free forever</h2>
        <p className="text-sm text-text-secondary mb-4">
          Learn 5 new words every day at no cost. Go Premium for unlimited
          words, unlimited tutor chat, and custom learning paths —{' '}
          <span className="font-bold text-foreground">$9.99/mo</span> or{' '}
          <span className="font-bold text-foreground">$79.99/yr</span>.
        </p>
        <Link
          href="/pricing"
          className="text-sm font-extrabold text-[color:var(--accent-indonesian)] hover:underline"
        >
          Compare plans →
        </Link>
      </Card>
      <div className="text-center mt-10">
        <Button variant="accent" size="lg" href="/try">
          Start learning now
        </Button>
        <p className="text-xs text-text-secondary mt-3">
          No account needed — learn your first 3 words in two minutes.
        </p>
      </div>
    </section>
  );
}
