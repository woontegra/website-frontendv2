import { apiRequest } from './apiClient';
import { getAdminToken } from './adminAuth';
import { normalizeContentPath } from './contentBundle';
import type { AdminV2ContentBundle } from './adminContentBundle';
import { adminV2Patch, ADMIN_V2_PATCH_ROUTES, parseAdminNumericId } from './adminV2Patch';

export type PageContentHeroDraft = {
  eyebrow: string;
  title: string;
  description: string;
};

export type AdminPageContentSnapshot = {
  id: number | null;
  eyebrow: string;
  title: string;
  description: string;
  subtitle: string;
};

function pageKeysMatch(stored: string, targetPath: string): boolean {
  return normalizeContentPath(stored) === normalizeContentPath(targetPath);
}

/** Admin bundle içinde sayfa bölümü (pageKey/sectionKey eşleşmesi, yol normalize). */
export function findAdminPageContent(
  bundle: AdminV2ContentBundle,
  pagePath: string,
  sectionKey: string,
): AdminPageContentSnapshot | null {
  const target = normalizeContentPath(pagePath);
  for (const item of bundle.pageContents ?? []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const pageKey = typeof row.pageKey === 'string' ? row.pageKey : '';
    const sec = typeof row.sectionKey === 'string' ? row.sectionKey : '';
    if (!pageKey || sec !== sectionKey || !pageKeysMatch(pageKey, target)) continue;
    const id = parseAdminNumericId(row.id != null ? String(row.id) : '');
    return {
      id,
      eyebrow: typeof row.eyebrow === 'string' ? row.eyebrow : '',
      title: typeof row.title === 'string' ? row.title : '',
      description: typeof row.description === 'string' ? row.description : '',
      subtitle: typeof row.subtitle === 'string' ? row.subtitle : '',
    };
  }
  return null;
}

export function heroDraftFromSnapshot(
  snapshot: AdminPageContentSnapshot | null,
  defaults: PageContentHeroDraft,
): PageContentHeroDraft {
  if (!snapshot) return { ...defaults };
  return {
    eyebrow: snapshot.eyebrow || defaults.eyebrow,
    title: snapshot.title || defaults.title,
    description: snapshot.description || defaults.description,
  };
}

export async function saveAdminPageContentSection(
  pagePath: string,
  sectionKey: string,
  fields: {
    eyebrow?: string;
    title?: string;
    description?: string;
    subtitle?: string;
  },
  existingId: number | null,
): Promise<void> {
  const pageKey = normalizeContentPath(pagePath);
  const body: Record<string, unknown> = { ...fields };

  if (existingId != null) {
    await adminV2Patch(ADMIN_V2_PATCH_ROUTES.pageContent(existingId), body);
    return;
  }

  const token = getAdminToken();
  if (!token) {
    throw new Error('Admin token bulunamadı.');
  }

  await apiRequest<{ success: boolean; data: unknown }>(ADMIN_V2_PATCH_ROUTES.pageContentUpsert(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: { pageKey, sectionKey, ...body },
  });
}
