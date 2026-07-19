import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useContentBundle } from '@/app/ContentProvider';
import {
  BillingInfoModal,
  type BillingFormData,
} from '@/components/checkout/BillingInfoModal';
import { Button } from '@/components/ui/Button';
import {
  createCustomerCodeRenewalBankTransferOrder,
  CustomerCodeValidationError,
  fetchBankTransferAvailability,
  fetchCustomerCodeRenewalStatus,
  initiateCustomerCodeRenewalPayment,
  resolveRenewalSession,
  validateCustomerCode,
  type RenewalBankTransferOrder,
  type CustomerCodeSummary,
  type RenewalBillingInfo,
  type RenewalPaymentState,
} from '@/lib/customerCodeApi';
import {
  fetchLegalTemplatePreview,
  LEGAL_CONSENT_LABELS,
  REQUIRED_LEGAL_TYPES,
} from '@/lib/legalApi';
import { usePageSeo } from '@/lib/pageSeo';

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const subscriptionDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
});

const rateFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

function formatSubscriptionEnd(value: string | null): string {
  return value ? subscriptionDateFormatter.format(new Date(value)) : 'Bilgi bulunamadı';
}

function formatKurus(value: number): string {
  return currencyFormatter.format(value / 100);
}

function formatCampaignEnd(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : 'Süresiz';
}

function formatPackageLabel(value: string): string {
  const normalized = value.trim().toLocaleLowerCase('tr-TR');
  const exactLabels: Record<string, string> = {
    annual: 'Yıllık',
    yearly: 'Yıllık',
    monthly: 'Aylık',
    '2_year': '2 Yıllık',
    two_year: '2 Yıllık',
    '3_year': '3 Yıllık',
    three_year: '3 Yıllık',
  };
  if (exactLabels[normalized]) return exactLabels[normalized];

  const tokens = normalized.split(/[\s_-]+/).filter(Boolean);
  const duration =
    tokens.includes('monthly')
      ? 'Aylık'
      : tokens.includes('annual') || tokens.includes('yearly')
        ? 'Yıllık'
        : (tokens.includes('2') || tokens.includes('two')) && tokens.includes('year')
          ? '2 Yıllık'
          : (tokens.includes('3') || tokens.includes('three')) && tokens.includes('year')
            ? '3 Yıllık'
            : null;
  const technicalTokens = new Set([
    'annual',
    'yearly',
    'monthly',
    'year',
    '2',
    'two',
    '3',
    'three',
  ]);
  const packageName = tokens
    .filter((token) => !technicalTokens.has(token))
    .map((token) => token.charAt(0).toLocaleUpperCase('tr-TR') + token.slice(1))
    .join(' ');

  return [duration, packageName].filter(Boolean).join(' ') || 'Paket bilgisi';
}

function formatBillingForApi(data: BillingFormData): RenewalBillingInfo {
  const isCorporate = data.invoiceType === 'corporate';
  const fullName = data.fullName.trim();
  const openAddress = data.address.trim();
  const location = [data.district.trim(), data.city.trim()].filter(Boolean).join(' / ');
  const billingInfo: RenewalBillingInfo = {
    invoiceType: data.invoiceType,
    fullName,
    name: fullName,
    email: data.email.trim(),
    phone: data.phone.trim(),
    city: data.city.trim(),
    district: data.district.trim(),
    openAddress,
    address: location ? `${openAddress} — ${location}` : openAddress,
  };

  const identityNumber = data.identityNumber.replace(/\D/g, '');
  if (identityNumber) billingInfo.identityNumber = identityNumber;
  if (isCorporate) {
    billingInfo.companyName = data.companyName.trim();
    billingInfo.taxNumber = data.taxNumber.trim();
    billingInfo.taxOffice = data.taxOffice.trim();
  }
  return billingInfo;
}

function storedBillingToForm(customer: CustomerCodeSummary | null): BillingFormData | null {
  const billing = customer?.billingInfo;
  if (!customer || !billing) return null;
  return {
    invoiceType: billing.invoiceType,
    fullName: billing.fullName,
    email: customer.accountEmail ?? customer.maskedEmail,
    phone: billing.phone,
    identityNumber: billing.identityNumber ?? '',
    companyName: billing.companyName ?? '',
    taxNumber: billing.taxNumber ?? '',
    taxOffice: billing.taxOffice ?? '',
    city: billing.city,
    district: billing.district,
    address: billing.openAddress,
  };
}

