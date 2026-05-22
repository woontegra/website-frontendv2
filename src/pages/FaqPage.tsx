import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { Button } from '@/components/ui/Button';

function FaqAccordionItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-md">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-emerald-600 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-2">
          <p className="text-sm leading-relaxed text-slate-700">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const { content } = useContentBundle();
  const faqCategories = content.faqCategories;

  return (
    <div>
      <section className="hero-section-bg text-white">
        <div className="container-page py-14 lg:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <HelpCircle className="h-4 w-4" />
            Yardım merkezi
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Sık Sorulan Sorular
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            Bilirkişi Hesap kullanımı, demo talebi, fiyatlandırma ve hesaplama modülleri hakkında
            merak edilenler.
          </p>
        </div>
      </section>

      <section className="bg-slate-100 py-14 lg:py-20">
        <div className="container-page max-w-4xl">
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border-2 border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                {cat.title}
              </span>
            ))}
          </div>

          <div className="mt-10 space-y-12">
            {faqCategories.map((cat) => (
              <div key={cat.id} id={cat.id}>
                <h2 className="text-2xl font-bold text-slate-900">{cat.title}</h2>
                <div className="mt-5 space-y-4">
                  {cat.items.map((item, index) => (
                    <FaqAccordionItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      defaultOpen={cat.id === 'genel' && index === 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-16">
        <div className="container-page">
          <div className="cta-section-bg rounded-3xl px-6 py-12 text-center shadow-2xl sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Sorunuzun cevabını bulamadınız mı?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">
              Demo talebi oluşturun veya doğrudan bizimle iletişime geçin.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to="/demo-talep" variant="accent" size="lg">
                Demo Talep Et
              </Button>
              <Button to="/iletisim" variant="outlineLight" size="lg">
                İletişime Geç
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
