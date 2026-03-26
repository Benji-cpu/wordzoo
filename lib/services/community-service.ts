import { filterMnemonicContent } from '@/lib/ai/safety';
import {
  submitToCommunity,
  getCommunitySubmission,
  getMnemonicOwner,
  isMnemonicApproved,
  getMnemonicWordId,
  toggleVote,
  flagMnemonic,
  adoptCommunityMnemonic,
} from '@/lib/db/community-queries';
import { sql } from '@/lib/db/client';
import type { CommunityMnemonic } from '@/types/database';

export async function submitMnemonicToCommunity(
  mnemonicId: string,
  userId: string
): Promise<CommunityMnemonic> {
  // Verify ownership
  const owner = await getMnemonicOwner(mnemonicId);
  if (owner !== userId) {
    throw new Error('You can only submit your own mnemonics');
  }

  // Check not already submitted
  const existing = await getCommunitySubmission(mnemonicId);
  if (existing) {
    throw new Error('This mnemonic has already been submitted to the community');
  }

  // Fetch mnemonic data for safety check
  const rows = await sql`
    SELECT keyword_text, scene_description FROM mnemonics WHERE id = ${mnemonicId}
  `;
  if (rows.length === 0) {
    throw new Error('Mnemonic not found');
  }
  const mnemonic = rows[0] as { keyword_text: string; scene_description: string };

  // Run safety filter — auto-approve if safe, else pending for review
  const safetyResult = filterMnemonicContent({
    keyword: mnemonic.keyword_text,
    sceneDescription: mnemonic.scene_description,
    phoneticLink: '',
    bridgeSentence: '',
    imagePrompt: '',
  });

  const status = safetyResult.safe ? 'approved' : 'pending';
  return submitToCommunity(mnemonicId, userId, status);
}

export async function voteOnMnemonic(
  userId: string,
  mnemonicId: string
): Promise<{ voted: boolean; newCount: number }> {
  // Verify mnemonic is approved in community
  const approved = await isMnemonicApproved(mnemonicId);
  if (!approved) {
    throw new Error('Cannot vote on a mnemonic that is not in the community');
  }

  // Cannot vote on own mnemonic
  const owner = await getMnemonicOwner(mnemonicId);
  if (owner === userId) {
    throw new Error('Cannot vote on your own mnemonic');
  }

  return toggleVote(userId, mnemonicId);
}

export async function flagMnemonicContent(
  userId: string,
  mnemonicId: string,
  reason: string,
  detail?: string
): Promise<void> {
  const approved = await isMnemonicApproved(mnemonicId);
  if (!approved) {
    throw new Error('Cannot flag a mnemonic that is not in the community');
  }

  await flagMnemonic(userId, mnemonicId, reason, detail);
}

export async function adoptMnemonic(
  userId: string,
  wordId: string,
  mnemonicId: string
): Promise<void> {
  // Verify mnemonic is for the correct word and approved
  const mnemonicWordId = await getMnemonicWordId(mnemonicId);
  if (mnemonicWordId !== wordId) {
    throw new Error('Mnemonic does not belong to the specified word');
  }

  const approved = await isMnemonicApproved(mnemonicId);
  if (!approved) {
    throw new Error('Cannot adopt a mnemonic that is not approved');
  }

  await adoptCommunityMnemonic(userId, wordId, mnemonicId);
}
