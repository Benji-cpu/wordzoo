# WordZoo — Product Evaluation (2026-08-02)

A red-team / blue-team review of the whole app: what's broken, why, and what to do.
Written after 7 weeks of dormancy. Phases 1–6 below were implemented and shipped
the same day; Phase 7 (owner actions) and Phase 8 (pedagogy) are still open.

---

## 1. Where things actually stood

`7a0c42e` (2026-06-12) was the last app-code commit. Every one of the ~50 commits
on `main` since is automated triage markdown, and roughly 80% of those are
`triage: missing digest` stubs reporting the same never-fixed failure.

The last successful digest (`digests/2026-07-31.json`):

```json
"feedback": { "byStatus": { "actioned": 138, "dismissed": 1 }, "newLast24h": 0 },
"health":   { "stuckMnemonicsLast72h": 1, "overdueReviews": 149 }
```

139 feedback rows lifetime, all from the founder's own accounts. Zero new in 24h.
`overdueReviews` flat at ~149 for six weeks — nobody is reviewing.

Confirmed with the owner: **the only real user is him, learning Indonesian.**
Four production blockers were all still live: Vercel Blob suspended,
`PEDAGOGY_V2_SLICES` unset, `RESEND_API_KEY` unset, and Stripe on the shared
VO2MAXBODY account (the last is deliberate and out of scope).

## 2. The finding that explains the rest

These weren't four independent problems. They were one causal chain, and it
started in the code:

```
Travel funnel runs full AI enrichment BEFORE Stripe checkout exists
      ↓  ~40 Gemini calls + ~40 images + ~40 TTS + ~80 Blob writes, per abandoned checkout
Blob quota blown on a Hobby plan
      ↓
Blob store suspended → every mnemonic image and every audio file 403s
      ↓
The core differentiator — visual keyword mnemonics — is INVISIBLE in production
      ↓
The app looks broken → no reason to use it → no feedback → nothing to report
      ↓
7 weeks of silence
```

`components/trip/TripCommit.tsx` called `POST /api/paths/travel` (which fired
`after(() => enrichPath(...))` over **every word in the path**) at line 36,
created the Stripe checkout session at line 56, and redirected to Stripe at
line 72. Abandon at the payment page and we ate 100% of the production cost
for $0. Nothing metered it.

**The consequence for sequencing: un-suspending Blob without fixing the spend
architecture would just refill and re-suspend it.** That ordering constraint
drove the whole plan.

## 3. The alignment gap

The build quality is not the problem. The mnemonic prompts in `lib/ai/prompts.ts`
are genuinely rigorous — they enforce the Atkinson keyword method, ban proper
names, demand visual co-equality between keyword and meaning, and state their own
acceptance test. The Leitner drill system works. The no-dead-ends principle is
applied consistently across empty states.

**The gap is that almost none of it is switched on.**

- Pedagogy v2 — batched intro, Leitner drills, production typing, cloze, 80%
  checkpoints, in-scene conversation; two months of work — is admin-only because
  `PEDAGOGY_V2_SLICES` is unset. Real users get the legacy
  `word → mnemonic → quiz` loop.
- The retention email system is fully wired and silently no-ops without
  `RESEND_API_KEY`.
- Those legacy lessons render without images, because Blob is suspended.

The product a new user would meet is the thinnest version of the app, with the
pictures missing.

---

## 4. Red team

### 4.1 Money leaks — FIXED (Phase 1–2)

| Leak | Where |
|---|---|
| Travel pack paid full AI cost before checkout existed | `TripCommit.tsx:36-72`, `paths/travel/route.ts:60` |
| `mnemonics/generate` (Gemini 8192 tok + image + Blob) had no `checkAccess` at all | `mnemonics/generate/route.ts:20` |
| `mnemonics/custom` free while the identical `/regenerate` cost a quota | `mnemonics/custom/route.ts:13` |
| `paths/travel` ungated while near-identical `paths/custom:44` was gated | `paths/travel/route.ts:14` |
| Rate limiter was an in-memory module-scope `Map` → per-lambda on Vercel, ceiling scaled with attacker concurrency, never evicted | `lib/rate-limit.ts:9-37` |
| `/api/trip/preview` ran Gemini unauthenticated | `trip/preview/route.ts:9` |
| Unmetered Gemini on conversation-grade, studio/suggestions, studio/chat, tutor/session, tutor/guided-session | various |
| `IntroduceBatch` fires `mnemonics/generate` **in parallel for every unenriched word in a scene** — the mechanism that fills Blob at scale | `IntroduceBatch.tsx:69-89` |

