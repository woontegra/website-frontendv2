import { Link } from 'react-router-dom';
import {
  Check,
  X,
  Building2,
  ArrowRight,
  Sparkles,
  Scale,
} from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import {
  getMediaAssetByKey,
  resolveMediaFileUrl,
  resolvePageHero,
  type PricingComparisonColumnView,
  type PricingPlanView,
} from '@/lib/contentBundle';
import { usePageSeo } from '@/lib/pageSeo';
import { Button } from '@/components/ui/Button';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';

const PRICING_HERO_IMAGE_FALLBACK = '';
const PRICING_PLANS_IMAGE_FALLBACK = '';
const PRICING_COMPARISON_IMAGE_FALLBACK = '';
const PRICING_CTA_IMAGE_FALLBACK = '';

function PricingPageMedia({
  src,
  alt,
  label,
  frame = 'light',
  className = 'mb-5',
}: {
  src: string;
  alt: string;
  label: string;
  frame?: 'light' | 'dark';
  className?: string;
}) {
  if (!src.trim()) return null;

  return (
    <div className={className}>
      <MarketingImage src={src} alt={alt} className="w-full" frame={frame} />
      <MarketingImageFallback label={label} variant={frame} />
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PricingPlanCard({ plan }: { plan: PricingPlanView }) {
  const cardClass = plan.isFeatured
    ? 'relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-white p-7 shadow-xl ring-4 ring-emerald-500/15 lg:-mt-2 lg:mb-2'
    : plan.isBaro
      ? 'flex flex-col rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b from-amber-50/80 to-white p-7 shadow-lg'
      : 'flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-lg';

  const titleClass = plan.isFeatured
    ? 'mt-2 text-sm font-bold uppercase tracking-wide text-emerald-700'
    : plan.isBaro
      ? 'text-sm font-bold uppercase tracking-wide text-amber-900'
      : 'text-sm font-bold uppercase tracking-wide text-sky-800';

  return (
    <div className={cardClass}>
      {plan.badgeText && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
          {plan.badgeText}
        </span>
      )}
      {plan.isBaro ? (
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-700" />
          <p className={titleClass}>{plan.name}</p>
        </div>
      ) : (
        <p className={titleClass}>{plan.name}</p>
      )}
      <p className="mt-4 text-4xl font-bold text-slate-900">
        {plan.priceDisplay}
        {plan.priceSuffix && (
          <span className="text-lg font-semibold text-slate-600"> {plan.priceSuffix}</span>
        )}
      </p>
      {plan.subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{plan.subtitle}</p>
      )}
      <FeatureList items={plan.features} />
      <Button
        to={plan.ctaTo}
        external={plan.ctaExternal}
        variant={plan.isFeatured ? 'accent' : 'secondary'}
        size="lg"
        className="mt-8 w-full"
      >
        {plan.ctaText}
      </Button>
    </div>
  );
}

const PRICING_HERO_DEFAULTS = {
  eyebrow: 'Fiyatlandırma',
  title: 'Bilirkişi Hesap paketleri',
  description:
    'İşçilik alacakları hesaplamalarında doğru, hızlı ve raporlanabilir hesaplama altyapısı.',
};

