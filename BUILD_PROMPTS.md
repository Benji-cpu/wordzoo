# WordZoo - Build Prompts

Hand each prompt below to a separate AI agent/designer. They are ordered by dependency — build them in sequence (or parallelize where noted).

**Stack decisions (apply to all prompts):**
- LLM/Text AI: Google Gemini API
- Image Generation: Stability AI
- Hosting: Vercel (frontend + serverless API routes)
- Database: Vercel Postgres (or Supabase)
- Frontend: Next.js (React) with mobile-responsive design (PWA first, native apps later)
- Auth: NextAuth.js
- File Storage: Vercel Blob or Cloudflare R2

---

## Prompt 1: Project Skeleton & Infrastructure

```
Build the foundational Next.js project for a language learning app called "WordZoo."

Tech stack:
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Vercel Postgres (via @vercel/postgres)
- NextAuth.js for authentication (Google + Apple + email magic link)
- Vercel Blob for file storage (images, audio)
- Deployed on Vercel

Set up the following:

1. Project structure:
   /app
     /api          → API routes (serverless functions)
     /(auth)       → login, signup pages
     /(app)        → main app pages (dashboard, learn, review, paths, tutor, settings)
     /layout.tsx   → root layout with auth provider
   /lib
     /db           → database client, schema definitions, migrations
     /services     → business logic services
     /ai           → Gemini and Stability AI client wrappers
     /srs          → spaced repetition algorithm
   /components     → shared UI components
   /types          → TypeScript type definitions
   /public         → static assets

2. Database schema (Vercel Postgres):

   users:
     id (uuid, PK), email, name, native_language (default 'en'),
     subscription_tier ('free' | 'premium'), created_at, updated_at,
     preferences (jsonb: { audio_speed, absurdity_level, hands_free_mode })

   languages:
     id (varchar, PK, e.g. 'id', 'es', 'ja'), name, flag_emoji, active (bool)

   words:
     id (uuid, PK), language_id (FK), text, romanization (nullable),
     meaning_en, part_of_speech, frequency_rank (int),
     pronunciation_audio_url (nullable), created_at

   phrases:
     id (uuid, PK), word_id (FK), text, meaning_en, audio_url (nullable)

   mnemonics:
     id (uuid, PK), word_id (FK), user_id (FK, nullable for defaults),
     keyword_text, scene_description, image_prompt,
     image_url (nullable), audio_narration_url (nullable),
     is_custom (bool), is_community (bool), upvote_count (int, default 0),
     created_at

   user_words:
     id (uuid, PK), user_id (FK), word_id (FK),
     status ('new' | 'learning' | 'reviewing' | 'mastered'),
     current_mnemonic_id (FK to mnemonics),
     ease_factor (float, default 2.5), interval_days (int, default 0),
     next_review_at (timestamp), times_reviewed (int), times_correct (int),
     last_reviewed_at (timestamp), direction ('recognition' | 'production' | 'both'),
     UNIQUE(user_id, word_id)

   paths:
     id (uuid, PK), language_id (FK), type ('premade' | 'custom' | 'travel'),
     title, description, created_by (FK to users, nullable),
     created_at

   path_words:
     path_id (FK), word_id (FK), scene_group (varchar), sort_order (int),
     PRIMARY KEY (path_id, word_id)

   scenes:
     id (uuid, PK), path_id (FK), title, narrative_setup,
     combined_scene_image_url (nullable), sort_order (int)

   scene_words:
     scene_id (FK), word_id (FK), sort_order (int),
     PRIMARY KEY (scene_id, word_id)

3. AI client wrappers:
   /lib/ai/gemini.ts — wrapper around Google Gemini API
     - initGeminiClient()
     - generateText(prompt, options?) → string
     - generateChat(messages[], systemPrompt) → stream
     - Export typed interfaces for all responses

   /lib/ai/stability.ts — wrapper around Stability AI API
     - generateImage(prompt, style?, dimensions?) → imageUrl
     - Handle uploading result to Vercel Blob and returning the public URL

4. API route stubs (just the route files with input validation, no business logic yet):
   /api/auth/[...nextauth]
   /api/words/[languageId]
   /api/mnemonics/generate
   /api/mnemonics/regenerate
   /api/mnemonics/custom
   /api/paths/[languageId]
   /api/paths/custom
   /api/reviews/due
   /api/reviews/record
   /api/tutor/session
   /api/tutor/message

5. Environment variables needed (.env.example):
   DATABASE_URL, GOOGLE_GEMINI_API_KEY, STABILITY_AI_API_KEY,
   NEXTAUTH_SECRET, NEXTAUTH_URL,
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
   APPLE_CLIENT_ID, APPLE_CLIENT_SECRET,
   BLOB_READ_WRITE_TOKEN

6. Basic middleware:
   - Auth middleware (protect /api/* routes except auth)
   - Rate limiting on AI generation endpoints (10 req/min for free tier)

7. Seed script (/lib/db/seed.ts):
   - Add 3 languages: Indonesian, Spanish, Japanese
   - Add 20 sample words per language (frequency-ranked, with meanings)
   - Add 1 sample path per language with 3 scenes of 5-7 words each

Don't build any UI yet. Just the skeleton, database, AI wrappers, and API stubs.
Focus on clean types, proper error handling, and a solid foundation.
```

---

## Prompt 2: Content Library & Word Database

