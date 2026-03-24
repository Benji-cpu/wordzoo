# WordZoo: Fix Core Journey & Add Differentiation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken learning loop, build path navigation, add a Mnemonic Gallery, and expand content — transforming WordZoo from a broken demo into a viable language learning app.

**Architecture:** Fix 2 critical bugs (word card race condition, session instability), then build the path detail page and seed dialogue content, then add retention features (Practice Now, Mnemonic Gallery, enhanced dashboard), then build the AI content pipeline. Each phase produces testable, working software.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Neon Postgres (raw SQL), Tailwind CSS v4, shadcn/ui patterns, Google Gemini 2.5 Flash

**No automated tests:** This project has no test runner. Verification is done via Playwright MCP browser testing after each phase. Do NOT create test files, test scripts, or test dependencies.

**Already implemented (do NOT re-implement):**
- `SceneSummary` already accepts `nextScene`/`pathId` props and renders "Next Scene →" / "Path Complete!" buttons
- `LearnClient` already accepts and passes `nextScene`/`pathId` to `SceneSummary`
- `PathCard` already links to `/paths/${path.id}` (not `/learn/${sceneId}`)
- The learn page already computes `nextScene` via `getNextSceneInPath()` and passes it to client components
- The paths page already fetches scene mastery data and passes `scenesCompleted`/`totalScenes` to PathCard

---

## File Map

### Files to Modify

| File | Responsibility | Changes |
|------|---------------|---------|
| `components/learn/LearnClient.tsx` | Legacy scene word-by-word learning | Fix race condition in useEffect + advanceWord/onQuizCorrect |
| `app/(app)/paths/page.tsx` | Paths listing page | Add try/catch + error logging around data fetching |
| `middleware.ts` | Auth middleware | Extend matcher to page routes; add redirect logic for unauthenticated page access |
| `app/(app)/review/page.tsx` | Review page server component | Fetch practice words alongside SRS-due words |
| `components/learn/ReviewClient.tsx` | Review page client | Add "Practice Now" mode when no SRS items due |
| `lib/db/queries.ts` | Database query layer | Add `getAllLearnedWordsForPractice`, `getLearnedWordsWithMnemonics`, `getWordMasteryDistribution` queries |
| `app/(app)/dashboard/page.tsx` | Dashboard server component | Enhanced progress section with mastery tiers |
| `app/(app)/BottomNav.tsx` | Bottom navigation | Add Gallery nav item, remove Settings |
| `lib/ai/prompts.ts` | AI prompt templates | Add content generation prompts |

### Files to Create

| File | Responsibility |
|------|---------------|
| `app/(app)/paths/error.tsx` | Error boundary for /paths route |
| `app/(app)/paths/[pathId]/page.tsx` | Path detail page with scene list |
| `components/learn/SceneCard.tsx` | Scene card for path detail page |
| `app/(app)/gallery/page.tsx` | Mnemonic Gallery page |
| `components/learn/MnemonicGalleryCard.tsx` | Gallery card component |
| `components/learn/ProgressChart.tsx` | Mastery distribution + streak calendar |
| `lib/ai/content-generation.ts` | AI content generation functions |
| `scripts/generate-scene.ts` | Admin script to generate + seed scenes |

---

## Phase 1: Fix Critical Bugs

### Task 1: Fix word card click not advancing

**Root cause:** The `useEffect` progress fetch in `LearnClient.tsx` (lines 52-70) has `[sceneId, words]` as dependencies. `words` is an array prop from the server component — in React 19 with RSC, its reference identity can change during hydration, re-triggering the effect. If the fetch response arrives AFTER the user clicks a word card, `setState` in the `.then()` callback overwrites the user's state transition. Additionally, `advanceWord` and `onQuizCorrect` use closure-captured `state` via `useCallback` instead of functional `setState`, making them vulnerable to stale closures.

**Fix:** (1) Remove `words` from the useEffect dependency array and access it via a ref inside the callback. (2) Add `userHasInteractedRef` guard so the progress fetch can never override user-initiated state. (3) Convert `advanceWord` and `onQuizCorrect` to functional `setState`.

**Files:**
- Modify: `components/learn/LearnClient.tsx`

- [ ] **Step 1: Add refs and fix useEffect**

In `LearnClient.tsx`, after line 51 (`learnedIdsRef`), add:

```typescript
const userHasInteractedRef = useRef(false);
const wordsRef = useRef(words);
wordsRef.current = words;
```

Replace the progress-fetching `useEffect` (lines 52-70) with:

```typescript
useEffect(() => {
  let cancelled = false;
  fetch(`/api/scenes/${sceneId}/progress`)
    .then(r => r.json())
    .then(res => {
      if (cancelled || !res.data || userHasInteractedRef.current) return;
      const ids = new Set<string>(res.data.learnedWordIds);
      learnedIdsRef.current = ids;
      if (ids.size === 0) return;
      const currentWords = wordsRef.current;
      const startIndex = currentWords.findIndex(w => !ids.has(w.word.id));
      if (startIndex === -1) {
        setState({ phase: 'scene_complete' });
      } else if (startIndex > 0) {
        setState({ phase: 'word_learning', wordIndex: startIndex, step: 'word' });
      }
    })
    .catch(() => {});
  return () => { cancelled = true; };
}, [sceneId]);
```

Note: `words` removed from dependency array. Accessed via `wordsRef.current` inside the callback.

- [ ] **Step 2: Convert advanceWord to functional setState**

Replace `advanceWord` (around lines 107-121) with:

```typescript
const advanceWord = useCallback(() => {
  userHasInteractedRef.current = true;
  setState(prev => {
    if (prev.phase !== 'word_learning') return prev;
    const { wordIndex, step } = prev;
    const word = wordsRef.current[wordIndex];
    if (step === 'word') {
      return word?.mnemonic
        ? { phase: 'word_learning', wordIndex, step: 'mnemonic' }
        : { phase: 'word_learning', wordIndex, step: 'quiz' };
    } else if (step === 'mnemonic') {
      return { phase: 'word_learning', wordIndex, step: 'quiz' };
    }
    return prev;
  });
}, []);
```

- [ ] **Step 3: Convert onQuizCorrect to functional setState**

Replace `onQuizCorrect` (around lines 142-159) with:

```typescript
const onQuizCorrect = useCallback(() => {
  userHasInteractedRef.current = true;
  setState(prev => {
    if (prev.phase !== 'word_learning') return prev;
    const currentWords = wordsRef.current;
    const currentId = currentWords[prev.wordIndex]?.word.id;
    if (currentId) sessionLearnedRef.current.add(currentId);

    const learned = learnedIdsRef.current;
    const nextIndex = currentWords.findIndex((w, i) => {
      if (i <= prev.wordIndex) return false;
      if (sessionLearnedRef.current.has(w.word.id)) return false;
      if (learned?.has(w.word.id)) return false;
      return true;
    });
    if (nextIndex === -1) {
      return { phase: 'scene_complete' };
    }
    return { phase: 'word_learning', wordIndex: nextIndex, step: 'word' };
  });
}, []);
```

- [ ] **Step 4: Update currentWord derivation**

The `currentWord` variable (line 72-73) reads from `words[state.wordIndex]` which is fine for rendering. But `advanceWord` now uses `wordsRef.current` instead of closure-captured `currentWord`, so remove `currentWord` from the `advanceWord` dependency array if it was there. The render code still uses `currentWord` directly — this is correct since render always has the latest props.

- [ ] **Step 5: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Click "Continue Learning" on dashboard
3. Tap the word card → should transition to mnemonic or quiz (NOT stay stuck)
4. Complete the quiz → should advance to next word
5. Repeat until all words done → should show "Scene Complete!" with "Next Scene →" button

- [ ] **Step 6: Commit**

```bash
git add components/learn/LearnClient.tsx
git commit -m "fix: resolve word card race condition with wordsRef and functional setState"
```

---

### Task 2: Harden /paths page with error boundary

**Context:** The `/paths` page makes multiple DB queries. While the queries themselves may work, adding an error boundary and try/catch provides robustness against transient DB connection issues or edge cases. The previous audit sessions saw /paths consistently redirect to login — this may already be fixed in the current code (which was modified since those audits), but the error boundary ensures any future errors are caught gracefully.

**Files:**
- Create: `app/(app)/paths/error.tsx`
- Modify: `app/(app)/paths/page.tsx`

- [ ] **Step 1: Add error boundary**

Create `app/(app)/paths/error.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function PathsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Paths page error:', error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-4xl mb-4">😵</p>
      <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-text-secondary mb-6 text-center">
        Could not load learning paths. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

- [ ] **Step 2: Add try/catch with error logging to paths page**

In `app/(app)/paths/page.tsx`, wrap the for-loop that fetches paths per language (lines 30-34) in a try/catch:

```typescript
const allPathsRaw: Path[] = [];
for (const lang of languages) {
  try {
    const paths = await getPathsByLanguage(lang.id, userId);
    allPathsRaw.push(...paths);
  } catch (e) {
    console.error(`PathsPage: getPathsByLanguage failed for language ${lang.id}:`, e);
  }
}
```

And wrap the parallel stats/mastery fetch (lines 45-48) in a try/catch:

```typescript
let statsResults: Awaited<ReturnType<typeof getPathWordStats>>[];
let masteryResults: Awaited<ReturnType<typeof getSceneMasteryForPath>>[];
try {
  [statsResults, masteryResults] = await Promise.all([
    Promise.all(uniquePaths.map(p => getPathWordStats(userId, p.id))),
    Promise.all(uniquePaths.map(p => getSceneMasteryForPath(userId, p.id))),
  ]);
} catch (e) {
  console.error('PathsPage: stats/mastery fetch failed:', e);
  statsResults = uniquePaths.map(() => ({ total_words: 0, words_learned: 0, words_mastered: 0 }));
  masteryResults = uniquePaths.map(() => []);
}
```

**Important:** Preserve ALL existing data passed to PathCard — `scenesCompleted`, `totalScenes`, `wordCount`, `wordsCompleted`, `progress`. Do NOT remove any fields from `pathsWithStats`.

- [ ] **Step 3: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Navigate to `localhost:8000/paths` → should load with path cards
3. Path cards should show "X/Y scenes · X/Y words"
4. Check dev server terminal for any console.error messages

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/paths/page.tsx app/\(app\)/paths/error.tsx
git commit -m "fix: add error boundary and try/catch to paths page"
```

---

### Task 3: Fix session instability on page navigation

**Root cause:** Middleware only matches `/api/:path*`, so it never runs for page routes. Page auth depends solely on `auth()` calls in the layout/page Server Components. Client-side `fetch()` calls to API routes (e.g., the progress endpoint) can get 401 if cookies aren't sent properly. Extending middleware to cover page routes provides consistent, early auth handling.

**Note:** The `(app)/layout.tsx` already redirects to `/login` if `auth()` returns no session. After this change, the middleware redirect fires first for covered routes. This is redundant but harmless — the middleware provides a faster, more consistent check.

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Extend middleware matcher and add page redirect logic**

