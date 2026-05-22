import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

type Envelope<T> = { success?: boolean; data?: T; message?: string };

export type FaqCategoryDto = {
  id: number;
  code: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
};

export type FaqItemDto = {
  id: number;
  categoryId: number;
  code: string;
  question: string;
  answer: string;
  sortOrder: number;
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

export async function createAdminV2FaqCategory(body: {
  title: string;
  code?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<FaqCategoryDto> {
  const json = await apiRequest<Envelope<FaqCategoryDto>>('/api/admin/v2/faq/categories', {
    method: 'POST',
    headers: authHeaders(),
    body: {
      title: body.title.trim(),
      ...(body.code?.trim() ? { code: body.code.trim() } : {}),
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive !== false,
    },
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Kategori oluşturulamadı');
  }
  return json.data;
}

export async function createAdminV2FaqItem(body: {
  categoryId: number;
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<FaqItemDto> {
  const json = await apiRequest<Envelope<FaqItemDto>>('/api/admin/v2/faq/items', {
    method: 'POST',
    headers: authHeaders(),
    body: {
      categoryId: body.categoryId,
      question: body.question.trim(),
      answer: body.answer,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive !== false,
    },
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Soru oluşturulamadı');
  }
  return json.data;
}
