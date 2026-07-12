import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Copy, Loader2, XCircle } from 'lucide-react';
import { useRedirectPaymentResultFromWebapi } from '@/lib/redirectWebapiPaymentHost';
import {
  fetchPaymentPublicStatus,
  fetchPublicBankTransferOrder,
  type BankTransferOrderResponse,
} from '@/lib/storeApi';
import { paymentPageInternalNav } from '@/lib/paymentPageNav';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/toast';

const POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 5000;

type LocationState = {
  bankTransferOrder?: BankTransferOrderResponse;
};

type ViewPhase =
  | 'loading'
  | 'pending'
  | 'success'
  | 'rejected'
  | 'failed'
  | 'missing';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function copyText(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => showToast('Panoya kopyalandı', 'success'),
    () => showToast('Kopyalanamadı', 'error'),
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs break-all text-right' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function OdemeBeklemedePage() {
  useRedirectPaymentResultFromWebapi();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const merchantOid = searchParams.get('merchant_oid')?.trim() ?? '';
  const initialOrderRef = useRef<BankTransferOrderResponse | null>(
    (location.state as LocationState | null)?.bankTransferOrder ?? null,
  );

  const [order, setOrder] = useState<BankTransferOrderResponse | null>(initialOrderRef.current);
  const [status, setStatus] = useState<string>(
    initialOrderRef.current?.status ?? 'bank_transfer_pending',
  );
  const [phase, setPhase] = useState<ViewPhase>(merchantOid ? 'loading' : 'missing');

  const homeNav = paymentPageInternalNav('/');
  const iletisimNav = paymentPageInternalNav('/iletisim');

  useEffect(() => {
    if (!merchantOid) {
      setPhase('missing');
      return;
    }

    let cancelled = false;

    void (async () => {
      setPhase('loading');

      const resolvePhase = (s: string): ViewPhase => {
        if (s === 'success') return 'success';
        if (s === 'bank_transfer_rejected') return 'rejected';
        if (s === 'failed') return 'failed';
        return 'pending';
      };

      let currentOrder = initialOrderRef.current;
      if (!currentOrder) {
        currentOrder = await fetchPublicBankTransferOrder(merchantOid);
        if (cancelled) return;
        if (currentOrder) {
          setOrder(currentOrder);
          initialOrderRef.current = currentOrder;
        }
      }

      let currentStatus = currentOrder?.status ?? 'bank_transfer_pending';
      const st = await fetchPaymentPublicStatus(merchantOid);
      if (cancelled) return;

      if (st.ok && st.data) {
        currentStatus = st.data.status;
        setStatus(currentStatus);
      } else if (!currentOrder) {
        setPhase('missing');
        return;
      }

      setPhase(resolvePhase(currentStatus));

      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        if (cancelled) return;
        if (i > 0) await sleep(POLL_INTERVAL_MS);

        const poll = await fetchPaymentPublicStatus(merchantOid);
        if (cancelled) return;
        if (!poll.ok || !poll.data) continue;

        setStatus(poll.data.status);
        const nextPhase = resolvePhase(poll.data.status);
        setPhase(nextPhase);

        if (nextPhase === 'success' || nextPhase === 'rejected' || nextPhase === 'failed') {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [merchantOid]);

  const reference = order?.bankTransfer.reference ?? order?.merchantOid ?? merchantOid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        {phase === 'loading' && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
            <p className="mt-4 text-sm text-slate-600">Sipariş bilgileri yükleniyor…</p>
          </div>
        )}

        {phase === 'missing' && (
          <>
            <AlertCircle className="mx-auto h-14 w-14 text-amber-600" />
            <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Sipariş bulunamadı</h1>
            <p className="mt-3 text-center text-sm text-slate-600">
              Havale/EFT sipariş bilgisi görüntülenemedi. Sipariş numaranızı kontrol edin veya destek ile iletişime geçin.
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Ödeme onaylandı</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
              Havale/EFT ödemeniz onaylandı. Aboneliğiniz aktif edildiyse programa giriş yapabilirsiniz.
            </p>
          </>
        )}

        {phase === 'rejected' && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-600" />
            <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Ödeme reddedildi</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
              Havale/EFT ödemeniz reddedildi veya doğrulanamadı. Lütfen destek ekibimizle iletişime geçin.
            </p>
          </>
        )}

        {phase === 'failed' && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-600" />
            <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Sipariş başarısız</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
              Ödeme kaydı başarısız durumda. Yeni bir sipariş oluşturabilir veya destek ile iletişime geçebilirsiniz.
            </p>
          </>
        )}

        {phase === 'pending' && order && (
          <>
            <Clock className="mx-auto h-14 w-14 text-amber-600" />
            <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
              Havale/EFT siparişiniz oluşturuldu
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
              Aşağıdaki banka hesabına ödemenizi yapın. Ödemeniz kontrol edildikten sonra aboneliğiniz aktif edilecektir;
              lisans hemen açılmaz.
            </p>
            <p className="mt-2 text-center text-xs text-amber-800">
              Onay işlemi genellikle mesai saatleri içinde yapılır.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Ödenecek tutar
              </p>
              <p className="mt-1 text-center text-2xl font-bold text-emerald-900">
                {order.amountFormatted}
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <InfoRow label="Banka" value={order.bankTransfer.bankName} />
              <InfoRow label="Alıcı adı" value={order.bankTransfer.accountHolderName} />
              <InfoRow label="IBAN" value={order.bankTransfer.iban} mono />
              {order.bankTransfer.branchInfo ? (
                <InfoRow label="Şube" value={order.bankTransfer.branchInfo} />
              ) : null}
              <div className="flex flex-col gap-2 border-b border-slate-100 py-3">
                <span className="text-sm text-slate-500">Açıklama kodu / referans</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="break-all font-mono text-xs font-semibold text-slate-900">{reference}</code>
                  <button
                    type="button"
                    onClick={() => copyText(reference)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-amber-800">
                  Lütfen havale/EFT açıklama alanına bu kodu yazın.
                </p>
              </div>
              {order.bankTransfer.instructions ? (
                <div className="pt-3">
                  <p className="text-sm text-slate-500">Talimat</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {order.bankTransfer.instructions}
                  </p>
                </div>
              ) : null}
            </div>

            {status === 'bank_transfer_pending' && (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Ödeme durumu kontrol ediliyor…
              </p>
            )}
          </>
        )}

        {merchantOid && phase !== 'loading' && (
          <p className="mt-6 text-center text-xs text-slate-500">
            Sipariş no{' '}
            <code className="mt-1 block break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">
              {merchantOid}
            </code>
          </p>
        )}

        <div className="mt-6 flex w-full flex-col gap-3 border-t border-slate-200 pt-6">
          <Button to={homeNav.href} external={homeNav.external} variant="accent" className="w-full justify-center">
            Ana sayfaya dön
          </Button>
          <Button
            to={iletisimNav.href}
            external={iletisimNav.external}
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
