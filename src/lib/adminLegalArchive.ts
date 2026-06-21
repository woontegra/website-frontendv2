import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

export type LegalArchiveListItem = {
  id: number;
  packageNo: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
  acceptedAt: string;
  status: string;
};

export type LegalArchiveDocument = {
  id: number;
  documentType: string;
  documentTitle: string;
  documentVersion: string;
  approvalCode: string;
  sha256Hash: string | null;
  pdfPath: string | null;
};

export type LegalArchiveDetail = LegalArchiveListItem & {
  customerPhone: string | null;
  customerAddress: string | null;
  customerIdentityNo: string | null;
  customerTaxNo: string | null;
  billingCycle: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  paymentReference: string | null;
  paymentProvider: string;
  archiveZipPath: string | null;
  acceptedVersionsJson: string | null;
  documents: LegalArchiveDocument[];
};

type ApiEnvelope<T> = { success?: boolean; data?: T; message?: string };

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token gerekli');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchLegalArchives(page = 1, limit = 20) {
  const json = await apiRequest<
    ApiEnvelope<{ items: LegalArchiveListItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>
  >(`/api/admin/legal-archives?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Arşiv yüklenemedi');
  return json.data;
}

export async function fetchLegalArchiveDetail(id: number): Promise<LegalArchiveDetail> {
  const json = await apiRequest<ApiEnvelope<LegalArchiveDetail>>(`/api/admin/legal-archives/${id}`, {
    headers: authHeaders(),
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Detay yüklenemedi');
  return json.data;
}

export function legalArchiveZipUrl(id: number): string {
  const token = getAdminToken();
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/admin/legal-archives/${id}/download-zip?token=${encodeURIComponent(token || '')}`;
}

export function legalDocumentDownloadUrl(docId: number): string {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/admin/legal-archives/documents/${docId}/download`;
}

export async function downloadLegalArchiveZip(id: number, filename: string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/admin/legal-archives/${id}/download-zip`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('ZIP indirilemedi');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadLegalDocument(docId: number, filename: string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/admin/legal-archives/documents/${docId}/download`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('PDF indirilemedi');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
