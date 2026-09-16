# Memory

Learned experience, gotchas, and session-to-session context for WordZoo.

## Playwright MCP Zombie Processes (2026-03-24)

Playwright MCP servers spawned via `npm exec @playwright/mcp` can become orphaned when Claude Code sessions end abruptly (terminal closed, crash, force-kill). These persist as zombie node + headless Chrome processes, accumulating across sessions and causing system sluggishness. Fix: `pkill -f "playwright-mcp"; pkill -f "mcp-chrome"`. If machine feels slow, check `ps aux | grep playwright | wc -l` first.

## Feedback status enum diverges (2026-05-05)

WordZoo's `app_feedback.status` is `'new' | 'reviewed' | 'actioned' | 'dismissed'`. The cross-project standard (from Ubudian) is `'new' | 'reviewed' | 'resolved' | 'dismissed'`. "Actioned" → "resolved" rename is on the roadmap; not blocking. When migrating, dual-read for one release before flipping the enum.

## Gemini free tier is 20 requests/DAY (2026-08-03)

Not per-minute — per day, per project, per model (`gemini-2.5-flash`). A full can-do generation pass over 40 Indonesian scenes cannot finish in one sitting; it died at scene 12. `generate-can-dos.ts --append` exists for exactly this: it keeps everything already in the content file and only generates for uncovered scenes. Any bulk generation script needs the same resumability.

**Bulk generation and the live tutor share that one quota.** Burning it on content generation is what broke the tutor mid-conversation ("Failed to send message") the same day — greeting succeeded, next turn 429'd. Run bulk scripts knowing they can take the tutor down for the rest of the day. `gemini-2.5-flash-lite` has a separate pool and still works when `2.5-flash` is dry; `gemini-2.0-flash` and `gemini-2.5-pro` are `limit: 0` on free tier (unusable). Real fix is enabling billing on the key.

## Can-do content status (2026-08-03)

46 can-dos seeded across 12 of 40 Indonesian scenes. The other 28 need `--append` on a fresh quota day, then a hand-edit pass. Scenes with no can-dos degrade silently (no card on the summary, nothing in the review queue) — that's intended, not a bug.

## Stuck-content checks in nightly digest

- `mnemonics.audio_url IS NULL AND created_at < now() - interval '72 hours'` flags TTS generation backlog. If this number trends up, investigate `db:seed-audio` job health.
- `user_words.next_review_date < now() - interval '2 days'` flags abandoned review queues — could indicate dropped re-engagement emails.

## Typed cues must own their reveal (2026-08-11)

`DrillBlock`/`PhraseDrillBlock`/`SceneCheckpoint` all react to a reported miss by mutating their queue, which re-keys and remounts the child. So `ProductionTyping`/`Cloze` report the miss only *after* the learner dismisses the reveal — reporting it when it happens tears the hint/answer off screen in the same tick and traps a learner who doesn't know the word in an endless re-queue. Don't "simplify" that deferral away.

## Brave can't do speech recognition at all (2026-08-11)

Brave ships `webkitSpeechRecognition` but holds no licence for Google's speech service, so `start()` succeeds and dies ~instantly with a `network` error — the mic visibly switches itself off. No Brave setting fixes it (the old hint pointing at "Use Google services for push messaging" was wrong; that toggle is FCM). Feature-detection alone therefore over-reports the capability: `lib/audio/speech-support.ts` learns it from the failure and latches it in `sessionStorage`. **Test all speaking/dictation features in Chrome, not Brave.**

## Scene "back" is card-level, owned by the intro components (2026-08-11)

`VocabularyBlock`/`PhraseBlock` only know slot landmarks (intro / drill / interlude), so back used to skip whole screens. `IntroduceBatch` and `PhraseIntroBatch` now register a `goBack` closure with their parent and rewind their own cards; the block only falls through to slot-level back at card 1. Backing out of a drill mounts the intro with `startAtEnd` (the handoff screen). A drill itself is not rewindable — answers are already in the queue and the SRS.

## 2026-09-16 audit — what was learned (see docs/audit-2026-09.md)

