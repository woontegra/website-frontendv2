import { HeroCarousel } from '@/components/sections/HeroCarousel';
import type { HeroSlideResolved } from '@/lib/homepageHero';

type HeroSectionProps = {
  slides: HeroSlideResolved[];
  carouselIntervalMs?: number;
};

export function HeroSection({ slides, carouselIntervalMs }: HeroSectionProps) {
  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-slate-100" aria-label="Ana sayfa hero">
      <HeroCarousel slides={slides} intervalMs={carouselIntervalMs} />
    </section>
  );
}
