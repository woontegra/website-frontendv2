import type { AdminMediaAssetRow } from '@/lib/adminContentBundle';

/** Homepage PATCH config alanlarına yazılacak değer (önce fileUrl, yoksa assetKey). */
export function mediaPickValue(asset: AdminMediaAssetRow): string {
  const url = asset.fileUrl?.trim();
  if (url) return url;
  return asset.assetKey;
}

export function resolveMediaPreviewSrc(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith('//')) return fileUrl;
  if (fileUrl.startsWith('/')) return `${window.location.origin}${fileUrl}`;
  return fileUrl;
}

export function canShowMediaImagePreview(asset: AdminMediaAssetRow): boolean {
  if (!asset.fileUrl) return false;
  if (asset.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(asset.fileUrl);
}

export function truncateMediaUrl(url: string, max = 42): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}
