'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThumbButton } from '@/components/ui/ThumbButton';
import type { FeedbackContext } from '@/lib/utils/capture-feedback-context';
import { getActivityTrail } from '@/lib/feedback/activity-trail';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: FeedbackContext | null;
  screenshotBlob: Blob | null;
}

type ModalState = 'idle' | 'sending' | 'success' | 'error';

const DRAFT_KEY = 'feedback_draft';

export function FeedbackModal({ isOpen, onClose, context, screenshotBlob }: FeedbackModalProps) {
  const [message, setMessage] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(DRAFT_KEY) ?? '';
  });
  const [state, setState] = useState<ModalState>('idle');
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Restore draft when opening
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft && !message) setMessage(draft);
      const t = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss after success
  useEffect(() => {
    if (state === 'success') {
      const t = setTimeout(() => {
        setState('idle');
        onClose();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state, onClose]);

  function handleClose() {
    if (message.trim()) {
      sessionStorage.setItem(DRAFT_KEY, message);
    }
    setState('idle');
    onClose();
  }

  function clearDraft() {
    setMessage('');
    sessionStorage.removeItem(DRAFT_KEY);
  }

  async function handleSubmit() {
    if (!message.trim() || !context) return;

    // Optimistic UX: the user doesn't need to watch the upload. Snapshot
    // the payload, clear the draft, flash a success, and close — then do the
    // network work in the background. If it fails we stash the draft back
    // into sessionStorage so they don't lose it.
    const payload = {
      message: message.trim(),
      pageUrl: context.pageUrl,
      pageTitle: context.pageTitle,
      routeParams: context.routeParams,
      viewportWidth: context.viewportWidth,
      viewportHeight: context.viewportHeight,
      userAgent: context.userAgent,
      activityTrail: getActivityTrail(),
    };
    const blob = screenshotBlob;
    clearDraft();
    setState('success');

    void (async () => {
      try {
        let screenshotUrl: string | undefined;
        if (blob) {
          const formData = new FormData();
          formData.append('screenshot', blob, 'screenshot.jpg');
          const uploadRes = await fetch('/api/feedback/screenshot', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            screenshotUrl = uploadData.data?.url;
          }
        }

        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, screenshotUrl }),
        });
        if (!res.ok) throw new Error('Failed to submit');
      } catch {
        // Background failure: restore draft so user can retry.
        sessionStorage.setItem(DRAFT_KEY, payload.message);
      }
    })();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="feedback-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 9998 }}
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="feedback-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) handleClose();
            }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl border-t border-card-border shadow-2xl max-w-lg mx-auto"
            style={{ zIndex: 9999 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-card-border" />
            </div>

            <div className="px-5 pb-8 pt-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}>
              {state === 'success' ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <span className="text-3xl">&#10003;</span>
                  <p className="text-foreground font-medium">Thanks for your feedback!</p>
                </div>
              ) : (
                <>
                  {/* Context summary */}
                  {context && (
                    <p className="text-xs text-text-secondary mb-3 truncate">
                      <span className="opacity-70">Page:</span> {context.contextSummary}
                      {screenshotBlob && (
                        <span className="ml-2 opacity-70">&#183; screenshot captured</span>
                      )}
                    </p>
                  )}

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 8000))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        if (message.trim()) handleSubmit();
                      }
                    }}
                    placeholder="What's on your mind? Bug report, suggestion, content issue... (Enter to send, Shift+Enter for newline)"
                    className="w-full h-28 p-3 rounded-xl bg-surface-inset border border-card-border text-foreground placeholder:text-text-secondary/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-id/40"
                    disabled={state === 'sending'}
                  />

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-secondary">
                      {message.length}/8000
                    </span>

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg"
                        disabled={state === 'sending'}
                      >
                        Cancel
                      </button>
                      <ThumbButton
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        loading={state === 'sending'}
                        size="md"
                        variant="primary"
                        fullWidth={false}
                        haptic="success"
                        sound="reveal"
                        className="min-h-0 h-11 px-5"
                      >
                        {state === 'error' ? 'Retry' : 'Send'}
                      </ThumbButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
