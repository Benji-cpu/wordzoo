import Link from 'next/link';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { gateBody, gateHeadline, practiseLabel } from '@/lib/pedagogy/gate';

interface GateNoticeProps {
  sceneId: string;
  sceneTitle: string;
  fragileDue: number;
}

/**
 * Rendered in place of a NEW scene while too many recent items are still
 * fragile. Soft on purpose: "Start the scene anyway" is always one tap, and
 * once the scene is started the gate never shows for it again.
 */
export function GateNotice({ sceneId, sceneTitle, fragileDue }: GateNoticeProps) {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-3 py-2">
      <EmptyStateCard
        foxPose="proud"
        title={gateHeadline()}
        subtitle={gateBody(fragileDue)}
        primary={{ label: `${practiseLabel(fragileDue)} →`, href: '/review' }}
      />
      <p className="text-center text-[12px] text-[color:var(--text-secondary)] font-semibold">
        Up next: {sceneTitle}
      </p>
      <Link
        href={`/learn/${sceneId}?anyway=1`}
        className="block text-center text-[12.5px] font-semibold text-[color:var(--text-secondary)] underline underline-offset-2 hover:text-[color:var(--foreground)] transition-colors py-2"
      >
        Start the scene anyway
      </Link>
    </div>
  );
}
