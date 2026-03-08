# WordZoo - Modular Architecture

## How to Use This Document

Each module below is designed to be **worked on independently**. Hand each module to a different designer/AI with its section and the **Interface Contract** — that's all they need to know about the rest of the system.

Modules communicate through a shared data layer (Module 1) and well-defined inputs/outputs listed in each section.

---

## System Diagram

```
                         +------------------+
                         |   Module 9:      |
                         |   Onboarding     |
                         +--------+---------+
                                  |
                                  v
+----------------+    +----------+----------+    +------------------+
|  Module 3:     |    |   Module 7:         |    |  Module 8:       |
|  Mnemonic      |<-->|   Path &            |<-->|  Conversational  |
|  Engine        |    |   Progression       |    |  AI Tutor        |
+-------+--------+    +----------+----------+    +--------+---------+
        |                        |                        |
        v                        v                        v
+-------+--------+    +----------+----------+    +--------+---------+
|  Module 4:     |    |   Module 6:         |    |  Module 5:       |
|  Image         |    |   Spaced            |    |  Audio           |
|  Generation    |    |   Repetition        |    |  Engine          |
+----------------+    +---------------------+    +------------------+
        |                        |                        |
        +------------+-----------+------------------------+
                     |
                     v
          +----------+----------+
          |   Module 1:         |
          |   Core Data Model   |
          |   & User State      |
          +----------+----------+
                     |
          +----------+----------+
          |   Module 2:         |
          |   Content Library   |
          +---------------------+

+------------------+  +------------------+  +------------------+
|  Module 10:      |  |  Module 11:      |  |  Module 12:      |
|  Social &        |  |  Offline &       |  |  Monetization    |
|  Sharing         |  |  Caching         |  |                  |
+------------------+  +------------------+  +------------------+

+------------------------------------------------------+
|              Module 13: Platform & Infra              |
+------------------------------------------------------+
```

---

## Module 1: Core Data Model & User State

**Purpose:** The single source of truth for all user data and word mastery. Every other module reads from and writes to this.

**Owner:** Backend / Data Architect

### Responsibilities
- Define and maintain all data schemas
- User profile (native language, target languages, preferences)
- Word mastery state per user per word (new → learning → reviewing → mastered)
- Session history (what was shown, user responses, timestamps)
- Mnemonic preferences (which mnemonic the user chose per word)
- Progress snapshots for re-engagement ("you still know 73/85 words")

### Key Entities

```
User
  - id, native_language, created_at, subscription_tier
  - preferences: { audio_speed, absurdity_level, hands_free_mode }

UserWord
  - user_id, word_id
  - status: new | learning | reviewing | mastered
  - current_mnemonic_id
  - ease_factor, interval_days, next_review_at
  - times_reviewed, times_correct, last_reviewed_at
  - direction: recognition | production | both

Mnemonic
  - id, word_id, user_id (null if community/default)
  - keyword_text ("selling a mat")
  - scene_description (full vivid scene text)
  - image_url
  - audio_url (scene narration)
  - is_custom, upvote_count

Word
  - id, language, text, romanization, pronunciation_audio_url
  - meaning_en, part_of_speech
  - frequency_rank
  - phrases: [{ text, meaning, audio_url }]

Path
  - id, language, type: premade | custom | travel
  - title, description, word_ids[]
  - scene_groups: [{ title, word_ids[], combined_scene_image_url }]
```

### Interface Contract
- Exposes a **UserStateService** that any module can query:
  - `getKnownWords(userId, languageId) → Word[]`
  - `getWordState(userId, wordId) → UserWord`
  - `updateWordState(userId, wordId, reviewResult)`
  - `getMnemonic(userId, wordId) → Mnemonic`
  - `getRetentionSnapshot(userId) → { total, remembered, forgotten }`

### Open Decisions
- Database choice: PostgreSQL + Redis cache? Supabase? Firebase?
- Real-time sync strategy for offline → online reconciliation

---

## Module 2: Content Library

**Purpose:** All language content — word lists, phrases, frequency rankings, audio recordings, thematic groupings.

**Owner:** Linguist / Content Designer

### Responsibilities
- Curate frequency-ranked word lists per language (sources: OpenSubtitles frequency lists, Wiktionary)
- Group words into thematic scenes (not just categories)
- Define phrase lists (high-frequency multi-word expressions)
- Provide native-speaker pronunciation audio or high-quality TTS reference
- Define travel packs per destination (50-100 words/phrases per destination)

