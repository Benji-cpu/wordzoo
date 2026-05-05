'use client';

import { useState, useCallback, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { captureFeedbackContext, type FeedbackContext } from '@/lib/utils/capture-feedback-context';
import { captureScreenshot } from '@/lib/utils/capture-screenshot';
import { installActivityTrail } from '@/lib/feedback/activity-trail';
import { captureDomainSnapshot, type DomainSnapshot } from '@/lib/feedback/domain-snapshot';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [domainSnapshot, setDomainSnapshot] = useState<DomainSnapshot | null>(null);

  // Start capturing recent route/click/fetch/error events on every page so
  // the trail is ready when feedback is submitted.
  useEffect(() => {
    installActivityTrail();
  }, []);

  const handleFeedbackTap = useCallback(async () => {
    // Capture context + domain snapshot + screenshot BEFORE opening modal.
    // Domain snapshot is synchronous (reads window.__wordzooFeedbackContext);
    // capture it now while page state is fresh, before any nav can clear it.
    const ctx = captureFeedbackContext();
    setFeedbackContext(ctx);
    setDomainSnapshot(captureDomainSnapshot());

    const blob = await captureScreenshot();
    setScreenshotBlob(blob);

    setFeedbackOpen(true);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setFeedbackOpen(false);
    setFeedbackContext(null);
    setScreenshotBlob(null);
    setDomainSnapshot(null);
  }, []);

  return (
    <>
      <div className="flex-1 flex min-h-0">
        <SideNav onFeedbackTap={handleFeedbackTap} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-8">{children}</main>
      </div>
      <BottomNav onFeedbackTap={handleFeedbackTap} />
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={handleFeedbackClose}
        context={feedbackContext}
        screenshotBlob={screenshotBlob}
        domainSnapshot={domainSnapshot}
      />
    </>
  );
}
