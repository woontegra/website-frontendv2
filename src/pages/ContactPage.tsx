import {
  Mail,
  Phone,
  LogIn,
  ClipboardList,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { config } from '@/lib/config';
import { ContactForm } from '@/components/forms/ContactForm';
import { Button } from '@/components/ui/Button';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';
import {
  getMediaAssetByKey,
  resolveMediaFileUrl,
  resolvePageHero,
  resolvePanelLoginCta,
} from '@/lib/contentBundle';
import { usePageSeo } from '@/lib/pageSeo';

const CONTACT_HERO_IMAGE_FALLBACK = '';
const CONTACT_INFO_IMAGE_FALLBACK = '';
const CONTACT_SUPPORT_IMAGE_FALLBACK = '';
const CONTACT_CTA_IMAGE_FALLBACK = '';

function ContactPageMedia({
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

const CONTACT_HERO_DEFAULTS = {
  eyebrow: 'Destek',
  title: 'İletişime Geçin',
  description:
    'Demo talebi, abonelik, baro kampanyaları ve program kullanımı hakkında bizimle iletişime geçebilirsiniz.',
};

export default function ContactPage() {
  const { content } = useContentBundle();
  const { setting, supportCards } = content.contact;
  const hero = resolvePageHero(content, '/iletisim', CONTACT_HERO_DEFAULTS);

  usePageSeo(content, '/iletisim', {
    title: CONTACT_HERO_DEFAULTS.title,
    description: CONTACT_HERO_DEFAULTS.description,
  });

  const heroImageSrc = resolveMediaFileUrl(
    content,
    'contact.hero.image',
    CONTACT_HERO_IMAGE_FALLBACK,
  );
  const infoImageSrc = resolveMediaFileUrl(
    content,
    'contact.info.image',
    CONTACT_INFO_IMAGE_FALLBACK,
  );
  const supportImageSrc = resolveMediaFileUrl(
    content,
    'contact.support.image',
    CONTACT_SUPPORT_IMAGE_FALLBACK,
  );
  const ctaImageSrc = resolveMediaFileUrl(
    content,
    'contact.cta.image',
    CONTACT_CTA_IMAGE_FALLBACK,
  );

  const heroImageAlt =
    getMediaAssetByKey(content, 'contact.hero.image')?.altText ?? 'İletişim sayfası hero görseli';
  const infoImageAlt =
    getMediaAssetByKey(content, 'contact.info.image')?.altText ??
    'İletişim bilgileri ve harita görseli';
  const supportImageAlt =
    getMediaAssetByKey(content, 'contact.support.image')?.altText ?? 'Destek kartları görseli';
  const ctaImageAlt =
    getMediaAssetByKey(content, 'contact.cta.image')?.altText ?? 'İletişim sayfası CTA görseli';

  const ctaSectionStyle = ctaImageSrc.trim()
    ? {
        backgroundImage:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(19, 78, 74, 0.88) 48%, rgba(15, 23, 42, 0.92) 100%), ' +
          `url(${ctaImageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const contactEmail = setting.contactEmail ?? config.contactEmail;
  const panelLogin = resolvePanelLoginCta(content);
  const phoneDisplay =
    setting.phoneNote?.trim() ||
    setting.contactPhone?.trim() ||
    'Yakında eklenecek';

  return (
    <div>
      <section className="hero-section-bg text-white">
        <div className="container-page py-14 lg:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <MessageCircle className="h-4 w-4" />
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            {hero.description}
          </p>
          <ContactPageMedia
            src={heroImageSrc}
            alt={heroImageAlt}
            label="contact-hero.png"
            frame="dark"
            className="mt-8 max-w-xl"
          />
        </div>
      </section>

      <section className="bg-slate-100 py-14 lg:py-20">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
            <div className="flex flex-col gap-5 lg:col-span-2">
              <ContactPageMedia
                src={infoImageSrc}
                alt={infoImageAlt}
                label="contact-info.png"
                className="mb-0"
              />
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md">
                <Mail className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  E-posta
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-2 block text-lg font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {contactEmail}
                </a>
              </div>

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md">
                <Phone className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Telefon
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-700">{phoneDisplay}</p>
              </div>

              {setting.contactAddress && (
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Adres
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-700">
                    {setting.contactAddress}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md">
                <LogIn className="h-6 w-6 text-sky-700" />
                <p className="mt-3 font-bold text-slate-900">Program Girişi</p>
                <p className="mt-1 text-sm text-slate-600">
                  Mevcut aboneliğiniz varsa programa buradan giriş yapın.
                </p>
                <Button
                  to={panelLogin.href}
                  external={panelLogin.external}
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  {panelLogin.label}
                </Button>
              </div>

              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/80 p-6 shadow-md">
                <ClipboardList className="h-6 w-6 text-emerald-700" />
                <p className="mt-3 font-bold text-slate-900">Demo Talebi</p>
                <p className="mt-1 text-sm text-slate-700">
                  Programı incelemek için demo talebi oluşturun.
                </p>
                <Button to="/demo-talep" variant="accent" className="mt-4 w-full">
                  Demo Talep Et
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-page">
          <ContactPageMedia
            src={supportImageSrc}
            alt={supportImageAlt}
            label="contact-support.png"
            className="mx-auto mb-8 max-w-2xl"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {supportCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-md"
                >
                  <div className="inline-flex rounded-xl bg-slate-900 p-3 text-emerald-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {item.description}
                  </p>
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
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Programı incelemek ister misiniz?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">
              Demo ile modülleri deneyin veya fiyatlandırmayı inceleyin.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to="/demo-talep" variant="accent" size="lg">
                Demo Talep Et
              </Button>
              <Button to="/fiyatlandirma" variant="outlineLight" size="lg">
                Fiyatlandırmaya Git
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
