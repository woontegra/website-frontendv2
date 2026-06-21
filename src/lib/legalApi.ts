import { apiRequest } from '@/lib/apiClient';

export type LegalTemplateMeta = {
  type: string;
  title: string;
  version: string;
  label: string;
};

export type LegalPreview = {
  type: string;
  title: string;
  version: string;
  content: string;
  contentHtml: string;
};

type ApiEnvelope<T> = { success?: boolean; data?: T; message?: string };

export async function fetchActiveLegalTemplates(): Promise<LegalTemplateMeta[]> {
  const json = await apiRequest<ApiEnvelope<LegalTemplateMeta[]>>('/api/legal/templates');
  return json.data ?? [];
}

export async function fetchLegalTemplatePreview(
  type: string,
  opts?: { productType?: 'monthly' | 'annual'; amountKurus?: number },
): Promise<LegalPreview | null> {
  const params = new URLSearchParams();
  if (opts?.productType) params.set('productType', opts.productType);
  if (opts?.amountKurus != null && opts.amountKurus > 0) {
    params.set('amountKurus', String(opts.amountKurus));
  }
  const qs = params.toString();
  const path = `/api/legal/templates/${type}/preview${qs ? `?${qs}` : ''}`;
  const json = await apiRequest<ApiEnvelope<LegalPreview>>(path);
  return json.data ?? null;
}

export const LEGAL_CONSENT_LABELS: Record<string, string> = {
  PRE_INFORMATION: 'Ön Bilgilendirme Formu',
  DISTANCE_SALE: 'Mesafeli Satış Sözleşmesi',
  SUBSCRIPTION_AGREEMENT: 'Bilirkişi Hesap Abonelik ve Kullanım Sözleşmesi',
  KVKK: 'KVKK Aydınlatma Metni',
  WITHDRAWAL_EXCEPTION:
    'Aboneliğimin ödeme sonrası hemen aktif edilmesini, dijital hizmetin ifasına başlanmasını ve bu kapsamda cayma hakkı istisnası hakkında bilgilendirildiğimi kabul ediyorum',
};

export const REQUIRED_LEGAL_TYPES = [
  'PRE_INFORMATION',
  'DISTANCE_SALE',
  'SUBSCRIPTION_AGREEMENT',
  'KVKK',
  'WITHDRAWAL_EXCEPTION',
] as const;
