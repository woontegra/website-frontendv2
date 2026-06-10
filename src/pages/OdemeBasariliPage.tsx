import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { resolvePanelLoginCta } from '@/lib/contentBundle';
import { paymentPageInternalNav } from '@/lib/paymentPageNav';
import {
  confirmPaymentManualCallback,
  fetchPaymentPublicStatus,
  type ApiEnvelope,
  type PublicPaymentStatusData,
} from '@/lib/storeApi';
import { Button } from '@/components/ui/Button';

const POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

const COPY_SUCCESS =
  'Ödemeniz başarıyla alındı. Abonelik aktivasyonunuz tamamlandıysa programa giriş yapabilirsiniz.';
const COPY_SOFT_GUEST =
  'Ödemeniz alınmıştır. Abonelik aktivasyonunuz ödeme bildiriminin doğrulanmasının ardından kısa süre içinde tamamlanacaktır.';
const COPY_SOFT_PENDING =
  'Ödemeniz alınmıştır. Ödeme bildiriminiz kısa süre içinde işlenecektir. Bu işlem genellikle birkaç dakika içinde tamamlanır.';
const COPY_HARD =
  'Ödeme durumunuz şu anda doğrulanamadı. Ödeme yaptıysanız sipariş numaranızla destek ekibimizle iletişime geçebilirsiniz.';
const COPY_POLLING = 'Ödeme bildirimi kontrol ediliyor...';

type Phase =
  | 'checking'
  | 'success'
  | 'soft_guest'
  | 'soft_pending'
  | 'hard'
  | 'neutral_no_oid';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isGuestNoUserManualFailure(res: ApiEnvelope<unknown>): boolean {
  if (res.success === true) return false;
  const msg = `${(res as { message?: string }).message ?? ''}${(res as { error?: string }).error ?? ''}`.toLowerCase();
  return msg.includes('kullanıcı bulunamadı');
}

export default function OdemeBasariliPage() {
  const [searchParams] = useSearchParams();
  const merchantOid = searchParams.get('merchant_oid');
  const [phase, setPhase] = useState<Phase>(merchantOid ? 'checking' : 'neutral_no_oid');
  const { content } = useContentBundle();
  const panelLogin = resolvePanelLoginCta(content);

  const homeNav = paymentPageInternalNav('/');
  const iletisimNav = paymentPageInternalNav('/iletisim');
  const panelNav: {
    href: string;
    external: boolean;
    externalTarget?: '_blank' | '_self';
  } = panelLogin.external
    ? { href: panelLogin.href, external: true }
    : paymentPageInternalNav(
        panelLogin.href.startsWith('/') ? panelLogin.href : `/${panelLogin.href}`,
      );

  useEffect(() => {
    if (!merchantOid) {
      setPhase('neutral_no_oid');
      return;
    }

    let cancelled = false;

    void (async () => {
      setPhase('checking');
      let manualGuestNoUser = false;

      try {
        const manual = await confirmPaymentManualCallback(merchantOid);
        if (cancelled) return;
        if (manual.success !== true && isGuestNoUserManualFailure(manual)) {
          manualGuestNoUser = true;
        }
      } catch {
        /* manual isteği başarısız; public-status ile devam */
      }

      let lastData: PublicPaymentStatusData | null = null;
      let okReads = 0;
      let all404 = true;

      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        if (cancelled) return;
        if (i > 0) await sleep(POLL_INTERVAL_MS);

        const st = await fetchPaymentPublicStatus(merchantOid);
        if (cancelled) return;

        if (st.ok && st.data) {
          all404 = false;
          okReads++;
          lastData = st.data;
          if (st.data.status === 'success') {
            setPhase('success');
            return;
          }
          if (st.data.status === 'failed') {
            setPhase('hard');
            return;
          }
        } else {
          if (st.status !== 404) {
            all404 = false;
          }
        }
      }

      if (cancelled) return;

      if (lastData?.status === 'pending') {
        setPhase(manualGuestNoUser ? 'soft_guest' : 'soft_pending');
        return;
      }

      if (okReads === 0 && all404) {
        setPhase('hard');
        return;
      }

      if (okReads === 0) {
        setPhase('hard');
        return;
      }

      setPhase('soft_pending');
    })();

    return () => {
      cancelled = true;
    };
  }, [merchantOid]);

  const leadCopy =
    phase === 'checking'
      ? 'Ödemeniz alınmıştır. Ödeme bildiriminiz kontrol ediliyor; lütfen kısa süre bekleyin.'
      : phase === 'success'
        ? COPY_SUCCESS
        : phase === 'soft_guest'
          ? COPY_SOFT_GUEST
          : phase === 'soft_pending' || phase === 'neutral_no_oid'
            ? COPY_SOFT_PENDING
            : phase === 'hard'
              ? COPY_HARD
              : COPY_SOFT_PENDING;

  const showCheckingLine = phase === 'checking' && Boolean(merchantOid);
  const leadTone =
    phase === 'hard'
      ? 'text-red-900'
      : phase === 'soft_guest' || phase === 'soft_pending' || phase === 'neutral_no_oid'
        ? 'text-amber-950'
        : 'text-slate-600';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" strokeWidth={2} />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Ödeme alındı</h1>
        <p className={`mt-3 text-sm leading-relaxed ${leadTone}`}>{leadCopy}</p>
        {merchantOid ? (
          <p className="mt-4 text-xs text-slate-500">
            Sipariş numarası{' '}
            <code className="mt-1 block break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">
              {merchantOid}
            </code>
          </p>
        ) : null}
        {showCheckingLine ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {COPY_POLLING}
          </p>
        ) : null}
        <p className="mt-6 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Herhangi bir sorun yaşarsanız destek ile iletişime geçebilirsiniz.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            to={homeNav.href}
            external={homeNav.external}
            externalTarget={homeNav.externalTarget}
            variant="accent"
            className="w-full justify-center"
          >
            Ana sayfaya dön
          </Button>
          <Button
            to={panelNav.href}
            external={panelNav.external}
            externalTarget={panelNav.externalTarget}
            variant="outline"
            className="w-full justify-center border-emerald-600 text-emerald-900 hover:border-emerald-700 hover:bg-emerald-50"
          >
            Programa giriş yap
          </Button>
          <Button
            to={iletisimNav.href}
            external={iletisimNav.external}
            externalTarget={iletisimNav.externalTarget}
            variant="outline"
            className="w-full justify-center"
          >
            Destek / iletişim
          </Button>
        </div>
      </div>
    </div>
  );
}
