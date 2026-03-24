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

// Image generation types
export interface ImageGenerationResponse {
  imageUrl: string;
}

// Mnemonic generation types
export interface MnemonicCandidate {
  keyword: string;
  phoneticLink: string; // e.g. "KOO-ching sounds like couching"
  bridgeSentence: string; // e.g. "EENIE meenie — THIS is the one!"
  sceneDescription: string;
  imagePrompt: string;
}

export interface MnemonicGenerationResult {
  candidates: MnemonicCandidate[];
  recommended: number; // index of best candidate
}
