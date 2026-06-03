import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import { config } from '@/lib/config';
import { LEGAL_PAGE_BY_KEY, type LegalPageKey } from '@/data/legalPages';
import { loadLegalPageContent } from '@/lib/legal/loadLegalPage';
import { usePageSeo } from '@/lib/pageSeo';

type Props = { pageKey: LegalPageKey };

export default function LegalDocumentPage({ pageKey }: Props) {
  const def = LEGAL_PAGE_BY_KEY[pageKey];
  const { content } = useContentBundle();
  const [title, setTitle] = useState(def.title);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  usePageSeo(content, def.path, {
    title: `${def.title} | ${content.footer.siteName || config.siteName}`,
    description: def.description,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadLegalPageContent(pageKey, content).then((result) => {
      if (cancelled) return;
      setTitle(result.title);
      setHtml(result.html);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pageKey, content]);

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-14 text-white sm:py-16">
        <div className="legal-page__shell">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfa
          </Link>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <FileText className="h-3.5 w-3.5" />
            Yasal
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem]">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">{def.description}</p>
        </div>
      </section>

      <section className="legal-page__main">
        <div className="legal-page__shell">
          <article className="legal-page__card">
            {loading ? (
              <p className="text-base text-slate-500">İçerik yükleniyor…</p>
            ) : (
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{ __html: html ?? '' }}
              />
            )}
            <p className="legal-page__footer-meta">
              Sayfa görüntüleme tarihi: {new Date().toLocaleDateString('tr-TR')}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
