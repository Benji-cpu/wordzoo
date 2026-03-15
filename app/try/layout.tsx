import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WordZoo - Try It',
  description: 'Learn your first words in 60 seconds — no signup required.',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
