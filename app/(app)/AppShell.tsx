'use client';

import { useState, useCallback } from 'react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { captureFeedbackContext, type FeedbackContext } from '@/lib/utils/capture-feedback-context';
import { captureScreenshot } from '@/lib/utils/capture-screenshot';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);

  const handleFeedbackTap = useCallback(async () => {
    // Capture context + screenshot BEFORE opening modal
    const ctx = captureFeedbackContext();
    setFeedbackContext(ctx);

    // Capture screenshot silently (don't block modal opening)
    const blob = await captureScreenshot();
    setScreenshotBlob(blob);

    setFeedbackOpen(true);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setFeedbackOpen(false);
    setFeedbackContext(null);
    setScreenshotBlob(null);
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
      />
    </>
  );
}