### Content Structure

```
Language Pack
  ├── Tier 1: Survival (Top 100 words)
  │   ├── Scene: "Meeting someone" (selamat pagi, nama saya, apa kabar...)
  │   ├── Scene: "Finding your way" (di mana, kiri, kanan, lurus...)
  │   ├── Scene: "Getting food" (makan, minum, berapa, pedas...)
  │   └── ...
  ├── Tier 2: Conversational (Top 1,000 words)
  │   └── ...
  ├── Tier 3: Fluent (Top 3,000 words)
  │   └── ...
  └── Travel Packs
      ├── "2 Weeks in Bali"
      ├── "Tokyo Survival"
      └── ...
```

### Scene Grouping Rules
- 5-7 words per scene (cognitive sweet spot)
- Words in a scene should naturally co-occur in a real situation
- Each scene has a narrative setup: "You walk into a warung and want to order..."
- Phrases are first-class citizens, not afterthoughts

### Interface Contract
- `getWordsByLanguage(languageId, tier) → Word[]`
- `getScenesByLanguage(languageId, tier) → Scene[]`
- `getTravelPack(destinationId) → Path`
- `getPhrasesForWord(wordId) → Phrase[]`

### Launch Languages
- Bahasa Indonesia (tonal-free, phonetic, good for proof of concept)
- Spanish (largest learner market)
- Japanese (high difficulty, proves the method works on hard languages)

### Open Decisions
- Human-recorded audio vs. high-quality TTS (cost vs. quality)
- Community-contributed content pipeline (later phase?)
- How to handle gendered/conjugated forms

---

## Module 3: Mnemonic Engine

**Purpose:** The creative core — takes a foreign word and generates a memorable keyword association, vivid scene description, and image prompt.

**Owner:** AI / Prompt Engineer

