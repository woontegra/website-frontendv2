import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { HomepageSectionHeadingView } from '@/lib/contentBundle';

type FaqPreviewSectionProps = {
  heading: HomepageSectionHeadingView;
};

export function FaqPreviewSection({ heading }: FaqPreviewSectionProps) {
  const { content } = useContentBundle();
  const preview = content.faqPreview;

  return (
    <section className="border-t border-slate-200 bg-white py-16 lg:py-20">
      <div className="container-page">
        <SectionHeading
          theme="light"
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {preview.map((item) => (
            <article
              key={item.id}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-card transition-shadow hover:border-slate-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-4">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/sss"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Tüm soruları gör
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