That last one plus `PEDAGOGY_V2_SLICES=*` was the loaded gun: `restructure`
activates `IntroduceBatch` for everyone.

### 4.2 Paid-content bypass — FIXED (Phase 3)

`/learn/[sceneId]` rendered the complete scene payload for **any** authenticated
user with no access check, while its API twin `/api/scenes/[sceneId]` had always
checked. The travel paywall was a client-side `isLocked` flag in `TripDashboard`
while the server serialized every scene id into the RSC payload. So the $4.99
pack — and every other user's private path — was readable by anyone who read a
UUID out of devtools.

The page then called `upsertUserPath()` on that path, enrolling the visitor in a
stranger's path and (because `upsertUserPath` marks every other path abandoned)
silently dropping their own.

`/api/studio/generate-callback` is middleware-bypassed and checked only
`metadata.userId && payment_status === 'paid'` — never the product type or the
amount. Any paid Stripe session could be replayed for a free $2.99 studio path.

### 4.3 Privacy — FIXED (Phase 5)

- `getPublicWordData`'s LATERAL had no `user_id IS NULL` filter. Since
  `upvote_count` is 0 everywhere, the `created_at DESC` tiebreak reliably
  surfaced whichever user most recently generated a mnemonic for that word —
  publishing their private mnemonic as the public share card and OG image.
- `deleteUserCascade` was `DELETE FROM users` with a comment falsely claiming
  everything cascaded. Five FKs are `ON DELETE SET NULL`, and for `mnemonics`
  that null **is the marker for global curated content** — so a GDPR erasure
  request promoted the user's private mnemonics into the shared pool.
- `/api/auth/test-login` was gated only on `NODE_ENV`, so on any Vercel preview
  deploy it minted a session for any email, creating the user if absent.
- `/api/admin/activity-feed` accepted `CRON_SECRET` via `?secret=` while
  returning every user's email. (It was also missing from the middleware bypass,
  so its documented Bearer auth never actually reached the handler.)
- Admin gating was duplicated inline across 10 sites and compared
  **case-sensitively**, while `billing-service` and `flags.ts` lowercased both
  sides — a mixed-case Google address bypassed premium limits while being denied
  the admin UI.

### 4.4 Pedagogy — STILL OPEN (Phase 8)

This is the honest critique, and it's the part that decides whether the product
is worth using.

**The SRS never punishes forgetting.** `lib/srs/engine.ts:65-69` — on `forgot`,
the interval resets to 1 but **the ease factor is untouched**. No lapse counter,
no leech detection, no learning steps (minimum interval is a full day), no
interval fuzz, no maximum cap. A word you forget ten times keeps EF 2.5 and
re-inflates 1 → 6 → 15 → 38 days. This is why `overdueReviews` only ever climbs.

**"Mastered" is a time bucket wearing an achievement's clothes** —
`interval_days >= 30`, reachable in about four correct answers.
`lib/pedagogy/mastery.ts` implements a real 5-stage ladder with retrieval-delay
checks; it has **zero importers** and no backing column.

**Review is self-graded and production-only.** `ReviewClient.tsx:167-168`
hardcodes `wordMode = 'production'`; the recognition direction exists in the
schema and is never used. Meanwhile the in-scene drills *are* objectively graded
and throw the granularity away — `SceneFlowClient.tsx:697` collapses everything
to `got_it | forgot`.

**The app collects the data to prove it works and never reads it.**
`pedagogy_events` has 30 event types, exactly one INSERT, and **zero SELECTs
anywhere in the codebase**. `times_correct` and `times_reviewed` sit on every row
and are never divided. The mnemonic prompt even states its own success criterion
— *"would someone seeing ONLY the generated image guess the word's meaning within
2 tries?"* — and nothing measures it. **There is no answer in this codebase to
"does WordZoo teach better than a flashcard app?"**

**Real feedback targets the pedagogy's core mechanism.** The dominant complaint
cluster is the mobile keyboard destroying cloze and production typing — the only
two *productive retrieval* modes in the app:

> "when the keyboard opens on mobile it's just kind of pushes everything away and
> it's hard to see" — feedback `724a2ed2`

And the single most damning report:

> "We seem to have hit an era where the learning stopped." — feedback `33e8819f`

