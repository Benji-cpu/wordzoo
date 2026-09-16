// Brazilian Portuguese can-dos — hand-authored per unit (not AI-drafted), so
// there is no generator comment trail here. One file per unit keeps the
// content reviewable; this file only concatenates them in path order.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';
import { PT_UNIT1_CAN_DOS } from './pt-unit1';
import { PT_UNIT2_CAN_DOS } from './pt-unit2';
import { PT_UNIT3_CAN_DOS } from './pt-unit3';
import { PT_UNIT4_CAN_DOS } from './pt-unit4';
import { PT_UNIT5_CAN_DOS } from './pt-unit5';

export const PT_CAN_DOS: CanDoData[] = [
  ...PT_UNIT1_CAN_DOS,
  ...PT_UNIT2_CAN_DOS,
  ...PT_UNIT3_CAN_DOS,
  ...PT_UNIT4_CAN_DOS,
  ...PT_UNIT5_CAN_DOS,
];
