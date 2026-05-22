import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { OverviewDailyChart } from '@/admin/v2/overviewCharts';
import {
  dashboardPeriodCompare,
  fetchAdminDashboardStats,
  fetchCampaignStats,
  formatDashboardCurrency,
  formatDashboardNumber,
  metricChangePct,
  type AdminDashboardStats,
  type CampaignStatRow,
} from '@/lib/adminAnalytics';
import type { ApiError } from '@/lib/apiClient';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#dbe4ea] bg-white shadow-[0_1px_3px_rgba(26,36,51,0.06)]">
      <header className="border-b border-[#e8eef2] bg-[#fafbfc] px-4 py-2.5">
        <h3 className="text-[14px] font-semibold text-[#1e2a3a]">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CompareStatCard({
  title,
  value,
  previousValue,
  icon: Icon,
  iconBg,
  formatter = formatDashboardNumber,
}: {
  title: string;
  value: number;
  previousValue: number;
  icon: LucideIcon;
  iconBg: string;
  formatter?: (n: number) => string;
}) {
  const change = metricChangePct(value, previousValue);
  const up = change >= 0;
  return (
    <div className="rounded-xl border border-[#dbe4ea] bg-white p-4">
      <div className="flex items-start justify-between">
        <span className={`rounded-lg p-2.5 text-white ${iconBg}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span
          className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${
            up ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <p className="mt-3 text-[12px] font-medium text-[#5c6b7a]">{title}</p>
      <p className="text-[22px] font-bold tabular-nums text-[#1e2a3a]">{formatter(value)}</p>
      <p className="mt-1 text-[11px] text-[#8a9aaa]">Önceki: {formatter(previousValue)}</p>
    </div>
  );
}

/** Eski panel dashboard + kampanya istatistikleri (website-backend analytics API) */
export function AdminBusinessAnalyticsPanel() {
  const { tokenPresent, revision } = useAdminToken();
  const [period, setPeriod] = useState('30');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        fetchAdminDashboardStats(period),
        fetchCampaignStats(),
      ]);
      setStats(s);
      setCampaigns(c.rows);
    } catch (err) {
      const apiErr = err as ApiError;
      setStats(null);
      setError(apiErr.message ?? 'İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (tokenPresent) void load();
    else {
      setStats(null);
      setCampaigns([]);
      setError(null);
    }
  }, [tokenPresent, revision, load]);

  const periodData = stats ? dashboardPeriodCompare(period, stats) : null;
  const current = periodData?.current;
  const previous = periodData?.previous;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#5c6b7a]">
          Ziyaret, demo talebi, kullanıcı, ödeme ve gelir — eski admin dashboard verisi.
        </p>
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium text-[#5c6b7a]">Periyot</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={!tokenPresent || loading}
            className="rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px]"
          >
            <option value="7">Son 7 gün</option>
            <option value="30">Son 30 gün</option>
            <option value="90">Son 90 gün</option>
            <option value="365">Son 1 yıl</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-8 text-[#5c6b7a]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Yükleniyor…
        </div>
      )}

      {stats && !loading && current && previous && periodData && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <CompareStatCard
              title="Sayfa görüntüleme"
              value={current.pageViews}
              previousValue={previous.pageViews}
              icon={Eye}
              iconBg="bg-blue-500"
            />
            <CompareStatCard
              title="Demo talepleri"
              value={current.demoRequests}
              previousValue={previous.demoRequests}
              icon={FileText}
              iconBg="bg-violet-500"
            />
            <CompareStatCard
              title="Yeni kullanıcılar"
              value={current.users}
              previousValue={previous.users}
              icon={Users}
              iconBg="bg-emerald-500"
            />
            <CompareStatCard
              title="Ödemeler"
              value={current.payments}
              previousValue={previous.payments}
              icon={TrendingUp}
              iconBg="bg-orange-500"
            />
            <CompareStatCard
              title="Gelir"
              value={current.revenue}
              previousValue={previous.revenue}
              icon={DollarSign}
              iconBg="bg-teal-600"
              formatter={formatDashboardCurrency}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Sayfa görüntülemeleri">
              <OverviewDailyChart data={stats.daily} dataKey="pageViews" color="#3b82f6" />
            </Panel>
            <Panel title="Demo talepleri">
              <OverviewDailyChart data={stats.daily} dataKey="demoRequests" color="#a855f7" />
            </Panel>
            <Panel title="Yeni kullanıcılar">
              <OverviewDailyChart data={stats.daily} dataKey="users" color="#10b981" />
            </Panel>
            <Panel title="Gelir">
              <OverviewDailyChart
                data={stats.daily}
                dataKey="revenue"
                color="#0f766e"
                formatValue={(n) => formatDashboardCurrency(n)}
              />
            </Panel>
          </div>

          <Panel title="Kampanya / baro istatistikleri">
            {campaigns.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#8a9aaa]">Henüz veri yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#dbe4ea] text-[11px] font-semibold uppercase text-[#8a9aaa]">
                      <th className="px-3 py-2">Kampanya</th>
                      <th className="px-3 py-2 text-center">Limit</th>
                      <th className="px-3 py-2 text-center">Kullanım</th>
                      <th className="px-3 py-2 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((row) => {
                      const limitLabel =
                        row.usageLimit != null
                          ? `${row.usageCount}/${row.usageLimit}`
                          : '—';
                      return (
                        <tr key={row.id} className="border-b border-[#eef2f5]">
                          <td className="px-3 py-2.5 font-medium">{row.name}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums">{limitLabel}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums">
                            {formatDashboardNumber(row.usageCount)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[12px] text-[#5c6b7a]">
                            {row.isActive === false ? 'Pasif' : 'Aktif'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
