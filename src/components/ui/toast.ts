export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export function showToast(message: string, tone: ToastTone = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app-toast', { detail: { message, tone } }),
  );
}