```
You are building the content database for WordZoo, a language learning app that uses
mnemonic imagery to teach vocabulary.

Your job: Create comprehensive, frequency-ranked word/phrase lists for 3 launch languages,
organized into thematic scenes.

For each language (Indonesian, Spanish, Japanese), create:

1. TIER 1 — Survival (Top 100 words + 30 essential phrases)
   Group into scenes of 5-7 words each. Each scene represents a real-life situation.

   Required scenes (adapt per language/culture):
   - "Meeting Someone" (greetings, introductions, pleasantries)
   - "Finding Your Way" (directions, locations, transport)
   - "Getting Food" (ordering, common foods, drinks, paying)
   - "Shopping" (prices, numbers, colors, sizes)
   - "Emergency" (help, doctor, police, pain, lost)
   - "At the Hotel" (room, key, bathroom, wifi, checkout)
   - "Small Talk" (weather, family, work, hobbies)
   - "Time & Numbers" (days, months, counting, time expressions)

   For each word/phrase provide:
   - The word in the target language
   - Romanization (for Japanese only)
   - English meaning
   - Part of speech
   - Frequency rank (use OpenSubtitles or similar corpus data)
   - A sample sentence using the word
   - Whether it's a standalone word or part of a common phrase

2. TIER 2 — Conversational (next 400 words, reaching ~500 total)
   Same scene-based grouping. Add scenes for:
   - "Feelings & Opinions"
   - "Making Plans"
   - "Describing Things"
   - "At Work"
   - "Technology & Internet"
   - "Health & Body"

3. TRAVEL PACKS — Create a curated 80-word pack for:
   - "2 Weeks in Bali" (Indonesian)
   - "2 Weeks in Mexico City" (Spanish)
   - "2 Weeks in Tokyo" (Japanese)

   Organized by travel situations:
   - Airport & Immigration
   - Getting Around (taxi, train, walking)
   - Restaurants & Street Food
   - Hotel & Accommodation
   - Shopping & Markets
   - Sightseeing & Activities
   - Emergency & Health

   Include culture-specific phrases (e.g., "permisi" in Indonesian,
   "sumimasen" in Japanese for its many contextual uses).

4. For each scene, write a brief narrative setup (1-2 sentences) that sets the situation:
   Example: "You've just landed in Bali and need to get to your hotel.
   The taxi driver doesn't speak much English."

Output format: JSON files, one per language, structured as:

{
  "language": "Indonesian",
  "language_code": "id",
  "tiers": [
    {
      "tier": 1,
      "name": "Survival",
      "scenes": [
        {
          "title": "Meeting Someone",
          "narrative": "You bump into a friendly local at a coffee shop in Jakarta...",
          "words": [
            {
              "text": "selamat pagi",
              "romanization": null,
              "meaning": "good morning",
              "part_of_speech": "phrase",
              "frequency_rank": 15,
              "sample_sentence": "Selamat pagi, apa kabar?",
              "is_phrase": true
            }
          ]
        }
      ]
    }
  ],
  "travel_packs": [
    {
      "title": "2 Weeks in Bali",
      "situations": [...]
    }
  ]
}

Focus on practical, high-frequency words that a real traveler or beginner
would actually need. Avoid textbook-only words. Prefer colloquial over formal
where appropriate.
```

---

## Prompt 3: Mnemonic Generation Engine

```
Build the mnemonic generation engine for WordZoo. This is the creative core of the app —
it takes a foreign word and produces a memorable keyword association, vivid scene, and
image prompt.

Tech: Google Gemini API, TypeScript, runs as serverless functions on Vercel.

Build these functions in /lib/services/mnemonic-service.ts:

1. generateMnemonic(word, meaning, language, nativeLanguage = 'en')
   → Returns: { keywords: MnemonicCandidate[], recommended: number }

   A MnemonicCandidate contains:
   - keyword: string (the English sound-alike word)
   - phoneticLink: string (how the foreign word sounds like the keyword)
   - sceneDescription: string (vivid, absurd scene connecting keyword to meaning)
   - imagePrompt: string (optimized for Stability AI)

   The function should:
   a) Call Gemini to generate 3 keyword options per word
   b) For each keyword, generate a scene and image prompt
   c) Rank by estimated memorability (absurdity + clarity of meaning connection)

2. regenerateMnemonic(word, meaning, language, nativeLanguage, excludeKeywords[])
   → Same as above but explicitly avoids previously seen keywords

3. generateFromUserKeyword(word, meaning, userKeyword)
   → Takes the user's own keyword and generates scene + image prompt for it

4. generateSceneImage(imagePrompt)
   → Calls Stability AI and returns the image URL

Gemini Prompt Engineering (this is critical — the quality of the app lives or dies here):

The system prompt for mnemonic generation should enforce these rules:

KEYWORD RULES:
- The keyword must be a common English word or short phrase (max 3 words)
- It must sound like the foreign word (phonetic similarity, not spelling)
- Partial sound matches are OK ("kucing" → "couching" — the "cu-cing" maps to "couch-ing")
- For multi-syllable words, the keyword can match the most distinctive syllable
- For phrases, create one keyword for the whole phrase OR one per word, whichever is more natural

SCENE RULES:
- The scene MUST visually connect the keyword to the meaning. If someone sees the image
  without any text, the keyword and meaning should both be visually present.
- Make it ABSURD. Memory research shows bizarre images stick 2-3x better.
  Apply these techniques:
  * Scale distortion (giant cats, tiny buildings)
  * Impossible actions (fish driving cars, trees walking)
  * Emotional intensity (explosions, chases, dramatic moments)
  * Humor (slapstick, unexpected situations)
- Keep the scene simple enough to be captured in a single image (one focal point)
- Scene description should be 2-3 sentences max

IMAGE PROMPT RULES:
- Optimize for Stability AI's style
- Art style: bright, saturated colors, semi-cartoonish illustration style,
  NOT photorealistic
- Include: "no text, no words, no letters, no writing" (AI image gen adds random text)
- Include composition direction: "centered composition, single focal point"
- Always specify the art style: "digital illustration, vibrant colors, slightly surreal"
- Max 75 words for the prompt

EXAMPLE OUTPUT:
Word: "kucing" (Indonesian for "cat")
{
  "keyword": "couching",
  "phoneticLink": "KOO-ching sounds like couching",
  "sceneDescription": "A massive orange tabby cat violently shoving a couch through a
   living room wall while terrified people dive out of the way. The cat wears a tiny
   moving company hat and has a determined expression.",
  "imagePrompt": "A giant orange tabby cat pushing an oversized couch through a
   crumbling wall, people diving away in panic, cat wearing a small hat, digital
   illustration, vibrant colors, slightly surreal, centered composition, single focal
   point, no text no words no letters"
}

Also build the API routes:
- POST /api/mnemonics/generate — takes { wordId } or { word, meaning, language }
- POST /api/mnemonics/regenerate — takes { wordId, excludeKeywords[] }
- POST /api/mnemonics/custom — takes { wordId, userKeyword }

Each route should:
1. Generate the mnemonic via Gemini
2. Generate the image via Stability AI
3. Store the mnemonic + image URL in the database
4. Return the complete mnemonic object

Include error handling for API failures, rate limiting, and content safety filtering
(reject any Gemini output that contains slurs, explicit content, or offensive stereotypes).

For the "recommended first words" (used in onboarding), pre-generate and cache 5
mnemonics per language — these should be the most impressive, funny, and memorable
ones. Hand-tune the prompts for these if needed.
```

