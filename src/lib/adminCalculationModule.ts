import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import { ADMIN_V2_PATCH_ROUTES } from '@/lib/adminV2Patch';
import type { ModuleLandingContent } from '@/lib/calculationLandingContent';

export type PatchCalculationModuleBody = {
  cardTitle: string;
  cardDescription: string;
  landingTitle: string;
  landingDescription: string;
  landingEyebrow: string;
  benefits: string[];
  landingContent: ModuleLandingContent | null;
  ctaText: string;
  slug: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
};

export type PatchCalculationModuleResult = {
  id: number;
  code: string;
  slug: string;
  cardTitle: string;
  cardDescription: string | null;
  landingTitle: string | null;
  landingDescription: string | null;
  landingEyebrow: string | null;
  landingContent: ModuleLandingContent | null;
  benefits: string[];
  ctaText: string | null;
  iconName: string | null;
  sortOrder: number;
  isActive: boolean;
};

export async function patchAdminV2CalculationModule(
  id: string,
  body: PatchCalculationModuleBody,
): Promise<{ data: PatchCalculationModuleResult }> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
    };
    throw error;
  }

  return apiRequest<{ success: boolean; data: PatchCalculationModuleResult }>(
    ADMIN_V2_PATCH_ROUTES.module(id),
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        cardTitle: body.cardTitle.trim(),
        cardDescription: body.cardDescription,
        landingTitle: body.landingTitle.trim(),
        landingDescription: body.landingDescription,
        landingEyebrow: body.landingEyebrow.trim(),
        benefits: body.benefits,
        landingContent: body.landingContent,
        ctaText: body.ctaText.trim(),
        slug: body.slug.trim(),
        iconName: body.iconName.trim(),
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    },
  );
}
