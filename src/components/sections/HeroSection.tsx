import { ArrowRight, PlayCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { config } from '@/lib/config';
import type { HeroSlideResolved } from '@/lib/homepageHero';

type HeroSectionProps = {
  slides: HeroSlideResolved[];
};

export function HeroSection({ slides }: HeroSectionProps) {
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

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 sm:gap-10 lg:grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] lg:gap-10 lg:px-8 lg:py-20 xl:max-w-[90rem] xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] xl:gap-12 xl:py-[5.5rem] 2xl:max-w-[96rem] 2xl:gap-14">
        <div className="z-10 min-w-0 lg:pr-2 xl:max-w-[36rem]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Scale className="h-4 w-4 text-emerald-400" />
            Avukatlar ve bilirkişiler için profesyonel hesaplama yazılımı
          </p>

          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.65rem] xl:text-5xl">
            İşçilik alacaklarında{' '}
            <span className="text-emerald-400">doğru, hızlı ve denetlenebilir</span> hesaplama
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg lg:max-w-md xl:max-w-lg">
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

        <div className="relative z-10 w-full min-w-0">
          <div
            className="pointer-events-none absolute -inset-2 rounded-3xl bg-emerald-500/25 blur-3xl lg:-inset-4"
            aria-hidden
          />
          <HeroCarousel slides={slides} />
        </div>
      </div>
    </section>
  );
}
