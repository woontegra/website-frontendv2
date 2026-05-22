import { Layers, FileCheck, ShieldCheck } from 'lucide-react';

const metrics = [
  {
    icon: Layers,
    value: '40+',
    label: 'hesaplama modülü',
    description: 'Kıdemden UBGT’ye tüm işçilik alacakları tek platformda.',
  },
  {
    icon: FileCheck,
    value: 'Dakikalar',
    label: 'içinde rapor',
    description: 'Manuel tablolar yerine hızlı, standart çıktı üretin.',
  },
  {
    icon: ShieldCheck,
    value: 'Mevzuata',
    label: 'uygun yapı',
    description: 'Güncel parametrelerle denetlenebilir hesaplama süreci.',
  },
];

export function TrustSection() {
  return (
    <section className="border-b border-slate-200/80 bg-white py-14 lg:py-16">
      <div className="container-page">
        <p className="text-center text-lg font-semibold text-slate-800 sm:text-xl lg:text-2xl">
          İşçilik alacaklarında{' '}
          <span className="text-sky-800">doğru, hızlı ve denetlenebilir</span> hesaplama
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-slate-900 p-3 text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {item.value}
                  <span className="ml-1 text-base font-semibold text-slate-600">
                    {item.label}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
