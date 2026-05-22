import { Check } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';
import type { HomepageExcelView } from '@/lib/contentBundle';

type ExcelSectionProps = HomepageExcelView;

export function ExcelSection({
  eyebrow,
  title,
  description,
  benefits,
  imageSrc,
  imageAlt,
}: ExcelSectionProps) {
  return (
    <section className="section-muted py-16 lg:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            theme="muted"
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
          <ul className="mt-10 space-y-4">
            {benefits.map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm font-medium text-slate-800 sm:text-base">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div
          key={imageSrc}
          className="relative w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-md"
        >
          <MarketingImage
            src={imageSrc}
            alt={imageAlt}
            className="h-auto w-full"
            frame="light"
            fit="contain"
            bare
          />
          <MarketingImageFallback label={imageSrc || 'excel-vs-program.png'} variant="light" />
        </div>
      </div>
    </section>
  );
}
