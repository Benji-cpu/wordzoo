import ContinueBanner from '@/components/onboarding/ContinueBanner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Hero } from '@/components/landing/Hero';
import { MnemonicShowcase } from '@/components/landing/MnemonicShowcase';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingTeaser } from '@/components/landing/PricingTeaser';

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-col items-center pb-20">
        <ContinueBanner />
        <Hero />
        <MnemonicShowcase />
        <HowItWorks />
        <PricingTeaser />
      </main>
    </div>
  );
}
