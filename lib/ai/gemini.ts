import { GoogleGenAI } from '@google/genai';
import type { GeminiTextOptions, GeminiChatMessage, GeminiTextResponse } from '@/types/ai';

function getClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

export async function generateText(
  prompt: string,
  options: GeminiTextOptions = {}
): Promise<GeminiTextResponse> {
  const ai = getClient();
  const model = options.model ?? DEFAULT_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  });

  return {
    text: response.text ?? '',
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  };
}

export async function generateChat(
  messages: GeminiChatMessage[],
  systemPrompt: string
): Promise<GeminiTextResponse> {
  const ai = getClient();

  const contents = messages.map((m) => ({
    role: m.role === 'model' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  return {
    text: response.text ?? '',
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  };
}
