'use client';

/**
 * Fire a feedback-driven mnemonic regeneration. Generation takes 5–10s
 * (text + image), so callers toast immediately and let the result land in
 * the background — the new mnemonic is pinned server-side and surfaces on
 * the next review.
 */
export function requestMnemonicRegen(mnemonicId: string, comment?: string): void {
  import('sonner').then(({ toast }) =>
    toast("A new mnemonic is brewing — you'll see it on your next review")
  );
  fetch('/api/mnemonics/regenerate-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mnemonicId, ...(comment ? { comment } : {}) }),
  })
    .then(async (res) => {
      if (res.ok) return;
      const json = await res.json().catch(() => null);
      import('sonner').then(({ toast }) =>
        toast.error(json?.error ?? "Couldn't generate a new mnemonic — try again later")
      );
    })
    .catch(() => {
      import('sonner').then(({ toast }) =>
        toast.error("Couldn't generate a new mnemonic — try again later")
      );
    });
}
