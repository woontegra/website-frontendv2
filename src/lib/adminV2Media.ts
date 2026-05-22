import { apiRequest, resolveApiUrl, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import { formatMediaCreateError } from '@/lib/mediaUsageOptions';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export type MediaAssetDto = {
  id: number;
  assetKey: string;
  fileUrl: string;
  altText: string | null;
  mimeType: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Envelope<T> = { success?: boolean; data?: T; message?: string };

export const SUGGESTED_ASSET_KEYS = [
  'home.hero.image',
  'home.modules.image',
  'demo.hero.image',
  'pricing.hero.image',
  'contact.hero.image',
  'module.kidem-tazminati.hero.image',
] as const;

export function guessMimeTypeFromUrl(url: string): string {
  const path = url.split('?')[0].split('#')[0];
  const ext = path.includes('.') ? path.split('.').pop()?.toLowerCase() : '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token gerekli.',
    };
    throw error;
  }
  return { Authorization: `Bearer ${token}` };
}

export async function createAdminV2Media(body: {
  assetKey: string;
  fileUrl: string;
  altText?: string;
  mimeType?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<MediaAssetDto> {
  const mimeType =
    body.mimeType?.trim() || guessMimeTypeFromUrl(body.fileUrl);
  const json = await apiRequest<Envelope<MediaAssetDto>>('/api/admin/v2/media', {
    method: 'POST',
    headers: authHeaders(),
    body: {
      assetKey: body.assetKey.trim(),
      fileUrl: body.fileUrl.trim(),
      altText: body.altText?.trim() || undefined,
      mimeType,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive !== false,
    },
  });
  if (!json.success || !json.data) {
    throw new Error(formatMediaCreateError(json.message ?? 'Medya kaydı oluşturulamadı'));
  }
  return json.data;
}

export async function updateAdminV2Media(
  id: number,
  body: {
    fileUrl: string;
    altText?: string;
    mimeType?: string;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<MediaAssetDto> {
  const mimeType = body.mimeType?.trim() || guessMimeTypeFromUrl(body.fileUrl);
  const json = await apiRequest<Envelope<MediaAssetDto>>(
    `/api/admin/v2/media/${encodeURIComponent(String(id))}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: {
        fileUrl: body.fileUrl.trim(),
        altText: body.altText ?? '',
        mimeType,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Medya kaydı güncellenemedi');
  }
  return json.data;
}

export function shortenUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 3)}…`;
}

export function validateMediaUploadFile(file: File): string | null {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const extOk = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext ?? '');
    if (!extOk) {
      return 'Yalnızca JPEG, PNG, WEBP veya SVG dosyaları yüklenebilir.';
    }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Dosya boyutu en fazla 5 MB olabilir.';
  }
  return null;
}

/** Cloudinary upload yanıtı → admin medya satırı */
export function mediaDtoToAdminRow(
  dto: MediaAssetDto,
  title?: string | null,
): {
  id: string;
  assetKey: string;
  fileUrl: string | null;
  altText: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  title: string | null;
} {
  return {
    id: String(dto.id),
    assetKey: dto.assetKey,
    fileUrl: dto.fileUrl?.trim() || null,
    altText: dto.altText,
    mimeType: dto.mimeType,
    width: null,
    height: null,
    sortOrder: dto.sortOrder ?? 0,
    title: title?.trim() || dto.altText?.trim() || null,
  };
}

export async function uploadAdminV2Media(body: {
  file: File;
  assetKey: string;
  altText?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<MediaAssetDto> {
  const fileError = validateMediaUploadFile(body.file);
  if (fileError) throw new Error(fileError);

  const token = getAdminToken();
  if (!token) {
    const error: ApiError = { status: 401, message: 'Admin token gerekli.' };
    throw error;
  }

  const fd = new FormData();
  fd.append('file', body.file);
  fd.append('assetKey', body.assetKey.trim());
  if (body.altText?.trim()) fd.append('altText', body.altText.trim());
  fd.append('sortOrder', String(body.sortOrder ?? 0));
  fd.append('isActive', body.isActive !== false ? 'true' : 'false');

  const url = resolveApiUrl('/api/admin/v2/media/upload');
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Yükleme isteği başarısız: ${detail}`);
  }

  const text = await response.text();
  type UploadResponse = { success?: boolean; data?: MediaAssetDto; message?: string };
  let data: UploadResponse | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as UploadResponse;
    } catch {
      /* ignore */
    }
  }

  if (!response.ok) {
    throw new Error(formatMediaCreateError(data?.message ?? `Yükleme başarısız (${response.status})`));
  }
  if (!data?.success || !data.data) {
    throw new Error(formatMediaCreateError(data?.message ?? 'Medya yüklemesi tamamlanamadı'));
  }
  return data.data;
}

export type CloudinarySyncResult = {
  cloudinaryCount: number;
  created: number;
  skipped: number;
  syncedUrls: number;
  heroAttached: number;
  includeAll: boolean;
};

/** Cloudinary'deki görselleri veritabanına aktarır; isteğe bağlı hero carousel'e bağlar. */
export async function syncAdminV2MediaFromCloudinary(options?: {
  includeAll?: boolean;
  attachToHero?: boolean;
  maxHeroSlides?: number;
}): Promise<CloudinarySyncResult> {
  const json = await apiRequest<Envelope<CloudinarySyncResult>>(
    '/api/admin/v2/media/sync-cloudinary',
    {
      method: 'POST',
      headers: authHeaders(),
      body: {
        includeAll: options?.includeAll === true,
        attachToHero: options?.attachToHero === true,
        maxHeroSlides: options?.maxHeroSlides,
      },
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Cloudinary senkronizasyonu başarısız');
  }
  return json.data;
}
