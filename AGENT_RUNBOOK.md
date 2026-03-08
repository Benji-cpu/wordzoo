# WordZoo — 4-Agent Build Runbook

This document is the master coordination guide. It assigns all 12 build prompts across 4 agents in 5 phases. Each agent gets its assignments, dependencies, and handoff instructions.

---

## Overview

| Agent | Name | Specialty | Total Prompts |
|-------|------|-----------|---------------|
| **A** | Architect | Infra, backend services, AI integrations | 4 |
| **B** | Engineer | Data, algorithms, audio, system internals | 3 |
| **C** | Designer | UI/UX, onboarding, social, monetization | 3 |
| **D** | Builder | Core app UI, learning screens | 2 |

```
Timeline:
         Phase 1      Phase 2      Phase 3       Phase 4      Phase 5
Agent A: Skeleton ──→ Mnemonic ──→ Paths ──────→ Tutor ─────→ Social
Agent B: Content ──→ SRS ───────→ Audio ────────→ (idle) ───→ Offline
Agent C: (idle) ───→ (idle) ────→ Onboarding ──→ (idle) ───→ Monetization
Agent D: (idle) ───→ (idle) ────→ Core UI ─────→ (idle) ───→ (idle)
```

---

## Phase 1 — Foundation

**Goal:** Project skeleton exists, content database is ready to import.
**Agents active:** A + B (in parallel)
**Blocking:** Everything in Phase 2+ depends on Phase 1.

### Agent A → Prompt 1: Project Skeleton & Infrastructure

**What to build:**
- Next.js 14+ project with App Router, TypeScript, Tailwind CSS
- Vercel Postgres database with full schema (users, words, mnemonics, user_words, paths, scenes, etc.)
- NextAuth.js authentication (Google + Apple + email magic link)
- Gemini API wrapper (`/lib/ai/gemini.ts`)
- Stability AI wrapper (`/lib/ai/stability.ts`)
- Vercel Blob storage setup
- API route stubs (no business logic yet)
- Seed script with 3 languages, 20 words each, sample paths
- Auth middleware + rate limiting middleware
- `.env.example` with all required environment variables

**Done when:**
- `npm run dev` starts without errors
- Database migrations run successfully
- Auth flow works (login/logout)
- Gemini wrapper can make a test call
- Stability AI wrapper can generate a test image
- Seed script populates the database
- All API route stubs return 501 (not implemented)

**Handoff to Phase 2:** Push to `main`. Agents C and D will pull from this foundation.

---

### Agent B → Prompt 2: Content Library

**What to build:**
- Frequency-ranked word lists for 3 languages: Indonesian, Spanish, Japanese
- Tier 1 (100 words + 30 phrases per language) grouped into thematic scenes
- Tier 2 (400 more words per language) grouped into scenes
- 3 travel packs: "2 Weeks in Bali," "2 Weeks in Mexico City," "2 Weeks in Tokyo"
- Each scene has 5-7 words + a narrative setup sentence
- Output as JSON files ready for database import

**Output format:** JSON files in `/data/`:
```
/data/
  indonesian.json
  spanish.json
  japanese.json
```

**Done when:**
- Each language has 500+ words with meanings, frequency ranks, parts of speech
- Words are grouped into scenes with narrative setups
- Travel packs have 80+ words organized by travel situations
- A seed/import script exists that loads these JSON files into the database schema from Prompt 1

**Handoff to Phase 2:** Merge into `main`. Agent A will use this content for mnemonic generation.

**NOTE:** This agent does NOT need the codebase to start. The JSON structure is defined in Prompt 2. Just follow the schema and produce the data files.

---

## Phase 2 — Core Engines

**Goal:** Mnemonic generation and spaced repetition work end-to-end.
**Agents active:** A + B (in parallel)
**Depends on:** Phase 1 complete (skeleton + content in `main`)
**Blocking:** Phase 3 depends on both of these.

### Agent A → Prompt 3: Mnemonic Generation Engine

**What to build:**
- `/lib/services/mnemonic-service.ts` with functions:
  - `generateMnemonic()` — calls Gemini for 3 keyword options, scenes, image prompts
  - `regenerateMnemonic()` — excludes previously seen keywords
  - `generateFromUserKeyword()` — user provides keyword, AI generates scene
  - `generateSceneImage()` — calls Stability AI, uploads to Vercel Blob