---

## Prompt 4: Spaced Repetition Engine

```
Build the spaced repetition system (SRS) for WordZoo. This module schedules when
users should review words and tracks their mastery progress.

Tech: TypeScript, runs in Vercel serverless functions, reads/writes to Vercel Postgres.

KEY DESIGN PRINCIPLE: The SRS should be INVISIBLE to users. No "review queue" UI.
Other modules (paths, tutor, onboarding) pull from SRS to decide what to surface.
The user never sees "47 cards due" — instead they see "before we learn restaurant
words, let's check if you remember greetings."

Build in /lib/srs/engine.ts:

1. ALGORITHM — Modified SM-2:

   function calculateNextReview(
     currentInterval: number,    // days
     easeFactor: number,         // starts at 2.5
     rating: 'instant' | 'got_it' | 'hard' | 'forgot'
   ): { newInterval: number, newEaseFactor: number, nextReviewAt: Date }

   Rating mapping:
   - 'instant' (quality=5): user knew it immediately
   - 'got_it' (quality=4): user remembered after brief thought
   - 'hard' (quality=3): user struggled but got it
   - 'forgot' (quality=0): user didn't remember

   Interval progression for correct answers:
   - First correct: 1 day
   - Second correct: 3 days
   - Third correct: 7 days
   - After that: previous_interval * ease_factor

   On 'forgot':
   - Reset interval to 1 day (NOT to 10 minutes — the keyword method means
     re-learning is faster than initial learning)
   - Reduce ease factor by 0.2 (floor at 1.3)
   - DON'T reset the mnemonic — the association is still useful

   On 'hard':
   - Keep current interval (don't advance)
   - Reduce ease factor by 0.1 (floor at 1.3)

   Ease factor adjustments:
   - 'instant': ease + 0.15
   - 'got_it': ease + 0.05
   - 'hard': ease - 0.10
   - 'forgot': ease - 0.20

2. QUERY FUNCTIONS:

   getDueWords(userId, limit = 10): UserWord[]
     → Words where next_review_at <= now, ordered by most overdue first

   getDueWordsForContext(userId, context): UserWord[]
     Context types:
     - 'session_start': up to 5 words, mix of overdue + coming-due-today
     - 'pre_scene': words from the previous scene that are due or almost due
     - 'conversation': 3-5 words to weave into tutor conversation
     - 'comeback': ALL words, sorted by predicted retention (see below)

   getRetentionForecast(userId): { wordId, predictedRetention, daysSinceReview }[]
     → For each learned word, estimate current retention using:
       R = e^(-t/S) where t = days since review, S = stability (derived from interval)

3. COMEBACK LOGIC:

   getComebackReport(userId): ComebackReport
     When a user returns after absence:
     a) Calculate predicted retention for all learned words
     b) Select 10 words spanning the retention range
        (mix of "probably still knows" and "probably forgot")
     c) Return a quick-test set with predicted vs actual comparison

   ComebackReport = {
     daysSinceLastSession: number,
     totalWordsLearned: number,
     predictedRetained: number,
     testWords: { wordId, predictedRetention }[],
     // After test:
     actualRetained?: number,
     message?: string  // "You remembered 8/10! The keyword method works."
   }

4. REVIEW RECORDING:

   recordReview(userId, wordId, direction, rating): ReviewResult
     - Update user_words row with new interval, ease_factor, next_review_at
     - Increment times_reviewed (and times_correct if not 'forgot')
     - Update last_reviewed_at
     - If word has been reviewed 5+ times with no 'forgot': status = 'mastered'
     - If word is 'new' and gets first review: status = 'learning'
     - If word is 'learning' and passes 2 reviews: status = 'reviewing'

   ReviewResult = {
     newStatus: WordStatus,
     nextReviewAt: Date,
     currentStreak: number,
     masteredToday: boolean  // for celebration triggers
   }

5. API ROUTES:

   GET /api/reviews/due?context=session_start
     → Returns due words with their mnemonics attached

   POST /api/reviews/record
     Body: { wordId, direction: 'recognition' | 'production', rating }
     → Records the review and returns updated state

   GET /api/reviews/comeback
     → Returns comeback report for the current user

   GET /api/reviews/stats
     → Returns { totalLearned, totalMastered, currentStreak, longestStreak,
        retentionRate, wordsReviewedToday }

Include comprehensive unit tests for the SM-2 algorithm with edge cases:
- First review of a new word
- Word that keeps getting 'forgot'
- Word with very high ease factor
- Comeback after 30+ days
- Multiple reviews in same day
```

---

## Prompt 5: Learning Path & Progression System