Triage reconstructed it: ~83 minutes in one scene, the same 4 phrases cycling.
The Leitner queue working exactly as designed, and reading as infinite.

**Dead weight:** `ListeningExercise.tsx` (282 lines) has no importers, yet
`exercise-picker.ts` can still assign `listening` as an active cue — rendering a
recognition MCQ, labelling it *"hear & type"*, and crediting the learner for a
modality they were never tested in.

### 4.5 Operations — FIXED 2026-08-03

The nightly pipeline self-diagnosed the identical failure ~50 times without a
fix, generating commit noise that drowned the real history.

**Every one of those stubs blamed the wrong thing.** They said
`GITHUB_PAT_REPO_WRITE missing/expired` — the cause CLAUDE.md's playbook lists
first. The PAT was fine (verified: valid, `push: true` on `Benji-cpu/wordzoo`).

The real cause: `/api/cron/nightly-routine` had **no `maxDuration`**, so it ran
on the default ~10s budget while doing six sequential Neon round-trips plus two
GitHub API calls. It timed out before writing `digests/YYYY-MM-DD.json`, and the
agent — finding no digest — committed a stub. The tell was that failures were
*sporadic* (2026-07-18, 07-29 and 07-31 succeeded): an expired credential fails
every single day; a timeout doesn't.

Fixed in `1bbe394`: `maxDuration = 60`, and the six independent reads now run
under one `Promise.all`.

This also unblocks `health.spendLast24h` — the spend signal added in `bdbc49d`
rides on this digest, so until now it could never actually have been delivered.

---

## 5. What shipped today

| Commit | Content |
|---|---|
| `bdbc49d` | Durable spend guard (`spend_events` + atomic conditional insert), wired into 13 unmetered endpoints; travel enrichment deferred behind payment; shared admin helper; studio ownership check |
| `ba66be6` | `verifySceneAccess` honours purchases; learn-page IDOR closed; 4 missing route gates; Stripe callback hardened |
| `bd5c9a9` | Public mnemonic leak; account-deletion transaction; test-login gated on `VERCEL`; activity-feed Bearer-only; share-image IP limit; `words_learned` double-count; XP/hands-free caps |
| `46830ec` | Timeouts on every external call; `readJson` across 29 routes; guarded model-output `JSON.parse`; `sharp` declared; security headers; webhook retry |
| `1bbe394` | Nightly digest root cause (timeout, not the PAT); 39 handlers no longer return raw `error.message` to clients |
| `6712580` | Typo tolerance scaled to word length — a flat 2 edits was a free pass on short words ("voice" passed for "noite") |
| `e7622ab` | Measurement layer: `/admin/pedagogy`, nine aggregates, `srs_review_recorded` events (Phase 8 item 1) |
| `528c0a4` | Pronunciation stopped returning `close_enough` on mic-denied/unsupported/no-speech; review now alternates both directions |
| `72e8320` | SRS lapses cost ease, leeches capped, interval fuzz; phantom `listening` cue removed (Phase 8 items 3 and 6) |

**The spend guard is the load-bearing piece.** It claims budget with a single
atomic conditional INSERT, so N concurrent lambdas serialize through Postgres
instead of each seeing a fresh in-memory bucket. Verified against the live DB:

```
sequential, limit 3 (expect T,T,T,F,F): T,T,T,F,F
parallel x12, limit 4 -> granted: 4 (expect 4)
units 60+60 vs limit 100 (expect T,F): T,F
window expiry (expect T): T
```

Current budgets (per user per rolling window, admins exempt):

| kind | limit | window |
|---|---|---|
| `mnemonic_generate` | 60 | 24h |
| `path_enrich_word` | 250 | 24h |
| `conversation_grade` | 120 | 24h |
| `studio_chat` | 100 | 24h |
| `tutor_greeting` / `studio_suggestions` | 30 | 24h |
| `mnemonic_regenerate` | 20 | 24h |
| `mnemonic_custom` / `screenshot_upload` | 10 | 24h / 60min |
| `path_generate` | 5 | 24h |
| `trip_preview` (by IP, anonymous) | 3 | 60min |
| `share_image` (by IP, anonymous) | 60 | 60min |
| `xp_award` | 3000 units | 24h |

A per-kind 24h rollup now lands in the nightly digest under
`health.spendLast24h`. **That number is the go/no-go signal for un-suspending
Blob.**

---

## 6. Phase 7 — owner actions

Status verified 2026-08-03 via `vercel env ls production`.

