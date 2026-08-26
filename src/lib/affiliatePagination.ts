export const AFFILIATE_TABLE_PAGE_SIZE = 10;

export type AffiliateListPagination = {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const emptyAffiliatePagination = (
  limit = AFFILIATE_TABLE_PAGE_SIZE,
): AffiliateListPagination => ({
  page: 1,
  limit,
  pageSize: limit,
  total: 0,
  totalPages: 1,
});

/** Normalize API pagination (limit and/or pageSize). */
export function normalizeAffiliatePagination(
  raw: Partial<AffiliateListPagination> | null | undefined,
  fallbackLimit = AFFILIATE_TABLE_PAGE_SIZE,
): AffiliateListPagination {
  const limit = Number(raw?.limit ?? raw?.pageSize ?? fallbackLimit) || fallbackLimit;
  const page = Number(raw?.page ?? 1) || 1;
  const total = Number(raw?.total ?? 0) || 0;
  const totalPages =
    Number(raw?.totalPages) || Math.max(1, Math.ceil(total / limit) || 1);
  return { page, limit, pageSize: limit, total, totalPages };
}
