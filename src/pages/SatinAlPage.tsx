import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContentBundle } from '@/app/ContentProvider';
import {
  Check,
  CheckCircle,
  Shield,
  Lock,
  Loader2,
  Sparkles,
  Gift,
  X,
  FileText,
  Users,
  UserPlus,
} from 'lucide-react';
import { BillingInfoModal, type BillingFormData } from '@/components/checkout/BillingInfoModal';
import { AnnualGiftPromoSection } from '@/components/checkout/AnnualGiftPromoSection';
import { ProductGallery } from '@/components/checkout/ProductGallery';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/toast';
import { getSatinAlDisplayImages } from '@/lib/marketingProductImages';
import {
  fetchAuthMe,
  fetchBankTransferAvailability,
  fetchCampaignQuote,
  fetchPublicProduct,
  fetchRenewalContext,
  fetchRenewalQuote,
  requestBankTransferOrder,
  requestPaytrToken,
  type CheckoutQuote,
  type PublicProduct,
  type PublicQuoteCampaign,
  type RenewalContext,
} from '@/lib/storeApi';
import {
  fetchLegalTemplatePreview,
  LEGAL_CONSENT_LABELS,
  REQUIRED_LEGAL_TYPES,
} from '@/lib/legalApi';
import { ANNUAL_GIFT_BADGE_LINES } from '@/lib/annualGiftPromo';

const MONTHLY_FALLBACK_TL = 2000;
const ANNUAL_FALLBACK_TL = 20000;
const subscriptionRenewalEnabled =
  import.meta.env.VITE_SUBSCRIPTION_RENEWAL_ENABLED === 'true';

const DEFAULT_FEATURES = [
  '40+ farklı hesaplama türü',
  'Güncel mevzuata tam uyum',
  'Yargı içtihatları entegrasyonu',
  'PDF çıktı ve raporlama',
  'Süre boyunca tüm güncellemeler',
  'Teknik destek',
];

const DEFAULT_TARGET_AUDIENCE = [
  'Avukatlar ve hukuk büroları',
  'Bilirkişiler',
  'İş hukuku uzmanları',
  'Hukuk danışmanları',
  'Dava takip sistemleri',
];

const DEFAULT_SECURE_PAYMENT =
  'Ödemeleriniz PayTR güvenli ödeme altyapısı ile gerçekleştirilir. Kart bilgileriniz saklanmaz ve tüm işlemler 256-bit SSL ile şifrelenir.';

const DEFAULT_INVOICE_RECEIPT =
  'Satın alma işleminizden sonra e-posta adresinize fatura veya makbuz gönderilir. Tüm işlemler KVKK uyumlu olarak gerçekleştirilir.';

/** API boş veya kısa placeholder döndüğünde tam metin gösterilir */
function pickTrustParagraph(value: string | undefined | null, fallback: string): string {
  const text = value?.trim() ?? '';
  if (!text || text.length < 50) return fallback;
  return text;
}

type ProductType = 'monthly' | 'annual';
type PaymentMethod = 'card' | 'bank_transfer';

