// Anonymous trip-intake state — persisted to localStorage so the user can
// bounce out and resume, and so the intake survives Google OAuth round-trips.

import type { TripPreviewResponse } from '@/lib/trip/types';

export const TRIP_USE_CASES = [
  'eat at warungs',
  'order coffee',
  'ride a scooter',
  'bargain at markets',
  'talk to your villa host',
  'surf / beach club',
  'temple etiquette',
  'taxi / Grab rides',
] as const;

export type TripUseCase = typeof TRIP_USE_CASES[number];

export interface TripIntake {
  destination: string;          // hardcoded "Bali" in v1
  tripStartDate: string;        // YYYY-MM-DD
  tripDays: number;             // length of trip in days
  useCases: string[];
}

export interface TripStoredState {
  intake: TripIntake | null;
  preview: TripPreviewResponse | null;
  generatedAt: number | null;   // unix ms
}

export const INITIAL_TRIP_STATE: TripStoredState = {
  intake: null,
  preview: null,
  generatedAt: null,
};

const STORAGE_KEY = 'wordzoo_trip';

export function saveTripState(state: TripStoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // unavailable in SSR / private browsing
  }
}

export function loadTripState(): TripStoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TripStoredState;
  } catch {
    return null;
  }
}

export function clearTripState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  const ms = target.getTime() - today.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