type PaymentViewState = RenewalPaymentState | 'IDLE' | 'STARTING';
type PaymentMethod = 'PAYTR' | 'BANK_TRANSFER';

const inputClass =
  'mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base font-semibold uppercase tracking-wide text-slate-900 shadow-sm transition-colors placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-100';

export default function AbonelikYenilePage() {
  const { content } = useContentBundle();
  const [searchParams] = useSearchParams();
  const initialUrlCustomer = useRef(searchParams.get('customer') ?? '');
  const initialRenewalToken = useRef(searchParams.get('renew') ?? '');
  const sessionRenewal = Boolean(initialRenewalToken.current.trim());
  const [customerCode, setCustomerCode] = useState(initialUrlCustomer.current);
  const [customer, setCustomer] = useState<CustomerCodeSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalConsents, setLegalConsents] = useState<Record<string, boolean>>({});
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingOverride, setBillingOverride] = useState<BillingFormData | null>(null);
  const [editingBilling, setEditingBilling] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalPreview, setLegalPreview] =
    useState<{ title: string; content: string } | null>(null);
  const [legalPreviewLoading, setLegalPreviewLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentViewState>('IDLE');
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAYTR');
  const [bankTransferAvailable, setBankTransferAvailable] = useState(false);
  const [bankTransferOrder, setBankTransferOrder] =
    useState<RenewalBankTransferOrder | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [paytrTestMode, setPaytrTestMode] = useState(false);
  const [merchantOid, setMerchantOid] = useState<string | null>(null);
  const [chargedAmountKurus, setChargedAmountKurus] = useState<number | null>(null);
  const [newSubscriptionEndsAt, setNewSubscriptionEndsAt] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const activeController = useRef<AbortController | null>(null);
  const paymentController = useRef<AbortController | null>(null);
  const paymentStarting = useRef(false);
  const requestSequence = useRef(0);

  usePageSeo(content, '/abonelik-yenile', {
    title: 'Abonelik Yenile',
    description: 'Müşteri kodunuzla abonelik bilgilerinizi güvenli şekilde doğrulayın.',
  });

  const resetPayment = useCallback(() => {
    paymentController.current?.abort();
    paymentController.current = null;
    setLegalConsents({});
    setShowBillingModal(false);
    setBillingOverride(null);
    setEditingBilling(false);
    setShowLegalModal(false);
    setLegalPreview(null);
    setPaymentState('IDLE');
    setPaymentError('');
    setPaymentMethod('PAYTR');
    setBankTransferAvailable(false);
    setBankTransferOrder(null);
    setPaytrToken(null);
    setPaytrTestMode(false);
    setMerchantOid(null);
    setChargedAmountKurus(null);
    setNewSubscriptionEndsAt(null);
  }, []);

  const runValidation = useCallback(async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();
    resetPayment();
    setCustomerCode(normalizedCode);
    setCustomer(null);
    setError('');

    if (!normalizedCode) {
      setError('Lütfen müşteri kodunuzu girin.');
      return;
    }

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const requestId = ++requestSequence.current;
    setLoading(true);

    try {
      const validation = await validateCustomerCode(normalizedCode, controller.signal);
      const result = await resolveRenewalSession(
        validation.checkoutToken,
        controller.signal,
      );
      if (requestId !== requestSequence.current || controller.signal.aborted) return;
      setCustomer(result);
      try {
        const availability = await fetchBankTransferAvailability(controller.signal);
        if (requestId !== requestSequence.current || controller.signal.aborted) return;
        setBankTransferAvailable(availability.isActive);
      } catch {
        if (controller.signal.aborted) return;
        setBankTransferAvailable(false);
      }
    } catch (validationError) {
      if (requestId !== requestSequence.current || controller.signal.aborted) return;
      setError(
        validationError instanceof CustomerCodeValidationError
          ? validationError.message
          : 'Müşteri kodu doğrulanamadı. Lütfen tekrar deneyin.',
      );
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [resetPayment]);

  const runSessionValidation = useCallback(async (rawToken: string) => {
    const renewalToken = rawToken.trim();
    resetPayment();
    setCustomer(null);
    setError('');

    if (!renewalToken) {
      setError('Yenileme bağlantısı geçersiz.');
      return;
    }

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const requestId = ++requestSequence.current;
    setLoading(true);

    try {
      const result = await resolveRenewalSession(renewalToken, controller.signal);
      if (requestId !== requestSequence.current || controller.signal.aborted) return;
      setCustomer(result);
      try {
        const availability = await fetchBankTransferAvailability(controller.signal);
        if (requestId !== requestSequence.current || controller.signal.aborted) return;
        setBankTransferAvailable(availability.isActive);
      } catch {
        if (controller.signal.aborted) return;
        setBankTransferAvailable(false);
      }
    } catch (sessionError) {
      if (requestId !== requestSequence.current || controller.signal.aborted) return;
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : 'Yenileme bağlantısı doğrulanamadı. Lütfen panelden yeniden deneyin.',
      );
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [resetPayment]);

  useEffect(() => {
    if (!customer) return;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [customer]);

  useEffect(() => {
    if (
      !customer?.checkoutToken ||
      !merchantOid ||
      (paymentState !== 'PAYMENT_PENDING' && paymentState !== 'FULFILLMENT_PENDING')
    ) {
      return;
    }

    const controller = new AbortController();
    paymentController.current = controller;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const status = await fetchCustomerCodeRenewalStatus(
          customer.checkoutToken,
          merchantOid,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        if (
          chargedAmountKurus !== null &&
          status.chargedAmountKurus !== chargedAmountKurus
        ) {
          setPaymentError('Ödeme tutarı doğrulanamadı. Güvenliğiniz için işlem durduruldu.');
          setPaymentState('FULFILLMENT_FAILED');
          setPaytrToken(null);
          setCustomer(null);
          setLegalConsents({});
          return;
        }

        setPaymentError('');
        setPaymentState(status.state);

        if (status.state === 'COMPLETED') {
          setPaytrToken(null);
          setShowBillingModal(false);
          setNewSubscriptionEndsAt(status.newSubscriptionEndsAt);
          return;
        }
        if (status.state === 'PAYMENT_FAILED' || status.state === 'FULFILLMENT_FAILED') {
          setPaytrToken(null);
          setShowBillingModal(false);
          setCustomer(null);
          setLegalConsents({});
          setMerchantOid(null);
          setPaymentError(
            status.state === 'PAYMENT_FAILED'
              ? sessionRenewal
                ? 'Ödeme tamamlanamadı. Yeniden denemek için panelden yeni bir yenileme bağlantısı oluşturun.'
                : 'Ödeme tamamlanamadı. Yeniden denemek için müşteri kodunuzu tekrar doğrulayın.'
              : 'Ödeme alındı ancak abonelik yenilenemedi. Destek ekibiyle iletişime geçin; tekrar ödeme yapmadan önce yeni bir doğrulama gerekebilir.',
          );
          return;
        }
      } catch (statusError) {
        if (controller.signal.aborted) return;
        setPaymentError('Ödeme durumu geçici olarak alınamadı; kontrol edilmeye devam ediliyor.');
      }

      timer = window.setTimeout(() => void poll(), 2500);
    };

    timer = window.setTimeout(() => void poll(), 2500);
    return () => {
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [chargedAmountKurus, customer, merchantOid, paymentState, sessionRenewal]);

  useEffect(() => {
    if (initialRenewalToken.current.trim()) {
      void runSessionValidation(initialRenewalToken.current);
    } else if (initialUrlCustomer.current.trim()) {
      void runValidation(initialUrlCustomer.current);
    }

    return () => {
      requestSequence.current += 1;
      activeController.current?.abort();
      paymentController.current?.abort();
    };
  }, [runSessionValidation, runValidation]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    requestSequence.current += 1;
    activeController.current?.abort();
    resetPayment();
    setLoading(false);
    setCustomer(null);
    setError('');
    setCustomerCode(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loading) void runValidation(customerCode);
  };

  const allLegalAccepted = REQUIRED_LEGAL_TYPES.every((type) => legalConsents[type]);
  const checkoutAvailable =
    Boolean(customer?.checkoutToken) &&
    Boolean(customer && Date.parse(customer.checkoutExpiresAt) > clock);
  const paymentInProgress =
    paymentState === 'STARTING' ||
    paymentState === 'PAYMENT_PENDING' ||
    paymentState === 'FULFILLMENT_PENDING';
  const paymentCompleted = paymentState === 'COMPLETED';
  const billingInitialValues = useMemo(
    () => billingOverride ?? storedBillingToForm(customer),
    [billingOverride, customer],
  );
  const displayBilling = billingOverride
    ? formatBillingForApi(billingOverride)
    : customer?.billingInfo;
  const hasCompleteBillingInfo = Boolean(
    billingOverride || (customer?.hasCompleteBillingInfo && customer.billingInfo),
  );

  const openBilling = (requireLegalConsent = true) => {
    setPaymentError('');
    if (!customer || !checkoutAvailable) {
      setPaymentError(
        sessionRenewal
          ? 'Ödeme oturumunun süresi doldu. Panelden yeni bir yenileme bağlantısı oluşturun.'
          : 'Ödeme oturumunun süresi doldu. Müşteri kodunuzu yeniden doğrulayın.',
      );
      setCustomer(null);
      setLegalConsents({});
      return;
    }
    if (requireLegalConsent && !allLegalAccepted) {
      setPaymentError('Devam etmek için tüm yasal onayları kabul edin.');
      return;
    }
    setShowBillingModal(true);
  };

  const openLegalPreview = async (type: string) => {
    if (!customer) return;
    setShowLegalModal(true);
    setLegalPreviewLoading(true);
    setLegalPreview(null);
    try {
      const data = await fetchLegalTemplatePreview(type, {
        productType: customer.selectedProductType,
        amountKurus: customer.renewalQuote.finalPriceKurus,
      });
      setLegalPreview(
        data
          ? { title: data.title, content: data.content }
          : {
              title: LEGAL_CONSENT_LABELS[type] || type,
              content: 'İçerik yüklenemedi.',
            },
      );
    } catch {
      setLegalPreview({
        title: LEGAL_CONSENT_LABELS[type] || type,
        content: 'İçerik yüklenemedi.',
      });
    } finally {
      setLegalPreviewLoading(false);
    }
  };

  const processPayment = async (billing?: BillingFormData) => {
    if (paymentStarting.current) return;
    if (
      !customer ||
      !allLegalAccepted ||
      Date.parse(customer.checkoutExpiresAt) <= Date.now()
    ) {
      setShowBillingModal(false);
      setCustomer(null);
      setLegalConsents({});
      setPaymentError(
        sessionRenewal
          ? 'Ödeme oturumu geçersiz veya süresi dolmuş. Panelden yeni bir yenileme bağlantısı oluşturun.'
          : 'Ödeme oturumu geçersiz veya süresi dolmuş. Müşteri kodunuzu yeniden doğrulayın.',
      );
      return;
    }

    paymentStarting.current = true;
    const controller = new AbortController();
    paymentController.current?.abort();
    paymentController.current = controller;
    setPaymentState('STARTING');
    setPaymentError('');

    try {
      const acceptedLegalConsents = Object.fromEntries(
        REQUIRED_LEGAL_TYPES.map((type) => [type, true]),
      );
      const billingInfo = billing ? formatBillingForApi(billing) : undefined;

      if (paymentMethod === 'BANK_TRANSFER') {
        const order = await createCustomerCodeRenewalBankTransferOrder({
          checkoutToken: customer.checkoutToken,
          productType: customer.selectedProductType,
          subscriptionPeriod: customer.selectedSubscriptionPeriod,
          billingInfo,
          legalConsents: acceptedLegalConsents,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setCustomer((current) =>
          current ? { ...current, renewalQuote: order.renewalQuote } : current,
        );
        if (order.amount !== order.renewalQuote.finalPriceKurus) {
          setShowBillingModal(false);
          setCustomer(null);
          setLegalConsents({});
          setPaymentState('PAYMENT_FAILED');
          setPaymentError(
            'Havale tutarı güncel teklif ile eşleşmedi. Banka bilgileri gösterilmedi; lütfen müşteri kodunuzu yeniden doğrulayın.',
          );
          return;
        }

        setChargedAmountKurus(order.amount);
        setMerchantOid(order.merchantOid);
        setBankTransferOrder(order);
        setShowBillingModal(false);
        setPaymentState('PAYMENT_PENDING');
        return;
      }

      const payment = await initiateCustomerCodeRenewalPayment({
        checkoutToken: customer.checkoutToken,
        productType: customer.selectedProductType,
        subscriptionPeriod: customer.selectedSubscriptionPeriod,
        billingInfo,
        legalConsents: acceptedLegalConsents,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      // The initiation response is the authoritative price snapshot.
      setCustomer((current) =>
        current ? { ...current, renewalQuote: payment.renewalQuote } : current,
      );

      if (payment.chargedAmountKurus !== payment.renewalQuote.finalPriceKurus) {
        setShowBillingModal(false);
        setCustomer(null);
        setLegalConsents({});
        setPaymentState('FULFILLMENT_FAILED');
        setPaymentError(
          'Ödeme tutarı teklif ile eşleşmedi. Güvenliğiniz için ödeme ekranı açılmadı; yeniden denemeden önce destek ekibiyle iletişime geçin.',
        );
        return;
      }

      setChargedAmountKurus(payment.chargedAmountKurus);
      setMerchantOid(payment.merchantOid);
      setPaytrToken(payment.token);
      setPaytrTestMode(payment.testMode);
      setShowBillingModal(false);
      setPaymentState('PAYMENT_PENDING');
    } catch (paymentRequestError) {
      if (controller.signal.aborted) return;
      const message =
        typeof paymentRequestError === 'object' &&
        paymentRequestError !== null &&
        'message' in paymentRequestError &&
        typeof paymentRequestError.message === 'string'
          ? paymentRequestError.message
          : 'Ödeme başlatılamadı.';
      setShowBillingModal(false);
      setCustomer(null);
      setLegalConsents({});
      setPaymentState('PAYMENT_FAILED');
      setPaymentError(
        sessionRenewal
          ? `${message} Panelden yeni bir yenileme bağlantısı oluşturup tekrar deneyin.`
          : `${message} Müşteri kodunuzu yeniden doğrulayıp tekrar deneyin.`,
      );
    } finally {
      paymentStarting.current = false;
    }
  };

  return (
    <div>
      <section className="hero-section-bg text-white">
        <div className="container-page py-14 lg:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <RefreshCw className="h-4 w-4" />
            Abonelik işlemleri
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Abonelik Yenile
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            {sessionRenewal
              ? 'Panelde seçtiğiniz yenileme paketi güvenli şekilde doğrulanıyor.'
              : 'Müşteri kodunuzu doğrulayarak mevcut abonelik bilgilerinizi görüntüleyin.'}
          </p>
        </div>
      </section>

      <section className="bg-slate-100 py-14 lg:py-20">
        <div className="container-page max-w-3xl">
          {!sessionRenewal && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg sm:p-8"
            >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Müşteri kodunu doğrulayın</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Aboneliğinize ait müşteri kodunu aşağıdaki alana girin.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <label htmlFor="customer-code" className="block text-sm font-semibold text-slate-800">
                Müşteri kodu
              </label>
              <input
                id="customer-code"
                name="customerCode"
                type="text"
                value={customerCode}
                onChange={handleChange}
                className={inputClass}
                placeholder="Müşteri kodunuzu girin"
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'customer-code-error' : undefined}
              />
            </div>

            {error && (
              <p
                id="customer-code-error"
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Doğrulanıyor…
                </>
              ) : (
                'Müşteri Kodunu Doğrula'
              )}
            </Button>

            {loading && (
              <p role="status" className="sr-only">
                Müşteri kodu doğrulanıyor.
              </p>
            )}
            </form>
          )}

          {sessionRenewal && (loading || error) && (
            <section className="rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-lg sm:p-8">
              {loading ? (
                <div role="status" className="flex items-center justify-center gap-3 font-semibold text-slate-800">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Yenileme bağlantısı doğrulanıyor…
                </div>
              ) : (
                <>
                  <p role="alert" className="font-semibold text-red-700">{error}</p>
                  <Button
                    type="button"
                    variant="accent"
                    className="mt-5"
                    onClick={() => void runSessionValidation(initialRenewalToken.current)}
                  >
                    Tekrar Dene
                  </Button>
                </>
              )}
            </section>
          )}

          {paymentState === 'COMPLETED' && newSubscriptionEndsAt && (
            <section
              role="status"
              className="mt-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center shadow-lg sm:p-8"
            >
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-bold text-emerald-950">
                Aboneliğiniz yenilendi
              </h2>
              <p className="mt-2 text-emerald-900">
                Yeni abonelik bitiş tarihi:{' '}
                <strong>{formatSubscriptionEnd(newSubscriptionEndsAt)}</strong>
              </p>
            </section>
          )}

          {paymentError && (
            <p
              role="alert"
              className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-4 font-semibold text-red-800"
            >
              {paymentError}
            </p>
          )}

          {(paymentState === 'PAYMENT_PENDING' ||
            paymentState === 'FULFILLMENT_PENDING') && (
            <div
              role="status"
              className="mt-8 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-900"
            >
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
              <p className="font-semibold">
                {paymentState === 'FULFILLMENT_PENDING'
                  ? 'Ödeme alındı. Aboneliğiniz yenileniyor; lütfen bekleyin.'
                  : 'Ödeme sonucu bekleniyor. Bu sayfayı açık tutun.'}
              </p>
            </div>
          )}

          {customer && (
            <section
              aria-labelledby="subscription-details-title"
              className="mt-8 rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg sm:p-8"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-emerald-600" aria-hidden="true" />
                <h2 id="subscription-details-title" className="text-xl font-bold text-slate-900">
                  Abonelik bilgileri
                </h2>
              </div>
              <dl className="mt-6 divide-y divide-slate-200">
                {[
                  ['Ad Soyad', customer.maskedName],
                  ['E-posta', customer.maskedEmail],
                  [
                    'Mevcut Paket',
                    customer.currentPackage
                      ? formatPackageLabel(customer.currentPackage)
                      : 'Bilgi bulunamadı',
                  ],
                  ['Abonelik Bitiş Tarihi', formatSubscriptionEnd(customer.subscriptionEndsAt)],
                  ['Baro', customer.barAssociationName ?? 'Bağlı baro yok'],
                  ['Yenileme Süresi', formatPackageLabel(customer.renewalQuote.periodLabel)],
                  ['Normal Fiyat', formatKurus(customer.renewalQuote.normalPriceKurus)],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-4 sm:grid-cols-2 sm:gap-6">
                    <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                    <dd className="font-semibold text-slate-900 sm:text-right">{value}</dd>
                  </div>
                ))}
                {customer.renewalQuote.campaignApplied && (
                  <>
                    <div className="grid gap-1 py-4 sm:grid-cols-2 sm:gap-6">
                      <dt className="text-sm font-semibold text-slate-600">Kampanya İndirimi</dt>
                      <dd className="font-semibold text-emerald-700 sm:text-right">
                        %{rateFormatter.format(customer.renewalQuote.campaignDiscountRate)} (
                        {formatKurus(customer.renewalQuote.campaignDiscountAmountKurus)})
                      </dd>
                    </div>
                    <div className="grid gap-1 py-4 sm:grid-cols-2 sm:gap-6">
                      <dt className="text-sm font-semibold text-slate-600">
                        Kampanya Bitiş Tarihi
                      </dt>
                      <dd className="font-semibold text-slate-900 sm:text-right">
                        {formatCampaignEnd(customer.renewalQuote.campaignEndsAt)}
                      </dd>
                    </div>
                  </>
                )}
                <div className="grid gap-1 py-4 sm:grid-cols-2 sm:gap-6">
                  <dt className="text-sm font-bold text-slate-700">Ödenecek Tutar</dt>
                  <dd className="text-lg font-bold text-emerald-700 sm:text-right">
                    {formatKurus(customer.renewalQuote.finalPriceKurus)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-center text-sm font-semibold text-emerald-700">
                Fiyat sistem tarafından güvenli şekilde hesaplandı.
              </p>
              {!customer.renewalQuote.campaignApplied && (
                <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center font-bold text-amber-900">
                  Güncel normal fiyat uygulanacaktır.
                </p>
              )}

              {bankTransferAvailable && (
                <fieldset
                  className="mt-7 border-t border-slate-200 pt-6"
                  disabled={paymentInProgress || paymentCompleted}
                >
                  <legend className="text-base font-bold text-slate-900">Ödeme yöntemi</legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                      <input
                        type="radio"
                        name="renewal-payment-method"
                        value="PAYTR"
                        checked={paymentMethod === 'PAYTR'}
                        onChange={() => setPaymentMethod('PAYTR')}
                        className="h-4 w-4 border-slate-300 text-emerald-600"
                      />
                      <CreditCard className="h-5 w-5 text-slate-600" aria-hidden="true" />
                      <span className="font-semibold text-slate-900">PayTR ile kart</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                      <input
                        type="radio"
                        name="renewal-payment-method"
                        value="BANK_TRANSFER"
                        checked={paymentMethod === 'BANK_TRANSFER'}
                        onChange={() => setPaymentMethod('BANK_TRANSFER')}
                        className="h-4 w-4 border-slate-300 text-emerald-600"
                      />
                      <Landmark className="h-5 w-5 text-slate-600" aria-hidden="true" />
                      <span className="font-semibold text-slate-900">Havale / EFT</span>
                    </label>
                  </div>
                </fieldset>
              )}

              <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Fatura bilgileri</h3>
                    {displayBilling ? (
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        <p>{displayBilling.fullName || 'Ad / unvan eksik'}</p>
                        <p>{customer.maskedEmail}</p>
                        <p>{displayBilling.phone || 'Telefon eksik'}</p>
                        <p>
                          {[
                            displayBilling.openAddress,
                            displayBilling.district,
                            displayBilling.city,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'Adres eksik'}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-amber-800">
                        Ödeme öncesinde fatura bilgilerinizi tamamlamanız gerekiyor.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBilling(true);
                      openBilling(false);
                    }}
                    disabled={paymentInProgress || paymentCompleted}
                    className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                  >
                    Değiştir
                  </button>
                </div>
                {!hasCompleteBillingInfo && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                    Eksik bilgiler ödeme sırasında zorunlu olarak tamamlanacaktır.
                  </p>
                )}
              </section>

              <fieldset
                className={`${bankTransferAvailable ? 'mt-6' : 'mt-7 border-t pt-6'} border-slate-200`}
                disabled={paymentInProgress || paymentCompleted}
              >
                <legend className="text-base font-bold text-slate-900">Yasal onaylar</legend>
                <div className="mt-4 space-y-3">
                  {REQUIRED_LEGAL_TYPES.map((type) => (
                    <label key={type} className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(legalConsents[type])}
                        onChange={(event) =>
                          setLegalConsents((current) => ({
                            ...current,
                            [type]: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span className="leading-relaxed text-slate-700">
                        {type === 'WITHDRAWAL_EXCEPTION' ? (
                          LEGAL_CONSENT_LABELS[type]
                        ) : (
                          <button
                            type="button"
                            className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                            onClick={() => void openLegalPreview(type)}
                          >
                            {LEGAL_CONSENT_LABELS[type]}
                          </button>
                        )}
                        {type === 'WITHDRAWAL_EXCEPTION'
                          ? ''
                          : type === 'KVKK'
                            ? "'ni okudum."
                            : "'nu okudum ve onaylıyorum."}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {!checkoutAvailable && (
                <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {sessionRenewal
                    ? 'Ödeme oturumunun süresi doldu. Panelden yeni bir yenileme bağlantısı oluşturun.'
                    : 'Ödeme oturumunun süresi doldu. Devam etmek için müşteri kodunuzu yeniden doğrulayın.'}
                </p>
              )}

              <Button
                type="button"
                variant="accent"
                size="lg"
                className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  !allLegalAccepted ||
                  !checkoutAvailable ||
                  paymentInProgress ||
                  paymentCompleted
                }
                onClick={() => {
                  if (billingOverride) {
                    void processPayment(billingOverride);
                  } else if (hasCompleteBillingInfo) {
                    void processPayment();
                  } else {
                    setEditingBilling(false);
                    openBilling();
                  }
                }}
              >
                {paymentMethod === 'BANK_TRANSFER' ? (
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                )}
                {paymentCompleted
                  ? 'Yenileme tamamlandı'
                  : paymentMethod === 'BANK_TRANSFER'
                    ? 'Havale siparişi oluştur'
                    : 'PayTR ile güvenli ödemeye geç'}
              </Button>

              {bankTransferOrder && (
                <section
                  aria-labelledby="bank-transfer-details-title"
                  className="mt-7 rounded-xl border-2 border-amber-300 bg-amber-50 p-5"
                >
                  <h3
                    id="bank-transfer-details-title"
                    className="flex items-center gap-2 text-lg font-bold text-amber-950"
                  >
                    <Landmark className="h-5 w-5" aria-hidden="true" />
                    Havale / EFT bilgileri
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-900">
                    Lisansınız yalnızca ödemeniz yönetici tarafından onaylandıktan sonra uzatılır.
                  </p>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      ['Banka', bankTransferOrder.bankTransfer.bankName || 'Belirtilmedi'],
                      ['Hesap sahibi', bankTransferOrder.bankTransfer.accountHolderName],
                      ['IBAN', bankTransferOrder.bankTransfer.iban],
                      ['Şube bilgisi', bankTransferOrder.bankTransfer.branchInfo || 'Belirtilmedi'],
                      ['Tam tutar', formatKurus(bankTransferOrder.amount)],
                      ['Sipariş numarası', bankTransferOrder.merchantOid],
                      ['Havale açıklaması / referans', bankTransferOrder.bankTransfer.reference],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-semibold text-amber-900">{label}</dt>
                        <dd className="mt-1 select-all break-all rounded-lg bg-white px-3 py-2 font-mono font-semibold text-slate-900">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {bankTransferOrder.bankTransfer.instructions && (
                    <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white px-3 py-3 text-sm leading-relaxed text-slate-700">
                      {bankTransferOrder.bankTransfer.instructions}
                    </p>
                  )}
                </section>
              )}
            </section>
          )}
        </div>
      </section>

      <BillingInfoModal
        open={showBillingModal}
        onClose={() => {
          if (paymentState !== 'STARTING') {
            setShowBillingModal(false);
            setEditingBilling(false);
          }
        }}
        onSubmit={(data) => {
          if (editingBilling) {
            setBillingOverride(data);
            setEditingBilling(false);
            setShowBillingModal(false);
            return;
          }
          void processPayment(data);
        }}
        processing={paymentState === 'STARTING'}
        lockedAccountEmail={customer?.accountEmail ?? customer?.maskedEmail ?? null}
        initialValues={billingInitialValues}
        purpose="renewal"
        submitLabel={
          editingBilling
            ? 'Bilgileri Kaydet'
            : paymentMethod === 'BANK_TRANSFER'
              ? 'Havale Siparişini Oluştur'
              : undefined
        }
        processingLabel={
          paymentMethod === 'BANK_TRANSFER' ? 'Sipariş oluşturuluyor...' : undefined
        }
      />

      {showLegalModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {legalPreview?.title ?? 'Yasal metin'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowLegalModal(false);
                  setLegalPreview(null);
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {legalPreviewLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                  {legalPreview?.content ?? 'İçerik yükleniyor…'}
                </pre>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <Button
                variant="primary"
                onClick={() => {
                  setShowLegalModal(false);
                  setLegalPreview(null);
                }}
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {paytrToken && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="renewal-payment-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="renewal-payment-title" className="font-bold text-slate-900">
                  PayTR güvenli ödeme
                </h2>
                {chargedAmountKurus !== null && (
                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    Ödenecek tutar: {formatKurus(chargedAmountKurus)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPaytrToken(null)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Ödeme ekranını kapat"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {paytrTestMode && (
              <p className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-900">
                Test modu açık, gerçek tahsilat yapılmaz
              </p>
            )}
            <iframe
              title="PayTR ödeme"
              src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
              className="h-[min(70vh,640px)] w-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
