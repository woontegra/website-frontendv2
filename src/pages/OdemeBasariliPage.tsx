import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { confirmPaymentManualCallback } from '@/lib/storeApi';
import { Button } from '@/components/ui/Button';

export default function OdemeBasariliPage() {
  const [searchParams] = useSearchParams();
  const merchantOid = searchParams.get('merchant_oid');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!merchantOid) return;
    let cancelled = false;
    setStatus('loading');
    confirmPaymentManualCallback(merchantOid)
      .then((res) => {
        if (cancelled) return;
        setStatus(res.success ? 'done' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [merchantOid]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" strokeWidth={2} />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Ödeme alındı</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Ödemeniz başarıyla tamamlandı. Aboneliğiniz kısa süre içinde aktifleştirilecektir.
        </p>
        {merchantOid && (
          <p className="mt-4 text-xs text-slate-500">
            Sipariş no: <span className="font-mono">{merchantOid}</span>
          </p>
        )}
        {status === 'loading' && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            İşlem doğrulanıyor…
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-amber-800">
            Ödeme kaydı doğrulanamadı; destek ile iletişime geçebilirsiniz.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button to="/" variant="accent">
            Ana sayfaya dön
          </Button>
          <Button to="/satin-al" variant="outline">
            Satın al
          </Button>
        </div>
        <Link to="/iletisim" className="mt-4 inline-block text-sm text-sky-700 hover:underline">
          Destek / iletişim
        </Link>
      </div>
    </div>
  );
}