```
Build the learning path and progression system for WordZoo. This controls what
the user learns next, how content is organized into scenes, and when users "graduate."

Tech: TypeScript, Next.js API routes on Vercel, Vercel Postgres.

BUILD THESE COMPONENTS:

1. PATH SERVICE (/lib/services/path-service.ts):

   getActivePath(userId): Path
     → Returns the user's current active path with progress info

   getNextScene(userId, pathId): Scene | GraduationEvent
     → If current scene is mastered, return next scene
     → If all scenes mastered, trigger graduation
     → Include the words, their mnemonics, and the narrative setup

   getPathProgress(userId, pathId): PathProgress
     → { completedScenes, totalScenes, wordsLearned, wordsMastered, percentComplete }

   Scene mastery rules:
   - A word is "scene-mastered" when its status is 'reviewing' or 'mastered'
     (meaning it has passed at least 2 successful reviews)
   - A scene is "mastered" when ALL its words are scene-mastered
   - The next scene unlocks when the current scene is mastered

2. CUSTOM PATH GENERATION (/lib/services/custom-path-service.ts):

   generateCustomPath(userId, userInput: string): Path
     → User types something like "I'm going to a wedding in Jakarta"
     → Call Gemini to:
       a) Extract context (topic, location, formality, situations)
       b) Generate 20-30 relevant words/phrases in the target language
       c) Group them into 4-5 scenes with narrative setups
     → Save as a new path in the database
     → DO NOT generate mnemonics yet (those are generated when the user
        reaches each word, to save API costs)

   generateTravelPack(userId, destination, duration, language): Path
     → Similar to custom but uses the pre-built travel word lists from
        the content library as a base
     → Adds destination-specific words via Gemini
     → Includes a countdown: "Learn X words/day to finish before your trip"

3. GRADUATION SYSTEM:

   checkGraduation(userId, pathId): GraduationResult | null
     → Checks if all scenes in the path are mastered
     → If yes, triggers a final mixed review: 15 random words from the path
     → User must score >80% to graduate
     → Returns graduation data for the celebration UI

   GraduationResult = {
     pathTitle: string,
     totalWords: number,
     totalDays: number,
     accuracy: number,
     celebrationMessage: string,  // "You've mastered Survival Indonesian!"
     shareCard: { imageUrl, text },
     nextPathSuggestion: Path | null
   }

4. SCENE PRESENTATION:

   getSceneForLearning(userId, sceneId): SceneLearningData
     → Returns the scene's words in learning order
     → For each word: check if mnemonic exists, if not trigger generation
     → Include the narrative setup
     → Include any SRS-due words from PREVIOUS scenes that should be
        reviewed before starting (get from SRS engine, max 3-5 words)

   SceneLearningData = {
     scene: Scene,
     narrativeSetup: string,
     wordsToLearn: WordWithMnemonic[],
     reviewFirst: WordWithMnemonic[],  // due words from earlier scenes
     sceneNumber: number,
     totalScenes: number
   }

5. API ROUTES:

   GET /api/paths/:languageId
     → List available paths for a language (premade + user's custom)

   GET /api/paths/:pathId/progress
     → Current progress on a path

   GET /api/paths/:pathId/next-scene
     → Get the next scene to learn (with review-first words)

   POST /api/paths/custom
     Body: { userInput, languageId }
     → Generate a custom path

   POST /api/paths/travel
     Body: { destination, duration, languageId }
     → Generate a travel pack

   GET /api/paths/:pathId/graduation
     → Check graduation eligibility and get graduation data

6. PRE-SCENE REVIEW GATING:

   Before presenting a new scene, the system should check if there are
   overdue words from previous scenes. If >5 words are overdue, show a
   quick review round first. Frame it positively:

   "Before we learn restaurant words, let's make sure your greetings
   are locked in. Quick check:"
   [show 3-5 review cards]
   "Perfect! Now let's learn how to order food."

   This is NOT optional — it's how SRS stays invisible. The user thinks
   they're progressing through a story. They don't realize they're doing
   spaced repetition.
```

---

## Prompt 6: Audio Engine

```
Build the audio system for WordZoo — pronunciation playback, mnemonic narration,
speech recognition for pronunciation practice, and hands-free learning mode.

Tech: TypeScript, Next.js, Web Speech API (browser-native), Google Cloud TTS
or browser TTS as fallback, Vercel serverless functions.

BUILD THESE COMPONENTS:

1. PRONUNCIATION PLAYBACK (/lib/audio/pronunciation.ts):

   playWordPronunciation(wordId): void
     → If word has a pronunciation_audio_url, play that
     → Otherwise, use browser SpeechSynthesis with the correct language voice
     → For Japanese, ensure proper pitch accent (use a quality TTS voice)

   setPlaybackSpeed(speed: 0.5 | 0.75 | 1.0): void
     → Slow playback for beginners

2. MNEMONIC NARRATION (/lib/audio/narration.ts):

   narrateMnemonic(mnemonic: Mnemonic): void
     → Speak: "It sounds like [keyword]..."
     → Pause 0.5s
     → Speak the scene description
     → Use a friendly, slightly playful voice
     → Use browser TTS (SpeechSynthesis) — no API cost

3. PRONUNCIATION SCORING (/lib/audio/scoring.ts):

   startPronunciationChallenge(wordId): PronunciationChallenge
     → Play the target word
     → Start recording user's voice (MediaRecorder API)
     → On stop, process the recording

   scorePronunciation(audioBlob, targetWord, language): PronunciationResult
     → Use Web Speech API (SpeechRecognition) to transcribe user's speech
     → Compare transcription to target word
     → Score: 'close_enough' | 'getting_there' | 'try_again'
     → Provide brief, encouraging feedback

   PronunciationResult = {
     score: 'close_enough' | 'getting_there' | 'try_again',
     transcription: string,     // what the system heard
     feedback: string,          // "Great! Try emphasizing the second syllable"
     targetWord: string
   }

   Scoring rules:
   - 'close_enough': transcription matches or is phonetically very similar
   - 'getting_there': partially correct
   - 'try_again': not recognizable as the target word
   - Be GENEROUS with scoring — the goal is confidence building, not perfection

4. HANDS-FREE MODE (/lib/audio/hands-free.ts):

   This is a major feature. Build a state machine that drives an entirely
   audio-based learning session.

   HandsFreeSession state machine:
   States: idle → playing_word → playing_mnemonic → waiting_for_repeat →
           scoring → giving_feedback → next_word → session_complete

   startHandsFreeSession(wordIds[]): HandsFreeSession
     → Takes a list of words to cycle through
     → Auto-advances through the flow:

     For each word:
       1. "Next word. Listen:" → play foreign word pronunciation
       2. Pause 1s
       3. "It means [English meaning]." → speak
       4. "The keyword is [keyword]." → speak
       5. "Imagine:" → speak scene description
       6. Pause 1s
       7. "Now you say it: [foreign word]" → play pronunciation again
       8. Listen for user speech (5 second timeout)
       9. Score pronunciation
       10. Feedback: "Nice!" or "Try again:" → replay word
       11. If 'try_again', give one more attempt, then move on with encouragement
       12. → Next word

   pauseHandsFree(): void
   resumeHandsFree(): void
   stopHandsFree(): SessionSummary
     → Returns { wordsAttempted, pronunciationScores, duration }

5. AUDIO UI COMPONENTS (/components/audio/):

   <PronunciationButton wordId={id} />
     → Tap to hear the word. Shows a speaker icon with ripple animation while playing.

   <RepeatAfterMe wordId={id} onResult={fn} />
     → Shows microphone icon. Tap to record, tap again to stop.
     → Shows score with animation after processing.

   <HandsFreeControls session={session} />
     → Play/pause/stop controls for hands-free mode.
     → Shows current word and progress.
     → Works on lock screen (Media Session API).

6. IMPORTANT CONSIDERATIONS:
   - Request microphone permission only when user initiates pronunciation practice
   - Handle permission denial gracefully ("Pronunciation practice needs your mic.
     You can still learn without it!")
   - Audio should not auto-play on first page load (browser policy). First interaction
     must be user-initiated, then subsequent auto-play is fine.
   - For hands-free mode, use Media Session API so it works with phone locked
   - All TTS should use the SAME voice per session (don't switch voices randomly)
   - Speech recognition may not support all target languages — detect and fall back
     gracefully ("Pronunciation scoring isn't available for Japanese yet")
```

