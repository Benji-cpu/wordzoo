import { Logo } from '@/components/brand/Logo';
import { Fox } from '@/components/mascot/Fox';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="flex flex-col items-center text-center gap-6 pt-16 pb-12 px-6">
      <div className="flex items-end gap-3">
        <Logo size={64} className="rounded-2xl" />
        <Fox pose="wave" size="sm" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-xl leading-tight">
        Words that <span className="text-[color:var(--accent-indonesian)]">stick</span>, not slip
      </h1>
      <p className="max-w-md text-lg leading-8 text-text-secondary">
        WordZoo turns every new word into a vivid memory trick — so you actually
        remember it tomorrow. Learn Indonesian, Spanish, or Portuguese a few
        minutes a day.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="accent" size="lg" href="/try">
          Try It Free — no signup
        </Button>
        <Button variant="outline" size="lg" href="/login">
          Sign In
        </Button>
      </div>
    </section>
  );
}
