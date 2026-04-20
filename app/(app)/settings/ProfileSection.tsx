import { Card } from '@/components/ui/Card';
import { getUserProfile } from '@/lib/db/queries';

export async function ProfileSection({ userId }: { userId: string }) {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Profile
      </h2>
      <Card>
        <div className="flex items-center gap-3">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="w-12 h-12 rounded-full border border-card-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-surface-inset flex items-center justify-center text-lg text-text-secondary">
              {profile.email[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{profile.name ?? profile.email}</p>
            <p className="text-xs text-text-secondary truncate">{profile.email}</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