- API routes: `POST /api/mnemonics/generate`, `/regenerate`, `/custom`
- Gemini prompt engineering (keyword rules, absurdity guidelines, image prompt optimization)
- Pre-generated mnemonics for onboarding words (5 per language, hand-tuned)
- Content safety filtering on Gemini output

**Critical quality bar:** The mnemonics must be FUNNY and ABSURD. This is the product's core differentiator. Spend time on prompt engineering. Test with 20+ words and verify the images are memorable, not generic.

**Done when:**
- `POST /api/mnemonics/generate` with a word returns 3 mnemonic candidates with keywords, scenes, and images
- Images are stored in Vercel Blob and URLs are persisted in the database
- Regeneration correctly excludes previous keywords
- Custom keyword flow works
- Onboarding words have pre-generated, high-quality mnemonics

**Handoff:** Merge to `main`. Agents in Phase 3 will use this service.

---

### Agent B → Prompt 4: Spaced Repetition Engine

**What to build:**
- `/lib/srs/engine.ts` with modified SM-2 algorithm:
  - `calculateNextReview()` — takes interval, ease factor, rating → new schedule
  - `getDueWords()` — words where next_review_at <= now
  - `getDueWordsForContext()` — context-aware queries (session_start, pre_scene, conversation, comeback)
  - `getRetentionForecast()` — predict current retention per word using forgetting curve
  - `getComebackReport()` — returning user flow
  - `recordReview()` — update user_words with new SRS state
- API routes: `GET /api/reviews/due`, `POST /api/reviews/record`, `GET /api/reviews/comeback`, `GET /api/reviews/stats`
- Comprehensive unit tests for the algorithm (edge cases listed in prompt)

**Done when:**
- All SRS functions work correctly (verified by unit tests)
- API routes return correct data
- Comeback report generates meaningful predictions
- Tests pass for: first review, repeated failures, high ease factor, 30+ day absence, same-day reviews

**Handoff:** Merge to `main`. Path system and tutor will pull from SRS.

---

## Phase 3 — Learning Experience

**Goal:** Users can go through the full learning loop: onboarding → scenes → review.
**Agents active:** A + B + C + D (all four, in parallel)
**Depends on:** Phase 2 complete (mnemonic engine + SRS in `main`)
**Blocking:** Phase 4 depends on Phase 3.

### Agent A → Prompt 5: Path & Progression System

**What to build:**
- `/lib/services/path-service.ts`:
  - `getActivePath()`, `getNextScene()`, `getPathProgress()`
  - Pre-scene review gating (check SRS for overdue words before new scene)
  - Scene mastery rules (all words reviewed 2+ times → scene complete)
- `/lib/services/custom-path-service.ts`:
  - `generateCustomPath()` — Gemini generates word list from user input
  - `generateTravelPack()` — uses content library + Gemini additions
- Graduation system: `checkGraduation()` → final mixed review → celebration data
- API routes for paths, progress, custom generation, travel packs

**Integration points:**
- Pulls from SRS engine (Module 4) for pre-scene review words
- Triggers mnemonic generation (Module 3) when a scene is loaded for the first time
- Reads content library (Module 2) for pre-made paths

**Done when:**
- User can browse paths, see progress, advance through scenes
- Custom path generation works from a text prompt
- Pre-scene review gating blocks new content until reviews are done
- Graduation triggers when all scenes mastered + final quiz passes

---

### Agent B → Prompt 6: Audio Engine

**What to build:**
- `/lib/audio/pronunciation.ts` — word playback via Web Speech API or stored audio
- `/lib/audio/narration.ts` — TTS narration of mnemonic scenes
- `/lib/audio/scoring.ts` — pronunciation challenges using SpeechRecognition API
- `/lib/audio/hands-free.ts` — state machine for fully audio-driven learning sessions
- UI components: `<PronunciationButton>`, `<RepeatAfterMe>`, `<HandsFreeControls>`

**This is a standalone module.** It reads mnemonic data from the database but doesn't depend on other Phase 3 work. Build and test independently.

**Done when:**
- Words play pronunciation audio on tap
- Mnemonic scenes can be narrated via TTS
- Pronunciation scoring works for at least Indonesian and Spanish
- Hands-free mode plays through a word list without user interaction (except speaking)
- Graceful fallbacks for unsupported browsers/languages

---

### Agent C → Prompt 7: Onboarding & First Experience

