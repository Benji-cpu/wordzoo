import type { DailyDoseEntry } from '@/lib/daily-dose/types';
import { PT_DAILY_DOSE_PART_1 } from './part1';
import { PT_DAILY_DOSE_PART_2 } from './part2';
import { PT_DAILY_DOSE_PART_3 } from './part3';
import { PT_DAILY_DOSE_PART_4 } from './part4';

/** 29 Sep – 20 Dec 2026, one card a day, aimed at Ben's São Paulo trip. */
export const PT_DAILY_DOSE: readonly DailyDoseEntry[] = [
  ...PT_DAILY_DOSE_PART_1,
  ...PT_DAILY_DOSE_PART_2,
  ...PT_DAILY_DOSE_PART_3,
  ...PT_DAILY_DOSE_PART_4,
];
