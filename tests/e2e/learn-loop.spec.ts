import { expect, test, type Page } from '@playwright/test';

/**
 * The stranger walk, automated. Two flows, on a phone viewport:
 *   1. /try — three words, no account, real illustrations, no 401s.
 *   2. The first Indonesian scene as a NON-admin — the v2 loop (breakdown,
 *      drill with typing) must render, not the old flip-card loop.
 *
 * Header strips are uppercased by CSS, so match them case-insensitively —
 * getByText sees the DOM text, not the rendered one.
 *
 * Needs `npm run dev` on :8000. Uses /api/auth/test-login, which 404s on
 * Vercel, so this can only run locally — that is the point.
 */

const FIRST_SCENE = '/learn/d1000000-0001-4000-8000-000000000004';

async function tap(page: Page, pattern: RegExp) {
  const el = page.getByText(pattern).last();
  await el.scrollIntoViewIfNeeded();
  await el.click({ force: true });
}

test('the public demo teaches three words without an account or a TTS call', async ({ page }) => {
  const apiFailures: string[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/') && !r.url().includes('/api/auth/session') && r.status() >= 400) {
      apiFailures.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto('/try');
  await page.getByPlaceholder('Your first name').fill('Sam');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Indonesian/ }).click();
  await page.getByRole('button', { name: /Just curious/ }).click();

  // Word 1: the illustration is the real Blob asset, not a placeholder.
  await expect(page.getByText('kucing')).toBeVisible();
  const img = page.locator('img[alt]').first();
  await expect(img).toHaveAttribute('src', /public\.blob\.vercel-storage\.com/);
  await tap(page, /Tap to continue/);

  // Quiz 1: wrong first, then right.
  await page.getByRole('button', { name: 'dog' }).click();
  await expect(page.getByText(/sounds like/)).toBeVisible();
  await page.getByRole('button', { name: 'cat' }).click();
  await expect(page.getByText(/You know Indonesian now/)).toBeVisible();

  // Word 2 → its quiz → the surprise recall of word 1 → word 3 → done.
  await tap(page, /Tap to continue/);
  await page.getByRole('button', { name: 'big' }).click();
  await page.getByRole('button', { name: 'cat' }).click();
  await tap(page, /Tap to continue/);
  await expect(page.getByText(/you just learned 3 Indonesian words/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep Learning' })).toBeVisible();

  expect(apiFailures).toEqual([]);
});

test('a non-admin gets the v2 loop in the first scene and the typing drill respects the keyboard', async ({ page }) => {
  await page.goto(`/api/auth/test-login?email=smoke-${Date.now()}@wordzoo.dev`);
  await page.goto(FIRST_SCENE);

  await tap(page, /Tap to begin/);
  // Five dialogue lines.
  for (let i = 0; i < 4; i++) await tap(page, /Tap to continue/);
  await tap(page, /Tap to move on/);

  // Phrase 1 card, then the v2 breakdown — the legacy loop had no breakdown.
  await expect(page.getByText(/key phrase/i).first()).toBeVisible();
  await tap(page, /Tap to continue/);
  await expect(page.getByText(/Tap a word for its memory hook/)).toBeVisible();

  // Through the remaining cards to the drill handoff.
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /Continue/ }).click();
    await tap(page, /Tap to continue/);
  }
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByText(/lock these phrases in/)).toBeVisible();
  await page.getByRole('button', { name: /Drill these/ }).click();
  await expect(page.getByText(/locked in/i)).toBeVisible();

  // Reach a typing turn. Recognition turns come first; answer them correctly
  // (scene 1's phrases are seed content, so the map is stable) — a wrong
  // answer re-queues the item and the picker hands out more recognition.
  const ANSWERS: Record<string, string> = {
    'How are you?': 'Apa kabar?',
    'Good, thank you': 'Baik, terima kasih',
    'My name is ...': 'Nama saya ...',
    'Nice to meet you': 'Senang bertemu',
    'Where from?': 'Dari mana?',
  };
  for (let i = 0; i < 12 && !(await page.getByText(/type it|fill the blank/i).count()); i++) {
    const prompt = (await page.locator('p', { hasText: /How do you say/ }).locator('..').locator('p').last().innerText()).trim();
    const answer = ANSWERS[prompt];
    expect(answer, `unknown prompt "${prompt}"`).toBeTruthy();
    await page.getByRole('button', { name: answer, exact: true }).click();
    const cont = page.getByRole('button', { name: /Continue/ });
    await page.waitForTimeout(800);
    if (await cont.isVisible().catch(() => false)) await cont.click({ force: true }).catch(() => {});
  }
  await expect(page.getByText(/type it|fill the blank/i)).toBeVisible();

  // The input's form carries the keyboard-inset transition class.
  const form = page.locator('form').filter({ has: page.locator('input[type="text"]') }).first();
  await expect(form).toHaveClass(/transition-\[padding\]/);
});