function toKurus(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatPriceTL(amount: number): string {
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]} TL`;
}

function quoteAmountTL(amount: number): number {
  return amount;
}

function campaignReasonMessage(reason?: string | null): string {
  const normalized = reason?.trim().toUpperCase() ?? '';
  if (normalized.includes('EXPIRED') || normalized.includes('SÜRESİ')) {
    return 'Bu kampanyanın süresi dolmuş. Güncel normal fiyatla devam edebilirsiniz.';
  }
  if (normalized.includes('LIMIT')) {
    return 'Bu kampanyanın kullanım limiti dolmuş. Güncel normal fiyatla devam edebilirsiniz.';
  }
  if (normalized.includes('INACTIVE') || normalized.includes('NOT_ACTIVE')) {
    return 'Bu kampanya aktif değil. Güncel normal fiyatla devam edebilirsiniz.';
  }
  if (normalized.includes('NOT_FOUND')) {
    return 'Kampanya bulunamadı. Güncel normal fiyatla devam edebilirsiniz.';
  }
  if (normalized.includes('NOT_STARTED')) {
    return 'Bu kampanya henüz başlamamış. Güncel normal fiyatla devam edebilirsiniz.';
  }
  if (normalized.includes('NOT_ELIGIBLE') || normalized.includes('NOT_APPLICABLE')) {
    return 'Bu kampanya seçilen paket veya işlem için geçerli değil. Güncel normal fiyatla devam edebilirsiniz.';
  }
  return reason
    ? `Kampanya uygulanamadı: ${reason}. Güncel normal fiyatla devam edebilirsiniz.`
    : 'Kampanya geçerli değil. Güncel normal fiyatla devam edebilirsiniz.';
}

function composeBillingAddressLine(data: BillingFormData): string {
  const street = data.address.trim();
  const tail = [data.district.trim(), data.city.trim()].filter(Boolean).join(' / ');
  return tail ? `${street} — ${tail}` : street;
}

/** Backend `billingInfo.address` PayTR `user_address` için kullanılıyor; il/ilçe birleşik satır. */
function formatBillingForApi(data: BillingFormData): Record<string, unknown> {
  const isCorp = data.invoiceType === 'corporate';
  const displayName = isCorp ? data.companyName.trim() : data.fullName.trim();
  const combinedAddress = composeBillingAddressLine(data);
  const idDigits = data.identityNumber.replace(/\D/g, '');

  const payload: Record<string, unknown> = {
    invoiceType: data.invoiceType,
    fullName: displayName,
    name: displayName,
    email: data.email.trim(),
    phone: data.phone.trim(),
    city: data.city.trim(),
    district: data.district.trim(),
    openAddress: data.address.trim(),
    address: combinedAddress,
  };

  if (!isCorp && idDigits) payload.identityNumber = idDigits;
  if (isCorp) {
    payload.companyName = data.companyName.trim();
    payload.taxNumber = data.taxNumber.trim();
    payload.taxOffice = data.taxOffice.trim();
  }

  return payload;
}

export default function SatinAlPage() {
  const navigate = useNavigate();
  const { content } = useContentBundle();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [productType, setProductType] = useState<ProductType>('annual');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [bankTransferActive, setBankTransferActive] = useState(false);
  const [campaign, setCampaign] = useState<PublicQuoteCampaign | null>(null);
  const [backendQuote, setBackendQuote] = useState<CheckoutQuote | null>(null);
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);
  const [campaignValidating, setCampaignValidating] = useState(
    Boolean(searchParams.get('c')?.trim()),
  );
  const [validatedCampaignCode, setValidatedCampaignCode] = useState<string | null>(null);
  const [validatedCampaignSelection, setValidatedCampaignSelection] = useState<string | null>(
    null,
  );
  const [campaignValidationAttempt, setCampaignValidationAttempt] = useState<string | null>(null);
  const [renewalContext, setRenewalContext] = useState<RenewalContext | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [legalConsents, setLegalConsents] = useState<Record<string, boolean>>({});
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalPreview, setLegalPreview] = useState<{ title: string; content: string } | null>(null);
  const [legalPreviewLoading, setLegalPreviewLoading] = useState(false);
  const [showPaytrModal, setShowPaytrModal] = useState(false);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<{
    label: string;
    totalTL: number;
    periodLabel: string;
  } | null>(null);
  const campaignCode = searchParams.get('c')?.trim() || undefined;
  const renewalToken = searchParams.get('renew')?.trim() || undefined;
  const renewalEmail = renewalContext?.accountEmail ?? renewalContext?.targetEmail ?? null;

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'pro-monthly') {
      setProductType('monthly');
      setSubscriptionPeriod(0);
    }
    if (plan === 'pro-yearly') {
      setProductType('annual');
      setSubscriptionPeriod(1);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const [me, productRes, bankAvailability] = await Promise.all([
          fetchAuthMe(),
          fetchPublicProduct(),
          fetchBankTransferAvailability(),
        ]);
        if (cancelled) return;
        setIsAuthenticated(Boolean(me.success && me.data));
        if (productRes.success && productRes.data) setProduct(productRes.data);
        else setProduct(null);
        setBankTransferActive(bankAvailability.isActive);
        setError(null);
      } catch {
        if (!cancelled) {
          const msg = 'Ürün bilgileri yüklenemedi';
          setError(msg);
          showToast(msg, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
        setCheckingAuth(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [content]);

  useEffect(() => {
    if (!renewalToken) {
      setRenewalContext(null);
      return;
    }
    let cancelled = false;
    setRenewalLoading(true);
    void fetchRenewalContext(renewalToken)
      .then((context) => {
        if (cancelled) return;
        const selected = context.selectedOption;
        const selectedIsAvailable = Boolean(
          selected
          && context.options?.some(
            (option) =>
              option.productType === selected.productType
              && option.subscriptionPeriod === selected.subscriptionPeriod,
          ),
        );
        if (!selected || !selectedIsAvailable) {
          setRenewalContext({
            ...context,
            valid: false,
            reason: 'Seçilen yenileme seçeneği artık kullanılamıyor',
            options: [],
            selectedOption: null,
          });
          setBackendQuote(null);
          setCampaign(null);
          return;
        }
        setRenewalContext({ ...context, options: [selected] });
        setBackendQuote(context.quote?.valid ? context.quote : null);
        setCampaign(context.quote?.campaign ?? null);
        setProductType(selected.productType);
        setSubscriptionPeriod(selected.subscriptionPeriod);
      })
      .catch((err) => {
        if (!cancelled) {
          setRenewalContext({
            valid: false,
            reason: err instanceof Error ? err.message : 'Yenileme bağlantısı doğrulanamadı',
            options: [],
          });
        }
      })
      .finally(() => {
        if (!cancelled) setRenewalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [renewalToken]);

  useEffect(() => {
    if (renewalToken) {
      setValidatedCampaignCode(null);
      setValidatedCampaignSelection(null);
      setCampaignValidationAttempt(null);
      setCampaignValidating(false);
      return;
    }
    if (!campaignCode) {
      setCampaign(null);
      setBackendQuote(null);
      setCampaignNotice(null);
      setValidatedCampaignCode(null);
      setValidatedCampaignSelection(null);
      setCampaignValidationAttempt(null);
      setCampaignValidating(false);
      return;
    }
    let cancelled = false;
    const selectionKey = `${productType}:${subscriptionPeriod}`;
    const validationAttempt = `${campaignCode}:${selectionKey}`;
    setCampaignValidating(true);
    setValidatedCampaignCode(null);
    setValidatedCampaignSelection(null);
    setCampaignValidationAttempt(null);
    void fetchCampaignQuote({
      campaignCode,
      productType,
      subscriptionPeriod,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.valid && result.quote?.valid) {
          setCampaign(result.campaign ?? result.quote.campaign ?? null);
          setBackendQuote(result.quote);
          setCampaignNotice(null);
          setValidatedCampaignCode(campaignCode);
          setValidatedCampaignSelection(selectionKey);
          setCampaignValidationAttempt(validationAttempt);
        } else {
          setCampaign(null);
          setBackendQuote(null);
          setValidatedCampaignCode(null);
          setValidatedCampaignSelection(null);
          setCampaignValidationAttempt(validationAttempt);
          setCampaignNotice(campaignReasonMessage(result.reason ?? result.quote?.reason));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setCampaign(null);
        setBackendQuote(null);
        setValidatedCampaignCode(null);
        setValidatedCampaignSelection(null);
        setCampaignValidationAttempt(validationAttempt);
        setCampaignNotice(
          campaignReasonMessage(err instanceof Error ? err.message : 'Kampanya doğrulanamadı'),
        );
      })
      .finally(() => {
        if (!cancelled) setCampaignValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignCode, productType, renewalToken, subscriptionPeriod]);

  useEffect(() => {
    if (!renewalToken || !renewalContext?.valid) return;
    let cancelled = false;
    void fetchRenewalQuote({
      renewalToken,
      productType,
      subscriptionPeriod,
    })
      .then((context) => {
        if (cancelled) return;
        setRenewalContext((previous) => ({ ...context, options: context.options ?? previous?.options ?? [] }));
        setBackendQuote(context.quote?.valid ? context.quote : null);
        setCampaign(context.quote?.campaign ?? null);
        setCampaignNotice(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setBackendQuote(null);
          setCampaignNotice(err instanceof Error ? err.message : 'Yenileme fiyatı alınamadı');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productType, renewalContext?.valid, renewalToken, subscriptionPeriod]);

  useEffect(() => {
    if (!campaignCode) {
      setCampaign(null);
      setCampaignNotice(null);
      setValidatedCampaignCode(null);
      setValidatedCampaignSelection(null);
      setCampaignValidationAttempt(null);
      setCampaignValidating(false);
    }
  }, [campaignCode]);

  const pricing = useMemo(() => {
    const monthlyKurus = product
      ? toKurus(product.priceMonthly ?? (product as { price_monthly?: number }).price_monthly)
      : null;
    const annualKurus = product ? toKurus(product.price) : null;

    const monthlyBase =
      monthlyKurus != null && monthlyKurus > 0 ? monthlyKurus / 100 : MONTHLY_FALLBACK_TL;
    const annualBase =
      annualKurus != null && annualKurus > 0 ? annualKurus / 100 : ANNUAL_FALLBACK_TL;

    return {
      monthly: monthlyBase,
      annual: annualBase,
      monthlyBase,
      annualBase,
      hasCampaign: Boolean(campaign && backendQuote?.valid),
    };
  }, [backendQuote?.valid, campaign, product]);

  const selectedTotal =
    backendQuote?.valid
      ? quoteAmountTL(backendQuote.finalPrice)
      : productType === 'monthly'
        ? pricing.monthly
        : pricing.annual;

  const isAnnualPlan = productType === 'annual';
  const renewalSelectedOption = renewalContext?.selectedOption ?? null;
  const displayedProductTypes: ProductType[] =
    renewalToken && renewalSelectedOption
      ? [renewalSelectedOption.productType]
      : ['monthly', 'annual'];
  const currentCampaignSelection = `${productType}:${subscriptionPeriod}`;
  const currentCampaignValidationAttempt = campaignCode
    ? `${campaignCode}:${currentCampaignSelection}`
    : null;
  const campaignValidationPending = Boolean(
    !renewalToken
    && campaignCode
    && (
      campaignValidating
      || campaignValidationAttempt !== currentCampaignValidationAttempt
    ),
  );
  const checkoutCampaignCode =
    !renewalToken
    && validatedCampaignCode === campaignCode
    && validatedCampaignSelection === currentCampaignSelection
      ? validatedCampaignCode
      : undefined;

  const galleryImages = getSatinAlDisplayImages(product?.imageUrl);
  const productName = product?.name ?? 'Bilirkişi Hesaplama Programı';
  const productDesc =
    product?.shortDescription ??
    'Avukatlar ve bilirkişiler için profesyonel hesaplama ve raporlama platformu.';
  const featureItems =
    product?.features && product.features.length > 0 ? product.features : DEFAULT_FEATURES;
  const audienceItems =
    product?.targetAudience && product.targetAudience.length > 0
      ? product.targetAudience
      : DEFAULT_TARGET_AUDIENCE;
  const securePaymentText = pickTrustParagraph(
    product?.trustInfo?.securePayment,
    DEFAULT_SECURE_PAYMENT,
  );
  const invoiceReceiptText = pickTrustParagraph(
    product?.trustInfo?.invoiceReceipt,
    DEFAULT_INVOICE_RECEIPT,
  );

  const allLegalAccepted = REQUIRED_LEGAL_TYPES.every((type) => legalConsents[type]);

  const openLegalPreview = async (type: string) => {
    setShowLegalModal(true);
    setLegalPreviewLoading(true);
    setLegalPreview(null);
    try {
      const data = await fetchLegalTemplatePreview(type, {
        productType,
        amountKurus: Math.round(selectedTotal * 100),
      });
      if (data) {
        setLegalPreview({ title: data.title, content: data.content });
      } else {
        setLegalPreview({ title: LEGAL_CONSENT_LABELS[type] || type, content: 'İçerik yüklenemedi.' });
      }
    } catch {
      setLegalPreview({ title: LEGAL_CONSENT_LABELS[type] || type, content: 'İçerik yüklenemedi.' });
    } finally {
      setLegalPreviewLoading(false);
    }
  };

  const handlePurchase = () => {
    if (renewalToken && !subscriptionRenewalEnabled) {
      const msg = 'Abonelik yenileme ödemesi şu anda devre dışı.';
      showToast(msg, 'warning');
      setError(msg);
      return;
    }
    if (renewalToken && (!renewalContext?.valid || !backendQuote?.valid)) {
      const msg = renewalContext?.reason || 'Yenileme bağlantısı veya fiyatı geçerli değil.';
      showToast(msg, 'error');
      setError(msg);
      return;
    }
    if (campaignValidationPending) {
      const msg = 'Kampanya doğrulaması tamamlanana kadar lütfen bekleyin.';
      showToast(msg, 'warning');
      setError(msg);
      return;
    }
    if (!allLegalAccepted) {
      const msg = 'Lütfen tüm yasal metinleri okuyup onaylayın.';
      showToast(msg, 'warning');
      setError(msg);
      return;
    }
    setError(null);
    setShowBillingModal(true);
  };

  const processPayment = async (billing: BillingFormData) => {
    try {
      setProcessing(true);
      setError(null);
      const periodForApi = renewalToken
        ? subscriptionPeriod
        : productType === 'annual'
          ? 1
          : 0;
      const billingInfo = formatBillingForApi(billing);
      if (renewalEmail) billingInfo.email = renewalEmail;
      const legalConsentsPayload = Object.fromEntries(
        REQUIRED_LEGAL_TYPES.map((type) => [type, Boolean(legalConsents[type])]),
      );

      if (paymentMethod === 'bank_transfer') {
        if (!bankTransferActive) {
          const msg = 'Havale/EFT ödeme yöntemi şu anda aktif değil.';
          showToast(msg, 'error');
          setError(msg);
          return;
        }

        const order = await requestBankTransferOrder({
          subscriptionPeriod: periodForApi,
          productType,
          billingInfo,
          campaignCode: checkoutCampaignCode,
          renewalToken,
          legalConsents: legalConsentsPayload,
        });

        setShowBillingModal(false);
        navigate(
          `/odeme-beklemede?merchant_oid=${encodeURIComponent(order.merchantOid)}`,
          { state: { bankTransferOrder: order } },
        );
        return;
      }

      const useGuest = !isAuthenticated;
      const data = await requestPaytrToken({
        subscriptionPeriod: periodForApi,
        productType,
        billingInfo,
        campaignCode: checkoutCampaignCode,
        renewalToken,
        authenticated: !useGuest,
        legalConsents: legalConsentsPayload,
      });
      const token = data.token ?? data.data?.token;
      if (data.success && token) {
        setCheckoutSummary({
          label: productType === 'monthly' ? 'Aylık abonelik' : 'Yıllık abonelik',
          totalTL: selectedTotal,
          periodLabel: productType === 'monthly' ? '1 ay' : '1 yıl',
        });
        setPaytrToken(token);
        setShowPaytrModal(true);
        setShowBillingModal(false);
      } else {
        const msg = data.message ?? 'Ödeme başlatılamadı';
        showToast(msg, 'error');
        setError(msg);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Ödeme sırasında bir hata oluştu';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || checkingAuth || renewalLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
          <p className="mt-4 text-slate-600">Sayfa yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-lg text-slate-700">{error}</p>
        <Button to="/" variant="secondary" className="mt-6">
          Ana sayfaya dön
        </Button>
      </div>
    );
  }

  return (
    <>
      <section className="hero-section-bg border-b border-slate-800/40 text-white">
        <div className="container-page py-14 lg:py-16">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">
            Abonelik
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {productName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {productDesc}
          </p>
          {campaign && (
            <div className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-xl border border-amber-400/50 bg-amber-500/15 px-5 py-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div>
                <p className="font-bold text-amber-50">{campaign.name}</p>
                <p className="mt-1 text-sm text-amber-100/90">
                  Tüm paketlerde %{campaign.discountRate} indirim uygulanır.
                </p>
              </div>
            </div>
          )}
          {renewalToken && (
            <div className="mt-6 max-w-xl rounded-xl border border-sky-300/50 bg-sky-500/15 px-5 py-4">
              <p className="font-bold text-sky-50">Abonelik yenileme</p>
              {renewalEmail && (
                <p className="mt-1 text-sm text-sky-100">
                  Yenilenecek hesap: <span className="font-semibold">{renewalEmail}</span>
                </p>
              )}
              {!subscriptionRenewalEnabled && (
                <p className="mt-2 text-sm font-semibold text-amber-200">
                  Yenileme ödemeleri şu anda devre dışı.
                </p>
              )}
              {renewalContext && !renewalContext.valid && (
                <p className="mt-2 text-sm font-semibold text-red-200">
                  {renewalContext.reason || 'Yenileme bağlantısı geçerli değil.'}
                </p>
              )}
            </div>
          )}
          {campaignNotice && (
            <div
              className="mt-6 max-w-xl rounded-xl border border-amber-300/60 bg-amber-500/15 px-5 py-4 text-sm font-semibold text-amber-50"
              role="alert"
            >
              {campaignNotice}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <ProductGallery images={galleryImages} alt={productName} />
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-white p-6 shadow-xl ring-4 ring-emerald-500/10 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Paket seçimi</h2>
              <p className="mt-1 text-sm text-slate-600">Aylık veya yıllık abonelik</p>

              <div className={`mt-5 grid gap-3 ${renewalToken ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {displayedProductTypes.map((type) => {
                  const active = productType === type;
                  const price =
                    active && backendQuote?.valid
                      ? quoteAmountTL(backendQuote.finalPrice)
                      : type === 'monthly'
                        ? pricing.monthly
                        : pricing.annual;
                  const base = type === 'monthly' ? pricing.monthlyBase : pricing.annualBase;
                  const isAnnualCard = type === 'annual';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        if (renewalToken) return;
                        setProductType(type);
                        setSubscriptionPeriod(type === 'annual' ? 1 : 0);
                      }}
                      disabled={Boolean(renewalToken)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {type === 'monthly' ? 'Aylık' : 'Yıllık'}
                      </p>
                      {isAnnualCard && (
                        <span className="mt-2 inline-flex w-full items-start gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-bold leading-tight text-white shadow-sm sm:text-[11px]">
                          <Gift className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                          <span className="text-left">
                            <span className="block">{ANNUAL_GIFT_BADGE_LINES[0]}</span>
                            <span className="block">{ANNUAL_GIFT_BADGE_LINES[1]}</span>
                          </span>
                        </span>
                      )}
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatPriceTL(price)}
                      </p>
                      {pricing.hasCampaign && base > price && (
                        <p className="mt-1 text-xs text-slate-500 line-through">
                          {formatPriceTL(base)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {type === 'monthly' ? '/ ay' : '/ yıl'}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-6 text-sm">
                {backendQuote?.valid ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Normal fiyat</span>
                      <span>{formatPriceTL(quoteAmountTL(backendQuote.normalPrice))}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Paket indirimi</span>
                      <span>-{formatPriceTL(quoteAmountTL(backendQuote.packageDiscount))}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Kampanya / baro indirimi</span>
                      <span>-{formatPriceTL(quoteAmountTL(backendQuote.campaignDiscount))}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                      <span>Son fiyat (KDV dahil)</span>
                      <span>{formatPriceTL(quoteAmountTL(backendQuote.finalPrice))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Fiyat backend tarafından doğrulandı</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Ara toplam (KDV dahil)</span>
                    <span className="font-semibold text-slate-900">
                      {formatPriceTL(selectedTotal)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                {REQUIRED_LEGAL_TYPES.map((type) => {
                  const label = LEGAL_CONSENT_LABELS[type];
                  const isWithdrawal = type === 'WITHDRAWAL_EXCEPTION';
                  return (
                    <label key={type} className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(legalConsents[type])}
                        onChange={(e) =>
                          setLegalConsents((prev) => ({ ...prev, [type]: e.target.checked }))
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span className="text-slate-700">
                        {isWithdrawal ? (
                          label
                        ) : (
                          <>
                            <button
                              type="button"
                              className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                              onClick={() => void openLegalPreview(type)}
                            >
                              {label}
                            </button>
                            {type === 'KVKK' ? "'ni okudum." : "'nu okudum ve onaylıyorum."}
                          </>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="text-sm font-semibold text-slate-900">Ödeme yöntemi</p>
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1 h-4 w-4 border-slate-300 text-emerald-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Kredi / Banka Kartı</span>
                      <span className="block text-xs text-slate-500">PayTR güvenli ödeme</span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-3 rounded-lg border border-slate-200 p-3 ${
                      bankTransferActive
                        ? 'cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50'
                        : 'cursor-not-allowed bg-slate-50 opacity-70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => bankTransferActive && setPaymentMethod('bank_transfer')}
                      disabled={!bankTransferActive}
                      className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 disabled:cursor-not-allowed"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Havale / EFT</span>
                      <span className="block text-xs text-slate-500">
                        {bankTransferActive
                          ? 'Ödeme admin onayından sonra aktif olur'
                          : 'Havale/EFT şu anda aktif değil'}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}

              <Button
                variant="accent"
                size="lg"
                className="mt-6 w-full"
                onClick={handlePurchase}
                disabled={
                  processing ||
                  campaignValidationPending ||
                  Boolean(
                    renewalToken &&
                      (!subscriptionRenewalEnabled ||
                        !renewalContext?.valid ||
                        !backendQuote?.valid),
                  )
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Hazırlanıyor…
                  </>
                ) : campaignValidationPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Kampanya doğrulanıyor…
                  </>
                ) : paymentMethod === 'bank_transfer' ? (
                  'Havale/EFT siparişi oluştur'
                ) : (
                  'Güvenli ödeme ile satın al'
                )}
              </Button>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                {paymentMethod === 'bank_transfer'
                  ? 'Havale/EFT ödemesi admin onayından sonra aboneliğinizi aktif eder'
                  : '256-bit SSL ile korumalı ödeme'}
              </p>
            </div>
          </div>
        </div>

        {isAnnualPlan && <AnnualGiftPromoSection />}

        {product?.longDescription && (
          <div className="mt-12 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Ürün açıklaması</h2>
            <div
              className="prose prose-slate mt-4 max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: product.longDescription }}
            />
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:mt-12">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              Neler dahil?
            </h2>
            <ul className="mt-6 space-y-3">
              {featureItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <UserPlus className="h-6 w-6 text-sky-600" />
              Kimler için?
            </h2>
            <ul className="mt-6 space-y-3">
              {audienceItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 shadow-lg sm:mt-8 sm:p-8 lg:p-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white sm:mb-6 sm:text-2xl">
            <Shield className="h-6 w-6 shrink-0 text-cyan-400" />
            Güven &amp; Yasal Bilgiler
          </h2>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Lock className="h-5 w-5 shrink-0 text-cyan-400" />
                Güvenli Ödeme
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">{securePaymentText}</p>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <FileText className="h-5 w-5 shrink-0 text-cyan-400" />
                Fatura &amp; Makbuz
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">{invoiceReceiptText}</p>
            </div>
          </div>
        </div>
      </section>

      <BillingInfoModal
        open={showBillingModal}
        onClose={() => !processing && setShowBillingModal(false)}
        onSubmit={(data) => void processPayment(data)}
        processing={processing}
        lockedAccountEmail={renewalToken ? renewalEmail : null}
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

      {showPaytrModal && paytrToken && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Güvenli ödeme</p>
                {checkoutSummary && (
                  <p className="text-sm text-slate-600">
                    {checkoutSummary.label} · {formatPriceTL(checkoutSummary.totalTL)} ·{' '}
                    {checkoutSummary.periodLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPaytrModal(false);
                  setPaytrToken(null);
                  setCheckoutSummary(null);
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Ödemeyi kapat"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>
            <iframe
              title="PayTR ödeme"
              src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
              className="h-[min(70vh,640px)] w-full border-0"
            />
          </div>
        </div>
      )}
    </>
  );
}
