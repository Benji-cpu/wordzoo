/**
 * Captures domain-specific state at the moment feedback is requested.
 *
 * Each page that has meaningful domain state registers a small object on
 * `window.__wordzooFeedbackContext` (e.g. last few tutor turns, current
 * scene/word). This module reads it back. Pages without registered state
 * still get URL-derived context (route + sceneId).
 *
 * Why a window key vs. React context: the FAB lives in AppShell and the
 * domain state lives several routes deep. A window key is the simplest
 * cross-tree pipe and the data is purely diagnostic — no reactivity needed.
 */

export type TutorTurn = { role: 'user' | 'assistant'; text: string };

export interface FeedbackDomainContextRegistration {
  domain: 'tutor' | 'learn' | 'review' | 'paths' | string;
  /** Free-form payload — kept on the page side; this module just forwards it. */
  data: unknown;
}

declare global {
  interface Window {
    __wordzooFeedbackContext?: FeedbackDomainContextRegistration;
  }
}

export interface DomainSnapshot {
  domain: string;
  pathname: string;
  data: unknown;
}

export function captureDomainSnapshot(): DomainSnapshot | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  const registered = window.__wordzooFeedbackContext;

  if (registered) {
    return {
      domain: registered.domain,
      pathname,
      data: registered.data,
    };
  }

  // URL-derived fallback for known domains (no registration needed).
  if (pathname.startsWith('/learn/')) {
    const sceneId = pathname.split('/')[2] ?? null;
    return { domain: 'learn', pathname, data: { sceneId } };
  }

  return null;
}

/**
 * Page helper: register domain context. Call inside an effect on the page,
 * pass `null` on cleanup.
 */
export function registerFeedbackContext(reg: FeedbackDomainContextRegistration | null) {
  if (typeof window === 'undefined') return;
  if (reg === null) {
    delete window.__wordzooFeedbackContext;
  } else {
    window.__wordzooFeedbackContext = reg;
  }
}
