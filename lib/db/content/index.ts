// Content registry — maps language codes to their expanded scene data.

import type { DialogueSceneData } from '../dialogue-data';
import { ALL_ID_SCENES } from './id';
import { ALL_ES_SCENES } from './es';
import { ALL_PT_SCENES } from './pt';

export const CONTENT_BY_LANGUAGE: Record<string, DialogueSceneData[]> = {
  id: ALL_ID_SCENES,
  es: ALL_ES_SCENES,
  pt: ALL_PT_SCENES,
};

export function getContentForLanguage(code: string): DialogueSceneData[] {
  return CONTENT_BY_LANGUAGE[code] ?? [];
}
