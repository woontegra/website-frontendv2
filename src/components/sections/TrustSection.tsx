import type { HomepageTrustView } from '@/lib/contentBundle';

type TrustSectionProps = HomepageTrustView;

export function TrustSection({ headline, metrics }: TrustSectionProps) {
  const parts = headline.split(/\s+(doğru,\s+hızlı\s+ve\s+denetlenebilir)\s+/i);
  const hasHighlight = parts.length >= 3;
  const before = hasHighlight ? parts[0] : headline;
  const highlight = hasHighlight ? parts[1] : null;
  const after = hasHighlight ? parts[2] : '';

  return (
    <section className="border-b border-slate-200/80 bg-white py-14 lg:py-16">
      <div className="container-page">
        <p className="text-center text-lg font-semibold text-slate-800 sm:text-xl lg:text-2xl">
          {hasHighlight ? (
            <>
              {before}
              <span className="text-sky-800"> {highlight} </span>
              {after}
            </>
          ) : (
            headline
          )}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.value}-${item.label}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-slate-900 p-3 text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {item.value}
                  {item.label ? (
                    <span className="ml-1 text-base font-semibold text-slate-600">
                      {item.label}
                    </span>
                  ) : null}
                </p>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
