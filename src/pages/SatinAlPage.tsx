import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle,
  Shield,
  Lock,
  Loader2,
  Sparkles,
  X,
  FileText,
  Users,
  Percent,
  UserPlus,
} from 'lucide-react';
import { BillingInfoModal, type BillingFormData } from '@/components/checkout/BillingInfoModal';
import { ProductGallery } from '@/components/checkout/ProductGallery';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/toast';
import { getSatinAlDisplayImages } from '@/lib/marketingProductImages';
import {
  fetchAuthMe,
  fetchCampaignById,
  fetchPageBySlug,
  fetchPublicProduct,
  requestPaytrToken,
  type Campaign,
  type PublicProduct,
} from '@/lib/storeApi';

const MONTHLY_FALLBACK_TL = 1800;
const ANNUAL_FALLBACK_TL = 22000;

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

type ProductType = 'monthly' | 'annual';

type LegalPage = { title?: string; content?: string };

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

function formatBillingForApi(data: BillingFormData) {
  return {
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    invoiceType: data.invoiceType,
    ...(data.taxNumber ? { taxNumber: data.taxNumber } : {}),
  };
}

export default function SatinAlPage() {
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [productType, setProductType] = useState<ProductType>('annual');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [termsContent, setTermsContent] = useState<LegalPage | null>(null);
  const [contractContent, setContractContent] = useState<LegalPage | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showPaytrModal, setShowPaytrModal] = useState(false);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<{
    label: string;
    totalTL: number;
    periodLabel: string;
  } | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'pro-monthly') setProductType('monthly');
    if (plan === 'pro-yearly') setProductType('annual');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const [me, productRes, terms, contract] = await Promise.all([
          fetchAuthMe(),
          fetchPublicProduct(),
          fetchPageBySlug('on-bilgilendirme'),
          fetchPageBySlug('mesafeli-satis-sozlesmesi'),
        ]);
        if (cancelled) return;
        setIsAuthenticated(Boolean(me.success && me.data));
        if (productRes.success && productRes.data) setProduct(productRes.data);
        else setProduct(null);
        if (terms) setTermsContent(terms);
        if (contract) setContractContent(contract);
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
  }, []);

  useEffect(() => {
    const campaignId = searchParams.get('c');
    if (!campaignId) {
      setCampaign(null);
      return;
    }
    let cancelled = false;
    void fetchCampaignById(campaignId).then((data) => {
      if (cancelled || !data) return;
      if (!data.isActive) return;
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) return;
      if (data.usageLimit != null && data.usageCount >= data.usageLimit) return;
      setCampaign(data);
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const pricing = useMemo(() => {
    const monthlyKurus = product
      ? toKurus(product.priceMonthly ?? (product as { price_monthly?: number }).price_monthly)
      : null;
    const annualKurus = product ? toKurus(product.price) : null;

    const monthlyBase =
      monthlyKurus != null && monthlyKurus > 0 ? monthlyKurus / 100 : MONTHLY_FALLBACK_TL;
    const annualBase =
      annualKurus != null && annualKurus > 0 ? annualKurus / 100 : ANNUAL_FALLBACK_TL;

    const applyCampaign = (base: number) =>
      campaign ? base * (1 - campaign.discountRate / 100) : base;

    return {
      monthly: applyCampaign(monthlyBase),
      annual: applyCampaign(annualBase),
      monthlyBase,
      annualBase,
      hasCampaign: Boolean(campaign),
    };
  }, [product, campaign]);

  const selectedTotal =
    productType === 'monthly' ? pricing.monthly : pricing.annual;

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
  const securePaymentText = product?.trustInfo?.securePayment ?? DEFAULT_SECURE_PAYMENT;
  const invoiceReceiptText = product?.trustInfo?.invoiceReceipt ?? DEFAULT_INVOICE_RECEIPT;

  const handlePurchase = () => {
    if (!acceptedTerms || !acceptedContract) {
      const msg =
        'Lütfen ön bilgilendirme koşulları ile mesafeli satış sözleşmesini onaylayın.';
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
      const periodForApi = productType === 'annual' ? 1 : 0;
      const billingInfo = formatBillingForApi(billing);
      const useGuest = !isAuthenticated;
      const data = await requestPaytrToken({
        subscriptionPeriod: periodForApi,
        productType,
        billingInfo,
        campaignId: campaign?.id,
        authenticated: !useGuest,
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

  if (loading || checkingAuth) {
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

              <div className="mt-5 grid grid-cols-2 gap-3">
                {(['monthly', 'annual'] as const).map((type) => {
                  const active = productType === type;
                  const price = type === 'monthly' ? pricing.monthly : pricing.annual;
                  const base = type === 'monthly' ? pricing.monthlyBase : pricing.annualBase;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProductType(type)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {type === 'monthly' ? 'Aylık' : 'Yıllık'}
                      </p>
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
                <div className="flex justify-between text-slate-600">
                  <span>Ara toplam (KDV dahil)</span>
                  <span className="font-semibold text-slate-900">
                    {formatPriceTL(selectedTotal)}
                  </span>
                </div>
                {pricing.hasCampaign && (
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Percent className="h-4 w-4" />
                    <span>Kampanya indirimi uygulandı</span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-slate-700">
                    <button
                      type="button"
                      className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                      onClick={() => setShowLegalModal(true)}
                    >
                      Ön bilgilendirme koşullarını
                    </button>{' '}
                    okudum ve kabul ediyorum.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedContract}
                    onChange={(e) => setAcceptedContract(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-slate-700">
                    <button
                      type="button"
                      className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                      onClick={() => setShowLegalModal(true)}
                    >
                      Mesafeli satış sözleşmesini
                    </button>{' '}
                    okudum ve kabul ediyorum.
                  </span>
                </label>
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
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Hazırlanıyor…
                  </>
                ) : (
                  'Güvenli ödeme ile satın al'
                )}
              </Button>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                256-bit SSL ile korumalı ödeme
              </p>
            </div>
          </div>
        </div>

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

        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md sm:mt-8 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Shield className="h-6 w-6 text-emerald-600" />
            Güven ve yasal bilgiler
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Lock className="h-5 w-5 text-emerald-600" />
                Güvenli ödeme
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{securePaymentText}</p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-sky-600" />
                Fatura ve makbuz
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{invoiceReceiptText}</p>
            </div>
          </div>
        </div>
      </section>

      <BillingInfoModal
        open={showBillingModal}
        onClose={() => !processing && setShowBillingModal(false)}
        onSubmit={(data) => void processPayment(data)}
        processing={processing}
      />

      {showLegalModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Yasal metinler</h2>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-6 overflow-y-auto p-6 md:grid-cols-2">
              <article>
                <h3 className="font-bold text-slate-900">
                  {termsContent?.title ?? 'Ön bilgilendirme'}
                </h3>
                <div
                  className="prose prose-sm mt-3 max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: termsContent?.content ?? '<p>İçerik yükleniyor…</p>',
                  }}
                />
              </article>
              <article>
                <h3 className="font-bold text-slate-900">
                  {contractContent?.title ?? 'Mesafeli satış sözleşmesi'}
                </h3>
                <div
                  className="prose prose-sm mt-3 max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: contractContent?.content ?? '<p>İçerik yükleniyor…</p>',
                  }}
                />
              </article>
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <Button variant="primary" onClick={() => setShowLegalModal(false)}>
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
