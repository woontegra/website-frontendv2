import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchPartnerCommissions,
  fetchPartnerLinks,
  fetchPartnerMe,
  fetchPartnerPayouts,
  fetchPartnerSummary,
  formatPartnerTry,
  type PartnerCommission,
  type PartnerLink,
  type PartnerMe,
  type PartnerPayout,
  type PartnerSummary,
} from '@/lib/partnerAffiliate';
import {
  AFFILIATE_TABLE_PAGE_SIZE,
  emptyAffiliatePagination,
  normalizeAffiliatePagination,
  type AffiliateListPagination,
} from '@/lib/affiliatePagination';
import { CompactTablePagination } from '@/components/ui/CompactTablePagination';
import {
  affiliateCommissionStatusLabel,
  affiliatePackageLabel,
  affiliatePaymentMethodLabel,
  affiliatePayoutStatusLabel,
  affiliateSaleTypeLabel,
} from '@/lib/affiliateUiLabels';
import { showToast } from '@/components/ui/toast';

const metricCardClass =
  'rounded-lg border border-[#e4ebf0] bg-white px-3 py-2';

const sectionClass = 'rounded-xl border border-[#e4ebf0] bg-white px-3.5 py-3.5 sm:px-4 sm:py-4';

const smallBtnClass =
  'inline-flex items-center gap-1 rounded-md border border-[#e4ebf0] bg-white px-2 py-1 text-[11px] font-normal text-[#5c6b7a] hover:bg-[#f7faf9] hover:text-[#1e2a3a]';

const thClass =
  'whitespace-nowrap py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a9aaa]';
const tdClass = 'whitespace-nowrap py-2 pr-3 text-[13px] font-normal text-[#3d4d5c]';
const tdMoney = `${tdClass} text-right tabular-nums`;
const tdRate = `${tdClass} text-center tabular-nums`;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={metricCardClass}>
      <p className="text-[10px] font-normal tracking-wide text-[#9aa8b5]">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums tracking-tight text-[#2a3848]">
        {value}
      </p>
    </div>
  );
}

function badgeClass(tone: 'amber' | 'sky' | 'emerald' | 'red' | 'slate') {
  const tones = {
    amber: 'bg-amber-50/80 text-amber-800/90 ring-amber-100',
    sky: 'bg-sky-50/80 text-sky-800/90 ring-sky-100',
    emerald: 'bg-emerald-50/80 text-emerald-800/90 ring-emerald-100',
    red: 'bg-red-50/80 text-red-800/90 ring-red-100',
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
  };
  return `inline-flex shrink-0 items-center whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`;
}

function CommissionStatusBadge({ status }: { status: string }) {
  const label = affiliateCommissionStatusLabel(status);
  if (status === 'EARNED') return <span className={badgeClass('amber')}>{label}</span>;
  if (status === 'PARTIALLY_PAID') return <span className={badgeClass('sky')}>{label}</span>;
  if (status === 'PAID') return <span className={badgeClass('emerald')}>{label}</span>;
  if (status === 'REVERSED' || status === 'CANCELLED' || status === 'CANCELED') {
    return <span className={badgeClass('red')}>{label}</span>;
  }
  return <span className={badgeClass('slate')}>{label}</span>;
}

function PayoutStatusBadge({ status }: { status: string }) {
  const label = affiliatePayoutStatusLabel(status);
  if (status === 'PAID') return <span className={badgeClass('emerald')}>{label}</span>;
  return <span className={badgeClass('slate')}>{label}</span>;
}

