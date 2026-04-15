import { z } from 'zod/v4';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// --- Zod Schemas ---

export const UuidSchema = z.string().uuid();

export const LanguageIdParamSchema = z.object({
  languageId: z.string().uuid(),
});

// Mnemonics
export const GenerateMnemonicSchema = z.object({
  wordId: z.string().uuid(),
});

export const RegenerateMnemonicSchema = z.object({
  wordId: z.string().uuid(),
  excludeKeywords: z.array(z.string()),
});

export const CustomMnemonicSchema = z.object({
  wordId: z.string().uuid(),
  keyword: z.string().min(1).max(200),
});

// Paths
export const CustomPathSchema = z.object({
  languageId: z.string().uuid(),
  userInput: z.string().min(1).max(500),
});

// Reviews
export const ReviewDirectionEnum = z.enum(['recognition', 'production']);
export const ReviewRatingEnum = z.enum(['instant', 'got_it', 'hard', 'forgot']);

export const RecordReviewSchema = z.object({
  wordId: z.string().uuid(),
  direction: ReviewDirectionEnum,
  rating: ReviewRatingEnum,
});

export const DueWordsQuerySchema = z.object({
  context: z.enum(['pre_scene', 'session_start', 'conversation']).optional(),
});

// Tutor
export const TutorModeEnum = z.enum(['free_chat', 'role_play', 'word_review', 'grammar_glimpse', 'pronunciation_coach', 'guided_conversation', 'path_builder']);

export const TutorSessionSchema = z.object({
  mode: TutorModeEnum,
  languageId: z.string().uuid(),
  scenario: z.string().max(500).optional(),
});

export const TutorEndSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const TutorMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// Words
export const WordIdParamSchema = z.object({
  wordId: z.string().uuid(),
});

// Path params
export const PathIdParamSchema = z.object({
  pathId: z.string().uuid(),
});

export const SceneIdParamSchema = z.object({
  sceneId: z.string().uuid(),
});

// Travel pack
export const TravelPackSchema = z.object({
  destination: z.string().min(1).max(200),
  duration: z.string().min(1).max(100),
  languageId: z.string().uuid(),
});

// Graduation
export const GraduatePathSchema = z.object({
  quizScore: z.number().min(0).max(100),
});

// Billing
export const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export const TravelPackCheckoutSchema = z.object({
  packId: z.string().uuid(),
});

export const BillingFeatureEnum = z.enum([
  'new_word',
  'regenerate_mnemonic',
  'hands_free',
  'tutor_message',
  'custom_path',
  'offline_download',
  'community_submit',
  'studio_path',
]);

export const CheckAccessSchema = z.object({
  feature: BillingFeatureEnum,
});

export const IncrementUsageSchema = z.object({
  feature: BillingFeatureEnum,
  amount: z.number().int().min(1).optional().default(1),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type TravelPackCheckoutInput = z.infer<typeof TravelPackCheckoutSchema>;
export type BillingFeature = z.infer<typeof BillingFeatureEnum>;
export type CheckAccessInput = z.infer<typeof CheckAccessSchema>;
export type IncrementUsageInput = z.infer<typeof IncrementUsageSchema>;

// Offline sync
export const SyncEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  word_id: z.string().uuid(),
  direction: ReviewDirectionEnum,
  rating: ReviewRatingEnum,
  reviewed_at: z.string(),
  created_at: z.string(),
});

export const BatchSyncSchema = z.object({
  events: z.array(SyncEventSchema),
});

// Community
export const SubmitCommunityMnemonicSchema = z.object({
  mnemonicId: z.string().uuid(),
});

export const VoteMnemonicSchema = z.object({
  mnemonicId: z.string().uuid(),
});

export const FlagReasonEnum = z.enum(['offensive', 'spam', 'misleading', 'other']);

export const FlagMnemonicSchema = z.object({
  mnemonicId: z.string().uuid(),
  reason: FlagReasonEnum,
  detail: z.string().max(500).optional(),
});

export const AdoptMnemonicSchema = z.object({
  mnemonicId: z.string().uuid(),
  wordId: z.string().uuid(),
});

