import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Radio,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminTokenStatusCard } from '@/admin/v2/AdminTokenStatusCard';
import { OverviewDailyChart } from '@/admin/v2/overviewCharts';
import {
  fetchAdminDashboardStats,
  fetchCampaignStats,
  formatDashboardCurrency,
  formatDashboardNumber,
  metricChangePct,
  type AdminDashboardStats,
  type CampaignStatRow,
  type CampaignStatsSummary,
  type DashboardDailyPoint,
} from '@/lib/adminAnalytics';
import type { ApiError } from '@/lib/apiClient';

const CHART_PERIOD = '7';
type DailyMetricKey = 'pageViews' | 'demoRequests' | 'payments' | 'revenue';

function Panel({
  title,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-lg border border-[#dbe4ea] bg-white shadow-[0_1px_2px_rgba(26,36,51,0.05)] ${className}`}
    >
      <header className="border-b border-[#e8eef2] bg-[#fafbfc] px-3 py-2">
        <h3 className="text-[12px] font-semibold text-[#1e2a3a]">{title}</h3>
      </header>
      <div className={`flex flex-1 flex-col p-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

const metricCardShellClass =
  'flex h-[84px] flex-col justify-between rounded-lg border border-[#dbe4ea]/90 bg-gradient-to-br from-white to-[#f8fafb] px-3 py-2.5 shadow-[0_1px_3px_rgba(26,36,51,0.06)]';

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className={metricCardShellClass}>
      <div className="flex items-start gap-2">
        <span className={`shrink-0 rounded-md p-1.5 text-white shadow-sm ${accent}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 pt-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-[#8a9aaa]">
          {label}
        </p>
      </div>
      <div>
        <p className="text-[17px] font-semibold tabular-nums leading-none tracking-tight text-[#1e2a3a]">
          {value}
        </p>
        {hint && (
          <p className="mt-1 truncate text-[10px] leading-tight text-[#8a9aaa]" title={hint}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function ActiveLast5MinMetricCard({
  count,
  note,
}: {
  count: number;
  note?: string | null;
}) {
  const hint =
    note ??
    'Benzersiz IP (page_views, son 5 dk; tam canlı oturum değil)';
  return (
    <div className={metricCardShellClass}>
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-md bg-slate-500 p-1.5 text-white shadow-sm">
          <Radio className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 pt-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-[#8a9aaa]">
          Son 5 dk aktif
        </p>
      </div>
      <div>
        <p className="text-[17px] font-semibold tabular-nums leading-none tracking-tight text-[#1e2a3a]">
          {formatDashboardNumber(count)}
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-[#8a9aaa]" title={hint}>
          {hint}
        </p>
      </div>
    </div>
  );
}

function MiniStatRow({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-[#eef2f5] bg-[#fafbfc] px-2.5 py-2">
      <span className="text-[10px] text-[#5c6b7a]">{label}</span>
      <span className={`text-[11px] font-semibold tabular-nums ${empty ? 'text-[#8a9aaa]' : 'text-[#1e2a3a]'}`}>
        {value}
      </span>
    </div>
  );
}

function hasDailyMetric(daily: DashboardDailyPoint[], key: DailyMetricKey): boolean {
  return daily.length > 0 && daily.some((row) => (row[key] as number) > 0);
}

function sumDaily(daily: DashboardDailyPoint[], key: DailyMetricKey): number {
  return daily.reduce((acc, row) => acc + (row[key] as number), 0);
}

function SevenDaySummary({ daily }: { daily: DashboardDailyPoint[] }) {
  return (
    <dl className="space-y-2">
      <MiniStatRow label="Demo (7 gün)" value={formatDashboardNumber(sumDaily(daily, 'demoRequests'))} />
      <MiniStatRow label="Görüntüleme" value={formatDashboardNumber(sumDaily(daily, 'pageViews'))} />
      <MiniStatRow label="Ödeme" value={formatDashboardNumber(sumDaily(daily, 'payments'))} />
      <MiniStatRow label="Gelir" value={formatDashboardCurrency(sumDaily(daily, 'revenue'))} />
    </dl>
  );
}

function CampaignBlock({
  campaigns,
  summary,
}: {
  campaigns: CampaignStatRow[];
  summary: CampaignStatsSummary;
}) {
  if (summary.totalCount === 0) {
    return (
      <p className="rounded-md border border-dashed border-[#dbe4ea] bg-[#fafbfc] px-2 py-2 text-center text-[10px] text-[#8a9aaa]">
        Kampanya verisi yok
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <MiniStatRow
        label="Toplam kampanya"
        value={formatDashboardNumber(summary.totalCount)}
      />
      <MiniStatRow
        label="Aktif kampanya"
        value={formatDashboardNumber(summary.activeCount)}
      />
      <MiniStatRow
        label="Toplam kullanım"
        value={formatDashboardNumber(summary.totalUsage)}
      />
    <div className="min-h-[7.5rem] flex-1 overflow-y-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-[#eef2f5] text-[9px] font-semibold uppercase text-[#8a9aaa]">
            <th className="py-1 pr-1.5">Kampanya</th>
            <th className="px-1 py-1 text-center">Kull.</th>
            <th className="py-1 pl-1.5 text-center">Limit</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.slice(0, 5).map((row) => {
            const limitLabel =
              row.usageLimit != null
                ? `${row.usageCount}/${row.usageLimit}`
                : '—';
            return (
              <tr key={row.id} className="border-b border-[#f4f6f8]">
                <td className="max-w-[100px] truncate py-1 pr-1.5 font-medium text-[#1e2a3a]" title={row.name}>
                  {row.name}
                </td>
                <td className="px-1 py-1 text-center tabular-nums text-[#5c6b7a]">
                  {row.usageCount}
                </td>
                <td className="py-1 pl-1.5 text-center text-[10px] text-[#5c6b7a]">{limitLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

export function AdminV2OverviewPage() {
  const { tokenPresent, revision } = useAdminToken();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStatRow[]>([]);
  const [campaignSummary, setCampaignSummary] = useState<CampaignStatsSummary>({
    totalCount: 0,
    activeCount: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignWarning, setCampaignWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCampaignWarning(null);
    try {
      const [statsResult, campaignResult] = await Promise.allSettled([
        fetchAdminDashboardStats(CHART_PERIOD),
        fetchCampaignStats(),
      ]);

      if (statsResult.status === 'rejected') {
        const apiErr = statsResult.reason as ApiError;
        console.error('[AdminV2Overview] analytics/stats:', apiErr);
        setStats(null);
        setCampaigns([]);
        setError(apiErr.message ?? 'Dashboard verileri yüklenemedi');
        return;
      }

      setStats(statsResult.value);

      if (campaignResult.status === 'fulfilled') {
        setCampaigns(campaignResult.value.rows);
        setCampaignSummary(campaignResult.value.summary);
      } else {
        const apiErr = campaignResult.reason as ApiError;
        console.error('[AdminV2Overview] campaigns/stats:', apiErr);
        setCampaigns([]);
        setCampaignSummary({ totalCount: 0, activeCount: 0, totalUsage: 0 });
        setCampaignWarning(
          apiErr.message ?? 'Kampanya istatistikleri yüklenemedi (analytics verisi yüklendi)',
        );
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.error('[AdminV2Overview] load:', apiErr);
      setStats(null);
      setCampaigns([]);
      setCampaignSummary({ totalCount: 0, activeCount: 0, totalUsage: 0 });
      setError(apiErr.message ?? 'Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenPresent) void load();
    else {
      setStats(null);
      setCampaigns([]);
      setCampaignSummary({ totalCount: 0, activeCount: 0, totalUsage: 0 });
      setError(null);
    }
  }, [tokenPresent, revision, load]);

  const last7PageViews = useMemo(
    () => (stats ? sumDaily(stats.daily, 'pageViews') : 0),
    [stats],
  );

  const pageViewTrend = useMemo(() => {
    if (!stats) return null;
    const pct = metricChangePct(stats.today.pageViews, stats.yesterday.pageViews);
    return { pct, up: pct >= 0 };
  }, [stats]);

  const campaignCardHint = useMemo(() => {
    if (campaignSummary.totalCount === 0) return undefined;
    return `${formatDashboardNumber(campaignSummary.totalUsage)} toplam kullanım · ${formatDashboardNumber(campaignSummary.totalCount)} kayıt`;
  }, [campaignSummary]);

  const demoHasChart = stats ? hasDailyMetric(stats.daily, 'demoRequests') : false;

  return (
    <div className="w-full min-w-0 space-y-3 pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[18px] font-semibold text-[#1e2a3a]">Genel Bakış</h1>
          <p className="text-[12px] text-[#5c6b7a]">Son 7 gün — trafik, demo ve gelir</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={!tokenPresent || loading}
          className="rounded-md border border-[#dbe4ea] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1e2a3a] hover:bg-[#f7faf9] disabled:opacity-50"
        >
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
          Metrikler için{' '}
          <a href="/admin/v2/login" className="font-semibold underline">
            giriş
          </a>{' '}
          yapın.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[12px] text-red-800">
          {error}
        </p>
      )}

      {campaignWarning && !error && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
          {campaignWarning}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 text-[12px] text-[#5c6b7a]">
          <Loader2 className="h-4 w-4 animate-spin text-[#0f5c56]" />
          Yükleniyor…
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <MetricCard
              label="Bugün görüntüleme"
              value={formatDashboardNumber(stats.today.pageViews)}
              hint={
                pageViewTrend
                  ? `${pageViewTrend.up ? '+' : ''}${pageViewTrend.pct.toFixed(0)}% dün`
                  : undefined
              }
              icon={Eye}
              accent="bg-blue-500"
            />
            <MetricCard
              label="7 gün görüntüleme"
              value={formatDashboardNumber(last7PageViews)}
              icon={Activity}
              accent="bg-sky-600"
            />
            <MetricCard
              label="Bugün demo"
              value={formatDashboardNumber(stats.today.demoRequests)}
              icon={FileText}
              accent="bg-violet-500"
            />
            <MetricCard
              label="Toplam demo"
              value={formatDashboardNumber(stats.total.demoRequests)}
              icon={FileText}
              accent="bg-purple-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <MetricCard
              label="Toplam ödeme"
              value={formatDashboardNumber(stats.total.payments)}
              hint={`Bugün ${formatDashboardNumber(stats.today.payments)}`}
              icon={ShoppingCart}
              accent="bg-orange-500"
            />
            <MetricCard
              label="Toplam gelir"
              value={formatDashboardCurrency(stats.total.revenue)}
              hint={`Bugün ${formatDashboardCurrency(stats.today.revenue)}`}
              icon={DollarSign}
              accent="bg-teal-600"
            />
            <MetricCard
              label="Aktif kampanya"
              value={formatDashboardNumber(campaignSummary.activeCount)}
              hint={campaignCardHint}
              icon={TrendingUp}
              accent="bg-indigo-500"
            />
            <ActiveLast5MinMetricCard
              count={stats.activeLast5Min ?? 0}
              note={stats.activeLast5MinNote}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
            <div className="flex flex-col gap-3 lg:col-span-7">
              <Panel title="Son 7 gün demo trendi" className="min-h-[15.5rem]">
                {demoHasChart ? (
                  <OverviewDailyChart
                    data={stats.daily}
                    dataKey="demoRequests"
                    color="#a855f7"
                    height={220}
                    compact
                  />
                ) : (
                  <p className="flex flex-1 items-center justify-center py-6 text-center text-[11px] text-[#8a9aaa]">
                    Demo trendi için henüz veri yok
                  </p>
                )}
              </Panel>
              <div className="grid grid-cols-3 gap-2">
                <MiniStatRow
                  label="Görüntüleme"
                  value={formatDashboardNumber(sumDaily(stats.daily, 'pageViews'))}
                  empty={!hasDailyMetric(stats.daily, 'pageViews')}
                />
                <MiniStatRow
                  label="Ödeme"
                  value={formatDashboardNumber(sumDaily(stats.daily, 'payments'))}
                  empty={!hasDailyMetric(stats.daily, 'payments')}
                />
                <MiniStatRow
                  label="Gelir"
                  value={formatDashboardCurrency(sumDaily(stats.daily, 'revenue'))}
                  empty={!hasDailyMetric(stats.daily, 'revenue')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-5">
              <Panel title="7 günlük özet">
                <SevenDaySummary daily={stats.daily} />
              </Panel>
              <Panel title="Kampanya / dönüşüm" className="min-h-[14rem] flex-1">
                <CampaignBlock campaigns={campaigns} summary={campaignSummary} />
              </Panel>
            </div>
          </div>
        </div>
      )}

      <details className="mt-2 rounded-lg border border-[#dbe4ea] bg-[#fafbfc]">
        <summary className="cursor-pointer list-none px-2.5 py-1.5 text-[11px] font-medium text-[#5c6b7a] marker:content-none">
          API token (gelişmiş)
        </summary>
        <div className="border-t border-[#e8eef2] px-2 pb-2 pt-1">
          <AdminTokenStatusCard />
        </div>
      </details>
    </div>
  );
}