- **The retention "cliff" (94% → 56% at 4–7d) is in-scene re-meets, not reviews.** 192 of 193 `srs_review_recorded` rows are `source: scene`; nobody opened `/review` for five weeks. Don't read it as a scheduler fault.
- **A returning learner's queue could not drain** because a late correct answer got `interval × ease` regardless of the gap. Late-review credit + retention-first ordering fixed that; an "amnesty" that resets old items was deliberately NOT built.
- **The demo used gradient placeholders** while the landing showed the real illustration for the same word; the real Blob images + clips for all 9 demo words exist and are now used. `/try` is unauthenticated, so it can never call `/api/tts` — pass `audioUrl` or it is the browser voice.
- **The Playwright MCP browser is often locked by another session.** `tools/admin-browser` in ZenPasta has playwright-core + a headless shell; the walk scripts from this audit lived in the session scratchpad. `tests/e2e/learn-loop.spec.ts` is the durable version.
- **Dev-server renders are slow (10–20s on `/learn`)** on the first hit — give headless navigation 90s+, and `waitUntil: 'load'`, not `networkidle`.
- **`vercel env add` and `git push --delete` were blocked by the session's permission classifier** on 2026-09-16 — env changes and branch deletions go to Ben via the CRM. Five stale remote branches (`feature/claude-agent-nightly`, `feature/ui-polish-fox`, `feedback-triage-2026-05-05`, `feedback-triage-2026-05-06`, `fix/admin-email-typo`, all ≤2026-05-05) are still there.
- **Lint has 22 pre-existing `react-hooks` errors** (refs during render in `DrillProgressDots`, setState-in-effect in the drill blocks, `ConversationBlock`, `MnemonicCard`, `ReviewClient`, `WordCard`, `ChatInput`, `ThemeToggle`, `SpeakingSession`, `studio-service`) from the React 19 rules upgrade. `npm run lint` is red before you touch anything; compare counts, don't expect green.
- **Production can only be walked signed-OUT.** `/api/auth/test-login` 404s on Vercel by design and sign-in is Google-only, so every signed-in check has to run against the dev server on the production database; only `/`, `/try` and the auth redirects can be verified on the live URL.
- **Speech slice**: still off. Needs a human in Chrome (not Brave) walking a speak turn with the mic denied, unsupported and silent before it goes into `PEDAGOGY_V2_SLICES`.

## 2026-09-16 — the Brazilian Portuguese stream

- **A seeder cannot import anything that reaches `lib/db/client.ts`.** ES imports are hoisted above the seeder's own `dotenv.config()`, so `client.ts` reads `DATABASE_URL` while it is still unset and the script dies before its first line. This is what broke `seed-can-dos.ts`; `CAN_DO_DELAY_HOURS` now lives in `lib/db/can-do-delay.ts` with no DB import. Any future shared constant a seeder needs goes the same way.
- **Can-dos authored after a learner finished the scene never reach them** — the only unlock path fires at scene completion, which has already happened. `seed-can-dos.ts` now backfills `user_can_dos`, anchored to that scene's own `completed_at`, exactly as the live unlock is. It unlocked 12 rows on the first run.
- **`user_scene_progress` has no `started_at`,** and `user_paths` has no `is_active` — the status column is `status` (`active`/`abandoned`/`completed`), and `user_word_progress` does not exist (it is `user_words`). Read `information_schema` before writing a progress fixture.
- **Activating a path abandons every other active one** (`upsertUserPath`), by design — one active path per learner. It is non-destructive: `abandoned` keeps all progress rows and flipping back restores them.
- **Ben's account was on Indonesian with 0 scenes and 0 XP** since May, so the switch to Portuguese cost nothing. Do not assume the transcript's claim of existing progress — check.
- **`/trip` is a Bali-only acquisition funnel** (`destination: 'Bali'` hardcoded in `TripIntake.tsx`, Bali-specific `TRIP_USE_CASES`). It is a different product from the premade paths and was never destination-aware; CRM #357 holds the decision.
- **The gender/name onboarding modal already exists for Portuguese** ("Make Portuguese yours", obrigado/obrigada) — don't rebuild it; author gendered forms into `accept_notes` and usage notes and it handles the rest.
- **Verify a gated scene as `test@wordzoo.dev`, not as Ben.** Scenes unlock sequentially, so navigating straight to scene 17 silently redirects to scene 1 — it looks like a routing bug and is not. Grant the test user `completed_at` on the earlier scenes instead.
