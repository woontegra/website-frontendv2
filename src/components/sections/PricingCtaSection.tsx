import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PricingCtaSection() {
  return (
    <section className="bg-slate-100 py-16 lg:py-20">
      <div className="container-page">
        <div className="cta-section-bg overflow-hidden rounded-3xl px-6 py-12 shadow-2xl sm:px-12 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">
              Fiyatlandırma
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Dosyanız için doğru hesaplama altyapısını seçin
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg">
              Profesyonel aylık veya yıllık paketler; baro üyelerine özel kampanyalar.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button to="/fiyatlandirma" variant="accent" size="lg">
                Fiyatlandırmaya Git
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button to="/demo-talep" variant="outlineLight" size="lg">
                Demo Talep Et
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