export default function PricingPage() {
  const { content } = useContentBundle();
  const hero = resolvePageHero(content, '/fiyatlandirma', PRICING_HERO_DEFAULTS);

  usePageSeo(content, '/fiyatlandirma', {
    title: PRICING_HERO_DEFAULTS.title,
    description: PRICING_HERO_DEFAULTS.description,
  });

  const heroImageSrc = resolveMediaFileUrl(
    content,
    'pricing.hero.image',
    PRICING_HERO_IMAGE_FALLBACK,
  );
  const plansImageSrc = resolveMediaFileUrl(
    content,
    'pricing.plans.image',
    PRICING_PLANS_IMAGE_FALLBACK,
  );
  const comparisonImageSrc = resolveMediaFileUrl(
    content,
    'pricing.comparison.image',
    PRICING_COMPARISON_IMAGE_FALLBACK,
  );
  const ctaImageSrc = resolveMediaFileUrl(
    content,
    'pricing.cta.image',
    PRICING_CTA_IMAGE_FALLBACK,
  );

  const heroImageAlt =
    getMediaAssetByKey(content, 'pricing.hero.image')?.altText ??
    'Fiyatlandırma sayfası hero görseli';
  const plansImageAlt =
    getMediaAssetByKey(content, 'pricing.plans.image')?.altText ?? 'Paket kartları görseli';
  const comparisonImageAlt =
    getMediaAssetByKey(content, 'pricing.comparison.image')?.altText ??
    'Karşılaştırma bölümü görseli';
  const ctaImageAlt =
    getMediaAssetByKey(content, 'pricing.cta.image')?.altText ?? 'Fiyatlandırma CTA görseli';

  const ctaSectionStyle = ctaImageSrc.trim()
    ? {
        backgroundImage:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(19, 78, 74, 0.88) 48%, rgba(15, 23, 42, 0.92) 100%), ' +
          `url(${ctaImageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div>
      {/* Hero */}
      <section className="hero-section-bg text-white">
        <div className="container-page py-14 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Scale className="h-4 w-4" />
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            {hero.description}
          </p>
          <PricingPageMedia
            src={heroImageSrc}
            alt={heroImageAlt}
            label="pricing-hero.png"
            frame="dark"
            className="mt-8 max-w-xl"
          />
        </div>
      </section>

      {/* Paket kartları */}
      <section className="bg-slate-100 py-14 lg:py-20">
        <div className="container-page">
          <PricingPageMedia
            src={plansImageSrc}
            alt={plansImageAlt}
            label="pricing-plans.png"
            className="mx-auto mb-8 max-w-2xl"
          />
          <div
            className={`mx-auto grid max-w-5xl gap-6 lg:gap-8 ${
              content.pricingPlans.length >= 3
                ? 'lg:grid-cols-3'
                : 'md:grid-cols-2'
            }`}
          >
            {content.pricingPlans.map((plan) => (
              <PricingPlanCard key={plan.code} plan={plan} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-600">
            Abone ol butonları bilgilendirme amaçlı yönlendirme linkleridir; bu aşamada canlı
            ödeme başlatılmaz.
          </p>
        </div>
      </section>

      {/* Karşılaştırma */}
      <section className="border-y border-slate-200 bg-white py-14 lg:py-20">
        <div className="container-page">
          <PricingPageMedia
            src={comparisonImageSrc}
            alt={comparisonImageAlt}
            label="pricing-comparison.png"
            className="mx-auto mb-8 max-w-2xl"
          />
          <h2 className="max-w-3xl text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            {content.pricingComparisonTitle}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.pricingComparisonColumns.map((col: PricingComparisonColumnView) => (
              <div
                key={col.title}
                className={`rounded-2xl border p-6 shadow-md ${
                  col.variant === 'primary'
                    ? 'border-emerald-500/50 bg-slate-900 text-white ring-2 ring-emerald-500/20'
                    : col.variant === 'negative'
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <h3
                  className={`text-lg font-bold ${
                    col.variant === 'primary' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {col.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className={`flex items-start gap-2.5 text-sm ${
                        col.variant === 'primary'
                          ? 'text-slate-200'
                          : 'text-slate-700'
                      }`}
                    >
                      {col.variant === 'negative' ? (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            col.variant === 'primary' ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        />
                      )}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="bg-slate-100 py-14 lg:py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Sık sorulan fiyat soruları
          </h2>
          <div className="mt-8 space-y-4">
            {content.pricingFaq.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
              >
                <h3 className="font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm">
            <Link to="/sss" className="font-semibold text-sky-800 hover:underline">
              Tüm SSS sayfasına git
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* Alt CTA */}
      <section className="py-14 lg:py-16">
        <div className="container-page">
          <div
            className="cta-section-bg rounded-3xl px-6 py-12 text-center shadow-2xl sm:px-12 lg:py-14"
            style={ctaSectionStyle}
            {...(ctaImageSrc.trim()
              ? { role: 'img' as const, 'aria-label': ctaImageAlt }
              : {})}
          >
            <Sparkles className="mx-auto h-8 w-8 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Hangi paketin uygun olduğundan emin değil misiniz?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-200">
              Demo talebi oluşturarak programı inceleyebilir, ihtiyacınıza uygun paketi
              belirleyebilirsiniz.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to="/demo-talep" variant="accent" size="lg">
                Demo Talep Et
              </Button>
              <Button to="/" variant="outlineLight" size="lg">
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
