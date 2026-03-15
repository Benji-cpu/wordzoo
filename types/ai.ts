// Gemini types
export interface GeminiTextOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface GeminiChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiTextResponse {
  text: string;
  tokensUsed: number;
}

// Stability AI types
export interface StabilityImageOptions {
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  style?: string;
}

export interface StabilityImageResponse {
  imageUrl: string;
  seed: number;
}

// Mnemonic generation types
export interface MnemonicCandidate {
  keyword: string;
  phoneticLink: string; // e.g. "KOO-ching sounds like couching"
  sceneDescription: string;
  imagePrompt: string;
}

export interface MnemonicGenerationResult {
  candidates: MnemonicCandidate[];
  recommended: number; // index of best candidate
}
