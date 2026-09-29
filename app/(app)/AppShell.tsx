'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [screenshotPromise, setScreenshotPromise] = useState<Promise<Blob | null> | null>(null);
  const [domainSnapshot, setDomainSnapshot] = useState<DomainSnapshot | null>(null);
  // Which open the running capture belongs to, so a slow one can't land in the next.
  const captureIdRef = useRef(0);

  // Start capturing recent route/click/fetch/error events on every page so
  // the trail is ready when feedback is submitted.
  useEffect(() => {
    installActivityTrail();
  }, []);

  const handleFeedbackTap = useCallback(() => {
    // Context + domain snapshot are synchronous (they read
    // window.__wordzooFeedbackContext); take them now, while page state is
    // fresh, before any nav can clear it.
    const ctx = captureFeedbackContext();
    setFeedbackContext(ctx);
    setDomainSnapshot(captureDomainSnapshot());
    setScreenshotBlob(null);

    // Open at once: the html2canvas render takes seconds on a phone, and the
    // modal (which starts dictation from a tap inside it) must not wait. The
    // sheet is portaled outside <main>, so it is not in the capture.
    setFeedbackOpen(true);

    const id = ++captureIdRef.current;
    const shot = new Promise<Blob | null>((resolve) => {
      // After a paint, so the capture's synchronous DOM clone doesn't hold up the sheet.
      requestAnimationFrame(() => {
        setTimeout(() => {
          void captureScreenshot().then(resolve, () => resolve(null));
        }, 0);
      });
    }).then((blob) => {
      if (id === captureIdRef.current) setScreenshotBlob(blob);
      return blob;
    });
    setScreenshotPromise(shot);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    captureIdRef.current += 1;
    setFeedbackOpen(false);
    setFeedbackContext(null);
    setScreenshotBlob(null);
    setScreenshotPromise(null);
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
        screenshotPromise={screenshotPromise}
        domainSnapshot={domainSnapshot}
      />
    </>
  );
}
