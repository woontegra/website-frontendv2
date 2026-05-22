import { ArrowRight, PlayCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';
import { config } from '@/lib/config';

type HeroSectionProps = {
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroSection({
  imageSrc = '/images/hero-dashboard.png',
  imageAlt = 'Bilirkişi Hesap yönetim paneli önizlemesi',
}: HeroSectionProps) {
  return (
    <section className="hero-section-bg relative overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 85% 15%, rgba(16, 185, 129, 0.35), transparent 50%)',
        }}
      />

      <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-14 lg:py-20 xl:py-24">
        <div className="z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Scale className="h-4 w-4 text-emerald-400" />
            Avukatlar ve bilirkişiler için profesyonel hesaplama yazılımı
          </p>

          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.65rem] xl:text-5xl">
            İşçilik alacaklarında{' '}
            <span className="text-emerald-400">doğru, hızlı ve denetlenebilir</span> hesaplama
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Kıdem, ihbar, fazla mesai ve 40+ modül — Excel karmaşası olmadan mevzuata uygun sonuç
            ve standart rapor çıktısı.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/demo-talep" variant="accent" size="lg">
              Demo Talep Et
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button to="/fiyatlandirma" variant="outlineLight" size="lg">
              Abone Ol
            </Button>
            <Button to={config.PANEL_LOGIN_URL} variant="ghostLight" size="lg" external>
              Programa Giriş
            </Button>
          </div>

          <a
            href={config.YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            <PlayCircle className="h-5 w-5 text-emerald-400" />
            Tanıtım videosunu izle
          </a>
        </div>

        <div className="relative z-10 lg:pl-2">
          <div
            className="absolute -inset-3 rounded-3xl bg-emerald-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative min-h-[300px] rounded-2xl border border-slate-600 bg-slate-800/90 p-3 shadow-2xl ring-1 ring-emerald-500/25 sm:min-h-[360px] lg:min-h-[400px]">
            <MarketingImage
              src={imageSrc}
              alt={imageAlt}
              className="h-full min-h-[280px] w-full lg:min-h-[360px]"
              frame="dark"
            />
            <MarketingImageFallback label="hero-dashboard.png" variant="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
