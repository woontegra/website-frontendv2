import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import type { ApiError } from '@/lib/apiClient';

export type DashboardMetricBlock = {
  pageViews: number;
  demoRequests: number;
  users: number;
  payments: number;
  revenue: number;
};

export type DashboardDailyPoint = DashboardMetricBlock & {
  date: string;
};

export type AdminDashboardStats = {
  total: DashboardMetricBlock;
  today: DashboardMetricBlock;
  yesterday: DashboardMetricBlock;
  thisMonth: DashboardMetricBlock;
  lastMonth: DashboardMetricBlock;
  thisYear: DashboardMetricBlock;
  lastYear: DashboardMetricBlock;
  daily: DashboardDailyPoint[];
  /** Benzersiz IP; son 5 dk page_views — heartbeat değil */
  activeLast5Min?: number;
  activeLast5MinNote?: string | null;
};

type StatsResponse = {
  success?: boolean;
  data?: AdminDashboardStats;
};

export type CampaignStatRow = {
  id: string;
  name: string;
  usageCount: number;
  usageLimit?: number | null;
  isActive?: boolean;
};

export type CampaignStatsSummary = {
  totalCount: number;
  activeCount: number;
  totalUsage: number;
};

export type CampaignStatsPayload = {
  rows: CampaignStatRow[];
  summary: CampaignStatsSummary;
};

export async function fetchAdminDashboardStats(
  periodDays: string,
): Promise<AdminDashboardStats> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token gerekli. Alttan token kaydedin.',
    };
    throw error;
  }

  const res = await apiRequest<StatsResponse>(
    `/api/admin/analytics/stats?period=${encodeURIComponent(periodDays)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.data) {
    console.error('[adminAnalytics] GET /api/admin/analytics/stats: data boş', res);
    throw { status: 500, message: 'Analytics yanıtı boş' } as ApiError;
  }
  return res.data;
}

function buildCampaignSummary(rows: CampaignStatRow[]): CampaignStatsSummary {
  const now = Date.now();
  let activeCount = 0;
  let totalUsage = 0;
  for (const row of rows) {
    totalUsage += Number(row.usageCount) || 0;
    if (row.isActive !== false) activeCount += 1;
  }
  return {
    totalCount: rows.length,
    activeCount,
    totalUsage,
  };
}

export async function fetchCampaignStats(): Promise<CampaignStatsPayload> {
  const token = getAdminToken();
  if (!token) {
    console.warn('[adminAnalytics] fetchCampaignStats: admin token yok');
    return { rows: [], summary: { totalCount: 0, activeCount: 0, totalUsage: 0 } };
  }

  const res = await apiRequest<{
    success?: boolean;
    data?: CampaignStatRow[];
    summary?: CampaignStatsSummary;
  }>('/api/campaigns/stats', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!Array.isArray(res.data)) {
    console.error('[adminAnalytics] GET /api/campaigns/stats: data dizisi yok', res);
    throw { status: 500, message: 'Kampanya istatistik yanıtı geçersiz' } as ApiError;
  }

  const summary =
    res.summary &&
    typeof res.summary.totalCount === 'number' &&
    typeof res.summary.activeCount === 'number' &&
    typeof res.summary.totalUsage === 'number'
      ? res.summary
      : buildCampaignSummary(res.data);

  return { rows: res.data, summary };
}

export function formatDashboardNumber(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(n);
}

/** Backend tutarı kuruş cinsinden döner */
export function formatDashboardCurrency(kurus: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(kurus / 100);
}

export function dashboardPeriodCompare(
  period: string,
  stats: AdminDashboardStats,
): {
  current: DashboardMetricBlock;
  previous: DashboardMetricBlock;
  label: string;
  previousLabel: string;
} {
  const days = parseInt(period, 10);
  if (days <= 7) {
    return {
      current: stats.today,
      previous: stats.yesterday,
      label: 'Bugün',
      previousLabel: 'Dün',
    };
  }
  if (days <= 30) {
    return {
      current: stats.thisMonth,
      previous: stats.lastMonth,
      label: 'Bu Ay',
      previousLabel: 'Geçen Ay',
    };
  }
  return {
    current: stats.thisYear,
    previous: stats.lastYear,
    label: 'Bu Yıl',
    previousLabel: 'Geçen Yıl',
  };
}

export function metricChangePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