Replace the entire `middleware.ts`:

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth API routes through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow share routes through (for social crawlers)
  if (pathname.startsWith('/api/share')) {
    return NextResponse.next();
  }

  // Allow Stripe webhook (verified by Stripe signature, not session)
  if (pathname === '/api/billing/webhook') {
    return NextResponse.next();
  }

  // Allow cron routes (verified by CRON_SECRET bearer token)
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // For unauthenticated requests:
  if (!req.auth) {
    // API routes → return 401 JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Page routes → redirect to login
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/paths/:path*',
    '/learn/:path*',
    '/review/:path*',
    '/tutor/:path*',
    '/settings/:path*',
    '/gallery/:path*',
    '/admin/:path*',
    '/community/:path*',
  ],
};
```

- [ ] **Step 2: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login` → should redirect to dashboard
2. Navigate to `localhost:8000/paths` → should load (not redirect to login)
3. Navigate to `localhost:8000/review` → should load
4. Navigate between pages via bottom nav → NO unexpected login redirects
5. Navigate to `localhost:8000/login` → should load normally (NOT caught by middleware)
6. Open incognito, navigate to `localhost:8000/paths` → should redirect to login

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "fix: extend middleware to cover page routes for consistent auth"
```

---

## Phase 2: Complete the Navigation Flow

### Task 4: Create path detail page

**Context:** `PathCard` already links to `/paths/${path.id}`, but no page exists at that route. Clicking a path card currently results in a 404. This page shows all scenes in a path with completion status, enabling users to see their progress and navigate to any scene.

**Files:**
- Create: `app/(app)/paths/[pathId]/page.tsx`
- Create: `components/learn/SceneCard.tsx`

- [ ] **Step 1: Create SceneCard component**

Create `components/learn/SceneCard.tsx`:

```tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface SceneCardProps {
  sceneId: string;
  title: string;
  description: string | null;
  sceneType: 'legacy' | 'dialogue';
  totalWords: number;
  masteredWords: number;
  isComplete: boolean;
  isNext: boolean;
  sceneNumber: number;
}

