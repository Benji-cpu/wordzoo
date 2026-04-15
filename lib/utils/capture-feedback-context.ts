export interface FeedbackContext {
  pageUrl: string;
  pageTitle: string;
  routeParams: Record<string, string>;
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
  contextSummary: string;
}

const ROUTE_PATTERNS: Array<{ pattern: RegExp; label: string; params: string[] }> = [
  { pattern: /^\/learn\/([^/]+)$/, label: 'Learn > Scene', params: ['sceneId'] },
  { pattern: /^\/paths\/([^/]+)$/, label: 'Path', params: ['pathId'] },
  { pattern: /^\/tutor\/([^/]+)$/, label: 'Tutor > Session', params: ['sessionId'] },
  { pattern: /^\/review$/, label: 'Review', params: [] },
  { pattern: /^\/dashboard$/, label: 'Dashboard', params: [] },
  { pattern: /^\/paths$/, label: 'Paths', params: [] },
  { pattern: /^\/tutor$/, label: 'Tutor', params: [] },
  { pattern: /^\/settings$/, label: 'Settings', params: [] },
  { pattern: /^\/admin/, label: 'Admin', params: [] },
  { pattern: /^\/community/, label: 'Community', params: [] },
  { pattern: /^\/studio/, label: 'Studio', params: [] },
];

export function captureFeedbackContext(): FeedbackContext {
  const pathname = window.location.pathname;
  const pageTitle = document.title;

  // Extract route params
  const routeParams: Record<string, string> = {};
  let contextSummary = pathname;

  for (const route of ROUTE_PATTERNS) {
    const match = pathname.match(route.pattern);
    if (match) {
      contextSummary = route.label;
      route.params.forEach((param, i) => {
        if (match[i + 1]) {
          routeParams[param] = match[i + 1];
        }
      });
      break;
    }
  }

  return {
    pageUrl: window.location.href,
    pageTitle,
    routeParams,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    contextSummary,
  };
}
