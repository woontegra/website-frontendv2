/**
 * Tanıtım görselleri:
 * 1) Önce admin/API (imageUrl, /uploads/...)
 * 2) Boş veya 404 olursa public/images yedeği (deploy-safe)
 */

import { parseProductImageUrls, resolvePublicAssetUrl } from './resolvePublicAssetUrl';

export interface HeroMarketingSlide {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** onError için statik PNG yedek */
  fallbackImage: string;
}

export const HERO_MARKETING_SLIDES: HeroMarketingSlide[] = [
  {
    title: 'Boş Form',
    description: 'Hesaplama formunu adım adım doldurun.',
    image: '/images/hero-bos-form.png',
    imageAlt: 'Bilirkişi hesaplama — boş form ekranı',
    fallbackImage: '/images/hero-bos-form.png',
  },
  {
    title: 'Doldurulmuş Form',
    description: 'Tüm alanları doldurduktan sonra hesaplamaya geçin.',
    image: '/images/hero-doldurulmus-form.png',
    imageAlt: 'Bilirkişi hesaplama — yönetim paneli',
    fallbackImage: '/images/hero-doldurulmus-form.png',
  },
  {
    title: 'Önizleme / Rapor',
    description: 'Sonucu önizleyin, rapor çıktısını kontrol edin.',
    image: '/images/hero-onizleme-rapor.png',
    imageAlt: 'Bilirkişi hesaplama — hesaplama ve rapor ekranı',
    fallbackImage: '/images/hero-onizleme-rapor.png',
  },
];

/** public/images altında mevcut hero görselleri (yedek galeri) */
export const SATIN_AL_STATIC_IMAGES: string[] = [
  '/images/hero-bos-form.png',
  '/images/hero-doldurulmus-form.png',
  '/images/hero-onizleme-rapor.png',
];

const HERO_BY_TITLE = new Map(
  HERO_MARKETING_SLIDES.map((s) => [s.title.trim().toLowerCase(), s])
);

export function matchHeroStaticSlide(title: string): HeroMarketingSlide {
  const key = title.trim().toLowerCase();
  if (HERO_BY_TITLE.has(key)) return HERO_BY_TITLE.get(key)!;
  if (key.includes('önizleme') || key.includes('onizleme') || key.includes('rapor')) {
    return HERO_BY_TITLE.get('önizleme / rapor')!;
  }
  if (key.includes('doldurulmuş') || key.includes('doldurulmus')) {
    return HERO_BY_TITLE.get('doldurulmuş form')!;
  }
  return HERO_MARKETING_SLIDES[0];
}

function pickItemImageUrl(item: {
  imageUrl?: string;
  image_url?: string;
  imageURL?: string;
}): string {
  const v = item.imageUrl ?? item.image_url ?? item.imageURL;
  return typeof v === 'string' ? v.trim() : '';
}

/** Hero: paneldeki imageUrl öncelikli */
export function buildHeroWorkflowItems(
  apiItems: Array<{
    title?: string;
    description?: string;
    imageUrl?: string;
    image_url?: string;
    imageURL?: string;
    imageAlt?: string;
  }>
): HeroMarketingSlide[] {
  if (!apiItems.length) return [...HERO_MARKETING_SLIDES];

  return apiItems
    .filter((item) => item?.title?.trim())
    .map((item) => {
      const title = item.title!.trim();
      const staticSlide = matchHeroStaticSlide(title);
      const rawUrl = pickItemImageUrl(item);
      const resolved = rawUrl ? resolvePublicAssetUrl(rawUrl) : '';

      return {
        title,
        description: (item.description || '').trim() || staticSlide.description,
        image: resolved || staticSlide.image,
        imageAlt: (item.imageAlt || '').trim() || staticSlide.imageAlt,
        fallbackImage: staticSlide.fallbackImage,
      };
    });
}

function isLikelyBrokenLocalPlaceholder(url: string): boolean {
  return /^\/images\/product-\d+/i.test(url);
}

/** Satın Al: ürün imageUrl (admin) öncelikli — Cloudinary https ve /uploads */
export function getSatinAlDisplayImages(imageUrl?: string | null): string[] {
  const fromAdmin = parseProductImageUrls(imageUrl)
    .filter((u) => !isLikelyBrokenLocalPlaceholder(u))
    .map((u) => resolvePublicAssetUrl(u))
    .filter((u) => Boolean(u && (/^https?:\/\//i.test(u) || u.startsWith('/'))));

  if (fromAdmin.length > 0) return fromAdmin;
  return SATIN_AL_STATIC_IMAGES.map((u) => resolvePublicAssetUrl(u)).filter(Boolean);
}

export function getSatinAlStaticFallback(index: number): string {
  return SATIN_AL_STATIC_IMAGES[index % SATIN_AL_STATIC_IMAGES.length];
}
