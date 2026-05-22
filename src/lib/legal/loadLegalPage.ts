import type { LegalPageKey } from '@/data/legalPages';
import { LEGAL_PAGE_BY_KEY } from '@/data/legalPages';
import type { ContentBundleView } from '@/lib/contentBundle';
import { fetchPageBySlug } from '@/lib/storeApi';
import { resolveLegalContact } from './contact';
import { getLegalPageHtml } from './getLegalPageHtml';
import { isUsableApiLegalContent } from './quality';

export async function loadLegalPageContent(
  pageKey: LegalPageKey,
  content: ContentBundleView,
): Promise<{ title: string; html: string }> {
  const def = LEGAL_PAGE_BY_KEY[pageKey];
  const contact = await resolveLegalContact(content);
  const fallbackHtml = getLegalPageHtml(pageKey, contact);

  for (const slug of def.apiSlugs) {
    const page = await fetchPageBySlug(slug);
    if (page?.content && isUsableApiLegalContent(page.content)) {
      return {
        title: page.title?.trim() || def.title,
        html: page.content,
      };
    }
  }

  return { title: def.title, html: fallbackHtml };
}
