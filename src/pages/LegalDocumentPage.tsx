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
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-12 text-white">
        <div className="container-page">
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
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">{def.description}</p>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <article className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md sm:p-10">
          {loading ? (
            <p className="text-sm text-slate-500">İçerik yükleniyor…</p>
          ) : (
            <div
              className="prose prose-slate max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-emerald-700"
              dangerouslySetInnerHTML={{ __html: html ?? '' }}
            />
          )}
          <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
          </p>
        </article>
      </section>
    </div>
  );
}