---

## Prompt 7: Onboarding & First Experience

```
Build the onboarding flow for WordZoo. The goal: get a user from opening the app to
"holy shit I'll never forget that word" in under 60 seconds. No signup required
for the first experience.

Tech: Next.js, TypeScript, Tailwind CSS, Framer Motion for animations.

THE FLOW:

Screen 1 — Language Pick (3 seconds):
  - Full-screen, minimal design
  - "Pick a language to try"
  - Show 3 large flag cards: 🇮🇩 Indonesian, 🇪🇸 Spanish, 🇯🇵 Japanese
  - Single tap to select. No "next" button. Selecting auto-advances.
  - No account required yet

Screen 2 — First Word (15 seconds):
  - "Here's your first word"
  - Foreign word appears large, centered, with a subtle entrance animation
  - Pronunciation auto-plays after 0.5s delay
  - Below the word, the English meaning fades in after 1s
  - Then: "This is how you'll remember it forever:"
  - The keyword text animates in: "It sounds like [keyword]..."
  - The mnemonic image fades in (full-width, vivid, absurd)
  - Brief scene description below the image as caption
  - Tap anywhere to continue

Screen 3 — Instant Quiz (5 seconds):
  - "Let's test it"
  - Show 4 English words (the correct meaning + 3 distractors)
  - User taps the right answer
  - If correct: satisfying animation + "See? You know Indonesian now."
  - If incorrect: "Not quite — remember the [keyword]?" → show image briefly → retry

Screen 4 — Second Word (15 seconds):
  - Same flow as Screen 2 but with word #2
  - Slightly faster pacing (user now knows the pattern)

Screen 5 — Double Quiz (5 seconds):
  - Quiz on word #2
  - Then a surprise: quiz on word #1 again ("still remember this one?")
  - "Two for two!"

Screen 6 — Third Word (10 seconds):
  - Same flow, even faster pacing

Screen 7 — Hook (5 seconds):
  - "You just learned 3 [language] words in under a minute."
  - "The keyword method makes words impossible to forget."
  - Big CTA: "Keep Learning" (creates account / goes to path selection)
  - Small link: "Maybe later" (still saves progress locally)

DESIGN REQUIREMENTS:
  - Dark background (words and images pop more on dark)
  - The mnemonic image should be the visual centerpiece — make it BIG
  - Animations should feel magical, not slow. Quick, snappy transitions.
  - No hamburger menus, no headers, no nav. Pure focus.
  - Mobile-first design (this MUST feel native-app quality on phone)
  - Progress dots at the top (subtle, shows 1-7 position)
  - Accessibility: all images have alt text, all audio has visual equivalent

FIRST WORDS (pre-selected for maximum impact):
  These should be pre-generated with hand-tuned mnemonics. The onboarding
  words should have the funniest, most absurd images. They are the app's
  first impression.

  Indonesian: "kucing" (cat), "besar" (big), "makan" (eat)
  Spanish: "mariposa" (butterfly), "cerveza" (beer), "perezoso" (lazy)
  Japanese: "neko" (cat), "kawaii" (cute), "taberu" (eat)

  (These words are chosen because they have strong phonetic hooks in English
  and produce funny mnemonic images.)

TECHNICAL:
  - Store onboarding state in localStorage (no account needed yet)
  - Pre-fetch all 3 words + mnemonics + images on language select
  - Pre-load images during text animations (no loading spinners)
  - On "Keep Learning": create account → import localStorage progress
    → redirect to path selection
  - On "Maybe later": keep in localStorage, show a persistent
    "Continue where you left off" banner on next visit

BUILD THESE FILES:
  /app/(onboarding)/page.tsx — the main onboarding flow
  /app/(onboarding)/layout.tsx — minimal layout (no nav, dark theme)
  /components/onboarding/LanguagePicker.tsx
  /components/onboarding/WordReveal.tsx
  /components/onboarding/MnemonicReveal.tsx
  /components/onboarding/QuizCard.tsx
  /components/onboarding/OnboardingComplete.tsx
  /lib/onboarding/state.ts — localStorage state management
```

---

## Prompt 8: Core Learning UI (Card Review + Scene View)

