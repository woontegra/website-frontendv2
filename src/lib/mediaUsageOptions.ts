export type MediaUsageId =
  | 'general'
  | 'home-hero'
  | 'home-modules'
  | 'demo-hero'
  | 'pricing-hero'
  | 'contact-hero'
  | 'module-calc'
  | 'custom';

export type MediaUsageOption = {
  id: MediaUsageId;
  label: string;
  /** Sabit site alanı anahtarı; genel ve özel için null */
  assetKey: string | null;
};

export const MEDIA_USAGE_OPTIONS: MediaUsageOption[] = [
  { id: 'general', label: 'Genel medya / ürün görseli', assetKey: null },
  { id: 'home-hero', label: 'Ana sayfa hero görseli', assetKey: 'home.hero.image' },
  { id: 'home-modules', label: 'Ana sayfa modül görseli', assetKey: 'home.modules.image' },
  { id: 'demo-hero', label: 'Demo sayfası hero görseli', assetKey: 'demo.hero.image' },
  { id: 'pricing-hero', label: 'Fiyatlandırma sayfası görseli', assetKey: 'pricing.hero.image' },
  { id: 'contact-hero', label: 'İletişim sayfası görseli', assetKey: 'contact.hero.image' },
  { id: 'module-calc', label: 'Hesaplama sayfası görseli', assetKey: 'module.kidem-tazminati.hero.image' },
  { id: 'custom', label: 'Özel kullanım', assetKey: null },
];

function slugifyFileBase(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const ascii = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (ascii || 'gorsel').slice(0, 48);
}

/** Genel medya — benzersiz otomatik anahtar */
export function generateGeneralMediaAssetKey(fileName?: string): string {
  const slug = fileName ? slugifyFileBase(fileName) : 'gorsel';
  return `media.${slug}.${Date.now()}`;
}

export function resolveMediaAssetKey(
  usageId: MediaUsageId,
  options?: { customAssetKey?: string; fileName?: string },
): string {
  if (usageId === 'custom') {
    return (options?.customAssetKey ?? '').trim();
  }
  if (usageId === 'general') {
    return generateGeneralMediaAssetKey(options?.fileName);
  }
  const opt = MEDIA_USAGE_OPTIONS.find((o) => o.id === usageId);
  return opt?.assetKey ?? '';
}

export function inferMediaUsageId(assetKey: string): MediaUsageId {
  const match = MEDIA_USAGE_OPTIONS.find((o) => o.assetKey === assetKey);
  if (match) return match.id;
  if (assetKey.startsWith('media.')) return 'general';
  return 'custom';
}

export function mediaUsageLabelForAssetKey(assetKey: string): string {
  const match = MEDIA_USAGE_OPTIONS.find((o) => o.assetKey === assetKey);
  if (match) return match.label;
  if (assetKey.startsWith('media.')) return 'Genel medya / ürün görseli';
  return 'Özel kullanım';
}

export function previewMediaAssetKey(
  usageId: MediaUsageId,
  options?: { customAssetKey?: string; fileName?: string },
): string {
  if (usageId === 'general') {
    const slug = options?.fileName ? slugifyFileBase(options.fileName) : 'gorsel';
    return `media.${slug}.{zaman}`;
  }
  if (usageId === 'custom') {
    const key = (options?.customAssetKey ?? '').trim();
    return key || '(özel tanımlayıcı girin)';
  }
  return resolveMediaAssetKey(usageId, options);
}

export function formatMediaCreateError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('assetkey') &&
    (lower.includes('kullanılıyor') ||
      lower.includes('benzersiz') ||
      lower.includes('already') ||
      lower.includes('unique'))
  ) {
    return 'Bu kullanım alanı için zaten görsel var. Mevcut kaydı düzenleyin veya özel kullanım seçin.';
  }
  return message;
}
