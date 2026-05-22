import { useContentBundle } from '@/app/ContentProvider';
import { HeroSection } from '@/components/sections/HeroSection';
import { TrustSection } from '@/components/sections/TrustSection';
import { ModulesSection } from '@/components/sections/ModulesSection';
import { ExcelSection } from '@/components/sections/ExcelSection';
import { PricingCtaSection } from '@/components/sections/PricingCtaSection';
import { FaqPreviewSection } from '@/components/sections/FaqPreviewSection';
import { usePageSeo } from '@/lib/pageSeo';
import {
  resolveHomepageExcel,
  resolveHomepageFaqPreviewHeading,
  resolveHomepageHero,
  resolveHomepageHeroCtaButtons,
  resolveHomepageHeroSlides,
  resolveHomepageModulesHeading,
  resolveHomepagePricingCta,
  resolveHomepagePricingCtaButtons,
  resolveHomepageTrust,
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
  const heroCopy = resolveHomepageHero(content);
  const heroButtons = resolveHomepageHeroCtaButtons(content);
  const modulesHeading = resolveHomepageModulesHeading(content);
  const excel = resolveHomepageExcel(content, HOME_EXCEL_IMAGE_FALLBACK);
  const pricingCta = resolveHomepagePricingCta(content);
  const pricingCtaButtons = resolveHomepagePricingCtaButtons(content);
  const faqPreviewHeading = resolveHomepageFaqPreviewHeading(content);
  const trust = resolveHomepageTrust(content);

  usePageSeo(content, '/', {
    title: heroCopy.title,
    description: heroCopy.description,
  });

  return (
    <>
      <HeroSection slides={heroSlides} {...heroCopy} buttons={heroButtons} />
      <TrustSection headline={trust.headline} metrics={trust.metrics} />
      <ModulesSection {...modulesHeading} />
      <ExcelSection {...excel} />
      <PricingCtaSection {...pricingCta} buttons={pricingCtaButtons} />
      <FaqPreviewSection heading={faqPreviewHeading} />
    </>
  );
}
