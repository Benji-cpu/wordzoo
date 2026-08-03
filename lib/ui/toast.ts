/**
 * Toast helpers.
 *
 * sonner is imported lazily because the learn and review flows are the hot
 * paths and none of them need the toast bundle unless something goes wrong.
 * That lazy import was hand-rolled at six separate call sites before this
 * existed; the copies drifted (some checked `res.ok`, some didn't).
 *
 * The <Toaster /> itself is mounted once in app/(app)/layout.tsx.
 */

export function toastError(message: string): void {
  void import('sonner').then(({ toast }) => toast.error(message));
}

export function toastSuccess(message: string): void {
  void import('sonner').then(({ toast }) => toast.success(message));
}