**What to build:**
- `/app/(onboarding)/page.tsx` — the 60-second first experience
- Components: `LanguagePicker`, `WordReveal`, `MnemonicReveal`, `QuizCard`, `OnboardingComplete`
- localStorage state management (no account needed for first experience)
- Auto-play audio, pre-fetch images, zero loading spinners
- Post-onboarding: account creation → import localStorage progress → redirect to paths

**Critical UX bar:** This is the app's first impression. It must feel MAGICAL. Animations must be snappy, images must load instantly (pre-fetch during text animations), and the quiz must feel satisfying.

**Depends on:**
- Pre-generated onboarding mnemonics from Prompt 3 (should be in database already)
- Database + auth from Prompt 1

**Done when:**
- A new user can open the app, pick a language, learn 3 words with mnemonics, pass quizzes, and reach the signup screen — all in under 60 seconds
- No loading spinners visible during the flow
- Works on mobile Safari and Chrome
- "Maybe later" saves progress locally

---

### Agent D → Prompt 8: Core Learning UI

**What to build:**
- `/app/(app)/learn/[sceneId]/page.tsx` — scene view with word-by-word learning
- `/app/(app)/review/page.tsx` — SRS review session
- `/app/(app)/dashboard/page.tsx` — home screen (continue learning, quick review, progress)
- `/app/(app)/paths/page.tsx` — path browser + custom path creation
- Components: `WordCard`, `MnemonicCard`, `QuizOptions`, `ReviewCard`, `ProgressBar`, `RatingButtons`, `SceneSummary`, `StreakCounter`
- Recognition mode + production mode for review cards
- Swipe gestures on cards
- Dark mode default with glassmorphism card style

**This is the largest UI prompt.** Focus on:
1. Dashboard first (users need a home screen)
2. Scene view second (the core learning loop)
3. Review session third (SRS consumption)
4. Path browser last

**Depends on:**
- Path service (Prompt 5) — but can stub API responses and build UI first
- SRS engine (Prompt 4) — for review card ratings
- Mnemonic data (Prompt 3) — for card display

**Done when:**
- Full learning loop works: dashboard → pick path → learn scene → review cards → back to dashboard
- Review session correctly shows due words and records ratings
- UI feels polished on mobile (44px tap targets, swipe gestures, no jank)
- Pre-fetching prevents loading spinners during learning flow

---

## Phase 4 — Conversational AI

**Goal:** AI tutor works with comprehensible input.
**Agents active:** A only
**Depends on:** Phase 3 complete
**Blocking:** Phase 5 can start once tutor basics work.

### Agent A → Prompt 9: Conversational AI Tutor

