import { apiRequest, resolveApiUrl } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import type { ApiError } from '@/lib/apiClient';
import { uploadAdminV2Media, validateMediaUploadFile } from '@/lib/adminV2Media';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

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

export type GeneralSettings = {
  id?: number | null;
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  phone: string;
  address: string;
  logoUrl: string;
  faviconUrl: string;
};

export async function fetchGeneralSettings(): Promise<GeneralSettings> {
  const json = await apiRequest<ApiEnvelope<GeneralSettings>>('/api/admin/settings', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Genel ayarlar yüklenemedi');
  }
  return json.data;
}

export async function updateGeneralSettings(
  data: Partial<GeneralSettings>,
): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/admin/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: data,
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Genel ayarlar kaydedilemedi');
  }
}

export type PaymentSettings = {
  provider: string;
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  successUrl: string;
  failUrl: string;
  isActive: boolean;
  testMode: boolean;
};

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const json = await apiRequest<ApiEnvelope<PaymentSettings>>('/api/admin/payment-settings', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Ödeme ayarları yüklenemedi');
  }
  return json.data;
}

export async function updatePaymentSettings(data: PaymentSettings): Promise<void> {
  /** Backend: POST /api/admin/payment-settings (PUT tanımlı değil; eski panel de POST kullanır) */
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/admin/payment-settings', {
    method: 'POST',
    headers: authHeaders(),
    body: data,
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Ödeme ayarları kaydedilemedi');
  }
}

export type BankTransferSettings = {
  isActive: boolean;
  bankName: string;
  accountHolderName: string;
  iban: string;
  branchInfo: string;
  instructions: string;
};

export async function fetchBankTransferSettings(): Promise<BankTransferSettings> {
  const json = await apiRequest<ApiEnvelope<BankTransferSettings>>(
    '/api/admin/bank-transfer-settings',
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Havale/EFT ayarları yüklenemedi');
  }
  return json.data;
}

export async function updateBankTransferSettings(data: BankTransferSettings): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/admin/bank-transfer-settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: data,
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Havale/EFT ayarları kaydedilemedi');
  }
}

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
};

export async function fetchSmtpSettings(): Promise<SmtpSettings> {
  const json = await apiRequest<ApiEnvelope<SmtpSettings>>('/api/smtp', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'SMTP ayarları yüklenemedi');
  }
  return json.data;
}

export async function updateSmtpSettings(
  data: SmtpSettings & { password?: string },
): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/smtp', {
    method: 'PUT',
    headers: authHeaders(),
    body: data,
  });
  if (!json.success) {
    throw new Error(json.message ?? 'SMTP ayarları kaydedilemedi');
  }
}

export async function testSmtpSettings(testEmail: string): Promise<string> {
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/smtp/test', {
    method: 'POST',
    headers: authHeaders(),
    body: { testEmail },
  });
  if (!json.success) {
    throw new Error(json.message ?? 'SMTP testi başarısız');
  }
  return json.message ?? 'Test e-postası gönderildi';
}

export type TrackingSettings = {
  ga4MeasurementId: string;
  gtmId: string;
  metaPixelId: string;
  metaAccessToken: string;
  metaDatasetId: string;
  metaTestEventCode: string;
  enableMetaCapi: boolean;
  customHeadScript: string;
  customBodyScript: string;
};

export async function fetchTrackingSettings(): Promise<TrackingSettings> {
  const json = await apiRequest<ApiEnvelope<TrackingSettings>>('/api/admin/tracking', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Takip ayarları yüklenemedi');
  }
  return json.data;
}

export async function updateTrackingSettings(data: TrackingSettings): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>('/api/admin/tracking', {
    method: 'PUT',
    headers: authHeaders(),
    body: data,
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Takip ayarları kaydedilemedi');
  }
}

export type UploadAdminImageOptions = {
  /** Benzersiz medya anahtarı öneki (ör. purchase.gallery) */
  assetKeyPrefix?: string;
  altText?: string;
};

function isCloudinaryUnavailableMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('cloudinary') ||
    m.includes('yapılandırılmamış') ||
    m.includes('(503)')
  );
}

async function uploadAdminImageLegacyDisk(file: File): Promise<string> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token gerekli');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(resolveApiUrl('/api/admin/upload'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await res.text();
  let json: ApiEnvelope<{ url?: string }> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<{ url?: string }>;
    } catch {
      /* ignore */
    }
  }

  if (!res.ok || !json?.success || !json.data?.url) {
    throw new Error(
      json?.message ??
        (res.status === 401
          ? 'Oturum süresi dolmuş olabilir — panelden tekrar giriş yapın.'
          : `Dosya yüklenemedi (${res.status})`),
    );
  }
  return json.data.url;
}

/**
 * Admin görsel yükleme — önce Cloudinary (v2 medya), yoksa yerel /uploads.
 */
export async function uploadAdminImage(
  file: File,
  options?: UploadAdminImageOptions,
): Promise<string> {
  const fileError = validateMediaUploadFile(file);
  if (fileError) throw new Error(fileError);

  const prefix = (options?.assetKeyPrefix ?? 'cms.upload').replace(/[^a-zA-Z0-9._-]/g, '-');
  const assetKey = `${prefix}.${Date.now()}`;

  try {
    const dto = await uploadAdminV2Media({
      file,
      assetKey,
      altText: options?.altText?.trim() || file.name,
    });
    const url = dto.fileUrl?.trim();
    if (!url) throw new Error('Yükleme tamamlandı ancak görsel adresi alınamadı');
    return url;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Dosya yüklenemedi';
    if (!isCloudinaryUnavailableMessage(message)) {
      throw err instanceof Error ? err : new Error(message);
    }
    try {
      return await uploadAdminImageLegacyDisk(file);
    } catch (legacyErr) {
      const legacyMsg = legacyErr instanceof Error ? legacyErr.message : String(legacyErr);
      throw new Error(
        `${message} Alternatif olarak görseli Cloudinary’ye yükleyip “URL ekle” ile https:// adresini yapıştırın. (${legacyMsg})`,
      );
    }
  }
}