export function SceneCard({
  sceneId,
  title,
  description,
  sceneType,
  totalWords,
  masteredWords,
  isComplete,
  isNext,
  sceneNumber,
}: SceneCardProps) {
  const progress = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  return (
    <Link href={`/learn/${sceneId}`} className="block">
      <Card className={`relative ${isNext ? 'ring-2 ring-accent-id' : ''} ${isComplete ? 'opacity-80' : ''}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isComplete
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : isNext
                ? 'bg-accent-id/10 text-accent-id'
                : 'bg-card-surface text-text-secondary'
          }`}>
            {isComplete ? '✓' : sceneNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
              {isNext && (
                <span className="text-xs bg-accent-id/10 text-accent-id px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Next
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{description}</p>
            )}
            <div className="mt-2">
              <ProgressBar value={progress} accentColor={isComplete ? 'bg-green-500' : 'bg-accent-id'} height="sm" />
              <p className="text-xs text-text-secondary mt-1">
                {masteredWords}/{totalWords} words
                {sceneType === 'dialogue' ? ' · Dialogue' : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create path detail page**

Create `app/(app)/paths/[pathId]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPathById, getSceneMasteryForPath, getPathWordStats } from '@/lib/db/queries';
import { SceneCard } from '@/components/learn/SceneCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ pathId: string }>;
}

export default async function PathDetailPage({ params }: PageProps) {
  const { pathId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const path = await getPathById(pathId);
  if (!path) return notFound();

  const [sceneMastery, wordStats] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getPathWordStats(userId, pathId),
  ]);

  const isSceneComplete = (s: typeof sceneMastery[0]) =>
    s.scene_type === 'dialogue' ? s.scene_completed : s.mastered_words >= s.total_words;

  const nextIncompleteScene = sceneMastery.find(s => !isSceneComplete(s));
  const overallProgress = wordStats.total_words > 0
    ? Math.round((wordStats.words_learned / wordStats.total_words) * 100)
    : 0;
  const allComplete = sceneMastery.length > 0 && sceneMastery.every(isSceneComplete);

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <Link href="/paths" className="text-sm text-text-secondary hover:text-foreground transition-colors mb-2 inline-block">
          ← All Paths
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{path.title}</h1>
        {path.description && (
          <p className="text-sm text-text-secondary mt-1">{path.description}</p>
        )}
      </div>

      {/* Overall Progress */}
      <div className="p-4 rounded-xl bg-card-surface border border-card-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-text-secondary">{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} accentColor={allComplete ? 'bg-green-500' : 'bg-accent-id'} height="md" />
        <p className="text-xs text-text-secondary mt-2">
          {wordStats.words_learned}/{wordStats.total_words} words learned · {wordStats.words_mastered} mastered
        </p>
      </div>

      {/* Continue Button */}
      {nextIncompleteScene && (
        <Link href={`/learn/${nextIncompleteScene.id}`} className="block">
          <Button className="w-full">
            Continue: {nextIncompleteScene.title}
          </Button>
        </Link>
      )}

      {allComplete && (
        <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-lg font-bold text-green-700 dark:text-green-300">Path Complete!</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            You&apos;ve mastered all scenes. Keep reviewing to strengthen your memory.
          </p>
        </div>
      )}

      {/* Scene List */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Scenes ({sceneMastery.length})
        </h2>
        <div className="space-y-3">
          {sceneMastery.map((scene, i) => (
            <SceneCard
              key={scene.id}
              sceneId={scene.id}
              title={scene.title}
              description={scene.description}
              sceneType={scene.scene_type}
              totalWords={scene.total_words}
              masteredWords={scene.mastered_words}
              isComplete={isSceneComplete(scene)}
              isNext={scene.id === nextIncompleteScene?.id}
              sceneNumber={i + 1}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Navigate to `localhost:8000/paths`
3. Click "Survival Indonesian" path card → should show path detail page with scene list
4. Scenes should show completion status (checkmark for completed, "Next" badge for next)
5. Click "Continue" button → should navigate to the next incomplete scene
6. Click "← All Paths" → should go back to /paths

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/paths/\[pathId\]/page.tsx components/learn/SceneCard.tsx
git commit -m "feat: add path detail page with scene list and progress"
```

---

### Task 5: Seed dialogue scenes

**Context:** The 6-phase dialogue flow is fully implemented in `SceneFlowClient.tsx`, and seed data exists in `lib/db/dialogue-data.ts` with 5 scenes. The seed script (`lib/db/seed-dialogues.ts`) is ready to run. This adds scenes 4-8 to the Indonesian path.

**Files:**
- Run: `lib/db/seed-dialogues.ts` (already exists)

- [ ] **Step 1: Run migrations first (if needed)**

```bash
cd "/Users/benji-m4/Documents/Code/WordZoo/WordZoo v1"
npm run db:migrate 2>&1
```

- [ ] **Step 2: Run the dialogue seed script**

```bash
npm run db:seed-dialogues 2>&1
```

Expected: "Seeding dialogue scenes..." followed by success messages for each of the 5 scenes.

If duplicate key violations occur, scenes are already partially seeded. Use `--only=N` to seed specific scenes (e.g., `npm run db:seed-dialogues -- --only=3,4,5`).

- [ ] **Step 3: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Navigate to `localhost:8000/paths` → click "Survival Indonesian"
3. Path detail should now show 8 scenes (3 legacy + 5 dialogue)
4. Click a dialogue scene → SceneFlowClient should render with dialogue phase

- [ ] **Step 4: Commit (only if seed script needed changes)**

```bash
git add lib/db/seed-dialogues.ts lib/db/dialogue-data.ts
git commit -m "fix: seed dialogue scenes for Indonesian path"
```

---

### Task 6: Auto-enroll user in path when entering a scene

**Context:** Dashboard auto-enrolls in the Indonesian path, but entering scenes from /paths doesn't track path enrollment.

**Files:**
- Modify: `app/(app)/learn/[sceneId]/page.tsx`

- [ ] **Step 1: Add auto-enrollment**

In `app/(app)/learn/[sceneId]/page.tsx`, add `upsertUserPath` to the import from `@/lib/db/queries`:

```typescript
import {
  getSceneWithLanguage,
  getSceneWordsForLearning,
  getDistractorsForWord,
  getNextSceneInPath,
  getSceneMasteryForPath,
  upsertUserPath,
} from '@/lib/db/queries';
```

Inside the `if (userId) {` block (around line 68), before the auto-advance logic, add:

```typescript
// Auto-enroll user in this path (fire-and-forget)
upsertUserPath(userId, scene.path_id, 'active').catch(() => {});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/learn/\[sceneId\]/page.tsx
git commit -m "feat: auto-enroll user in path when entering a scene"
```

---

## Phase 3: Retention Features

### Task 7: Add "Practice Now" to review page

**Context:** Review shows "No items due" even with learned words because SRS intervals haven't elapsed (minimum 1 day). Users need immediate practice.

**Files:**
- Modify: `lib/db/queries.ts` — add `getAllLearnedWordsForPractice` query
- Modify: `app/(app)/review/page.tsx` — fetch practice words
- Modify: `components/learn/ReviewClient.tsx` — add Practice Now mode

- [ ] **Step 1: Add practice words query**

In `lib/db/queries.ts`, add after the `getDueWordsForReview` function:

```typescript
export async function getAllLearnedWordsForPractice(
  userId: string,
  limit: number = 50
): Promise<DueWordForReview[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech, w.language_id, w.frequency_rank,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.id AS user_word_id, uw.status, uw.ease_factor, uw.interval_days,
      uw.times_reviewed, uw.times_correct, uw.direction
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
    WHERE uw.user_id = ${userId}
      AND uw.status != 'new'
    ORDER BY uw.last_reviewed_at ASC NULLS FIRST
    LIMIT ${limit}
  `;
  return rows as DueWordForReview[];
}
```

- [ ] **Step 2: Update review page to fetch practice words**

Replace `app/(app)/review/page.tsx`:

```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueWords, getDuePhrases } from '@/lib/srs/engine';
import { getAllLearnedWordsForPractice } from '@/lib/db/queries';
import { ReviewClient } from '@/components/learn/ReviewClient';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dueWords, duePhrases, practiceWords] = await Promise.all([
    getDueWords(session.user.id),
    getDuePhrases(session.user.id),
    getAllLearnedWordsForPractice(session.user.id),
  ]);

  return (
    <div className="max-w-lg mx-auto pb-24">
      <ReviewClient dueWords={dueWords} duePhrases={duePhrases} practiceWords={practiceWords} />
    </div>
  );
}
```

- [ ] **Step 3: Update ReviewClient with Practice Now mode**

In `components/learn/ReviewClient.tsx`:

Update the interface:

```typescript
interface ReviewClientProps {
  dueWords: DueWordForReview[];
  duePhrases: DuePhraseForReview[];
  practiceWords?: DueWordForReview[];
}
```

Update the destructuring:

```typescript
export function ReviewClient({ dueWords, duePhrases, practiceWords = [] }: ReviewClientProps) {
```

Add `practiceMode` state after the existing state declarations (around line 61):

```typescript
const [practiceMode, setPracticeMode] = useState(false);
```

Replace the `items` interleaving block (around lines 65-74) with:

```typescript
// In practice mode, use all learned words; otherwise use SRS-due items
const effectiveWords = practiceMode ? practiceWords : dueWords;
const effectivePhrases = practiceMode ? [] as DuePhraseForReview[] : duePhrases;

const items: ReviewItem[] = [];
const wLen = effectiveWords.length;
const pLen = effectivePhrases.length;
let wi = 0, pi = 0;
while (wi < wLen || pi < pLen) {
  if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
  if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
  if (pi < pLen) { items.push({ type: 'phrase', data: effectivePhrases[pi++] }); }
}
```

Replace the empty state block (`if (items.length === 0)` around line 149) with:

```tsx
if (items.length === 0 && !practiceMode) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
      <p className="text-4xl mb-4">✅</p>
      <h2 className="text-xl font-bold text-foreground mb-1">No items due for review</h2>
      <p className="text-text-secondary mb-6 text-center">
        {practiceWords.length > 0
          ? `You have ${practiceWords.length} words you can practice now.`
          : 'Keep learning to build your review queue!'}
      </p>
      {practiceWords.length > 0 ? (
        <button
          onClick={() => setPracticeMode(true)}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-id text-white font-medium hover:bg-accent-id/90 transition-colors"
        >
          Practice Now ({practiceWords.length} words)
        </button>
      ) : (
        <Link
          href="/paths"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-id text-white font-medium hover:bg-accent-id/90 transition-colors"
        >
          Go to Learning Paths
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Navigate to `localhost:8000/review`
3. If no SRS items due → should show "Practice Now (N words)" button
4. Click "Practice Now" → review cards should appear with all learned words
5. Rate a few words → should advance through cards normally

- [ ] **Step 5: Commit**

```bash
git add lib/db/queries.ts app/\(app\)/review/page.tsx components/learn/ReviewClient.tsx
git commit -m "feat: add Practice Now mode to review page"
```

---

### Task 8: Mnemonic Gallery page

**Context:** WordZoo's unique differentiator is AI-generated keyword mnemonics with vivid images. The Gallery is a visual "trophy case" of all learned mnemonics — no other language app has this.

**Files:**
- Modify: `lib/db/queries.ts` — add `getLearnedWordsWithMnemonics` query
- Create: `components/learn/MnemonicGalleryCard.tsx`
- Create: `app/(app)/gallery/page.tsx`
- Modify: `app/(app)/BottomNav.tsx` — add Gallery nav item

- [ ] **Step 1: Add gallery query**

In `lib/db/queries.ts`, add:

```typescript
export interface GalleryWord {
  word_id: string;
  text: string;
  romanization: string | null;
  meaning_en: string;
  pronunciation_audio_url: string | null;
  language_name: string;
  path_title: string;
  mnemonic_id: string;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string | null;
  image_url: string | null;
  status: string;
}

export async function getLearnedWordsWithMnemonics(
  userId: string
): Promise<GalleryWord[]> {
  const rows = await sql`
    SELECT DISTINCT ON (w.id)
      w.id AS word_id, w.text, w.romanization, w.meaning_en, w.pronunciation_audio_url,
      l.name AS language_name,
      COALESCE(p.title, 'Unknown') AS path_title,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN languages l ON l.id = w.language_id
    LEFT JOIN scene_words sw ON sw.word_id = w.id
    LEFT JOIN scenes s ON s.id = sw.scene_id
    LEFT JOIN paths p ON p.id = s.path_id
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
    WHERE uw.user_id = ${userId}
      AND uw.status != 'new'
      AND m.id IS NOT NULL
    ORDER BY w.id, uw.last_reviewed_at DESC NULLS LAST
  `;
  return rows as GalleryWord[];
}
```

- [ ] **Step 2: Create MnemonicGalleryCard component**

Create `components/learn/MnemonicGalleryCard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PronunciationButton } from '@/components/audio/PronunciationButton';
import type { GalleryWord } from '@/lib/db/queries';

export function MnemonicGalleryCard({ word }: { word: GalleryWord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Mnemonic Image */}
      {word.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={word.image_url}
          alt={word.scene_description}
          className="w-full h-32 object-cover -mx-4 -mt-4 mb-3"
          style={{ width: 'calc(100% + 2rem)' }}
        />
      ) : (
        <div className="w-full h-24 bg-card-surface -mx-4 -mt-4 mb-3 flex items-center justify-center" style={{ width: 'calc(100% + 2rem)' }}>
          <span className="text-3xl">🧠</span>
        </div>
      )}

      {/* Word + Keyword */}
      <div className="text-center">
        <p className="text-lg font-bold text-accent-id">{word.text}</p>
        <p className="text-sm text-text-secondary">{word.meaning_en}</p>
        <p className="text-xs text-text-secondary mt-1 italic">
          &ldquo;{word.keyword_text}&rdquo;
        </p>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-card-border space-y-2 animate-slide-up">
          <p className="text-sm text-foreground">{word.scene_description}</p>
          {word.bridge_sentence && (
            <p className="text-xs text-text-secondary italic">{word.bridge_sentence}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{word.path_title}</span>
            <div onClick={(e) => e.stopPropagation()}>
              <PronunciationButton
                wordId={word.word_id}
                audioUrl={word.pronunciation_audio_url}
                text={word.text}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Create Gallery page**

Create `app/(app)/gallery/page.tsx`:

```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLearnedWordsWithMnemonics } from '@/lib/db/queries';
import { MnemonicGalleryCard } from '@/components/learn/MnemonicGalleryCard';
import Link from 'next/link';

export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const words = await getLearnedWordsWithMnemonics(session.user.id);

  if (words.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-4xl mb-4">🖼️</p>
        <h2 className="text-xl font-bold text-foreground mb-1">Your Gallery is Empty</h2>
        <p className="text-text-secondary mb-6 text-center">
          Learn words to build your mnemonic collection. Each word creates a vivid memory scene.
        </p>
        <Link
          href="/paths"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-id text-white font-medium hover:bg-accent-id/90 transition-colors"
        >
          Start Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mnemonic Gallery</h1>
        <p className="text-sm text-text-secondary mt-1">
          {words.length} memory scene{words.length !== 1 ? 's' : ''} collected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {words.map(word => (
          <MnemonicGalleryCard key={word.word_id} word={word} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add Gallery to bottom nav**

In `app/(app)/BottomNav.tsx`, replace the Settings tab (the last entry in the `tabs` array) with:

```typescript
{
  href: '/gallery',
  label: 'Gallery',
  icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
},
```

- [ ] **Step 5: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Click "Gallery" in bottom nav → should show mnemonic cards with images
3. Tap a card → should expand to show full scene description + pronunciation
4. If no words learned → should show empty state with link to /paths

- [ ] **Step 6: Commit**

```bash
git add lib/db/queries.ts components/learn/MnemonicGalleryCard.tsx app/\(app\)/gallery/page.tsx app/\(app\)/BottomNav.tsx
git commit -m "feat: add Mnemonic Gallery page with visual trophy case"
```

---

## Phase 4: Content & Progress

### Task 9: Enhanced progress dashboard

**Context:** Dashboard currently shows 3 numbers via `ProgressStats`. Replace with a mastery tier breakdown showing Learning/Reviewing/Mastered distribution.

**Files:**
- Modify: `lib/db/queries.ts` — add `getWordMasteryDistribution` query
- Create: `components/learn/ProgressChart.tsx`
- Modify: `app/(app)/dashboard/page.tsx` — use enhanced progress

- [ ] **Step 1: Add mastery distribution query**

In `lib/db/queries.ts`, add:

```typescript
export interface MasteryDistribution {
  new_count: number;
  learning_count: number;
  reviewing_count: number;
  mastered_count: number;
  total_count: number;
}

export async function getWordMasteryDistribution(userId: string): Promise<MasteryDistribution> {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'new')::int AS new_count,
      COUNT(*) FILTER (WHERE status = 'learning')::int AS learning_count,
      COUNT(*) FILTER (WHERE status = 'reviewing')::int AS reviewing_count,
      COUNT(*) FILTER (WHERE status = 'mastered')::int AS mastered_count,
      COUNT(*)::int AS total_count
    FROM user_words
    WHERE user_id = ${userId}
  `;
  return (rows[0] as MasteryDistribution) ?? {
    new_count: 0, learning_count: 0, reviewing_count: 0, mastered_count: 0, total_count: 0,
  };
}
```

- [ ] **Step 2: Create ProgressChart component**

Create `components/learn/ProgressChart.tsx`:

```tsx
import type { MasteryDistribution } from '@/lib/db/queries';

const TIERS = [
  { key: 'learning_count' as const, label: 'Learning', color: 'bg-blue-400' },
  { key: 'reviewing_count' as const, label: 'Reviewing', color: 'bg-amber-400' },
  { key: 'mastered_count' as const, label: 'Mastered', color: 'bg-green-500' },
];

export function ProgressChart({ distribution, streak }: { distribution: MasteryDistribution; streak: number }) {
  const active = distribution.total_count - distribution.new_count;

  return (
    <div className="p-4 rounded-xl bg-card-surface border border-card-border space-y-4">
      {/* Mastery Bar */}
      {active > 0 ? (
        <div>
          <div className="flex h-3 rounded-full overflow-hidden bg-background">
            {TIERS.map(tier => {
              const pct = (distribution[tier.key] / active) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={tier.key}
                  className={`${tier.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {TIERS.map(tier => (
              <div key={tier.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                <span className="text-xs text-text-secondary">
                  {tier.label}: {distribution[tier.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary text-center">Start learning to see your progress!</p>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-foreground">{active}</p>
          <p className="text-xs text-text-secondary">Words Active</p>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{distribution.mastered_count}</p>
          <p className="text-xs text-text-secondary">Mastered</p>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{streak}d</p>
          <p className="text-xs text-text-secondary">Streak</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update dashboard to use ProgressChart**

In `app/(app)/dashboard/page.tsx`:

Add imports:

```typescript
import { getWordMasteryDistribution } from '@/lib/db/queries';
import { ProgressChart } from '@/components/learn/ProgressChart';
```

Add `getWordMasteryDistribution` to the parallel fetch (around line 55). Add it as the last item:

```typescript
const [sceneMastery, wordStats, dueWords, duePhrases, language, streakData, masteryDist] = await Promise.all([
  getSceneMasteryForPath(userId, pathId),
  getPathWordStats(userId, pathId),
  getUserDueWords(userId, languageId),
  getDuePhrasesForReview(userId, 100),
  getLanguageById(languageId),
  getUserStreak(userId),
  getWordMasteryDistribution(userId),
]);
```

Replace the "Your Progress" section (the `ProgressStats` component usage, around lines 132-143) with:

```tsx
{/* Progress Stats */}
<section>
  <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
    Your Progress
  </h2>
  <ProgressChart distribution={masteryDist} streak={streak} />
</section>
```

Remove the `ProgressStats` import if no longer used.

- [ ] **Step 4: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Dashboard should show mastery bar (colored segments for Learning/Reviewing/Mastered)
3. Stats row should show Words Active, Mastered, Streak

- [ ] **Step 5: Commit**

```bash
git add lib/db/queries.ts components/learn/ProgressChart.tsx app/\(app\)/dashboard/page.tsx
git commit -m "feat: enhanced progress dashboard with mastery distribution"
```

---

### Task 10: AI content generation pipeline

**Context:** 20 words per language = 30 minutes of content. Build a Gemini-powered pipeline to generate complete scenes from a topic + language pair. Uses the existing `generateText` function from `lib/ai/gemini.ts`.

**Files:**
- Modify: `lib/ai/prompts.ts` — add content generation prompt
- Create: `lib/ai/content-generation.ts`
- Create: `scripts/generate-scene.ts`

- [ ] **Step 1: Add content generation prompt**

In `lib/ai/prompts.ts`, add:

```typescript
export function buildSceneGenerationPrompt(
  topic: string,
  languageName: string,
  languageCode: string,
  existingWords: string[],
  wordCount: number = 10
): string {
  return `Generate a language learning scene for ${languageName} (code: ${languageCode}) about "${topic}".

Return a JSON object with this exact structure:
{
  "title": "Scene title (in English, 3-5 words)",
  "description": "Brief description of the scenario (1 sentence)",
  "scene_context": "Context for AI tutor conversations about this topic (1-2 sentences)",
  "words": [
    {
      "text": "word in ${languageName}",
      "meaning_en": "English meaning",
      "part_of_speech": "noun|verb|adjective|adverb|pronoun|conjunction|preposition|interjection",
      "romanization": "romanized form if applicable, or null"
    }
  ],
  "mnemonics": [
    {
      "word_text": "the ${languageName} word this mnemonic is for",
      "keyword_text": "English keyword that sounds like the word",
      "scene_description": "Vivid 2-3 sentence scene connecting the keyword to the meaning. Use sensory details.",
      "bridge_sentence": "One sentence connecting keyword sound to word meaning"
    }
  ],
  "dialogues": [
    {
      "speaker": "Person A or Person B",
      "text_target": "dialogue line in ${languageName}",
      "text_en": "English translation"
    }
  ],
  "phrases": [
    {
      "text_target": "useful phrase in ${languageName}",
      "text_en": "English meaning",
      "literal_translation": "word-by-word translation",
      "usage_note": "when/how to use this phrase"
    }
  ]
}

Requirements:
- Generate exactly ${wordCount} words. Focus on practical, high-frequency vocabulary for the topic.
- Do NOT include these words (already in the database): ${existingWords.join(', ')}
- Each word must have a mnemonic with a vivid, memorable scene description.
- Generate 4-6 dialogue lines showing natural conversation using the words.
- Generate 3-5 useful phrases related to the topic.
- All ${languageName} text must be accurate and natural-sounding.
- Mnemonics should use English words that SOUND LIKE the ${languageName} word (keyword method).

Return ONLY the JSON object, no markdown or explanation.`;
}
```

- [ ] **Step 2: Create content generation module**

Create `lib/ai/content-generation.ts`:

```typescript
import { generateText } from './gemini';
import { buildSceneGenerationPrompt } from './prompts';

interface GeneratedWord {
  text: string;
  meaning_en: string;
  part_of_speech: string;
  romanization: string | null;
}

interface GeneratedMnemonic {
  word_text: string;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string;
}

interface GeneratedDialogueLine {
  speaker: string;
  text_target: string;
  text_en: string;
}

interface GeneratedPhrase {
  text_target: string;
  text_en: string;
  literal_translation: string;
  usage_note: string;
}

export interface GeneratedScene {
  title: string;
  description: string;
  scene_context: string;
  words: GeneratedWord[];
  mnemonics: GeneratedMnemonic[];
  dialogues: GeneratedDialogueLine[];
  phrases: GeneratedPhrase[];
}

export async function generateScene(
  topic: string,
  languageName: string,
  languageCode: string,
  existingWords: string[],
  wordCount: number = 10
): Promise<GeneratedScene> {
  const prompt = buildSceneGenerationPrompt(topic, languageName, languageCode, existingWords, wordCount);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeneratedScene;
}
```

- [ ] **Step 3: Create admin generation script**

Create `scripts/generate-scene.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { generateScene } from '../lib/ai/content-generation';
import { randomUUID } from 'crypto';

const USAGE = `
Usage: npx tsx scripts/generate-scene.ts --topic="food ordering" --language=Indonesian --path-id=<uuid>

Options:
  --topic       Topic for the scene (required)
  --language    Language name (default: Indonesian)
  --lang-code   Language code (default: id)
  --lang-id     Language UUID in DB (default: Indonesian UUID)
  --path-id     Path UUID to add scene to (required)
  --word-count  Number of words to generate (default: 10)
  --dry-run     Print generated content without inserting into DB
`;

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.split('=');
      return [k.replace(/^--/, ''), v ?? 'true'];
    })
  );

  if (!args.topic || !args['path-id']) {
    console.log(USAGE);
    process.exit(1);
  }

  const topic = args.topic;
  const languageName = args.language ?? 'Indonesian';
  const languageCode = args['lang-code'] ?? 'id';
  const languageId = args['lang-id'] ?? 'a1b2c3d4-0001-4000-8000-000000000001';
  const pathId = args['path-id'];
  const wordCount = parseInt(args['word-count'] ?? '10');
  const dryRun = args['dry-run'] === 'true';

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && !dryRun) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = dryRun ? null : neon(databaseUrl!);

  // Get existing words to avoid duplicates
  let existingWords: string[] = [];
  if (sql) {
    const rows = await sql`SELECT text FROM words WHERE language_id = ${languageId}`;
    existingWords = rows.map(r => (r as { text: string }).text);
  }

  console.log(`Generating scene: "${topic}" for ${languageName}...`);
  console.log(`Excluding ${existingWords.length} existing words`);

  const scene = await generateScene(topic, languageName, languageCode, existingWords, wordCount);

  console.log(`\nGenerated: "${scene.title}"`);
  console.log(`Words: ${scene.words.length}, Dialogues: ${scene.dialogues.length}, Phrases: ${scene.phrases.length}`);

  if (dryRun) {
    console.log(JSON.stringify(scene, null, 2));
    return;
  }

  // Insert into database
  console.log('\nInserting into database...');

  // 1. Get next sort_order for this path
  const sortRows = await sql!`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM scenes WHERE path_id = ${pathId}`;
  const nextSort = (sortRows[0] as { max_sort: number }).max_sort + 1;

  // 2. Create scene
  const sceneId = randomUUID();
  await sql!`
    INSERT INTO scenes (id, path_id, title, description, scene_type, scene_context, sort_order)
    VALUES (${sceneId}, ${pathId}, ${scene.title}, ${scene.description}, 'dialogue', ${scene.scene_context}, ${nextSort})
  `;
  console.log(`  Scene: ${scene.title} (sort_order: ${nextSort})`);

  // 3. Insert words + mnemonics
  let pathWordSort = 0;
  const sortRes = await sql!`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM path_words WHERE path_id = ${pathId}`;
  pathWordSort = (sortRes[0] as { max_sort: number }).max_sort;

  for (let i = 0; i < scene.words.length; i++) {
    const w = scene.words[i];
    const wordId = randomUUID();

    await sql!`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech)
      VALUES (${wordId}, ${languageId}, ${w.text}, ${w.romanization}, ${w.meaning_en}, ${w.part_of_speech})
      ON CONFLICT DO NOTHING
    `;

    await sql!`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES (${sceneId}, ${wordId}, ${i + 1}) ON CONFLICT DO NOTHING`;
    await sql!`INSERT INTO path_words (path_id, word_id, sort_order) VALUES (${pathId}, ${wordId}, ${++pathWordSort}) ON CONFLICT DO NOTHING`;

    // Insert mnemonic
    const mnemonic = scene.mnemonics.find(m => m.word_text === w.text);
    if (mnemonic) {
      await sql!`
        INSERT INTO mnemonics (word_id, keyword_text, scene_description, bridge_sentence)
        VALUES (${wordId}, ${mnemonic.keyword_text}, ${mnemonic.scene_description}, ${mnemonic.bridge_sentence})
      `;
    }

    console.log(`  Word: ${w.text} → ${w.meaning_en}`);
  }

  // 4. Insert dialogues
  for (let i = 0; i < scene.dialogues.length; i++) {
    const d = scene.dialogues[i];
    await sql!`
      INSERT INTO scene_dialogues (scene_id, sort_order, speaker, text_target, text_en)
      VALUES (${sceneId}, ${i + 1}, ${d.speaker}, ${d.text_target}, ${d.text_en})
    `;
  }

  // 5. Insert phrases
  for (let i = 0; i < scene.phrases.length; i++) {
    const p = scene.phrases[i];
    await sql!`
      INSERT INTO scene_phrases (scene_id, sort_order, text_target, text_en, literal_translation, usage_note)
      VALUES (${sceneId}, ${i + 1}, ${p.text_target}, ${p.text_en}, ${p.literal_translation}, ${p.usage_note})
    `;
  }

  console.log(`\nDone! Scene "${scene.title}" added to path ${pathId}`);
}

main().catch(console.error);
```

- [ ] **Step 4: Test with dry run**

```bash
cd "/Users/benji-m4/Documents/Code/WordZoo/WordZoo v1"
npx tsx scripts/generate-scene.ts --topic="food ordering" --language=Indonesian --path-id=c1000000-0001-4000-8000-000000000001 --dry-run
```

Expected: JSON output with 10 words, mnemonics, dialogues, and phrases about food ordering in Indonesian.

- [ ] **Step 5: Generate and insert a real scene**

```bash
npx tsx scripts/generate-scene.ts --topic="food ordering at a warung" --language=Indonesian --path-id=c1000000-0001-4000-8000-000000000001
```

- [ ] **Step 6: Verify with Playwright MCP**

1. Navigate to `localhost:8000/api/auth/test-login`
2. Go to `/paths` → click "Survival Indonesian"
3. New scene should appear in the scene list
4. Click the new scene → should load with dialogue flow
5. Words should have mnemonics with keyword text

- [ ] **Step 7: Commit**

```bash
git add lib/ai/content-generation.ts scripts/generate-scene.ts lib/ai/prompts.ts
git commit -m "feat: AI content generation pipeline for new scenes"
```

---

## Final Verification Checklist

After all phases, verify the complete user journey with Playwright MCP:

1. `localhost:8000/api/auth/test-login` → dashboard loads with mastery chart
2. Click "Paths" → `/paths` loads with path cards (NO login redirect)
3. Click "Survival Indonesian" → path detail shows 8+ scenes with completion status
4. Click next incomplete scene → learn page loads at correct word
5. Tap word card → transitions to mnemonic or quiz (NOT stuck)
6. Complete all words → "Next Scene →" button appears
7. Click "Next Scene →" → next scene loads
8. Navigate to `/review` → "Practice Now" available if no SRS items due
9. Click "Gallery" in nav → mnemonic images displayed in grid
10. Tap a gallery card → expands with scene description + pronunciation
11. Dashboard → mastery distribution bar + stats row
