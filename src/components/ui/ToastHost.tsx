import { useEffect, useState } from 'react';
import type { ToastTone } from '@/components/ui/toast';

export function ToastHost() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; tone: ToastTone }>).detail;
      setToast(detail);
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    };
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  if (!toast) return null;

  const colors: Record<ToastTone, string> = {
    info: 'bg-slate-800 text-white',
    success: 'bg-emerald-700 text-white',
    warning: 'bg-amber-600 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 px-4">
      <p className={`rounded-lg px-4 py-3 text-sm shadow-lg ${colors[toast.tone]}`}>{toast.message}</p>
    </div>
  );
}
