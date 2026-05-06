export interface TripPreviewWord {
  text: string;
  romanization: string | null;
  meaning: string;
  partOfSpeech: string;
}

export interface TripPreviewScene {
  title: string;
  narrative: string;
  words: TripPreviewWord[];
}

export interface TripPreviewResponse {
  pathTitle: string;
  pathDescription: string;
  destination: string;
  tripDays: number;
  useCases: string[];
  languageId: string;
  languageCode: string;
  scenes: TripPreviewScene[];
}
