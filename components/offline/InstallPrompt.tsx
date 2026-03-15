'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SESSION_KEY = 'wordzoo-session-count';
const DISMISSED_KEY = 'wordzoo-install-dismissed';
const MIN_SESSIONS = 3;

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Track session count
    const count = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10) + 1;
    localStorage.setItem(SESSION_KEY, String(count));

    if (count < MIN_SESSIONS) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    deferredPromptRef.current = null;
    setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <Card className="animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-default/20 flex items-center justify-center shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-default"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Add to Home Screen
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Install WordZoo for a faster, app-like experience with offline
            support.
          </p>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleInstall} variant="primary" size="sm">
              Install
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Not now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
