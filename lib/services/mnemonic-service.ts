import type { MnemonicCandidate } from '@/types/ai';

export async function generateMnemonic(
  _wordId: string,
  _userId: string
): Promise<MnemonicCandidate[]> {
  throw new Error('Not implemented');
}

export async function regenerateMnemonic(
  _wordId: string,
  _userId: string,
  _excludeKeywords: string[]
): Promise<MnemonicCandidate> {
  throw new Error('Not implemented');
}

export async function generateFromUserKeyword(
  _wordId: string,
  _userId: string,
  _keyword: string
): Promise<MnemonicCandidate> {
  throw new Error('Not implemented');
}
