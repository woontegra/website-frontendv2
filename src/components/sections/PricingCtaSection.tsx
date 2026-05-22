import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HomepageCtaButtonView, HomepageSectionHeadingView } from '@/lib/contentBundle';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'outlineLight'
  | 'ghost'
  | 'ghostLight';

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'accent',
  'outline',
  'outlineLight',
  'ghost',
  'ghostLight',
];

function parseButtonVariant(variant: string): ButtonVariant {
  if (VARIANTS.includes(variant as ButtonVariant)) return variant as ButtonVariant;
  return 'accent';
}

type PricingCtaSectionProps = HomepageSectionHeadingView & {
  buttons: HomepageCtaButtonView[];
};

export function PricingCtaSection({ eyebrow, title, description, buttons }: PricingCtaSectionProps) {
  return (
    <section className="bg-slate-100 py-16 lg:py-20">
      <div className="container-page">
        <div className="cta-section-bg overflow-hidden rounded-3xl px-6 py-12 shadow-2xl sm:px-12 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg">
              {description}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {buttons.map((btn, index) => {
                const external = /^https?:\/\//i.test(btn.href);
                const variant = parseButtonVariant(btn.variant);
                return (
                  <Button
                    key={btn.code}
                    to={btn.href}
                    variant={variant}
                    size="lg"
                    external={external}
                  >
                    {btn.label}
                    {index === 0 ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
