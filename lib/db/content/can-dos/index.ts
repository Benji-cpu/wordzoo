import type { CanDoData } from './types';
import { ID_CAN_DOS } from './id';

export type { CanDoData } from './types';

/**
 * Mirrors lib/db/content/index.ts. Only Indonesian is authored so far —
 * es/pt/ja scenes simply have no can-dos, and every surface degrades to
 * rendering nothing rather than an empty state.
 */
export const CAN_DOS_BY_LANGUAGE: Record<string, CanDoData[]> = {
  id: ID_CAN_DOS,
};

export function getCanDosForLanguage(code: string): CanDoData[] {
  return CAN_DOS_BY_LANGUAGE[code] ?? [];
}