### Responsibilities
- Generate phonetic keyword links (foreign word → native-language sound-alike)
- Generate vivid, absurd scene descriptions connecting keyword to meaning
- Generate image prompts optimized for the image generation pipeline
- Support regeneration (user didn't connect with first mnemonic)
- Support user-authored mnemonics (user types their own, system generates image)
- Adapt to user's native language (keyword must sound right in their language)

### The Generation Pipeline

```
Input: { word: "kucing", meaning: "cat", language: "Indonesian", user_native: "English" }

Step 1 - Keyword Generation:
  → "COOCH-ing" sounds like "couching"
  → Alternative: "KOOCH-ing" sounds like "coaching"
  → Offer 2-3 options, user picks or types custom

Step 2 - Scene Generation (for selected keyword "couching"):
  → "A giant fluffy cat aggressively couching — slamming a couch through
     a living room wall while startled people dive out of the way.
     The cat wears a tiny moving company hat."

Step 3 - Image Prompt:
  → Optimized for the specific image model (DALL-E / Flux / etc.)
  → Emphasizes: absurdity, exaggeration, emotional charge, visual clarity
  → Includes style directives (bright colors, cartoon/surreal, no text)
```

### Absurdity Guidelines (Critical for Memorability)
- **Scale distortion:** make things giant or tiny
- **Impossible actions:** animals doing human things, objects coming alive
- **Emotional charge:** danger, humor, surprise, disgust
- **Personal connection:** include recognizable settings when possible
- **Multi-sensory:** describe sounds, smells, textures in the scene text (even though image is visual)

### Interface Contract
- `generateMnemonic(word, meaning, language, nativeLanguage) → MnemonicCandidate[]`
- `regenerateMnemonic(word, meaning, language, nativeLanguage, excludeKeywords[]) → MnemonicCandidate`
- `generateFromUserKeyword(word, meaning, userKeyword) → MnemonicCandidate`
- `generateImagePrompt(sceneDescription) → string`

### Inputs From Other Modules
- Word data from **Module 2** (Content Library)
- User native language from **Module 1** (Core Data)

### Outputs To Other Modules
- Scene description + image prompt → **Module 4** (Image Generation)
- Scene narration text → **Module 5** (Audio Engine)
- Completed mnemonic → **Module 1** (stored in Core Data)

### Open Decisions
- LLM choice for generation (Claude, GPT-4, open-source?)
- How much to pre-generate vs. generate on-demand
- Quality control: auto-filter bad/offensive mnemonics?
- Support for tonal languages (Mandarin: tone must be part of the mnemonic)

---

## Module 4: Image Generation Pipeline

**Purpose:** Turn scene descriptions into memorable, absurd, visually striking mnemonic images.

**Owner:** AI / Visual Designer

### Responsibilities
- Take image prompts from Module 3 and generate images
- Maintain visual style consistency across all cards
- Handle caching and storage of generated images
- Support pre-generation for offline/travel packs
- Implement content safety filtering

### Style Guidelines
- **Art style:** Bright, saturated colors. Semi-cartoonish/surreal (not photorealistic — uncanny valley kills memorability). Think: editorial illustration meets fever dream.
- **Composition:** Single focal point. The keyword-meaning connection must be visually obvious without reading text.
- **No text in images:** Text in generated images is unreliable and unnecessary. The image should work purely visually.
- **Consistent aspect ratio:** Square (1:1) for card format, with safe zones for UI overlay.

### Pipeline

```
Scene Description (from Module 3)
  → Image Prompt Engineering (model-specific optimization)
  → Image Generation API call
  → Safety filter check
  → Resize/crop to standard dimensions
  → Upload to CDN / cache locally
  → Return URL
```

### Interface Contract
- `generateImage(imagePrompt, style?) → { imageUrl, localPath }`
- `preGenerateForPath(pathId) → { status, imageUrls[] }`
- `getCachedImage(mnemonicId) → imageUrl | null`

### Cost Management
- Pre-generate Tier 1 words for all languages (known, finite set)
- On-demand generation for custom paths and user keywords
- Cache aggressively — same word can share default image across users
- Budget: estimate ~$0.02-0.04 per image (DALL-E 3) or self-hosted (Flux)

### Open Decisions
- DALL-E 3 vs. Flux vs. Stable Diffusion (cost vs. quality vs. self-hosting)
- Image resolution (higher = more memorable but more storage/bandwidth)
- Batch generation strategy for pre-made content
- User ability to regenerate images (cost implication per regen)

---

## Module 5: Audio Engine

**Purpose:** All sound — word pronunciation, mnemonic narration, speech recognition for production practice, and hands-free mode.

**Owner:** Audio / Speech Engineer

### Responsibilities
- Play native pronunciation of foreign words/phrases
- Narrate the mnemonic scene ("It sounds like 'couching'... imagine a giant cat...")
- Score user pronunciation via speech recognition
- Drive hands-free mode (full audio-only learning flow)
- Manage audio playback queue and state

### Audio Flows

**Standard Review (visual + audio):**
```
1. Play: foreign word pronunciation (native speaker quality)
2. Play: "It sounds like [keyword]..." (TTS, tutor voice)
3. Display: mnemonic image
4. Play: brief scene description (TTS, tutor voice)
5. Prompt: "Now you say it" → record → score pronunciation
```

**Hands-Free Mode (audio only):**
```
1. Play: "Next word. Listen: [foreign word]"
2. Play: "It means [meaning]. The keyword is [keyword]."
3. Play: "Imagine: [scene description]"
4. Play: "Now repeat after me: [foreign word]"
5. Listen: user speaks → score → feedback
6. Play: "Great!" or "Try again: [foreign word]" with emphasis on problem sounds
7. → Next word (auto-advance after success)
```

### Pronunciation Scoring
- Use speech-to-text to capture user's attempt
- Compare phonetically (not character-by-character) to target pronunciation
- Score on a simple scale: Close Enough / Getting There / Try Again
- Don't be punishing — the goal is confidence, not perfection
- Highlight specific sounds that need work ("try rounding your lips more on the 'u'")

### Interface Contract
- `playWordAudio(wordId) → void`
- `playMnemonicNarration(mnemonicId) → void`
- `startPronunciationChallenge(wordId) → void`
- `scorePronunciation(audioBlob, targetWordId) → PronunciationResult`
- `startHandsFreeSession(wordIds[]) → HandsFreeSession`
- `pauseHandsFree() / resumeHandsFree() → void`

### Open Decisions
- TTS provider (ElevenLabs for quality? Platform native for cost?)
- Speech recognition provider (Whisper API? On-device?)
- Latency budget for pronunciation scoring (needs to feel instant)
- Voice persona for the tutor narration (friendly, calm, slightly playful?)

---

## Module 6: Spaced Repetition Engine

**Purpose:** Schedule reviews at optimal intervals. Make repetition invisible by weaving it into natural app flows rather than showing a review queue.

**Owner:** Algorithm / Learning Science Designer

### Responsibilities
- Implement SRS algorithm (SM-2 variant or custom)
- Schedule next review time per word per user
- Provide "what to review now" queries for other modules to consume
- Handle the comeback problem (user returns after long absence)
- Track retention statistics
- Never surface as a visible "review queue" — other modules pull from this

### Algorithm

Base: SM-2 with modifications for the keyword method context.

```
After each review:
  - User rates: "Instant" (5) | "Got it" (4) | "Hard" (3) | "Forgot" (0)
  - Update ease factor and interval
  - If recognition AND production are tracked, schedule independently

New word intervals: 1min → 10min → 1day → 3days → 7days → 14days → 30days → 90days
Forgot: reset to 1day but keep ease factor slightly above floor (keyword method
        means re-learning is faster than initial learning)
```

### Invisible Integration Points

Instead of "You have 47 cards to review," SRS feeds into:

| Context | How SRS surfaces |
|---|---|
| **Opening the app** | "Welcome back! Quick check — do you remember these?" (3-5 due words) |
| **Before new scene** | "Before we learn restaurant words, let's make sure greetings stuck" |
| **Conversational tutor** | Tutor naturally uses due-for-review words in conversation |
| **Travel mode countdown** | "12 days until Tokyo. Let's lock in these 8 shaky words" |
| **Push notification** | "You learned 'kucing' 3 days ago. Still remember? (tap to check)" |

### Comeback Logic
```
User returns after N days of absence:
  1. Calculate expected retention per word using forgetting curve
  2. Quick-fire test: show 10 words, user swipes "remember / forgot"
  3. Report: "You remembered 8/10! The keyword method really works."
  4. Reschedule forgotten words at short intervals
  5. Resume path from where they left off
```

### Interface Contract
- `getDueWords(userId, limit?) → UserWord[]`
- `getDueWordsForContext(userId, context: "pre_scene" | "session_start" | "conversation") → UserWord[]`
- `recordReview(userId, wordId, direction, rating) → NextReviewInfo`
- `getRetentionForecast(userId) → { word, predictedRetention }[]`
- `getComebackReport(userId) → ComebackReport`

### Outputs To Other Modules
- Due word lists → **Module 7** (Path & Progression), **Module 8** (Conversational Tutor)
- Retention stats → **Module 1** (stored), **Module 9** (shown in onboarding/re-engagement)

### Open Decisions
- Exact algorithm parameters (tune with real user data)
- Should production and recognition have separate SRS tracks from day 1?
- Push notification strategy and frequency caps
- How to handle words the user keeps forgetting (adapt mnemonic? flag for replacement?)

---

## Module 7: Path & Progression System

**Purpose:** Structure the learning journey — what words come next, how they're grouped, when the user "graduates," and how custom/travel paths are generated.

**Owner:** Learning Experience Designer

### Responsibilities
- Manage pre-made learning paths (Tier 1 → 2 → 3)
- Generate custom paths from user input ("I'm going to Bali")
- Organize words into scene-based groups within paths
- Track path completion and mastery
- Deliver the "graduation" moment ("You've mastered survival Bahasa!")
- Gate new content behind review of previously learned words (via Module 6)

### Path Types

**Pre-made Paths:**
```
Bahasa Indonesia: Survival
  ├── Scene 1: "Meeting Someone" [5 words] ← UNLOCKED
  ├── Scene 2: "Finding Your Way" [6 words] ← locked until Scene 1 mastered
  ├── Scene 3: "Ordering Food" [7 words]
  ├── ...
  └── Graduation: "Survival Bahasa Complete!" 🎓
```

**Custom Path (AI-generated):**
```
User input: "I'm going to a wedding in Jakarta"
  → AI extracts context: wedding, Jakarta, social, formal
  → Pulls relevant words: congratulations, beautiful, family, thank you, cheers...
  → Groups into scenes: "The ceremony", "The reception", "Meeting relatives"
  → Generates mnemonics for each word (via Module 3)
```

**Travel Mode:**
```
User input: "Japan, 2 weeks, tourist"
  → Pre-curated pack: 80 words/phrases
  → Organized by situation: airport, train, restaurant, hotel, shopping, emergency
  → Countdown timer: "14 days to go — learn 6 words/day to finish"
  → Daily push: "Today's situation: Getting around Tokyo"
  → Pre-generated images + audio (for offline use via Module 11)
```

### Progression Rules
- A scene is "mastered" when all words reach "reviewing" status (passed at least 2 reviews)
- Next scene unlocks after current scene mastered
- A tier is "graduated" when all scenes mastered + a final mixed review scores >80%
- Graduation is a celebratory moment: animation, stats summary, shareable card

### Scene-Based Memory Palace Effect
- Each scene has a **combined scene image** showing all the mnemonic keywords interacting
- Example: "Ordering Food" scene shows ALL keyword characters at a restaurant table together
- When reviewing individual words, the combined scene provides spatial context
- This creates associative links between words (not just word → meaning, but word → word)

### Interface Contract
- `getActivePath(userId) → Path`
- `getNextScene(userId, pathId) → Scene | GraduationEvent`
- `generateCustomPath(userId, userInput) → Path`
- `getTravelPack(destination, duration, travelerType) → Path`
- `getPathProgress(userId, pathId) → { completed, total, percentMastered }`
- `checkGraduation(userId, pathId) → GraduationResult | null`

### Open Decisions
- How many scenes before graduation feels earned but not exhausting?
- Can users skip ahead or test out of scenes they already know?
- Custom path generation: fully AI or template-based with AI fill?
- Should travel mode have a "cram mode" option for last-minute learners?

---

## Module 8: Conversational AI Tutor

**Purpose:** An AI chat partner that speaks at the user's level, weaves in review words naturally, introduces new vocabulary in context, and builds speaking confidence.

**Owner:** Conversational AI Designer

### Responsibilities
- Conduct conversations using comprehensible input (i+1 principle)
- Know which words the user has learned (from Module 1) and use primarily those
- Introduce new words in context with enough surrounding clues to guess meaning
- Weave in SRS-due words naturally in conversation (from Module 6)
- Role-play real scenarios (ordering food, asking directions, small talk)
- Provide gentle corrections without breaking conversational flow
- Support both text and voice interaction

### Comprehensible Input Rules

```
User knows 50 words.
Tutor's message should be:
  - 85-90% known words
  - 5-10% words due for review (reinforcement)
  - 5% new words (introduced with context clues)
  - New words appear in bold with tap-to-reveal translation

Example (user learning Bahasa, knows basics):
  Tutor: "Selamat pagi! Apa kabar? Hari ini saya mau pergi ke **toko**. Kamu mau ikut?"
         (Good morning! How are you? Today I want to go to the **shop**. You want to come?)
  → "toko" is new, but context makes it guessable
  → "selamat pagi" and "apa kabar" are review words
```

### Conversation Modes

| Mode | Description |
|---|---|
| **Free Chat** | Open conversation at user's level. Tutor adapts. |
| **Scenario Role-Play** | "Let's practice ordering at a restaurant." Structured, goal-oriented. |
| **Word Review** | "Let's see what you remember." Quick-fire Q&A woven into dialogue. |
| **Grammar Glimpse** | Brief, contextual grammar explanations when user makes pattern errors. Not a grammar course. |
| **Pronunciation Coach** | Tutor says a word/phrase, user repeats, tutor gives feedback. (Uses Module 5.) |

### Correction Style
- **Don't interrupt.** Let the user finish.
- **Recast, don't correct.** If user says "Saya pergi toko," tutor responds naturally with the correct form: "Oh, kamu mau pergi **ke** toko? Bagus!" (modeling the preposition without saying "you forgot 'ke'")
- **Only explicitly correct if asked** or if the same error repeats 3+ times.

### Interface Contract
- `startConversation(userId, mode, scenario?) → ConversationSession`
- `sendMessage(sessionId, userMessage) → TutorResponse`
- `sendVoiceMessage(sessionId, audioBlob) → TutorResponse` (transcribes, responds, optionally speaks)
- `getConversationHistory(sessionId) → Message[]`
- `endConversation(sessionId) → SessionSummary` (words practiced, new words encountered, corrections)

### Inputs From Other Modules
- Known word list from **Module 1**
- Due-for-review words from **Module 6**
- Current path/scene context from **Module 7**

### Outputs To Other Modules
- Review events (word used correctly in conversation) → **Module 6** (counts as a review)
- New words encountered → **Module 1** (added as "seen in context")

### Open Decisions
- LLM choice and latency requirements (streaming response essential for chat UX)
- How to handle the user switching between native language and target language mid-conversation
- Voice-only conversation mode (fully hands-free, uses Module 5 audio pipeline)
- Should the tutor have a persona/name/avatar?

---

## Module 9: Onboarding & First Experience

**Purpose:** Get a user from "I just opened the app" to "holy shit, I'll never forget that word" in under 60 seconds.

**Owner:** Product / UX Designer

### Responsibilities
- Design the zero-friction first experience
- Deliver the "aha moment" before asking for anything (no signup, no tutorial)
- Language selection (minimal, fast)
- First word → mnemonic → image flow
- Transition into path selection after the hook
- Handle returning users (comeback flow from Module 6)

### The 60-Second Flow

```
Second 0:   App opens. No splash screen. No logo animation.
Second 3:   "Pick a language to try." [3-4 flags, one tap]
Second 5:   "Here's your first word."
            [Foreign word appears, large, with audio auto-playing]
Second 8:   "It sounds like..." [keyword appears with animation]
Second 12:  [Absurd mnemonic image fades in, scene description as caption]
Second 18:  "You'll never forget this. Let's test it."
Second 20:  [Show 4 English words, user taps the correct meaning]
Second 22:  "See? You know Indonesian now. Want another?"
Second 25:  [Second word, same flow]
Second 45:  [Third word, user is hooked]
Second 55:  "You just learned 3 words in under a minute. Ready for more?"
Second 60:  → Path selection / signup (NOW you can ask for an account)
```

### Design Principles
- **No gates before value.** Signup comes AFTER the aha moment.
- **The first word must be a banger.** Pick words with the most absurd, memorable mnemonics. Pre-select these per language, don't randomize.
- **Auto-play audio.** Don't make them tap "listen." Just play it.
- **Minimize taps.** The first experience should feel like a magic trick, not a form.

### Comeback Flow (Returning User)
```
"Welcome back! It's been 12 days."
"Let's see what stuck..."
[Quick 5-word recall test — swipe right if you remember, left if not]
"You remembered 4 out of 5. The keyword method really works."
"Ready to keep going?"
→ Resume path
```

### Interface Contract
- `getOnboardingWords(languageId) → Word[]` (curated best-of for first impression)
- `completeOnboarding(userId) → void` (triggers path selection)
- `getComebackFlow(userId) → ComebackReport` (from Module 6)

### Open Decisions
- Should onboarding differ by platform (iOS vs Android vs Web)?
- A/B test different first words?
- Permit language switching without losing progress?
- How to handle users who want to skip straight to travel mode?

---

## Module 10: Social & Sharing

**Purpose:** Let users share mnemonic cards, browse community mnemonics, and drive organic growth through inherently shareable content.

**Owner:** Growth / Social Designer

### Responsibilities
- Generate shareable mnemonic card images (word + image + keyword)
- Community gallery: browse and upvote mnemonics per word
- "Use this mnemonic" — swap your default for a community one
- Referral mechanic (share a card → recipient gets a free word)
- Leaderboards (optional, if it fits the brand)

### Shareable Card Format

```
+----------------------------------+
|  [Absurd mnemonic image]         |
|                                  |
|                                  |
+----------------------------------+
|  🇮🇩 kucing = cat                |
|  "Sounds like COUCHING"          |
|  ──────────────────              |
|  I learned this on WordZoo       |
|  [QR code / app link]            |
+----------------------------------+
```

- Optimized for Instagram Stories (9:16) and Twitter/iMessage (1:1)
- The card should make someone laugh AND teach them the word — it's content AND an ad

### Community Gallery
- Per word: show top-voted user mnemonics
- Users can "adopt" a community mnemonic (replaces their generated one)
- Moderation: flag system + auto-filter for offensive content
- Incentive: "Your mnemonic for 'kucing' helped 340 people remember it"

### Interface Contract
- `generateShareCard(mnemonicId, format: "story" | "square") → imageUrl`
- `submitToCommunity(mnemonicId) → void`
- `getCommunityMnemonics(wordId, sort: "top" | "new") → Mnemonic[]`
- `adoptMnemonic(userId, mnemonicId) → void`
- `getShareLink(mnemonicId) → deepLink`

### Open Decisions
- Allow anonymous sharing or require account?
- Moderation approach (AI auto-mod? community flagging? manual review?)
- Should sharing give premium currency/credits?
- Social features at launch or post-launch?

---

## Module 11: Offline & Caching

**Purpose:** Ensure the app works without internet, especially for travel mode users who are most likely to be offline when they need the app most.

**Owner:** Mobile / Infrastructure Engineer

### Responsibilities
- Pre-download content packs (images, audio, word data)
- Cache generated mnemonics and images locally
- Queue reviews and progress updates for sync when back online
- Manage local storage budget (don't fill up user's phone)
- Sync conflict resolution (offline changes vs. server state)

### What Must Work Offline
| Feature | Offline Support |
|---|---|
| Review existing cards | Full (images, audio, SRS) |
| Hands-free mode | Full (pre-cached audio) |
| Travel pack | Full (pre-generated entirely) |
| New word generation | No (requires AI API) |
| Conversational tutor | No (requires LLM API) |
| Pronunciation scoring | Partial (on-device model?) |
| Community gallery | No (requires network) |

### Download Strategy
```
Travel Pack purchased:
  → Immediately pre-generate ALL mnemonics, images, audio
  → Download as a single bundle (~50-100MB per pack)
  → Show download progress: "Preparing your Japan pack... 73%"
  → Verify completeness before showing "Ready for offline use ✓"

Regular learning:
  → Cache each card after first view
  → Pre-fetch next 10 words in current path
  → Keep last 30 days of learned cards cached
  → Auto-clean cards older than 90 days if storage is tight
```

### Interface Contract
- `downloadPack(pathId) → DownloadProgress`
- `getCacheStatus(pathId) → { downloaded, total, sizeBytes }`
- `isAvailableOffline(wordId) → boolean`
- `queueSyncEvent(event) → void`
- `syncWhenOnline() → SyncResult`
- `clearOldCache(daysToKeep) → { freedBytes }`

### Open Decisions
- Max storage budget per user (suggest: 500MB default, configurable)
- Sync conflict resolution strategy (last-write-wins? merge?)
- Should we offer a "download all" option for premium users?
- On-device pronunciation scoring model (CoreML / TFLite)?

---

## Module 12: Monetization

**Purpose:** Revenue model that aligns incentives — users pay for value they can immediately feel.

**Owner:** Product / Business Designer

### Responsibilities
- Define free vs. premium feature boundaries
- Implement travel pack purchases
- Manage subscription lifecycle
- Paywall placement (after value, never before)
- Track conversion funnels

### Tiers

| Feature | Free | Premium |
|---|---|---|
| Words per day | 5 new words | Unlimited |
| Languages | 1 | All |
| Travel packs | -- | Included (or à la carte) |
| Mnemonic regeneration | 2 per word | Unlimited |
| Hands-free mode | 5 min/day | Unlimited |
| Conversational tutor | 3 messages/day | Unlimited |
| Offline download | -- | Full packs |
| Community gallery | Browse only | Browse + submit |
| Custom paths | -- | Unlimited |
| Ad-free | No | Yes |

### Revenue Streams
1. **Premium subscription:** $9.99/month or $59.99/year
2. **Travel packs (à la carte):** $4.99 per destination (for non-subscribers)
3. **No ads in free tier during learning.** Ads only on non-learning screens (home, settings). Never interrupt the flow.

### Paywall Placement Rules
- **Never before the aha moment.** User must experience 3+ words free.
- **Natural gates:** "You've learned 5 words today! Unlock unlimited with Premium."
- **Travel mode upsell:** "Going somewhere? Get a travel pack and be ready in 2 weeks."
- **Soft conversion:** Show premium features working (e.g., show hands-free mode for 5 min, then gate).

### Interface Contract
- `getUserTier(userId) → "free" | "premium"`
- `checkFeatureAccess(userId, feature) → { allowed, upgradePrompt? }`
- `getDailyUsage(userId) → { wordsLearned, tutorMessages, handsFreeMinutes }`
- `purchaseTravelPack(userId, destinationId) → PurchaseResult`
- `startSubscription(userId, plan) → SubscriptionResult`

### Open Decisions
- App Store vs. direct billing (App Store takes 30% but handles everything)
- Free trial length for premium (7 days? 14 days?)
- Should travel packs be included in premium or always separate?
- Family plan?

---

## Module 13: Platform & Infrastructure

**Purpose:** The technical foundation — APIs, database, auth, hosting, CI/CD, analytics.

**Owner:** Backend / DevOps Engineer

### Responsibilities
- API layer (REST or GraphQL) serving all client modules
- Database setup and migrations
- User authentication (email, Apple, Google sign-in)
- File storage (images, audio) via CDN
- Background job processing (mnemonic generation, image generation, audio generation)
- Analytics event tracking
- Error monitoring and alerting
- CI/CD pipeline

### Recommended Stack (Starting Point)

```
Client:        React Native (iOS + Android) or Flutter
                + Next.js for web/landing page
API:           Node.js/Express or Python/FastAPI
Database:      PostgreSQL (primary) + Redis (caching, SRS queues)
Auth:          Supabase Auth or Firebase Auth
File Storage:  Cloudflare R2 or AWS S3 + CloudFront CDN
AI APIs:       Claude API (mnemonic generation, conversational tutor)
               DALL-E 3 or Flux (image generation)
               ElevenLabs or Whisper (audio)
Job Queue:     BullMQ (Node) or Celery (Python)
Analytics:     PostHog or Mixpanel
Monitoring:    Sentry
Hosting:       Vercel (web) + Railway or Fly.io (API)
```

### API Structure

```
/api/v1/
  /auth           → signup, login, oauth callbacks
  /users          → profile, preferences, progress
  /words          → word data, search
  /mnemonics      → generate, regenerate, custom, community
  /paths          → list, progress, custom generation
  /travel-packs   → list, purchase, download
  /reviews        → record review, get due words
  /tutor          → start session, send message, end session
  /audio          → pronunciation scoring, TTS
  /social         → share card, community gallery, upvote
  /billing        → subscription, purchases
```

### Key Non-Functional Requirements
- **Mnemonic generation latency:** < 3 seconds for keyword + scene
- **Image generation latency:** < 10 seconds (show loading animation with scene text)
- **Tutor response latency:** < 1 second first token (streaming)
- **Pronunciation scoring:** < 2 seconds
- **Offline-first:** app must be usable without network for cached content
- **Cold start:** app usable within 2 seconds of launch

### Open Decisions
- React Native vs. Flutter vs. native (Swift/Kotlin)
- Monorepo vs. separate repos for client/server
- Self-hosted AI models vs. API-only (cost at scale)
- GDPR/privacy compliance requirements
- Rate limiting strategy for AI API calls

---

## Module Dependency Map

```
Module 9 (Onboarding) depends on: 2, 3, 4, 5
Module 7 (Paths) depends on: 1, 2, 3, 6
Module 8 (Tutor) depends on: 1, 5, 6
Module 3 (Mnemonic) depends on: 2
Module 4 (Image) depends on: 3
Module 5 (Audio) depends on: 3
Module 6 (SRS) depends on: 1
Module 10 (Social) depends on: 1, 4
Module 11 (Offline) depends on: 1, 4, 5
Module 12 (Monetization) depends on: 1
Module 13 (Platform) depends on: nothing (foundation)
Module 1 (Core Data) depends on: 13
Module 2 (Content) depends on: nothing (can be built independently)
```

### Recommended Build Order

```
Phase 1 — Foundation (Weeks 1-3):
  Module 13 (Platform) → Module 1 (Core Data) → Module 2 (Content Library)

Phase 2 — Core Magic (Weeks 3-6):
  Module 3 (Mnemonic Engine) → Module 4 (Image Gen) → Module 5 (Audio)

Phase 3 — Learning Loop (Weeks 5-8):
  Module 6 (SRS) → Module 7 (Paths) → Module 9 (Onboarding)

Phase 4 — Intelligence (Weeks 7-10):
  Module 8 (Conversational Tutor)

Phase 5 — Growth & Polish (Weeks 9-12):
  Module 10 (Social) → Module 11 (Offline) → Module 12 (Monetization)
```

Note: Phases overlap intentionally. Modules within a phase can often be parallelized across different teams/designers.

---

## Handoff Checklist

When assigning a module to a designer/AI, include:
1. This module's full section from this document
2. The **Interface Contracts** of any modules it depends on
3. The **Key Entities** from Module 1 that it touches
4. The **Open Decisions** — they should propose answers, not just note the questions
5. The overall product vision from the concept doc (so they understand *why*)
