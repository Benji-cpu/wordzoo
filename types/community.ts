// Community gallery card — joined data for display
export interface CommunityMnemonicCard {
  id: string; // community_mnemonics.id
  mnemonic_id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  upvote_count: number;
  submitted_at: Date;
  author_name: string | null;
  author_image: string | null;
  author_id: string;
  has_voted: boolean;
  word_id: string;
}

// Data for the public word page
export interface PublicWordData {
  word_id: string;
  word_text: string;
  romanization: string | null;
  meaning_en: string;
  part_of_speech: string;
  language_name: string;
  language_code: string;
  // Best community mnemonic (highest upvotes, approved)
  mnemonic_id: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  image_url: string | null;
  upvote_count: number | null;
}

// Referral aggregate stats
export interface ReferralStats {
  total_clicks: number;
  total_signups: number;
}
