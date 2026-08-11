export { detectAudioCapabilities, LANGUAGE_VOICE_MAP } from './voice-map';
export { playWordPronunciation, playAudioDirect, playPhraseAudio, speakText, stopPlayback, getPlaybackSpeed, setPlaybackSpeed, isAudioUnlocked, onAudioUnlocked, attachAudioUnlockListener, preloadAudioUrls } from './pronunciation';
export { narrateMnemonic, stopNarration } from './narration';
export { isScoringAvailable, startPronunciationChallenge, startSpeechAttempt, scorePronunciation } from './scoring';
export { isBraveBrowser, isSpeechServiceBlocked, markSpeechServiceBlocked, speechUnavailableMessage } from './speech-support';
export { HandsFreeEngine } from './hands-free';
export { useHandsFreeSession } from './useHandsFreeSession';
