'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { FeedbackContext } from '@/lib/utils/capture-feedback-context';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: FeedbackContext | null;
  screenshotBlob: Blob | null;
}

type ModalState = 'idle' | 'sending' | 'success' | 'error';

export function FeedbackModal({ isOpen, onClose, context, screenshotBlob }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ModalState>('idle');
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-dismiss after success
  useEffect(() => {
    if (state === 'success') {
      const t = setTimeout(() => {
        handleClose();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state]);

  function handleClose() {
    setMessage('');
    setState('idle');
    onClose();
  }

  async function handleSubmit() {
    if (!message.trim() || !context) return;
    setState('sending');

    try {
      // Upload screenshot if available
      let screenshotUrl: string | undefined;
      if (screenshotBlob) {
        const formData = new FormData();
        formData.append('screenshot', screenshotBlob, 'screenshot.jpg');
        const uploadRes = await fetch('/api/feedback/screenshot', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          screenshotUrl = uploadData.data?.url;
        }
      }

      // Submit feedback
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          pageUrl: context.pageUrl,
          pageTitle: context.pageTitle,
          routeParams: context.routeParams,
          screenshotUrl,
          viewportWidth: context.viewportWidth,
          viewportHeight: context.viewportHeight,
          userAgent: context.userAgent,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setState('success');
    } catch {
      setState('error');
    }
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

            <div className="px-5 pb-6 safe-area-bottom">
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
                    onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                    placeholder="What's on your mind? Bug report, suggestion, content issue..."
                    className="w-full h-28 p-3 rounded-xl bg-surface-inset border border-card-border text-foreground placeholder:text-text-secondary/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-id/40"
                    disabled={state === 'sending'}
                  />

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-secondary">
                      {message.length}/1000
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg"
                        disabled={state === 'sending'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!message.trim() || state === 'sending'}
                        className="px-5 py-2 text-sm font-medium rounded-xl bg-accent-id text-white hover:bg-accent-id/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {state === 'sending' ? 'Sending...' : state === 'error' ? 'Retry' : 'Send'}
                      </button>
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
