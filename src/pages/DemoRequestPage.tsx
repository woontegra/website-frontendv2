import type { ReactNode } from 'react';
import { Check, Scale, Users, ClipboardList, ArrowRight } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { DemoRequestForm } from '@/components/forms/DemoRequestForm';
import { Button } from '@/components/ui/Button';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';
import { getMediaAssetByKey, resolveMediaFileUrl } from '@/lib/contentBundle';

const DEMO_HERO_IMAGE_FALLBACK = '';
const DEMO_FORM_IMAGE_FALLBACK = '';
const DEMO_TRUST_IMAGE_FALLBACK = '';
const DEMO_CTA_IMAGE_FALLBACK = '';

function DemoPageMedia({
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

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function DemoRequestPage() {
  const { content } = useContentBundle();
  const demo = content.demo;

  const heroImageSrc = resolveMediaFileUrl(
    content,
    'demo.hero.image',
    DEMO_HERO_IMAGE_FALLBACK,
  );
  const formImageSrc = resolveMediaFileUrl(
    content,
    'demo.form.image',
    DEMO_FORM_IMAGE_FALLBACK,
  );
  const trustImageSrc = resolveMediaFileUrl(
    content,
    'demo.trust.image',
    DEMO_TRUST_IMAGE_FALLBACK,
  );
  const ctaImageSrc = resolveMediaFileUrl(
    content,
    'demo.cta.image',
    DEMO_CTA_IMAGE_FALLBACK,
  );

  const heroImageAlt =
    getMediaAssetByKey(content, 'demo.hero.image')?.altText ??
    'Demo talep sayfası hero görseli';
  const formImageAlt =
    getMediaAssetByKey(content, 'demo.form.image')?.altText ??
    'Demo talep formu yan panel görseli';
  const trustImageAlt =
    getMediaAssetByKey(content, 'demo.trust.image')?.altText ??
    'Demo güven ve önizleme görseli';
  const ctaImageAlt =
    getMediaAssetByKey(content, 'demo.cta.image')?.altText ?? 'Demo sayfası CTA görseli';

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
      <section className="hero-section-bg text-white">
        <div className="container-page py-14 lg:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Scale className="h-4 w-4" />
            {demo.heroEyebrow}
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {demo.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            {demo.heroDescription}
          </p>
          <p className="mt-3 max-w-2xl text-base font-medium text-emerald-300/95">
            {demo.heroSubtitle}
          </p>
          <DemoPageMedia
            src={heroImageSrc}
            alt={heroImageAlt}
            label="demo-hero.png"
            frame="dark"
            className="mt-8 max-w-xl"
          />
        </div>
      </section>

      <section className="bg-slate-100 py-14 lg:py-20">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="lg:col-span-3">
              <DemoRequestForm />
            </div>
            <div className="flex flex-col gap-5 lg:col-span-2">
              <DemoPageMedia
                src={formImageSrc}
                alt={formImageAlt}
                label="demo-form.png"
                className="mb-0"
              />
              <InfoCard title="Demo ile neleri görebilirsiniz?">
                <ul className="space-y-3">
                  {demo.benefits.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoCard>

              <InfoCard title="Kimler için uygundur?">
                <ul className="space-y-2">
                  {demo.audience.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm font-medium text-slate-800"
                    >
                      <Users className="h-4 w-4 text-sky-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoCard>

              <InfoCard title="Demo sonrası süreç">
                <ol className="space-y-3">
                  {demo.processSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-emerald-400">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </InfoCard>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-page">
          <DemoPageMedia
            src={trustImageSrc}
            alt={trustImageAlt}
            label="demo-trust.png"
            className="mx-auto mb-8 max-w-2xl"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {demo.trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-md sm:text-left"
                >
                  <div className="mx-auto inline-flex rounded-xl bg-slate-900 p-3 text-emerald-400 sm:mx-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-16">
        <div className="container-page">
          <div
            className="cta-section-bg rounded-3xl px-6 py-12 text-center shadow-2xl sm:px-12"
            style={ctaSectionStyle}
            {...(ctaImageSrc.trim()
              ? { role: 'img' as const, 'aria-label': ctaImageAlt }
              : {})}
          >
            <ClipboardList className="mx-auto h-8 w-8 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              {demo.bottomCtaTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">{demo.bottomCtaDescription}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to="/fiyatlandirma" variant="accent" size="lg">
                Fiyatlandırmaya Git
                <ArrowRight className="h-4 w-4" />
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