- [x] **Blob store un-suspended.** Spot-checked several `mnemonics/*.webp` and
      `audio/words/*.mp3` URLs from the DB — all **200**. The visual-mnemonic
      differentiator is live again.
- [ ] **`RESEND_API_KEY` — still unset.** No prerequisites; the retention email
      system is fully wired and silently no-ops without it.
- [ ] **`PEDAGOGY_V2_SLICES` — still unset.** Every real user is still on the
      legacy `word → mnemonic → quiz` loop. The Blob precondition is now met.
      Set it to `restructure,production,cloze` — **not `*`**.
- [ ] **`GOOGLE_CLOUD_TTS_API_KEY` — missing from production entirely.** It is in
      CLAUDE.md's required list but absent from the Vercel env. Existing audio is
      pre-seeded so playback works, but any *new* TTS generation fails — which
      silently degrades every AI-generated path.
- [ ] **Re-enrich** any path left `partial` during the outage. Must run behind
      the spend guard; watch `health.spendLast24h`.

---

## 7. Phase 8 — the pedagogy backlog

Ranked by what actually moves the product. Status as of 2026-08-03.

1. [x] **Measure retention.** `e7622ab` — nine aggregates in
   `lib/db/pedagogy-queries.ts` and an `/admin/pedagogy` page, plus a
   server-emitted `srs_review_recorded` event so retention can be bucketed by
   the interval a review actually happened at. First numbers: 84.1% mean item
   accuracy against 94.2% drill accuracy, and all 209 overdue items in the 8d+
   bucket.
2. [ ] **Fix the mobile keyboard on cloze and production typing.** The dominant
   real feedback cluster, landing on the only two productive-retrieval modes.
   **Blocked on browser verification** — this is a viewport/layout fix that
   cannot be validated by reading code, and shipping speculative CSS to the
   exercises that carry the learning would be worse than leaving it.
3. [x] **Penalise lapses in the SRS.** `72e8320` — the SM-2 ease penalty now
   applies to `forgot`, but only from the review queue; in-scene and tutor
   misses are first-exposure stumbles and spare the ease. Leeches (>=8 reviews
   at <50% lifetime accuracy) are capped at 21 days instead of graduating.
   Added ±5% interval fuzz from 4 days up and a 365-day ceiling.
4. [ ] **Make "mastered" mean something.** `lib/pedagogy/mastery.ts` is still
   orphaned (zero importers, no `mastery_stage` column). Note that the
   `mastery` *flag* does gate something real — `recordIntroduce` in
   `VocabularyBlock` — so the flag and the module are unrelated. The in-flight
   can-do capability layer is the more likely home for this idea than reviving
   the module.
5. [ ] **Stop discarding drill granularity.** In-scene drills are objectively
   graded and collapse to `got_it | forgot`. Lower priority now that in-scene
   misses no longer charge ease (item 3), so the lost granularity costs much
   less than it did.
6. [x] **Fix the phantom `listening` cue.** `72e8320` — the picker could assign
   `listening`, which `DrillBlock` has no branch for, so it rendered a
   recognition MCQ under a "hear & type" header and credited the learner for a
   modality never tested. Root cause was `DrillBlock` flattening its
   `enabledCueTypes` prop to one boolean; the picker now takes the list and
   intersects it with `RENDERABLE_CUE_TYPES`. Same flattening also meant the
   `production` slice flag had no effect on the picker.

   `ListeningExercise.tsx` stays unwired on purpose: it carries its own local
   Levenshtein with a flat edit allowance, which would reintroduce the
   short-word free-pass fixed in `6712580`. Wiring it means moving it onto
   `fuzzyMatchAnswer` first.

## 8. Smaller known debt

- [x] `recordPhraseReview` was a verbatim copy-paste of `recordReview` — both
  now share one `schedule()` in `lib/srs/engine.ts` (`72e8320`).
- 202 `scene_pattern_exercises` rows are seeded and never rendered (the phase was
  cut; the seed data wasn't).
- `lib/db/expanded/` is a byte-for-byte duplicate of `lib/db/content/id/`.
- Six one-off `apply-*.ts` scripts exist because the main migration runner aborts
  on a pre-existing constraint conflict.
- Curriculum shortfall: `docs/curriculum-indonesian-a1-a2.md` specifies 10 units
  / 50 scenes / ~580 words. Shipped: 5 units / 34 scenes / 231 new words.
- The CSP ships as `Report-Only`. Promote it to enforcing once reports are clean.
