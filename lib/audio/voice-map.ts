import type { SupportedLanguageCode, LanguageVoiceConfig, AudioCapabilities } from '@/types/audio';

export const LANGUAGE_VOICE_MAP: Record<SupportedLanguageCode, LanguageVoiceConfig> = {
  id: { bcp47: 'id-ID', fallbackBcp47: 'ms-MY', speechRecognitionSupported: true },
  es: { bcp47: 'es-MX', fallbackBcp47: 'es-ES', speechRecognitionSupported: true },
  ja: { bcp47: 'ja-JP', fallbackBcp47: 'ja-JP', speechRecognitionSupported: false },
};

const voiceCache = new Map<string, SpeechSynthesisVoice>();

function findVoice(bcp47: string): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === bcp47) ??
    voices.find((v) => v.lang.startsWith(bcp47.split('-')[0]))
  );
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(speechSynthesis.getVoices());
    }, { once: true });
  });
}

export async function getVoiceForLanguage(
  langCode: SupportedLanguageCode
): Promise<SpeechSynthesisVoice | null> {
  const cached = voiceCache.get(langCode);
  if (cached) return cached;

  await waitForVoices();
  const config = LANGUAGE_VOICE_MAP[langCode];
  const voice = findVoice(config.bcp47) ?? findVoice(config.fallbackBcp47) ?? null;
  if (voice) voiceCache.set(langCode, voice);
  return voice;
}

export async function getEnglishVoice(): Promise<SpeechSynthesisVoice | null> {
  const cached = voiceCache.get('en');
  if (cached) return cached;

  await waitForVoices();
  const voices = speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === 'en-US' && v.name.includes('Samantha')) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null;
  if (voice) voiceCache.set('en', voice);
  return voice;
}

export function speakWithPromise(utterance: SpeechSynthesisUtterance): Promise<void> {
  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        resolve();
      } else {
        reject(new Error(`Speech error: ${e.error}`));
      }
    };
    speechSynthesis.speak(utterance);
  });
}

export function detectAudioCapabilities(): AudioCapabilities {
  const w = typeof window !== 'undefined' ? window : undefined;
  return {
    speechSynthesis: typeof w?.speechSynthesis !== 'undefined',
    speechRecognition:
      typeof w !== 'undefined' &&
      ('SpeechRecognition' in w || 'webkitSpeechRecognition' in w),
    mediaSession: typeof w?.navigator?.mediaSession !== 'undefined',
    getUserMedia: typeof w?.navigator?.mediaDevices?.getUserMedia === 'function',
  };
}

export function pauseMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
