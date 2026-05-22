import { useContentBundle } from '@/app/ContentProvider';
import { HeroSection } from '@/components/sections/HeroSection';
import { TrustSection } from '@/components/sections/TrustSection';
import { ModulesSection } from '@/components/sections/ModulesSection';
import { ExcelSection } from '@/components/sections/ExcelSection';
import { PricingCtaSection } from '@/components/sections/PricingCtaSection';
import { FaqPreviewSection } from '@/components/sections/FaqPreviewSection';
import {
  resolveHomepageExcelImage,
  resolveHomepageHeroSlides,
} from '@/lib/contentBundle';

const HOME_HERO_IMAGE_FALLBACK = '/images/hero-dashboard.png';
const HOME_HERO_ALT_FALLBACK = 'Bilirkişi Hesap yönetim paneli önizlemesi';
const HOME_EXCEL_IMAGE_FALLBACK = '/images/excel-vs-program.png';

export default function HomePage() {
  const { content } = useContentBundle();
  const heroSlides = resolveHomepageHeroSlides(
    content,
    HOME_HERO_IMAGE_FALLBACK,
    HOME_HERO_ALT_FALLBACK,
  );
  const excelImageSrc = resolveHomepageExcelImage(content, HOME_EXCEL_IMAGE_FALLBACK);

  return (
    <>
      <HeroSection slides={heroSlides} />
      <TrustSection />
      <ModulesSection />
      <ExcelSection imageSrc={excelImageSrc} />
      <PricingCtaSection />
      <FaqPreviewSection />
    </>
  );
}
