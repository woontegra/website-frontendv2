import { Check } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { MarketingImage, MarketingImageFallback } from '@/components/ui/MarketingImage';

const benefits = [
  'Formül ve sürüm hatalarına son',
  'Standart rapor ve çıktı formatı',
  'Dosya kaybı riskini azaltma',
  'Ekip içi tutarlı hesaplama',
];

type ExcelSectionProps = {
  imageSrc?: string;
};

export function ExcelSection({
  imageSrc = '/images/excel-vs-program.png',
}: ExcelSectionProps) {
  return (
    <section className="section-muted py-16 lg:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            theme="muted"
            eyebrow="Excel yerine program"
            title="Tablolarla uğraşmayın, dosyaya odaklanın"
            description="Excel dosyaları her güncellemede risk taşır. Bilirkişi Hesap ile hesaplamalar merkezi, denetlenebilir ve profesyonel kalır."
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
        <div className="relative">
          <MarketingImage
            src={imageSrc}
            alt="Excel yerine program kullanımı karşılaştırması"
            className="w-full"
            frame="light"
          />
          <MarketingImageFallback label="excel-vs-program.png" variant="light" />
        </div>
      </div>
    </section>
  );
}