export default function PartnerPortalPage() {
  const [me, setMe] = useState<PartnerMe | null>(null);
  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [commissionsPagination, setCommissionsPagination] = useState<AffiliateListPagination>(
    emptyAffiliatePagination(),
  );
  const [payoutsPagination, setPayoutsPagination] = useState<AffiliateListPagination>(
    emptyAffiliatePagination(),
  );
  const [loading, setLoading] = useState(true);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const loadCommissions = useCallback(async (page: number) => {
    setCommissionsLoading(true);
    try {
      const sales = await fetchPartnerCommissions({
        page,
        limit: AFFILIATE_TABLE_PAGE_SIZE,
      });
      setCommissions(sales.items);
      setCommissionsPagination(normalizeAffiliatePagination(sales.pagination));
    } catch {
      setCommissions([]);
      setCommissionsPagination(emptyAffiliatePagination());
    } finally {
      setCommissionsLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async (page: number) => {
    setPayoutsLoading(true);
    try {
      const pays = await fetchPartnerPayouts({
        page,
        limit: AFFILIATE_TABLE_PAGE_SIZE,
      });
      setPayouts(pays.items);
      setPayoutsPagination(normalizeAffiliatePagination(pays.pagination));
    } catch {
      setPayouts([]);
      setPayoutsPagination(emptyAffiliatePagination());
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, sum, linkRows] = await Promise.all([
        fetchPartnerMe(),
        fetchPartnerSummary(),
        fetchPartnerLinks(),
      ]);
      setMe(profile);
      setSummary(sum);
      setLinks(linkRows);
      await Promise.all([loadCommissions(1), loadPayouts(1)]);
    } catch {
      setMe(null);
      setSummary(null);
      setLinks([]);
      setCommissions([]);
      setPayouts([]);
      setCommissionsPagination(emptyAffiliatePagination());
      setPayoutsPagination(emptyAffiliatePagination());
    } finally {
      setLoading(false);
    }
  }, [loadCommissions, loadPayouts]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link kopyalandı', 'success');
    } catch {
      showToast('Kopyalama başarısız', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[32vh] items-center justify-center gap-1.5 text-[12px] font-normal text-[#8a9aaa]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f5c56]/80" />
        Yükleniyor…
      </div>
    );
  }

  if (!me || !summary) {
    return (
      <div className={`${sectionClass} mx-auto max-w-lg text-center`}>
        <h1 className="text-[15px] font-medium text-[#2a3848]">İş Ortağı Paneli</h1>
        <p className="mt-2 text-[12px] font-normal leading-relaxed text-[#6b7c8c]">
          Partner oturumu bulunamadı.
        </p>
        <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-[#6b7c8c]">
          Bu sayfaya erişim için platform yöneticisinden size özel davet bağlantısı almanız gerekir.
          Referral linki paneline giriş sağlamaz.
        </p>
        <a
          href="mailto:info@bilirkisihesap.com"
          className="mt-4 inline-flex items-center justify-center rounded-md border border-[#e4ebf0] bg-white px-3 py-1.5 text-[12px] font-normal text-[#3d4d5c] hover:bg-[#f7faf9]"
        >
          Yeni giriş bağlantısı isteyin
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-medium tracking-tight text-[#2a3848]">İş Ortağı Paneli</h1>
          <p className="mt-0.5 text-[12px] font-normal text-[#8a9aaa]">Hoş geldiniz, {me.name}</p>
        </div>
        <button type="button" onClick={() => void load()} className={smallBtnClass}>
          <RefreshCw className="h-3 w-3 opacity-70" /> Yenile
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Satış" value={String(summary.saleCount)} />
        <StatCard
          label="Toplam tahsilat"
          value={formatPartnerTry(summary.totalGrossPaidAmountKurus)}
        />
        <StatCard
          label="Hak edilen komisyon"
          value={formatPartnerTry(summary.lifetimeEarnedCommissionKurus)}
        />
        <StatCard label="Ödenen" value={formatPartnerTry(summary.paidCommissionKurus)} />
        <StatCard label="Bekleyen" value={formatPartnerTry(summary.pendingCommissionKurus)} />
      </div>

      <section className={sectionClass}>
        <h2 className="text-[13px] font-medium text-[#2a3848]">Referral linkleri</h2>
        <p className="mt-0.5 text-[11px] font-normal text-[#9aa8b5]">
          Oranları yalnızca platform yönetimi değiştirir.
        </p>
        {links.length === 0 ? (
          <div className="mt-2.5 rounded-lg border border-dashed border-[#e4ebf0] bg-[#fafbfc] px-3 py-3 text-[12px] font-normal text-[#8a9aaa]">
            Henüz link yok.
          </div>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-col gap-2 rounded-lg border border-[#e4ebf0] bg-[#fafbfc] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="break-all font-mono text-[11px] font-normal leading-snug text-[#3d4d5c]">
                    {link.fullUrl}
                  </p>
                  <p className="text-[11px] font-normal text-[#8a9aaa]">
                    Müşteri indirimi: %{link.customerDiscountRate}
                    <span className="mx-1.5 text-[#d0d8de]">·</span>
                    Komisyon: %{link.commissionRate}
                  </p>
                  {!link.isActive ? (
                    <span className={badgeClass('slate')}>Pasif</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#0f5c56] px-2.5 py-1.5 text-[11px] font-normal text-white/95 hover:bg-[#0c4c47]"
                  onClick={() => void copyLink(link.fullUrl)}
                >
                  <Copy className="h-3 w-3 opacity-90" /> Kopyala
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className="text-[13px] font-medium text-[#2a3848]">Satış geçmişi</h2>
        {commissionsLoading ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-normal text-[#8a9aaa]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f5c56]/80" />
            Yükleniyor…
          </div>
        ) : commissionsPagination.total === 0 ? (
          <div className="mt-2.5 rounded-lg border border-dashed border-[#e4ebf0] bg-[#fafbfc] px-3 py-3 text-[12px] font-normal text-[#8a9aaa]">
            Henüz satış yok.
          </div>
        ) : (
          <>
            <div className="mt-2.5 -mx-0.5 overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="border-b border-[#eef2f5]">
                  <tr>
                    <th className={thClass}>Tarih</th>
                    <th className={thClass}>Paket</th>
                    <th className={thClass}>Satış türü</th>
                    <th className={`${thClass} text-right`}>Tahsilat</th>
                    <th className={`${thClass} text-center`}>Komisyon oranı</th>
                    <th className={`${thClass} text-right`}>Komisyon</th>
                    <th className={`${thClass} text-right`}>Ödenen</th>
                    <th className={`${thClass} text-right`}>Kalan</th>
                    <th className={thClass}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((row) => (
                    <tr key={row.id} className="border-b border-[#f3f6f8]">
                      <td className={tdClass}>
                        {new Date(row.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className={tdClass}>
                        {affiliatePackageLabel(row.productType, row.subscriptionPeriod)}
                      </td>
                      <td className={tdClass}>{affiliateSaleTypeLabel(row.saleType)}</td>
                      <td className={tdMoney}>
                        {formatPartnerTry(row.grossPaidAmountKurus)}
                      </td>
                      <td className={tdRate}>%{row.commissionRateSnapshot}</td>
                      <td className={`${tdMoney} text-[#2a3848]`}>
                        {formatPartnerTry(row.commissionAmountKurus)}
                      </td>
                      <td className={tdMoney}>
                        {formatPartnerTry(row.paidAmountKurus ?? 0)}
                      </td>
                      <td className={tdMoney}>
                        {formatPartnerTry(
                          row.remainingAmountKurus ??
                            Math.max(0, row.commissionAmountKurus - (row.paidAmountKurus ?? 0)),
                        )}
                      </td>
                      <td className={tdClass}>
                        <CommissionStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CompactTablePagination
              pagination={commissionsPagination}
              disabled={commissionsLoading}
              onPageChange={(page) => void loadCommissions(page)}
            />
          </>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className="text-[13px] font-medium text-[#2a3848]">Ödeme geçmişi</h2>
        {payoutsLoading ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-normal text-[#8a9aaa]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f5c56]/80" />
            Yükleniyor…
          </div>
        ) : payoutsPagination.total === 0 ? (
          <div className="mt-2.5 rounded-lg border border-dashed border-[#e4ebf0] bg-[#fafbfc] px-3 py-3 text-[12px] font-normal text-[#8a9aaa]">
            Henüz ödeme kaydı yok.
          </div>
        ) : (
          <>
            <div className="mt-2.5 -mx-0.5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead className="border-b border-[#eef2f5]">
                  <tr>
                    <th className={thClass}>Tarih</th>
                    <th className={`${thClass} text-right`}>Tutar</th>
                    <th className={thClass}>Yöntem</th>
                    <th className={thClass}>Referans</th>
                    <th className={thClass}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((row) => (
                    <tr key={row.id} className="border-b border-[#f3f6f8]">
                      <td className={tdClass}>
                        {new Date(row.paidAt).toLocaleString('tr-TR')}
                      </td>
                      <td className={`${tdMoney} text-[#2a3848]`}>
                        {formatPartnerTry(row.amountKurus)}
                      </td>
                      <td className={tdClass}>
                        {affiliatePaymentMethodLabel(row.paymentMethod)}
                      </td>
                      <td className={tdClass}>{row.reference || '—'}</td>
                      <td className={tdClass}>
                        <PayoutStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CompactTablePagination
              pagination={payoutsPagination}
              disabled={payoutsLoading}
              onPageChange={(page) => void loadPayouts(page)}
            />
          </>
        )}
      </section>
    </div>
  );
}