```
Build the main learning interface for WordZoo — the screens where users learn new
words, review flashcards, and progress through scenes.

Tech: Next.js, TypeScript, Tailwind CSS, Framer Motion.

BUILD THESE PAGES & COMPONENTS:

1. SCENE VIEW (/app/(app)/learn/[sceneId]/page.tsx):

   The primary learning screen. Shows a scene's narrative, then teaches
   each word one by one.

   Layout:
   - Top bar: scene title, progress (e.g., "3/6 words"), back button
   - If there are review-first words (from SRS): show a brief
     "Quick review" interstitial before the new words

   For each new word in the scene:
   a) Word Card — shows foreign word (large), pronunciation button,
      English meaning
   b) Mnemonic Card — "It sounds like [keyword]..." with the image
      and scene description
   c) Quick Quiz — 4-choice recognition quiz
   d) Swipe/tap to next word

   After all words:
   - Scene complete animation
   - "You learned [N] new words!"
   - Show all words in a summary grid (tap any to replay mnemonic)
   - "Continue to next scene" or "Practice these words" button

2. REVIEW CARD (/components/learn/ReviewCard.tsx):

   Used for SRS reviews. Two modes:

   RECOGNITION mode:
   - Show foreign word (large, centered)
   - Play pronunciation
   - User taps to reveal meaning + mnemonic image
   - Rate: "Instant" | "Got it" | "Hard" | "Forgot"
   - Swipe-based interaction (right = got it, left = forgot)

   PRODUCTION mode:
   - Show English meaning + mnemonic image
   - "What's the [language] word?"
   - User taps to reveal the foreign word + pronunciation
   - Rate the same way
   - Optional: tap mic to attempt pronunciation before reveal

3. REVIEW SESSION (/app/(app)/review/page.tsx):

   - Fetches due words from SRS
   - Shows review cards one at a time
   - No visible queue count ("47 remaining" = anxiety). Instead:
     "Let's check in on some words you've learned"
   - After completing reviews: "All caught up! Nice."
   - Mix recognition and production cards (start with recognition only,
     introduce production after a word has been reviewed 3+ times)

4. DASHBOARD (/app/(app)/dashboard/page.tsx):

   The home screen after onboarding.

   Sections:
   - "Continue Learning" — big card showing current scene + progress
   - "Quick Review" — if any words are due, show a CTA. Frame it as
     positive: "5 words want to say hi" (not "5 cards overdue")
   - "Your Progress" — words learned, mastered, current streak
   - "Travel Mode" — if user has a travel pack, show countdown
   - "Paths" — browse available paths or create custom

5. PATH BROWSER (/app/(app)/paths/page.tsx):

   - List all available paths for the user's language
   - Each path card shows: title, word count, progress bar, tier badge
   - "Create Custom Path" button → opens a text input:
     "What do you want to learn about?"
     → Calls custom path generation API
   - "Travel Mode" section with destination cards

6. UI COMPONENTS:

   <WordCard word={} size="large" | "small" showPronunciation />
   <MnemonicCard mnemonic={} showImage showScene />
   <QuizOptions options={4} correctIndex={n} onSelect={fn} />
   <ProgressBar current={n} total={n} />
   <RatingButtons onRate={fn} /> — the 4 SRS rating buttons
   <SceneSummary scene={} words={} />
   <StreakCounter count={n} />

DESIGN SYSTEM:
  - Dark mode by default, light mode optional
  - Cards have subtle glassmorphism (frosted glass effect)
  - Images are the hero element — always large, never thumbnails
  - Typography: large, readable. Foreign words in a distinct weight/style
  - Animations: cards slide in from right, images fade in, ratings have
    haptic-style bounce feedback
  - Color palette: deep navy background, accent colors per language
    (Indonesian: warm orange, Spanish: vibrant red, Japanese: soft pink)
  - Mobile-first, but should work on desktop too (centered card layout)

CRITICAL UX RULES:
  - NEVER show a loading spinner during the learning flow. Pre-fetch
    next word's mnemonic + image while current word is being viewed.
  - NEVER show error states inline. If mnemonic generation fails, silently
    retry once, then show the word without a mnemonic and log the error.
  - Tap targets must be at least 44x44px (mobile accessibility)
  - Support swipe gestures on cards (left/right for rating, up to skip)
```

---

## Prompt 9: Conversational AI Tutor

```
Build the conversational AI tutor for WordZoo. This is a chat interface where
users practice their target language with an AI that adapts to their level.

Tech: Google Gemini API (streaming), Next.js, TypeScript, Vercel AI SDK for streaming.

THE TUTOR'S CORE BEHAVIOR:

The tutor follows the Comprehensible Input principle: it speaks mostly in words
the user already knows, with ~5% new vocabulary introduced in context.

Before each tutor response, the system must:
1. Fetch the user's known words (from user_words where status != 'new')
2. Fetch words due for SRS review
3. Build a system prompt that constrains the tutor to use these words

SYSTEM PROMPT TEMPLATE:
```
You are a friendly language tutor for [language]. You are chatting with a learner.

CRITICAL RULES:
1. Use ONLY these words from the target language (the student knows these):
   [list of known words with meanings]

2. Prioritize using these words (they need review):
   [list of SRS-due words]

3. You may introduce UP TO 2 new words per message. When you do:
   - Use them in a context where the meaning is guessable
   - Bold the new word
   - Include the translation in parentheses after first use only

4. Respond primarily in the target language with natural mixing:
   - For beginners (< 50 words): 40% target language, 60% English
   - For intermediate (50-200 words): 70% target language, 30% English
   - For advanced (200+ words): 90% target language, 10% English

5. If the student makes an error, don't correct explicitly. Instead,
   naturally reuse the correct form in your response (recasting).
   Only explicitly correct if the same error appears 3+ times.

6. Keep messages short (2-3 sentences). This is a chat, not a lecture.

7. Be warm, encouraging, and slightly playful. Use the student's name.

8. If the student writes in English, gently steer back to the target
   language: "Good thought! How would you say that in [language]?"
```

BUILD THESE COMPONENTS:

1. TUTOR SERVICE (/lib/services/tutor-service.ts):

   startSession(userId, mode, scenario?): TutorSession
     Modes:
     - 'free_chat': open conversation
     - 'scenario': role-play a specific situation
     - 'review': focused word review through conversation
     - 'pronunciation': pronunciation practice (integrates with audio module)

     Scenarios (for 'scenario' mode):
     - "ordering_food", "asking_directions", "hotel_checkin",
       "meeting_someone", "shopping", "emergency"

   sendMessage(sessionId, userMessage): Stream<TutorChunk>
     → Streams the tutor's response using Vercel AI SDK
     → Each chunk includes the text token
     → After the full response, extract:
       - New words introduced (for tracking)
       - SRS-due words used (count as passive review)
       - Any corrections made

   endSession(sessionId): SessionSummary
     → { duration, messagesExchanged, newWordsEncountered,
        wordsReviewed, corrections, encouragement }

2. API ROUTES:

   POST /api/tutor/session
     Body: { mode, scenario?, languageId }
     → Creates a new session, returns sessionId

   POST /api/tutor/message
     Body: { sessionId, message }
     → Streams the tutor response (use Vercel AI SDK streaming)

   POST /api/tutor/end
     Body: { sessionId }
     → Returns session summary

3. CHAT UI (/app/(app)/tutor/page.tsx):

   - Clean chat interface (think iMessage, not enterprise chatbot)
   - Tutor messages in target language have a subtle highlight on new words
   - Tap any foreign word in a message to see its meaning (tooltip/popover)
   - Long-press a word to hear pronunciation
   - Microphone button for voice input (speech-to-text → send as message)
   - Quick-action chips above input: "Help me", "Speak English", "New topic"
   - Session summary card when conversation ends

4. CONVERSATION MODES UI:

   Mode selection screen:
   - "Free Chat" — "Just talk. I'll match your level."
   - "Role Play" — pick a scenario from a grid of illustrated cards
   - "Word Review" — "Let's practice words you've learned in conversation"
   - "Pronunciation" — "I'll say it, you repeat it"

5. WORD INTERACTION:

   When the user taps a foreign word in the chat:
   - Show a popover with: meaning, pronunciation button, mnemonic image (if exists)
   - "Add to my words" button if it's a new word the tutor introduced
   - This makes every tutor message a learning opportunity

TECHNICAL:
  - Use Vercel AI SDK's useChat() hook for streaming
  - Maintain conversation history in the session (in-memory or Redis)
  - Limit history to last 20 messages to control Gemini token usage
  - System prompt is rebuilt before each tutor response (to include
    latest known words and due words)
  - Handle Gemini API errors gracefully: "Hmm, let me think...
    [retry]" — never show raw errors
```

