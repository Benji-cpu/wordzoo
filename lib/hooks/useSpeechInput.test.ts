import { describe, it, expect, vi, beforeEach } from 'vitest';

// The hook is exercised without a DOM: React's hooks are replaced by minimal
// stand-ins (refs are plain boxes, state setters are spies), which is enough
// because the behaviour under test lives entirely in the refs.
vi.mock('react', () => ({
  useState: (init: unknown) => [init, vi.fn()],
  useRef: (init: unknown) => ({ current: init }),
  useCallback: (fn: unknown) => fn,
  useEffect: () => {},
}));

const blocked = vi.fn(() => false);
vi.mock('@/lib/audio/speech-support', () => ({
  isSpeechServiceBlocked: () => blocked(),
  markSpeechServiceBlocked: vi.fn(),
  recordSpeechFailure: vi.fn(() => false),
  recordSpeechSuccess: vi.fn(),
  speechRetryMessage: () => 'retry',
  speechUnavailableMessage: () => 'unavailable',
}));

import { useSpeechInput } from './useSpeechInput';

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {}
  stop() {}
  abort() {}
  say(finals: string, interim = '') {
    const results: Record<number, unknown> & { length: number } = { length: 0 };
    let i = 0;
    if (finals) results[i++] = { isFinal: true, 0: { transcript: finals } };
    if (interim) results[i++] = { isFinal: false, 0: { transcript: interim } };
    results.length = i;
    this.onresult?.({ results, resultIndex: 0 });
  }
}

function useSetup() {
  Object.assign(globalThis, {
    window: { SpeechRecognition: FakeRecognition },
    navigator: { maxTouchPoints: 0, userAgent: '' },
  });
  return useSpeechInput('en-US');
}

beforeEach(() => {
  FakeRecognition.instances = [];
  blocked.mockReturnValue(false);
});

describe('useSpeechInput startListening', () => {
  it('returns true when recognition started', () => {
    const speech = useSetup();
    expect(speech.startListening()).toBe(true);
  });

  it('a blocked start returns false and does not hand back the last session text', async () => {
    const speech = useSetup();
    expect(speech.startListening()).toBe(true);
    FakeRecognition.instances[0].say('the button is broken');
    const stopped = speech.stopListening();
    FakeRecognition.instances[0].onend?.();
    expect(await stopped).toBe('the button is broken');

    blocked.mockReturnValue(true);
    expect(speech.startListening()).toBe(false);
    expect(await speech.stopListening()).toBe('');
  });

  it('an unsupported browser returns false too', () => {
    const speech = useSetup();
    Object.assign(globalThis, { window: {} });
    expect(speech.startListening()).toBe(false);
  });

  it('a session started over one still flushing keeps the old words for its waiter', async () => {
    const speech = useSetup();
    speech.startListening();
    FakeRecognition.instances[0].say('first', 'thought');
    const stopped = speech.stopListening();
    // Second tap before the first instance's onend arrives.
    expect(speech.startListening()).toBe(true);
    expect(await stopped).toBe('first thought');
    // The new session starts clean.
    FakeRecognition.instances[1].say('second');
    const second = speech.stopListening();
    FakeRecognition.instances[1].onend?.();
    expect(await second).toBe('second');
  });
});
