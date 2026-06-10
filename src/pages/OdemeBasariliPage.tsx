import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { resolvePanelLoginCta } from '@/lib/contentBundle';
import { confirmPaymentManualCallback } from '@/lib/storeApi';
import { Button } from '@/components/ui/Button';

const PENDING_COPY =
  'Ödemeniz başarıyla alınmıştır. Abonelik aktivasyonunuz ödeme bildiriminin doğrulanmasının ardından kısa süre içinde tamamlanacaktır.';
const VERIFIED_COPY =
  'Ödemeniz başarıyla tamamlandı. Aboneliğiniz aktifleştiyse programa giriş yapabilirsiniz.';

export default function OdemeBasariliPage() {
  const [searchParams] = useSearchParams();
  const merchantOid = searchParams.get('merchant_oid');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const { content } = useContentBundle();
  const panelLogin = resolvePanelLoginCta(content);

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

  const leadCopy = status === 'done' ? VERIFIED_COPY : PENDING_COPY;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" strokeWidth={2} />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Ödeme alındı</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{leadCopy}</p>
        {merchantOid ? (
          <p className="mt-4 text-xs text-slate-500">
            Sipariş numarası{' '}
            <code className="mt-1 block break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">
              {merchantOid}
            </code>
          </p>
        ) : null}
        {status === 'loading' ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            İşlem doğrulanıyor…
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="mt-4 text-sm text-amber-800">
            Ödeme kaydı doğrulanamadı; destek ile iletişime geçebilirsiniz.
          </p>
        ) : null}
        <p className="mt-6 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Herhangi bir sorun yaşarsanız destek ile iletişime geçebilirsiniz.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button to="/" variant="accent" className="w-full justify-center">
            Ana sayfaya dön
          </Button>
          <Button
            to={panelLogin.href}
            external={panelLogin.external}
            variant="outline"
            className="w-full justify-center border-emerald-600 text-emerald-900 hover:border-emerald-700 hover:bg-emerald-50"
          >
            Programa giriş yap
          </Button>
          <Button to="/iletisim" variant="outline" className="w-full justify-center">
            Destek / iletişim
          </Button>
        </div>
      </div>
    </div>
  );
}
