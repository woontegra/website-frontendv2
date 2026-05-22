import type { ContentBundleView } from '@/lib/contentBundle';
import { fetchPageBySlug } from '@/lib/storeApi';
import { resolveLegalContact } from './contact';
import { getLegalHtmlByApiSlug, getLegalTitleByApiSlug } from './getLegalPageHtml';
import { isUsableApiLegalContent } from './quality';

/** Satın alma modalı ve API slug’ları için ortak yükleme */
export async function loadLegalContentByApiSlug(
  slug: string,
  content: ContentBundleView,
): Promise<{ title: string; content: string }> {
  const contact = await resolveLegalContact(content);
  const fallbackHtml = getLegalHtmlByApiSlug(slug, contact);
  const fallbackTitle = getLegalTitleByApiSlug(slug) ?? 'Yasal metin';

  const page = await fetchPageBySlug(slug);
  if (page?.content && isUsableApiLegalContent(page.content)) {
    return {
      title: page.title?.trim() || fallbackTitle,
      content: page.content,
    };
  }

  return {
    title: fallbackTitle,
    content: fallbackHtml ?? '<p>İçerik yüklenemedi.</p>',
  };
}
