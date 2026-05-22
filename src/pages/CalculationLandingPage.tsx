import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LogIn } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import {
  getModuleMediaAsset,
  resolveCalculationLanding,
  resolveModuleMediaFileUrl,
  toModuleMediaSlug,
} from '@/lib/contentBundle';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/Button';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';
import { CalculationLegacyContent } from '@/components/calculation/CalculationLegacyContent';
import { resolveModuleLandingContent } from '@/lib/calculationLandingContent';

function ModuleLandingMedia({
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

export default function CalculationLandingPage() {
  const { pathname } = useLocation();
  const { content } = useContentBundle();
  const page = resolveCalculationLanding(pathname, content);
  const legacy = resolveModuleLandingContent(pathname, content);
  const moduleSlug = toModuleMediaSlug(pathname);
  const heroDescription = legacy?.intro?.trim() || page?.description || '';
  const showCmsBenefits = !legacy?.programBenefits?.length && (page?.benefits.length ?? 0) > 0;

  const heroImageSrc = resolveModuleMediaFileUrl(content, pathname, 'hero');
  const featuresImageSrc = resolveModuleMediaFileUrl(content, pathname, 'features');
  const ctaImageSrc = resolveModuleMediaFileUrl(content, pathname, 'cta');

  const heroImageAlt =
    getModuleMediaAsset(content, pathname, 'hero')?.altText ?? `${page?.title ?? 'Modül'} hero görseli`;
  const featuresImageAlt =
    getModuleMediaAsset(content, pathname, 'features')?.altText ??
    `${page?.title ?? 'Modül'} özellikler görseli`;
  const ctaImageAlt =
    getModuleMediaAsset(content, pathname, 'cta')?.altText ?? `${page?.title ?? 'Modül'} CTA görseli`;

  const ctaSectionStyle = ctaImageSrc.trim()
    ? {
        backgroundImage:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(19, 78, 74, 0.88) 48%, rgba(15, 23, 42, 0.92) 100%), ' +
          `url(${ctaImageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  useEffect(() => {
    if (!page) return;

    const metaTitle = page.seo.metaTitle ?? page.title;
    if (metaTitle) {
      document.title = metaTitle;
    }

    const metaDescription = page.seo.metaDescription;
    if (metaDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', metaDescription);
    }
  }, [page]);

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      {/* Hero */}
      <section className="hero-section-bg relative overflow-hidden text-white">
        <div className="container-page relative py-14 lg:py-20">
          <Link
            to="/"
            className="mb-6 inline-flex text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            ← Ana sayfa
          </Link>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">
            {page.eyebrow}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          {heroDescription && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {heroDescription}
            </p>
          )}
          <p className="mt-4 max-w-2xl text-sm text-slate-400">{page.heroNote}</p>
          <ModuleLandingMedia
            src={heroImageSrc}
            alt={heroImageAlt}
            label={`${moduleSlug}-hero.png`}
            frame="dark"
            className="mt-8 max-w-xl"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/demo-talep" variant="accent" size="lg">
              Demo Talep Et
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button to={config.PANEL_LOGIN_URL} variant="outlineLight" size="lg" external>
              <LogIn className="h-4 w-4" />
              Programa Giriş
            </Button>
          </div>
        </div>
      </section>

      {legacy && <CalculationLegacyContent legacy={legacy} />}

      {/* CMS özet maddeleri — eski sitedeki uzun içerik yoksa */}
      {showCmsBenefits && (
      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Bu modülde neler yapılabilir?
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Avukat ve bilirkişi dosyalarında sık kullanılan hesaplama adımları tek akışta.
          </p>
          <ModuleLandingMedia
            src={featuresImageSrc}
            alt={featuresImageAlt}
            label={`${moduleSlug}-features.png`}
            className="mx-auto mt-8 max-w-2xl"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {page.benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-md"
              >
                <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={2} />
                <p className="mt-4 text-base font-semibold text-slate-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Process */}
      <section className="bg-slate-100 py-14 lg:py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Nasıl çalışır?</h2>
          <p className="mt-2 text-slate-600">Üç adımda hesaplama ve rapor.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {page.processSteps.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-emerald-400">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 lg:py-16">
        <div className="container-page">
          <div
            className="cta-section-bg rounded-3xl px-6 py-12 text-center shadow-2xl sm:px-12"
            style={ctaSectionStyle}
            {...(ctaImageSrc.trim()
              ? { role: 'img' as const, 'aria-label': ctaImageAlt }
              : {})}
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{page.ctaText}</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-200">{page.bottomCtaDescription}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to="/demo-talep" variant="accent" size="lg">
                Demo Talep Et
              </Button>
              <Button to={config.PANEL_LOGIN_URL} variant="outlineLight" size="lg" external>
                Programa Giriş
              </Button>
              <Button to="/fiyatlandirma" variant="ghostLight" size="lg">
                Fiyatlandırma
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
