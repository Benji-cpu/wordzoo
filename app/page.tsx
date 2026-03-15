import ContinueBanner from '@/components/onboarding/ContinueBanner';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <ContinueBanner />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">
            WordZoo
          </h1>
          <p className="max-w-md text-lg leading-8 text-text-secondary">
            Learn languages with memorable mnemonics. Try it now — no signup required.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button variant="inverse" href="/try">Try It Free</Button>
          <Button variant="outline" href="/login">Sign In</Button>
        </div>
      </main>
    </div>
  );
}
