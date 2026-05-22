import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function ModulesSection() {
  const { content } = useContentBundle();
  const { modules } = content;

  return (
    <section className="bg-slate-900 py-16 lg:py-24">
      <div className="container-page">
        <SectionHeading
          theme="dark"
          title="Hesaplama Modülleri"
          description="Kıdemden fazla mesaiye, yıllık izinden UBGT'ye kadar işçilik alacaklarını tek panelde hesaplayın."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                to={mod.href}
                className="group flex min-h-[168px] flex-col rounded-2xl border border-slate-600 bg-slate-800 p-5 shadow-lg transition-all hover:border-emerald-500/50 hover:bg-slate-800/95 hover:shadow-xl"
              >
                <div className="mb-4 inline-flex w-fit rounded-lg bg-slate-900 p-2.5 text-emerald-400 ring-1 ring-slate-600 transition-colors group-hover:text-emerald-300 group-hover:ring-emerald-500/40">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-50">
                  {mod.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                  {mod.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 opacity-80 transition-all group-hover:gap-2 group-hover:opacity-100">
                  Hesaplamaya git
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
