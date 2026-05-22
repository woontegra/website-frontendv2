import { CheckCircle2, Layers } from 'lucide-react';
import type { ModuleLandingContent } from '@/lib/calculationLandingContent';

type Props = {
  legacy: ModuleLandingContent;
};

export function CalculationLegacyContent({ legacy }: Props) {
  const hasArticle = legacy.articleSections.length > 0;
  const hasModuleTypes = (legacy.moduleTypes?.cards.length ?? 0) > 0;
  const hasProgramBenefits = (legacy.programBenefits?.length ?? 0) > 0;

  if (!hasArticle && !hasModuleTypes && !hasProgramBenefits) {
    return null;
  }

  return (
    <>
      {hasArticle && (
        <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
          <div className="container-page max-w-3xl">
            <div className="space-y-10">
              {legacy.articleSections.map((section) => (
                <article key={section.heading}>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-600">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                    {section.listItems && section.listItems.length > 0 && (
                      <ul className="list-disc space-y-2 pl-5 marker:text-emerald-600">
                        {section.listItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasModuleTypes && legacy.moduleTypes && (
        <section className="border-b border-slate-200 bg-slate-50 py-14 lg:py-16">
          <div className="container-page">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              {legacy.moduleTypes.title}
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {legacy.moduleTypes.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
                >
                  <Layers className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasProgramBenefits && legacy.programBenefits && (
        <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
          <div className="container-page">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Programın özellikleri
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {legacy.programBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-md"
                >
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2} />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
