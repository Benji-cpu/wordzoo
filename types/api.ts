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
export const TutorModeEnum = z.enum(['free_chat', 'role_play', 'word_review', 'grammar_glimpse', 'pronunciation_coach']);

export const TutorSessionSchema = z.object({
  mode: TutorModeEnum,
  languageId: z.string().uuid(),
});

export const TutorMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// Type exports from schemas
export type GenerateMnemonicInput = z.infer<typeof GenerateMnemonicSchema>;
export type RegenerateMnemonicInput = z.infer<typeof RegenerateMnemonicSchema>;
export type CustomMnemonicInput = z.infer<typeof CustomMnemonicSchema>;
export type CustomPathInput = z.infer<typeof CustomPathSchema>;
export type RecordReviewInput = z.infer<typeof RecordReviewSchema>;
export type TutorSessionInput = z.infer<typeof TutorSessionSchema>;
export type TutorMessageInput = z.infer<typeof TutorMessageSchema>;