export const CommunityListQuerySchema = z.object({
  sort: z.enum(['top', 'new']).optional().default('top'),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const ShareImageQuerySchema = z.object({
  format: z.enum(['square', 'story']).optional().default('square'),
});

// Mnemonic Feedback
export const FeedbackRatingEnum = z.enum(['thumbs_up', 'thumbs_down']);

export const SubmitFeedbackSchema = z.object({
  mnemonicId: z.string().uuid(),
  rating: FeedbackRatingEnum,
  comment: z.string().min(3).max(500).optional(),
});

// Admin
export const AdminRegenerateMnemonicSchema = z.object({
  mnemonicId: z.string().uuid(),
});

export const AdminFeedbackQuerySchema = z.object({
  sort: z.enum(['worst', 'best', 'recent']).optional().default('worst'),
  page: z.coerce.number().int().min(1).optional().default(1),
});

// Type exports from schemas
export type GenerateMnemonicInput = z.infer<typeof GenerateMnemonicSchema>;
export type RegenerateMnemonicInput = z.infer<typeof RegenerateMnemonicSchema>;
export type CustomMnemonicInput = z.infer<typeof CustomMnemonicSchema>;
export type CustomPathInput = z.infer<typeof CustomPathSchema>;
export type RecordReviewInput = z.infer<typeof RecordReviewSchema>;
export type TutorSessionInput = z.infer<typeof TutorSessionSchema>;
export type TutorMessageInput = z.infer<typeof TutorMessageSchema>;
export type TutorEndSessionInput = z.infer<typeof TutorEndSessionSchema>;
export type TravelPackInput = z.infer<typeof TravelPackSchema>;
export type GraduatePathInput = z.infer<typeof GraduatePathSchema>;
export type SubmitCommunityMnemonicInput = z.infer<typeof SubmitCommunityMnemonicSchema>;
export type VoteMnemonicInput = z.infer<typeof VoteMnemonicSchema>;
export type FlagMnemonicInput = z.infer<typeof FlagMnemonicSchema>;
export type AdoptMnemonicInput = z.infer<typeof AdoptMnemonicSchema>;
export type CommunityListQuery = z.infer<typeof CommunityListQuerySchema>;
export type ShareImageQuery = z.infer<typeof ShareImageQuerySchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type AdminRegenerateMnemonicInput = z.infer<typeof AdminRegenerateMnemonicSchema>;
export type AdminFeedbackQuery = z.infer<typeof AdminFeedbackQuerySchema>;

// Scene Flow Progress
export const SceneFlowPhaseEnum = z.enum(['dialogue', 'phrases', 'vocabulary', 'patterns', 'affixes', 'conversation', 'summary']);

export const UpdateSceneProgressSchema = z.object({
  currentPhase: SceneFlowPhaseEnum,
  phaseIndex: z.number().int().min(0),
  phaseCompleted: z.string().optional(), // e.g. 'dialogue', 'phrases', etc.
});

export type UpdateSceneProgressInput = z.infer<typeof UpdateSceneProgressSchema>;

// Guided Conversation
export const StartGuidedSessionSchema = z.object({
  sceneId: z.string().uuid(),
});

export type StartGuidedSessionInput = z.infer<typeof StartGuidedSessionSchema>;

// Phrase Review
export const RecordPhraseReviewSchema = z.object({
  phraseId: z.string().uuid(),
  rating: ReviewRatingEnum,
});

export type RecordPhraseReviewInput = z.infer<typeof RecordPhraseReviewSchema>;

// Tutor Nudge
export const NudgeQuerySchema = z.object({
  languageId: z.string().uuid(),
  page: z.string().min(1),
});

export const NudgeActionSchema = z.object({
  nudgeId: z.string().uuid(),
  action: z.enum(['dismissed', 'accepted']),
});

export type NudgeQueryInput = z.infer<typeof NudgeQuerySchema>;
export type NudgeActionInput = z.infer<typeof NudgeActionSchema>;

// Tutor Profile
export const ProfileQuerySchema = z.object({
  languageId: z.string().uuid(),
});

export type ProfileQueryInput = z.infer<typeof ProfileQuerySchema>;

// Path Builder
export const PathBuilderActionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['keep', 'remove', 'different', 'advance_phase']),
  itemType: z.enum(['vocabulary', 'phrase', 'dialogue']).optional(),
  tempId: z.string().optional(),
});

export type PathBuilderActionInput = z.infer<typeof PathBuilderActionSchema>;

// --- Studio ---

export const StudioStartSchema = z.object({
  languageId: z.string().uuid(),
  prefillScenario: z.string().max(500).optional(),
});

export const StudioChatSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  selections: z.array(z.string()).optional(),
});

export const StudioGenerateSchema = z.object({
  sessionId: z.string().uuid(),
});

export const StudioSuggestionsSchema = z.object({
  sessionId: z.string().uuid(),
  scenario: z.string().min(1).max(500),
});

export type StudioStartInput = z.infer<typeof StudioStartSchema>;
export type StudioChatInput = z.infer<typeof StudioChatSchema>;
export type StudioGenerateInput = z.infer<typeof StudioGenerateSchema>;
export type StudioSuggestionsInput = z.infer<typeof StudioSuggestionsSchema>;

// --- App Feedback ---

export const SubmitAppFeedbackSchema = z.object({
  message: z.string().min(1).max(1000),
  pageUrl: z.string().min(1).max(2000),
  pageTitle: z.string().max(200).optional(),
  routeParams: z.record(z.string(), z.string()).optional(),
  screenshotUrl: z.string().url().optional(),
  viewportWidth: z.number().int().positive().optional(),
  viewportHeight: z.number().int().positive().optional(),
  userAgent: z.string().max(500).optional(),
});

export const UpdateAppFeedbackSchema = z.object({
  status: z.enum(['new', 'reviewed', 'actioned', 'dismissed']),
  adminNotes: z.string().max(2000).optional(),
});

export const AppFeedbackQuerySchema = z.object({
  status: z.enum(['all', 'new', 'reviewed', 'actioned', 'dismissed']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type SubmitAppFeedbackInput = z.infer<typeof SubmitAppFeedbackSchema>;
export type UpdateAppFeedbackInput = z.infer<typeof UpdateAppFeedbackSchema>;
export type AppFeedbackQuery = z.infer<typeof AppFeedbackQuerySchema>;
