# Phase 0 — Subtract: Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remove Community, Offline, and standalone Affix/Pattern exercises. Fold PhraseBreakdown inline into PhraseQuiz. Tighten the scene flow to `intro → dialogue → phrases → vocabulary → summary`.

**Architecture:** Each cut is surgical. Community and Offline are near-isolated (Premium-gated); the main coupling points are `app/(app)/layout.tsx` (SyncProvider/OfflineIndicator), `lib/onboarding/actions.ts` + `app/word/[wordId]/page.tsx` (use community-queries as a utility), and `components/learn/TravelPackCard.tsx` (OfflineBadge). Exercise cuts only touch `SceneFlowClient.tsx`. PhraseBreakdown becomes an inline reveal inside PhraseQuiz.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Neon Postgres (raw SQL via `@neondatabase/serverless`), Tailwind v4. No automated test framework — verification is `npm run build`, `npm run lint`, and Playwright MCP browser checks per CLAUDE.md convention.

**Reference to roadmap:** `/Users/benji-m4/.claude/plans/amazing-plan-out-making-dapper-meerkat.md`

---

## Pre-flight

- [ ] **Confirm dev server is not running on port 8000** (we'll start it for Playwright verification at the end)
- [ ] **Confirm clean working tree** (git status) — the current branch already has modifications from other work; we'll commit Phase 0 as its own series on top
- [ ] **Back up DB schema note:** tables we will DROP → `community_mnemonics`, `mnemonic_votes`, `mnemonic_flags`, `share_events`. Tables we KEEP even though they're in community-queries.ts's orbit → `referrals`, `mnemonic_feedback`.

---

## Chunk 1: Cut Community

**Scope:** Delete community UI, API routes, service, queries, types, and DB tables. Preserve two non-community helpers that live in `community-queries.ts` (`attributeReferralSignup`, `getMnemonicWordId`, `getPublicWordData`) by moving them into other files.

### Task 1.1: Preserve non-community helpers

**Files:**
- Create: `lib/db/public-queries.ts`
- Modify: `lib/onboarding/actions.ts` (import path)
- Modify: `app/word/[wordId]/page.tsx` (import path, simplify query usage)
- Modify: `app/word/[wordId]/opengraph-image.tsx` (import path, same simplification)

- [ ] **Step 1: Create `lib/db/public-queries.ts`** with these three functions moved from `lib/db/community-queries.ts`:
  - `getPublicWordData(wordId)` — **simplify** the LATERAL join so it no longer filters on `community_mnemonics`. Use the mnemonic with the highest `upvote_count` attached to the word instead of "approved community mnemonic." This keeps the public share page working without the community table.
  - `attributeReferralSignup(referrerId, newUserId)` — referrals table, unrelated to community.
  - `getMnemonicWordId(mnemonicId)` — simple util.
  - Keep the `PublicWordData` and `Referral` types (copy from community-queries.ts).

- [ ] **Step 2: Update imports**
  - `lib/onboarding/actions.ts:121` → `from '@/lib/db/public-queries'`
  - `app/word/[wordId]/page.tsx:4` → `from '@/lib/db/public-queries'`
  - Check `app/word/[wordId]/opengraph-image.tsx` for same import — update if present.

- [ ] **Step 3: Build** — `npm run build`. Expected: passes. If TypeScript errors about missing community types, they'll be resolved in Task 1.3.

### Task 1.2: Delete community UI, routes, service

**Files to DELETE (entire files/dirs):**
- `app/(app)/community/[wordId]/page.tsx`
- `app/(app)/community/[wordId]/CommunityClient.tsx`
- `app/(app)/community/` (the now-empty directory)
- `app/api/community/[wordId]/route.ts`
- `app/api/community/vote/route.ts`
- `app/api/community/flag/route.ts`
- `app/api/community/adopt/route.ts`
- `app/api/community/` (the now-empty directory)
- `components/community/SubmitMnemonicModal.tsx`
- `components/community/CommunityMnemonicCard.tsx`
- `components/community/VoteButton.tsx`
- `components/community/FlagButton.tsx`
- `components/community/ShareButton.tsx`
- `components/community/` (now-empty directory)
- `lib/services/community-service.ts`
- `lib/db/community-queries.ts`
- `types/community.ts`

- [ ] **Step 1: Delete files using `rm -rf` for each path above**

- [ ] **Step 2: Grep for any remaining references**
  - `grep -r "components/community" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "lib/db/community-queries" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "lib/services/community-service" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "types/community" app components lib --include='*.ts' --include='*.tsx'` — expect: none

### Task 1.3: Purge community references from remaining files

**Files:**
- Modify: `lib/db/schema.ts` (drop community table DDL)
- Modify: `lib/db/queries.ts` (any community joins, e.g., mnemonic listing)
- Modify: `lib/db/dialogue-data.ts` (grep matched; verify it's a rename false-positive; if not, simplify)
- Modify: `types/database.ts` (strip community-specific types)
- Modify: `lib/services/billing-service.ts` (remove `community_submission` permission if present)
- Modify: `lib/services/share-service.ts` (remove `share_events` insertions; service may become trivial — in that case delete it and remove callers)
- Modify: `app/api/share/[mnemonicId]/image/route.tsx` (remove community-submission gating if present; keep share image rendering)
- Modify: `CLAUDE.md` (remove the "community features" bullet from the description line)

- [ ] **Step 1:** For each file above, grep for `community|CommunityMnemonic|share_events` and remove the offending lines/blocks. Do not delete unrelated code.
- [ ] **Step 2:** For `share-service.ts`: if the only remaining function is a no-op wrapper, delete the file and remove its imports.
- [ ] **Step 3:** For `types/database.ts`: remove `CommunityMnemonic`, `CommunityMnemonicSubmission`, `MnemonicVote`, `MnemonicFlag`, `ShareEvent` (and any related types). Keep `MnemonicFeedback` — still used by admin.
- [ ] **Step 4:** `npm run lint` → expected pass. Fix any unused-import warnings created by the cuts.
- [ ] **Step 5:** `npm run build` → expected pass.

### Task 1.4: Drop community DB tables

**Files:**
- Create: `lib/db/migrations/drop-community-tables.sql`
- Modify: `lib/db/schema.ts` (remove the `CREATE TABLE` blocks for dropped tables so fresh migrations stay in sync)

- [ ] **Step 1:** Create migration file with:
  ```sql
  DROP TABLE IF EXISTS mnemonic_flags;
  DROP TABLE IF EXISTS mnemonic_votes;
  DROP TABLE IF EXISTS community_mnemonics;
  DROP TABLE IF EXISTS share_events;
  ```
  (Order matters only if there are FKs — drop dependents first.)

- [ ] **Step 2:** Remove the `CREATE TABLE IF NOT EXISTS community_mnemonics`, `mnemonic_votes`, `mnemonic_flags`, and `share_events` blocks from `lib/db/schema.ts` (approx line 198 onwards per earlier grep). Also remove any indexes on these tables.

- [ ] **Step 3:** Run migration: `npm run db:migrate`. Expected: "drop-community-tables" applied successfully.

- [ ] **Step 4:** Verify via Neon MCP: `mcp__neon__run_sql` with `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('community_mnemonics','mnemonic_votes','mnemonic_flags','share_events')`. Expected: zero rows.

### Task 1.5: Commit Chunk 1

- [ ] **Step 1:** `git add -A`
- [ ] **Step 2:**
  ```bash
  git commit -m "feat: remove community features (Phase 0 cut 1/4)

  Drops community submissions, voting, flagging, and share events.
  Preserves non-community helpers (referrals, public word data) in
  new lib/db/public-queries.ts. Simplifies public word data to rank
  by mnemonic upvote_count directly rather than via community table.

  Tables dropped: community_mnemonics, mnemonic_votes, mnemonic_flags,
  share_events. mnemonic_feedback retained for admin use."
  ```

---

## Chunk 2: Cut Offline Mode

**Scope:** Delete `lib/offline/`, all offline components, the service worker route, and the offline hook. Strip offline references from `app/(app)/layout.tsx` and `components/learn/TravelPackCard.tsx`. Add a one-time SW unregister so existing users aren't stuck with a stale cache.

### Task 2.1: Add SW cleanup shim

**Files:**
- Create: `components/system/UnregisterServiceWorker.tsx`
- Modify: `app/(app)/layout.tsx`

Rationale: users who already have the old service worker registered will continue serving stale chunks indefinitely unless we actively unregister. See MEMORY.md "Service Worker caching in dev" — the SW re-registers on every page load.

- [ ] **Step 1: Create the shim component**

```tsx
'use client';
import { useEffect } from 'react';

export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    // Best-effort: also purge caches left behind by the SW.
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);
  return null;
}
```

- [ ] **Step 2: Mount it in layout** — replace the current `SyncProvider` wrapping. New `app/(app)/layout.tsx` imports drop `OfflineIndicator` and `SyncProvider`; add `UnregisterServiceWorker`. The JSX becomes a plain fragment / div (no SyncProvider). Remove `<OfflineIndicator />` from the header.

- [ ] **Step 3:** `npm run build` → expected pass (the deleted imports haven't been removed yet from other files; if the build fails on missing offline/* imports, continue to Task 2.2 then retry).

### Task 2.2: Delete offline code

**Files to DELETE (entire files/dirs):**
- `lib/offline/sync.ts`
- `lib/offline/cache-manager.ts`
- `lib/offline/storage.ts`
- `lib/offline/download.ts`
- `lib/offline/sw-template.js`
- `lib/offline/` (empty dir)
- `components/offline/SyncProvider.tsx`
- `components/offline/InstallPrompt.tsx`
- `components/offline/OfflineBadge.tsx`
- `components/offline/OfflineMessage.tsx`
- `components/offline/OfflineIndicator.tsx`
- `components/offline/DownloadProgress.tsx`
- `components/offline/` (empty dir)
- `app/sw.js/` (entire dir — includes `route.ts`)
- `lib/hooks/usePackDownload.ts`
- `lib/hooks/useOnlineStatus.ts`
- `types/offline.ts`

- [ ] **Step 1:** Delete each path above.
- [ ] **Step 2:** Grep for remaining references:
  - `grep -r "components/offline" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "lib/offline" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "usePackDownload\|useOnlineStatus" app components lib --include='*.ts' --include='*.tsx'` — expect: none
  - `grep -r "types/offline" app components lib --include='*.ts' --include='*.tsx'` — expect: none

### Task 2.3: Strip offline from remaining files

**Files:**
- Modify: `components/learn/TravelPackCard.tsx` — remove `OfflineBadge` import (line 3) and the `<OfflineBadge pathId={path.id} />` usage (line 24). Remove any surrounding "available offline" UI.
- Modify: `lib/services/billing-service.ts` — remove `offline_download` permission check if present.
- Modify: `lib/db/queries.ts` and `lib/db/schema.ts` — remove any `offline_downloads` or `downloaded_packs` columns/tables if present (grep first).
- Modify: `CLAUDE.md` — remove "offline support" from description.

- [ ] **Step 1:** `grep -n "offline\|download" lib/services/billing-service.ts lib/db/queries.ts lib/db/schema.ts components/learn/TravelPackCard.tsx` — review matches and clean up only offline-specific ones. Leave `mnemonic` "download" or unrelated matches alone.
- [ ] **Step 2:** `npm run lint` → fix unused imports.
- [ ] **Step 3:** `npm run build` → expected pass.

### Task 2.4: Drop `public/sw.js` artifact and disable PWA manifest pieces

- [ ] **Step 1:** The git status shows `public/sw.js` is deleted but not committed — the deletion should be captured in Chunk 2's commit. Verify with `git status public/`.
- [ ] **Step 2:** Check `app/manifest.json` (or `app/manifest.ts`) for any `"display": "standalone"` or PWA-specific entries. Leave the web-app manifest in place (no harm), but ensure no service-worker registration path remains in client code.
- [ ] **Step 3:** Grep `navigator.serviceWorker.register` — should have zero matches after deletion.

### Task 2.5: Commit Chunk 2

- [ ] **Step 1:** `git add -A`
- [ ] **Step 2:**
  ```bash
  git commit -m "feat: remove offline mode and service worker (Phase 0 cut 2/4)

  Deletes lib/offline/, components/offline/, app/sw.js route, and
  offline-related hooks and types. Adds UnregisterServiceWorker
  shim in (app) layout so existing users get a one-time cleanup
  of the stale SW registration (MEMORY.md: SW persists across
  page loads and browser restarts).

  Offline mode was Premium-gated and incompatible with upcoming
  voice-first features. See docs/superpowers/plans/
  2026-04-21-phase-0-subtract.md for rationale."
  ```

---

## Chunk 3: Cut Affix & Pattern Exercises

**Scope:** Delete `AffixExercise.tsx` and `PatternExercise.tsx`. Remove `patterns` and `affixes` phases from `SceneFlowClient.tsx`. Keep underlying DB tables (`scene_patterns`, `scene_affixes`) so we can re-introduce them inline later without a migration churn.

### Task 3.1: Remove scene flow phases

**Files:**
- Modify: `components/learn/SceneFlowClient.tsx`

- [ ] **Step 1:** In `SceneFlowClient.tsx`:
  - Remove imports for `PatternExercise`, `AffixExercise`, `AffixReferenceCard` (line 14, 17, 18).
  - Remove the `ScenePatternExercise` and `AffixExerciseData` type imports (line 24) — keep `SceneDialogue`, `ScenePhraseWithMnemonics`, `UserSceneProgress` imports.
  - Remove `patternExercises` and `affixExercises` props from `SceneFlowClientProps` (lines 37–38).
  - Remove `'patterns'` and `'affixes'` variants from the `FlowState` type union (lines 55–56).
  - Update `initialStateFromProgress` signature — drop the `totalPatterns` and `totalAffixes` parameters.
  - Remove every switch-case branch that handles `phase === 'patterns'` or `phase === 'affixes'` (search the file top-to-bottom).
  - Update phase-transition logic: after `vocabulary` → `summary` (skip patterns/affixes entirely).
  - Remove any `AffixReferenceCard` mid-flow reference insertions.

- [ ] **Step 2:** Find the caller (`app/(app)/learn/[sceneId]/page.tsx`) and stop fetching/passing `patternExercises` and `affixExercises`:
  - Remove the corresponding DB query calls.
  - Remove the props passed to `<SceneFlowClient />`.
  - Leave the DB tables intact — only the reads are removed.

### Task 3.2: Delete exercise components

- [ ] **Step 1:** Delete `components/learn/AffixExercise.tsx`, `components/learn/PatternExercise.tsx`, `components/learn/AffixReferenceCard.tsx`.
- [ ] **Step 2:** `grep -r "AffixExercise\|PatternExercise\|AffixReferenceCard" app components lib --include='*.ts' --include='*.tsx'` — expect: zero matches.

### Task 3.3: Clean up progress persistence

**Files:**
- Modify: `app/api/scenes/[sceneId]/progress/route.ts` (if it persists `patterns` or `affixes` phase)
- Modify: `lib/db/queries.ts` (scene progress read)

- [ ] **Step 1:** Grep for `'patterns'` and `'affixes'` in these two files. If a user's existing `user_scene_progress` row has `phase = 'patterns'` or `'affixes'`, `SceneFlowClient` will crash on init. Add a normalization in `initialStateFromProgress` that maps those legacy phases to `'summary'` (treat them as completed).
- [ ] **Step 2:** `npm run build` → expected pass.
- [ ] **Step 3:** `npm run lint` → expected pass.

### Task 3.4: Commit Chunk 3

- [ ] **Step 1:** `git add -A`
- [ ] **Step 2:**
  ```bash
  git commit -m "feat: remove standalone affix and pattern exercises (Phase 0 cut 3/4)

  Deletes AffixExercise, PatternExercise, AffixReferenceCard. Trims
  SceneFlowClient from 7 phases to 5: intro → dialogue → phrases →
  vocabulary → summary. Existing users on legacy 'patterns'/'affixes'
  phases are normalized forward to 'summary' on next load.

  scene_patterns and scene_affixes tables are retained — data may
  resurface inline in a later phase. No migration needed."
  ```

---

## Chunk 4: Fold PhraseBreakdown Inline

**Scope:** Convert PhraseBreakdown from a standalone scene-flow step into an inline "explain" affordance within PhraseQuiz. Scene phrase flow goes from `show → breakdown → quiz` to `show → quiz (with inline explain)`.

### Task 4.1: Redesign PhraseQuiz with inline breakdown

**Files:**
- Modify: `components/learn/PhraseQuiz.tsx`
- Keep: `components/learn/PhraseBreakdown.tsx` — used as the embedded view

- [ ] **Step 1:** Add an `onExplain` / `showBreakdown` toggle to `PhraseQuiz`:
  - After a correct answer, show a small "Break it down" link.
  - Tapping it expands an inline render of `<PhraseBreakdown />` below the quiz result.
  - Before a correct answer, the breakdown is NOT available (the quiz must test recognition first).
  - Pass the same `phrase` + `wordMnemonics` props through from the parent.

- [ ] **Step 2:** Keep the `PhraseBreakdown` component interface stable so it still renders correctly when embedded.

### Task 4.2: Remove the standalone breakdown step from SceneFlow

**Files:**
- Modify: `components/learn/SceneFlowClient.tsx`

- [ ] **Step 1:** Change `phase: 'phrases'; phraseIndex: number; step: 'show' | 'breakdown' | 'quiz'` → `'show' | 'quiz'`.
- [ ] **Step 2:** Remove the case in the phase-transition switch that goes `show → breakdown`. New transition: `show → quiz`.
- [ ] **Step 3:** Remove the standalone `<PhraseBreakdown />` render branch from the flow; PhraseQuiz now owns it.
- [ ] **Step 4:** Normalize any existing user progress with `step: 'breakdown'` to `step: 'quiz'` in `initialStateFromProgress`.

### Task 4.3: Verify

- [ ] **Step 1:** `npm run build` → expected pass.
- [ ] **Step 2:** `npm run lint` → expected pass.

### Task 4.4: Commit Chunk 4

- [ ] **Step 1:** `git add -A`
- [ ] **Step 2:**
  ```bash
  git commit -m "feat: fold PhraseBreakdown inline into PhraseQuiz (Phase 0 cut 4/4)

  Removes the standalone breakdown step from scene flow. Breakdown
  is now an optional inline reveal after correctly answering the
  phrase quiz — recognition first, analysis second. Scene phrase
  substep narrows from show→breakdown→quiz to show→quiz."
  ```

---

## Final Verification (end-to-end Playwright check)

Follows CLAUDE.md post-change verification.

- [ ] **Step 1:** Start dev server — `npm run dev` (port 8000). Background it.
- [ ] **Step 2:** Playwright MCP: navigate to `http://localhost:8000/api/auth/test-login` → confirm redirect to authenticated dashboard.
- [ ] **Step 3:** Playwright MCP: on dashboard, verify "Continue Learning" card renders and there are no broken icons/links where community/offline used to be.
- [ ] **Step 4:** Playwright MCP: navigate to a learn scene. Verify flow is `intro → dialogue → phrases (show → quiz with inline breakdown option) → vocabulary (word → mnemonic → quiz) → summary`. No patterns or affixes phase.
- [ ] **Step 5:** Playwright MCP: verify header no longer shows `<OfflineIndicator />`.
- [ ] **Step 6:** Playwright MCP: in browser console, run `navigator.serviceWorker.getRegistrations().then(r => r.length)` — expect `0` (cleanup shim worked).
- [ ] **Step 7:** Playwright MCP: navigate to `/paths` — confirm PathCards still load and are clickable. No offline badges.
- [ ] **Step 8:** Playwright MCP: navigate to `/review` — confirm review flow loads.
- [ ] **Step 9:** Attempt to visit `/community/<any-id>` — expect 404.
- [ ] **Step 10:** Attempt to POST to `/api/community/vote` — expect 404.

If any step fails → fix, re-run the failing step, and amend only the affected chunk's commit (never force-push beyond that).

---

## Rollback Strategy

If any chunk causes issues after commit:

- **Chunk 1 (community):** `git revert <commit>` restores code. DB tables must be re-created from an older migration or a manual `CREATE TABLE` — but only if real user data was lost. Since community features were Premium-gated and low-volume, data loss is tolerable; just revert the code.
- **Chunk 2 (offline):** `git revert <commit>` restores code. The SW unregister shim is idempotent; no rollback action needed for users who already had it run.
- **Chunks 3 & 4 (exercises):** pure code changes, `git revert` is clean.

---

## Files Touched Summary

**Deleted (31 files):**
- 2 community pages + 4 community API routes (app/(app)/community/, app/api/community/)
- 5 community components, 1 community service, 1 community queries file, 1 community types file
- 5 offline lib files, 6 offline components, 1 SW route, 2 offline hooks, 1 offline types file
- 3 exercise components (AffixExercise, PatternExercise, AffixReferenceCard)

**Created (3 files):**
- `lib/db/public-queries.ts`
- `components/system/UnregisterServiceWorker.tsx`
- `lib/db/migrations/drop-community-tables.sql`

**Modified (approx 10 files):**
- `app/(app)/layout.tsx`, `app/word/[wordId]/page.tsx`, `app/word/[wordId]/opengraph-image.tsx`
- `components/learn/SceneFlowClient.tsx`, `components/learn/PhraseQuiz.tsx`, `components/learn/TravelPackCard.tsx`
- `app/(app)/learn/[sceneId]/page.tsx`, `app/api/scenes/[sceneId]/progress/route.ts`
- `lib/db/schema.ts`, `lib/db/queries.ts`, `lib/services/billing-service.ts`, `lib/onboarding/actions.ts`
- `CLAUDE.md`

**DB:** 4 tables dropped (community_mnemonics, mnemonic_votes, mnemonic_flags, share_events). No other schema changes.