---

## Prompt 10: Social Sharing & Community

```
Build the social and sharing features for WordZoo — shareable mnemonic cards,
community mnemonic gallery, and viral growth mechanics.

Tech: Next.js, TypeScript, Tailwind CSS, Vercel OG (for image generation),
Vercel Postgres.

BUILD THESE FEATURES:

1. SHAREABLE CARD GENERATION:

   Use Vercel OG (or @vercel/og) to generate share images server-side.

   API route: GET /api/share/[mnemonicId]/image
     → Returns a PNG image of the mnemonic card

   Card layout:
   ┌──────────────────────────────┐
   │                              │
   │    [Mnemonic image]          │
   │                              │
   ├──────────────────────────────┤
   │  🇮🇩 kucing = cat             │
   │  "Sounds like COUCHING"      │
   │                              │
   │  I learned this with WordZoo │
   │  wordzoo.app                 │
   └──────────────────────────────┘

   Two formats:
   - Square (1:1) for Twitter/iMessage
   - Story (9:16) for Instagram Stories

   Share flow:
   - User taps "Share" on any mnemonic card
   - App generates the share image
   - Opens native share sheet (Web Share API) with image + link
   - Deep link: wordzoo.app/word/[wordId] → shows the mnemonic
     (even for non-users, as a preview/ad)

2. COMMUNITY GALLERY:

   Database additions:
   - community_mnemonics: mnemonic_id, submitted_at, status ('pending' | 'approved')
   - mnemonic_votes: user_id, mnemonic_id, created_at (unique constraint)

   /app/(app)/community/[wordId]/page.tsx:
   - Shows all community-submitted mnemonics for a word
   - Sorted by upvotes (default) or newest
   - Each card shows: keyword, scene description, image, vote count, author
   - "Use This Mnemonic" button → adopts it as user's active mnemonic
   - "Submit Yours" button → submits user's current mnemonic to community

   /api/community/[wordId] — GET list, POST submit
   /api/community/vote — POST upvote/remove vote

3. MODERATION:
   - Auto-filter: before showing community mnemonics, run a quick check
     via Gemini (batch-process, not per-view) for offensive content
   - Flag button on each card for user reports
   - Simple admin review queue (can be a basic page, not a full admin panel)

4. VIRAL MECHANICS:

   Share link behavior:
   - wordzoo.app/word/[wordId] → public page showing:
     - The word, meaning, mnemonic image, and keyword
     - "I learned this in 10 seconds. Try it:" → onboarding CTA
     - This page must be beautiful, fast, and work as a standalone ad

   Referral tracking:
   - Share links include ?ref=[userId]
   - Track: shares generated, link clicks, signups from shares
   - Future: reward referrals with premium days (not built now, just track)

5. OPEN GRAPH METADATA:

   Every shared link should have rich OG tags:
   - og:title: "I learned [word] in [language] — it means [meaning]!"
   - og:description: "It sounds like [keyword]. Try this memory trick."
   - og:image: the generated share card image
   - This makes links look great when pasted in iMessage, Twitter, etc.
```

---

## Prompt 11: Offline Mode & Travel Pack Downloads

```
Build offline support for WordZoo, with special focus on travel packs that
must work without internet.

Tech: Next.js PWA (next-pwa), Service Worker, IndexedDB (via idb library),
TypeScript.

BUILD THESE FEATURES:

1. PWA SETUP:
   - Configure next-pwa for service worker generation
   - App manifest (name, icons, theme color, display: standalone)
   - "Add to Home Screen" prompt after 3rd session

2. OFFLINE DATA STORAGE (IndexedDB via idb):

   Stores:
   - 'words': cached word data
   - 'mnemonics': cached mnemonics with image blobs
   - 'audio': cached pronunciation audio blobs
   - 'user_words': local copy of user's word states
   - 'review_queue': offline review events pending sync
   - 'paths': cached path/scene data

   /lib/offline/storage.ts:
   - cacheWord(word, mnemonic, imageBlob, audioBlob): void
   - getCachedWord(wordId): CachedWord | null
   - queueReviewEvent(event): void
   - getPendingSync(): SyncEvent[]
   - clearPendingSync(): void

3. TRAVEL PACK DOWNLOAD:

   When a user activates a travel pack:
   a) Generate all mnemonics for all words in the pack (via API)
   b) Generate all images (via Stability AI)
   c) Generate all pronunciation audio
   d) Bundle everything and download to IndexedDB

   /lib/offline/download.ts:
   - downloadPack(pathId): AsyncGenerator<DownloadProgress>
     → Yields progress events: { phase, current, total, sizeBytes }
     → Phases: 'mnemonics' → 'images' → 'audio' → 'complete'

   UI: /components/offline/DownloadProgress.tsx
   - Shows a progress bar with phase labels
   - "Preparing your Japan pack... Generating images (12/80)"
   - Estimated size shown before download starts
   - Pause/resume support
   - On complete: "Ready for offline use ✓"

4. SYNC ENGINE (/lib/offline/sync.ts):

   When the app comes back online:
   - Check for pending review events in IndexedDB
   - POST them to /api/reviews/sync (batch endpoint)
   - Handle conflicts: if server has newer data, server wins
   - Update local cache with any new data from server
   - Run sync on: app focus, network change event, manual trigger

   /api/reviews/sync:
   - Accepts batch of review events with timestamps
   - Processes each, skips if server has newer review for same word
   - Returns updated user_word states

5. CACHE MANAGEMENT:

   Auto-cache strategy:
   - When a user views a word, cache it for offline
   - Pre-fetch next 5 words in current scene
   - Keep all words from current path cached
   - Auto-clean words not reviewed in 90+ days (if storage > 200MB)

   /lib/offline/cache-manager.ts:
   - getCacheSize(): { totalBytes, breakdown: { images, audio, data } }
   - cleanOldCache(daysToKeep: 90): { freedBytes }
   - isFullyOffline(pathId): boolean
   - getOfflineStatus(): { cachedWords, totalSize, lastSync }

6. OFFLINE-AWARE UI:

   - Show a subtle offline indicator in the nav bar when disconnected
   - Features that need network show a friendly message:
     "You're offline. This feature needs internet. Your learned words
     and reviews still work!"
   - Queue any review events and show: "Will sync when you're back online"
   - Travel packs show a green checkmark: "Available offline ✓"
```

