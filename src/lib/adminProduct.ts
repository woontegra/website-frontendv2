import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import {
  parseProductImageUrls,
  serializeProductImageUrls,
} from '@/lib/resolvePublicAssetUrl';

type Envelope<T> = { success?: boolean; data?: T; message?: string };

export type AdminProductRecord = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  priceMonthly?: number | null;
  monthlyPrice?: number | null;
  imageUrl?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  features?: string | string[];
  targetAudience?: string | string[];
  trustInfo?: string | { securePayment?: string; invoiceReceipt?: string };
  isActive: boolean;
};

export type AdminProductForm = {
  name: string;
  priceAnnualTl: string;
  priceMonthlyTl: string;
  originalPriceTl: string;
  imageUrls: string[];
  shortDescription: string;
  longDescription: string;
  features: string[];
  targetAudience: string[];
  trustInfo: { securePayment: string; invoiceReceipt: string };
  isActive: boolean;
};

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = { status: 401, message: 'Admin token gerekli.' };
    throw error;
  }
  return { Authorization: `Bearer ${token}` };
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === 'string' && x.trim()).map((x) => x.trim());
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.trim()).map((x) => x.trim());
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseTrustInfo(value: unknown): { securePayment: string; invoiceReceipt: string } {
  let raw: Record<string, unknown> = {};
  if (typeof value === 'string' && value.trim()) {
    try {
      raw = JSON.parse(value) as Record<string, unknown>;
    } catch {
      raw = {};
    }
  } else if (value && typeof value === 'object') {
    raw = value as Record<string, unknown>;
  }
  return {
    securePayment: typeof raw.securePayment === 'string' ? raw.securePayment : '',
    invoiceReceipt: typeof raw.invoiceReceipt === 'string' ? raw.invoiceReceipt : '',
  };
}

export function kuruşToTlString(kurus: number | null | undefined): string {
  if (kurus == null || !Number.isFinite(kurus)) return '';
  return (kurus / 100).toFixed(2);
}

export function adminProductToForm(data: AdminProductRecord): AdminProductForm {
  const monthly = data.priceMonthly ?? data.monthlyPrice ?? null;
  return {
    name: data.name ?? '',
    priceAnnualTl: kuruşToTlString(data.price),
    priceMonthlyTl: kuruşToTlString(monthly),
    originalPriceTl: kuruşToTlString(data.originalPrice ?? null),
    imageUrls: parseProductImageUrls(data.imageUrl),
    shortDescription: data.shortDescription ?? '',
    longDescription: data.longDescription ?? '',
    features: parseJsonArray(data.features),
    targetAudience: parseJsonArray(data.targetAudience),
    trustInfo: parseTrustInfo(data.trustInfo),
    isActive: Boolean(data.isActive),
  };
}

export async function fetchAdminProduct(): Promise<AdminProductForm | null> {
  const json = await apiRequest<Envelope<AdminProductRecord>>('/api/admin/product', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) return null;
  return adminProductToForm(json.data);
}

export async function updateAdminProduct(form: AdminProductForm): Promise<void> {
  const priceAnnual = form.priceAnnualTl.trim();
  if (!form.name.trim()) throw new Error('Ürün adı zorunludur.');
  if (!priceAnnual) throw new Error('Yıllık fiyat zorunludur.');

  const json = await apiRequest<Envelope<AdminProductRecord>>('/api/admin/product', {
    method: 'POST',
    headers: authHeaders(),
    body: {
      name: form.name.trim(),
      price: priceAnnual,
      originalPrice: form.originalPriceTl.trim() || '',
      priceMonthly: form.priceMonthlyTl.trim() || '',
      imageUrl: serializeProductImageUrls(form.imageUrls),
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      features: JSON.stringify(form.features),
      targetAudience: JSON.stringify(form.targetAudience),
      trustInfo: JSON.stringify(form.trustInfo),
      isActive: form.isActive,
    },
  });

  if (!json.success) {
    throw new Error(json.message ?? 'Ürün kaydedilemedi');
  }
}
