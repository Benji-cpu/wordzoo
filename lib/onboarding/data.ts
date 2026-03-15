// Static onboarding data — no API calls, no database queries.
// All content is hand-crafted to guarantee zero latency during onboarding.

export interface OnboardingWord {
  id: string;
  text: string;
  romanization?: string;
  meaningEn: string;
  partOfSpeech: string;
  keyword: string;
  phoneticLink: string;
  sceneDescription: string;
  imageUrl: string;
  distractors: [string, string, string];
}

export interface OnboardingLanguage {
  code: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  words: [OnboardingWord, OnboardingWord, OnboardingWord];
}

export const ONBOARDING_LANGUAGES: [OnboardingLanguage, OnboardingLanguage, OnboardingLanguage] = [
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flagEmoji: '🇮🇩',
    words: [
      {
        id: 'id-kucing',
        text: 'kucing',
        meaningEn: 'cat',
        partOfSpeech: 'noun',
        keyword: 'couching',
        phoneticLink: 'kucing sounds like "couching"',
        sceneDescription: 'A fluffy cat couching down on a velvet sofa, eyes half-closed, tail curled around its paws.',
        imageUrl: '/onboarding/id-kucing.png',
        distractors: ['dog', 'bird', 'fish'],
      },
      {
        id: 'id-besar',
        text: 'besar',
        meaningEn: 'big',
        partOfSpeech: 'adjective',
        keyword: 'bazaar',
        phoneticLink: 'besar sounds like "bazaar"',
        sceneDescription: 'A massive, impossibly big bazaar stretching to the horizon, with giant fruits and oversized lanterns towering over tiny shoppers.',
        imageUrl: '/onboarding/id-besar.png',
        distractors: ['small', 'fast', 'round'],
      },
      {
        id: 'id-makan',
        text: 'makan',
        meaningEn: 'eat',
        partOfSpeech: 'verb',
        keyword: "mackin'",
        phoneticLink: 'makan sounds like "mackin\'"',
        sceneDescription: 'Someone mackin\' on a huge plate of nasi goreng, chopsticks flying, rice grains everywhere, pure joy on their face.',
        imageUrl: '/onboarding/id-makan.png',
        distractors: ['drink', 'sleep', 'run'],
      },
    ],
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flagEmoji: '🇪🇸',
    words: [
      {
        id: 'es-mariposa',
        text: 'mariposa',
        meaningEn: 'butterfly',
        partOfSpeech: 'noun',
        keyword: 'marry-pose',
        phoneticLink: 'mariposa sounds like "marry-pose-a"',
        sceneDescription: 'A butterfly striking a dramatic wedding pose at the altar, wearing a tiny veil, wings spread wide like a bridal train.',
        imageUrl: '/onboarding/es-mariposa.png',
        distractors: ['bee', 'flower', 'bird'],
      },
      {
        id: 'es-cerveza',
        text: 'cerveza',
        meaningEn: 'beer',
        partOfSpeech: 'noun',
        keyword: 'sir-visa',
        phoneticLink: 'cerveza sounds like "sir-visa"',
        sceneDescription: 'A knight called "Sir Visa" presenting his golden credit card to pay for a giant frosty mug of beer at a medieval tavern.',
        imageUrl: '/onboarding/es-cerveza.png',
        distractors: ['wine', 'water', 'juice'],
      },
      {
        id: 'es-perezoso',
        text: 'perezoso',
        meaningEn: 'lazy',
        partOfSpeech: 'adjective',
        keyword: 'pair-of-so-sos',
        phoneticLink: 'perezoso sounds like "pair-of-so-sos"',
        sceneDescription: 'A pair of SOS signals lazily flickering on and off, too lazy to fully light up, slumped against a hammock on a tropical beach.',
        imageUrl: '/onboarding/es-perezoso.png',
        distractors: ['busy', 'angry', 'tall'],
      },
    ],
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flagEmoji: '🇯🇵',
    words: [
      {
        id: 'ja-neko',
        text: '猫',
        romanization: 'neko',
        meaningEn: 'cat',
        partOfSpeech: 'noun',
        keyword: 'neck-oh',
        phoneticLink: 'neko sounds like "neck-oh"',
        sceneDescription: 'A cat wearing a sparkling necklace around its neck, looking surprised — "Oh!" — as it admires itself in a mirror.',
        imageUrl: '/onboarding/ja-neko.png',
        distractors: ['dog', 'rabbit', 'horse'],
      },
      {
        id: 'ja-kawaii',
        text: 'かわいい',
        romanization: 'kawaii',
        meaningEn: 'cute',
        partOfSpeech: 'adjective',
        keyword: 'cow-eye',
        phoneticLink: 'kawaii sounds like "cow-eye"',
        sceneDescription: 'A cow with the biggest, most adorable anime eyes you\'ve ever seen — impossibly cute cow-eyes blinking with sparkles.',
        imageUrl: '/onboarding/ja-kawaii.png',
        distractors: ['ugly', 'scary', 'old'],
      },
      {
        id: 'ja-taberu',
        text: '食べる',
        romanization: 'taberu',
        meaningEn: 'eat',
        partOfSpeech: 'verb',
        keyword: 'tab-bear-oo',
        phoneticLink: 'taberu sounds like "tab-bear-oo"',
        sceneDescription: 'A bear sitting at a restaurant, opening browser tabs on a laptop to order food online, going "ooh!" at each menu item.',
        imageUrl: '/onboarding/ja-taberu.png',
        distractors: ['drink', 'walk', 'read'],
      },
    ],
  },
];
