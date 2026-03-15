import { SubscriptionSection } from './SubscriptionSection';

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account and subscription
        </p>
      </div>

      <SubscriptionSection />

      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Preferences
        </h2>
        <p className="text-sm text-text-secondary">
          User preferences and account settings will appear here.
        </p>
      </section>
    </div>
  );
}