---

## Prompt 12: Monetization & Paywalls

```
Build the monetization system for WordZoo — free/premium tiers, travel pack
purchases, and paywall gates.

Tech: Next.js, TypeScript, Stripe (via @stripe/stripe-js and stripe npm package),
Vercel Postgres.

TIER SYSTEM:

Free tier limits:
- 5 new words per day
- 1 language
- 2 mnemonic regenerations per word
- 5 min/day hands-free mode
- 3 tutor messages per day
- Browse community gallery (no submit)
- No offline downloads
- No custom paths

Premium ($9.99/month or $59.99/year):
- Unlimited everything
- All languages
- Offline downloads
- Custom paths
- Community submissions
- No ads

Travel Pack ($4.99 each, one-time):
- Available without premium subscription
- Includes offline download for that pack
- 80-100 words with pre-generated mnemonics

BUILD THESE COMPONENTS:

1. FEATURE GATING SERVICE (/lib/services/billing-service.ts):

   checkAccess(userId, feature): AccessResult
     Features: 'new_word', 'regenerate_mnemonic', 'hands_free',
     'tutor_message', 'custom_path', 'offline_download', 'community_submit'

   AccessResult = {
     allowed: boolean,
     reason?: 'limit_reached' | 'premium_only',
     usage?: { used: number, limit: number },
     upgradePrompt?: string
   }

   getDailyUsage(userId): DailyUsage
     → { wordsLearned: n/5, tutorMessages: n/3, handsFreeMinutes: n/5 }

   resetDailyLimits(): void
     → Cron job (Vercel Cron) that resets daily counters at midnight UTC

2. STRIPE INTEGRATION:

   /lib/billing/stripe.ts:
   - createCheckoutSession(userId, plan: 'monthly' | 'yearly'): sessionUrl
   - createTravelPackCheckout(userId, packId): sessionUrl
   - handleWebhook(event): void
     → checkout.session.completed → upgrade user tier
     → customer.subscription.deleted → downgrade to free
     → invoice.payment_failed → notify user

   /api/billing/checkout — POST, creates Stripe checkout session
   /api/billing/webhook — POST, handles Stripe webhooks
   /api/billing/portal — POST, creates Stripe customer portal session
   /api/billing/status — GET, returns current subscription status

3. PAYWALL UI (/components/billing/):

   <PaywallGate feature="custom_path">
     {children}  ← renders if allowed
   </PaywallGate>
     → If not allowed, shows an upgrade prompt instead of children

   <UpgradePrompt reason="limit_reached" feature="new_word" />
     → Context-aware upgrade messages:
     - "You've learned 5 words today! Unlock unlimited with Premium."
     - "Custom paths are a Premium feature. Start your free trial?"
     - "Go hands-free for as long as you want with Premium."

   <PricingPage />
     → /app/(app)/pricing/page.tsx
     → Shows free vs premium comparison table
     → Monthly/yearly toggle (show savings)
     → Stripe checkout buttons
     → Travel pack cards below subscription section

   <TravelPackCard pack={} purchased={bool} />
     → Shows destination, word count, price
     → If purchased: "Download for offline use" button
     → If not: "Buy for $4.99" → Stripe checkout

4. PAYWALL RULES:
   - NEVER gate the onboarding flow. First 3 words are always free.
   - NEVER interrupt active learning with a paywall. Show it AFTER
     completing a scene or review session, never mid-card.
   - Daily limit resets are visible: "3 new words available tomorrow,
     or unlock unlimited now"
   - Free tier should feel generous enough that users see value before
     hitting limits. The goal is conversion, not frustration.

5. DATABASE:

   subscriptions:
     user_id (FK), stripe_customer_id, stripe_subscription_id,
     plan ('monthly' | 'yearly'), status ('active' | 'canceled' | 'past_due'),
     current_period_end, created_at

   purchases:
     user_id (FK), pack_id (FK to paths where type='travel'),
     stripe_payment_id, purchased_at

   daily_usage:
     user_id (FK), date, words_learned (int), tutor_messages (int),
     hands_free_seconds (int), regenerations (int)

6. CRON JOBS (vercel.json crons):
   - Reset daily usage counters: every day at 00:00 UTC
   - Check expiring subscriptions: every day, send reminder emails
```

---

## Execution Order Summary

```
PHASE 1 — Foundation (can start immediately):
  → Prompt 1: Project Skeleton (do this FIRST, everything depends on it)
  → Prompt 2: Content Library (independent, can run in parallel with Prompt 1)

PHASE 2 — Core Magic (after Prompt 1 is done):
  → Prompt 3: Mnemonic Engine (needs skeleton + AI wrappers)
  → Prompt 4: SRS Engine (needs skeleton + database)
  (These two can run in parallel)

PHASE 3 — Learning Experience (after Prompts 3 + 4):
  → Prompt 5: Path & Progression (needs SRS + mnemonics)
  → Prompt 6: Audio Engine (needs mnemonics, can parallel with Prompt 5)
  → Prompt 7: Onboarding (needs mnemonics + images, can parallel with 5/6)
  → Prompt 8: Core Learning UI (needs paths + SRS + mnemonics)

PHASE 4 — Intelligence (after Prompt 8):
  → Prompt 9: Conversational Tutor (needs known words + SRS)

PHASE 5 — Growth & Revenue (after core learning works):
  → Prompt 10: Social & Sharing (needs mnemonics + images)
  → Prompt 11: Offline Mode (needs everything it caches)
  → Prompt 12: Monetization (needs all features to gate)
  (These three can run in parallel)
```
