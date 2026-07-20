import { HeroCarousel } from '@/components/sections/HeroCarousel';
import type { HeroCarouselLayout, HeroSlideResolved } from '@/lib/homepageHero';

type HeroSectionProps = {
  slides: HeroSlideResolved[];
  carouselIntervalMs?: number;
  layout?: HeroCarouselLayout;
};

export function HeroSection({ slides, carouselIntervalMs, layout }: HeroSectionProps) {
  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-slate-100" aria-label="Ana sayfa hero">
      <HeroCarousel slides={slides} intervalMs={carouselIntervalMs} layout={layout} />
    </section>
  );
}