**What to build:**
- `/lib/services/tutor-service.ts`:
  - `startSession()` with modes: free_chat, scenario, review, pronunciation
  - `sendMessage()` — streaming via Vercel AI SDK + Gemini
  - System prompt rebuilds before each response (includes user's known words + SRS due words)
  - `endSession()` → session summary
- Chat UI: `/app/(app)/tutor/page.tsx`
  - Streaming message display
  - Tap any foreign word → popover with meaning + pronunciation + mnemonic
  - Voice input via microphone button
  - Mode selection screen with scenario cards
- Conversation history management (last 20 messages)

**The tutor's system prompt is critical.** It must:
- List the user's known words (fetched from user_words)
- List SRS-due words (prioritized for use in conversation)
- Enforce the comprehensible input ratio based on user level
- Use recasting for corrections, not explicit correction

**Done when:**
- User can chat with the tutor in their target language
- Tutor uses mostly known words + introduces ~2 new words per message
- New words are bolded with translation on first use
- Tapping a foreign word shows meaning + mnemonic
- Streaming response feels responsive (<1s to first token)
- Session summary shows words reviewed and new words encountered

---

## Phase 5 — Growth & Polish

**Goal:** Sharing, offline mode, and monetization.
**Agents active:** A + B + C (in parallel)
**Depends on:** Phase 4 complete (or at least Phase 3 — these don't strictly need the tutor)

### Agent A → Prompt 10: Social & Sharing

**What to build:**
- Share card generation via Vercel OG (`/api/share/[mnemonicId]/image`)
- Two formats: square (1:1) and story (9:16)
- Web Share API integration
- Community gallery: `/app/(app)/community/[wordId]/page.tsx`
- Upvoting, "use this mnemonic" adoption, submission
- Public word page: `/word/[wordId]` with OG tags (acts as both preview and ad)
- Referral tracking via `?ref=` parameter
- Auto-moderation via Gemini for community submissions

**Done when:**
- User can share a mnemonic card to any app via share sheet
- Shared links show rich previews (OG tags with image)
- Community gallery shows user-submitted mnemonics sorted by votes
- Public word page works for non-logged-in visitors with onboarding CTA

---

### Agent B → Prompt 11: Offline Mode & Travel Pack Downloads

**What to build:**
- PWA setup via next-pwa (service worker, app manifest)
- IndexedDB storage via `idb` library (`/lib/offline/storage.ts`)
- Travel pack download pipeline: generate all mnemonics → images → audio → bundle to IndexedDB
- Download progress UI component
- Sync engine: queue offline review events, batch-sync when online
- Cache management: auto-cache viewed words, pre-fetch next 5, clean old cache
- Offline-aware UI indicators

**Done when:**
- App installs as PWA on mobile
- Travel pack downloads entirely for offline use with progress indicator
- Reviews work offline and sync when back online
- Offline indicator shows in nav when disconnected
- Cache manager keeps storage under 200MB

---

### Agent C → Prompt 12: Monetization & Paywalls

**What to build:**
- Feature gating service (`/lib/services/billing-service.ts`)
- Stripe integration: checkout sessions, webhooks, customer portal
- Free tier daily limits (5 words, 3 tutor messages, 5 min hands-free)
- Premium subscription ($9.99/month, $59.99/year)
- Travel pack one-time purchases ($4.99 each)
- Paywall UI: `<PaywallGate>`, `<UpgradePrompt>`, `<PricingPage>`, `<TravelPackCard>`
- Daily limit reset via Vercel Cron
- Database tables: subscriptions, purchases, daily_usage

**Paywall placement rules (critical):**
- NEVER gate onboarding
- NEVER interrupt mid-learning
- Show upgrade prompts AFTER completing a session, at natural break points
- Free tier must feel generous — conversion comes from wanting MORE, not from frustration

**Done when:**
- Free users hit daily limits and see upgrade prompts
- Stripe checkout works for both subscription and travel packs
- Webhooks correctly upgrade/downgrade users
- Premium users have unlimited access to all features
- Pricing page clearly shows free vs premium comparison

---

## Coordination Rules

### Git Workflow
- All agents work on `main` (or short-lived feature branches merged to `main`)
- Each phase merges before the next phase starts
- Within a phase, agents should work in separate directories to minimize merge conflicts:
  - Agent A: `/lib/services/`, `/api/`
  - Agent B: `/lib/srs/`, `/lib/audio/`, `/lib/offline/`, `/data/`
  - Agent C: `/app/(onboarding)/`, `/components/onboarding/`, `/components/billing/`
  - Agent D: `/app/(app)/`, `/components/learn/`, `/components/ui/`

### Shared Conventions
- All TypeScript, strict mode
- All API routes return `{ data, error }` shape
- All services are pure functions (no side effects except database writes)
- Error handling: never throw in API routes, always return proper HTTP status + error message
- Use Zod for input validation on all API routes
- Tailwind CSS for all styling (no CSS modules, no styled-components)
- All components are React Server Components by default; add `'use client'` only when needed

### Interface Contracts
When an agent needs data from another agent's module, use the interface contracts defined in `ARCHITECTURE.md`. If a dependency isn't built yet, create a mock/stub that returns realistic fake data so UI work can proceed.

### Quality Checklist (Every Agent, Every Phase)
- [ ] TypeScript compiles with no errors
- [ ] No `any` types (use `unknown` if truly needed)
- [ ] API routes validate input with Zod
- [ ] Error states handled (not just happy path)
- [ ] Mobile-responsive (test at 375px width)
- [ ] No hardcoded API keys or secrets
- [ ] No loading spinners during learning flows (pre-fetch instead)

---

## How to Hand Off a Prompt

When giving a prompt to an agent:

1. Share the **specific prompt** from `BUILD_PROMPTS.md` (e.g., Prompt 3)
2. Share the **agent assignment context** from this runbook (what phase, what depends on it)
3. Share the **relevant interface contracts** from `ARCHITECTURE.md` for modules it connects to
4. Tell the agent: "You are Agent [A/B/C/D]. Your current assignment is Phase [N], Prompt [X]. The codebase is at [repo URL]. Previous phases are complete and merged to main."

That's all they need. The prompts are self-contained.
