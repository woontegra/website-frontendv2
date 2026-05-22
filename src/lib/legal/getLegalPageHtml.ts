import type { LegalPageKey } from '@/data/legalPages';
import type { LegalContactInfo } from './types';
import {
  cerezPolitikasiHtml,
  gizlilikPolitikasiHtml,
  kullanimSartlariHtml,
  kvkkAydinlatmaHtml,
  mesafeliSatisHtml,
  onBilgilendirmeHtml,
} from './legalBodies';

export function getLegalPageHtml(pageKey: LegalPageKey, contact: LegalContactInfo): string {
  switch (pageKey) {
    case 'gizlilik-politikasi':
      return gizlilikPolitikasiHtml(contact);
    case 'cerez-politikasi':
      return cerezPolitikasiHtml(contact);
    case 'kvkk-aydinlatma-metni':
      return kvkkAydinlatmaHtml(contact);
    case 'kullanim-sartlari':
      return kullanimSartlariHtml(contact);
    case 'on-bilgilendirme-formu':
      return onBilgilendirmeHtml(contact);
    case 'mesafeli-satis-sozlesmesi':
      return mesafeliSatisHtml(contact);
    default:
      return '';
  }
}

/** Satın alma modalı — backend slug eşlemesi */
export function getLegalHtmlByApiSlug(slug: string, contact: LegalContactInfo): string | null {
  const map: Record<string, LegalPageKey> = {
    'on-bilgilendirme': 'on-bilgilendirme-formu',
    'on-bilgilendirme-formu': 'on-bilgilendirme-formu',
    'mesafeli-satis-sozlesmesi': 'mesafeli-satis-sozlesmesi',
  };
  const key = map[slug];
  return key ? getLegalPageHtml(key, contact) : null;
}

export function getLegalTitleByApiSlug(slug: string): string | null {
  const titles: Record<string, string> = {
    'on-bilgilendirme': 'Ön Bilgilendirme Formu',
    'on-bilgilendirme-formu': 'Ön Bilgilendirme Formu',
    'mesafeli-satis-sozlesmesi': 'Mesafeli Satış Sözleşmesi',
  };
  return titles[slug] ?? null;
}
