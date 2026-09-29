'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThumbButton } from '@/components/ui/ThumbButton';
import type { FeedbackContext } from '@/lib/utils/capture-feedback-context';
import { getActivityTrail } from '@/lib/feedback/activity-trail';
import { useSpeechInput } from '@/lib/hooks/useSpeechInput';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: FeedbackContext | null;
  screenshotBlob: Blob | null;
  /** The capture still in flight; Send waits for it up to SCREENSHOT_WAIT_MS. */
  screenshotPromise?: Promise<Blob | null> | null;
  domainSnapshot: unknown | null;
}

type ModalState = 'idle' | 'sending' | 'success' | 'error';

const DRAFT_KEY = 'feedback_draft';
const FIRST_SEND_KEY = 'feedback_first_send_done';
const SCREENSHOT_WAIT_MS = 2000;

/** Append dictated words to what is already there, with one space between. */
function appendText(base: string, addition: string): string {
  const add = addition.trimStart();
  if (!add) return base;
  const sep = base && !/\s$/.test(base) ? ' ' : '';
  return (base + sep + add).slice(0, 8000);
}

export function FeedbackModal({ isOpen, onClose, context, screenshotBlob, screenshotPromise, domainSnapshot }: FeedbackModalProps) {
  const [message, setMessage] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(DRAFT_KEY) ?? '';
  });
  const [website, setWebsite] = useState(''); // honeypot — bots fill this, humans never see it
  const [state, setState] = useState<ModalState>('idle');
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice feedback: dictation starts only from the Speak button (a tap), since
  // mobile browsers refuse the mic outside a user gesture. Speech is appended
  // to the message as it finalises; the still-changing tail is shown beside the
  // box so text typed mid-dictation is never overwritten by a revised guess.
  const { isListening, finalText, interimText, startListening, stopListening, supported: voiceSupported, error: voiceError } =
    useSpeechInput('en-US');
  const dictatingRef = useRef(false);
  const dictationBaseRef = useRef('');
  // How much of finalText is already part of the base (the user typed past it).
  const consumedRef = useRef(0);
  const finalTextRef = useRef('');
  const messageRef = useRef(message);
  const submittingRef = useRef(false);
  finalTextRef.current = finalText;
  messageRef.current = message;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Uses only refs and stable setters, so the stale copy captured by the
  // [isOpen] effect's cleanup is safe to call.
  async function stopAndMerge(): Promise<string> {
    const text = await stopListening();
    let next = messageRef.current;
    if (dictatingRef.current) {
      next = appendText(dictationBaseRef.current, text.slice(consumedRef.current));
      setMessage(next);
      messageRef.current = next;
    }
    dictatingRef.current = false;
    return next;
  }

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Restore draft when opening
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft && !message) setMessage(draft);
      const t = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => {
        clearTimeout(t);
        if (dictatingRef.current) void stopAndMerge();
      };
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fold newly finalised speech into the message.
  useEffect(() => {
    if (!dictatingRef.current) return;
    setMessage(appendText(dictationBaseRef.current, finalText.slice(consumedRef.current)));
  }, [finalText]);

  function handleMessageChange(value: string) {
    const next = value.slice(0, 8000);
    setMessage(next);
    if (dictatingRef.current) {
      // Typing wins: what is in the box now is the new base, and only speech
      // finalised from here on is appended after it.
      dictationBaseRef.current = next;
      consumedRef.current = finalTextRef.current.length;
    }
  }

  function toggleDictation() {
    if (isListening) {
      void stopAndMerge();
      return;
    }
    dictationBaseRef.current = message;
    consumedRef.current = 0;
    dictatingRef.current = true;
    void startListening();
  }

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
    // Close at once; the draft is saved once the last spoken words have landed.
    const pending = dictatingRef.current ? stopAndMerge() : Promise.resolve(message);
    void pending.then((text) => {
      if (text.trim()) sessionStorage.setItem(DRAFT_KEY, text);
    });
    setState('idle');
    onClose();
  }

  function clearDraft() {
    setMessage('');
    sessionStorage.removeItem(DRAFT_KEY);
  }

  async function handleSubmit() {
    if (!context || submittingRef.current) return;
    submittingRef.current = true;
    // The last spoken words only arrive after stop, so flush before reading.
    const finalMessage = dictatingRef.current ? await stopAndMerge() : message;
    submittingRef.current = false;
    if (!finalMessage.trim()) return;

    // Optimistic UX: the user doesn't need to watch the upload. Snapshot
    // the payload, clear the draft, flash a success, and close — then do the
    // network work in the background. If it fails we stash the draft back
    // into sessionStorage so they don't lose it.
    const payload = {
      message: finalMessage.trim(),
      pageUrl: context.pageUrl,
      pageTitle: context.pageTitle,
      routeParams: context.routeParams,
      viewportWidth: context.viewportWidth,
      viewportHeight: context.viewportHeight,
      userAgent: context.userAgent,
      activityTrail: getActivityTrail(),
      domainContext: domainSnapshot ?? undefined,
      website,
    };
    const blobNow = screenshotBlob;
    const shotPromise = screenshotPromise;
    clearDraft();
    // First feedback ever: show the celebration so the user knows it worked.
    // Every subsequent send: just close — power users send rapidly and don't
    // need a Thanks screen each time. Failures still restore the draft.
    let firstSendDone = false;
    try {
      firstSendDone = localStorage.getItem(FIRST_SEND_KEY) === '1';
    } catch { /* ignore */ }
    if (firstSendDone) {
      setState('idle');
      onClose();
    } else {
      try { localStorage.setItem(FIRST_SEND_KEY, '1'); } catch { /* ignore */ }
      setState('success');
    }

    void (async () => {
      try {
        // The capture may still be rendering on a slow phone: give it a moment,
        // then send without it rather than hold the feedback back.
        let blob = blobNow;
        if (!blob && shotPromise) {
          blob = await Promise.race([
            shotPromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), SCREENSHOT_WAIT_MS)),
          ]);
        }
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

  // Speech still arriving counts: Send stops dictation and takes it.
  const canSend = !!message.trim() || (isListening && !!(finalText.trim() || interimText.trim()));

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

                  {/* Honeypot — never visible to humans, off-screen, no autofill, no a11y */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        if (canSend) void handleSubmit();
                      }
                    }}
                    placeholder="What's on your mind? Bug report, suggestion, content issue... (Enter to send, Shift+Enter for newline)"
                    className="w-full h-28 p-3 rounded-xl bg-surface-inset border border-card-border text-foreground placeholder:text-text-secondary/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-id/40"
                    disabled={state === 'sending'}
                  />

                  {/* What is being heard right now, not yet part of the message */}
                  {isListening && (
                    <p className="text-xs text-text-secondary mt-2 min-h-4" role="status" aria-live="polite">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5 align-middle" />
                      <span className="font-semibold">Listening in English</span>
                      {interimText && <span className="italic"> &mdash; {interimText}</span>}
                    </p>
                  )}

                  {/* Voice input failure hint — never fail silently */}
                  {voiceError && !isListening && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2" role="status">
                      {voiceError}
                    </p>
                  )}
                  {!voiceSupported && (
                    <p className="text-xs text-text-secondary/80 mt-2" role="status">
                      Voice input isn&rsquo;t supported in this browser — type your feedback below.
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    {voiceSupported ? (
                      <button
                        type="button"
                        onClick={toggleDictation}
                        aria-pressed={isListening}
                        aria-label={isListening ? 'Stop voice input' : voiceError ? 'Try voice input again' : 'Start voice input'}
                        className={`inline-flex items-center gap-1.5 px-3 h-11 rounded-xl text-sm font-semibold transition-colors ${
                          isListening
                            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                            : 'bg-surface-inset text-text-secondary border border-card-border hover:text-foreground'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={isListening ? 'animate-pulse' : ''}>
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
                        </svg>
                        {isListening ? 'Stop' : voiceError ? 'Try again' : 'Speak'}
                      </button>
                    ) : <span />}
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
                        disabled={!canSend}
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
