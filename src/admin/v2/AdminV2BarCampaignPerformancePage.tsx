import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/admin/ui/SectionCard';
import { adminAccentBtnClass, adminPageTitleClass } from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import {
  fetchBarCampaignPerformance,
  fetchBarCampaignPerformanceDetails,
  type BarCampaignPerformanceDetails,
  type BarCampaignPerformanceRow,
} from '@/lib/adminBarCampaignPerformance';

const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
});

function formatAmount(kurus: number): string {
  return money.format(kurus / 100);
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminV2BarCampaignPerformancePage() {
  const { tokenPresent } = useAdminToken();
  const [rows, setRows] = useState<BarCampaignPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BarCampaignPerformanceRow | null>(null);
  const [details, setDetails] = useState<BarCampaignPerformanceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchBarCampaignPerformance());
      setSelected(null);
      setDetails(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Baro kampanya performansı yüklenemedi.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [tokenPresent]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectBar = async (row: BarCampaignPerformanceRow) => {
    setSelected(row);
    setDetails(null);
    setDetailsLoading(true);
    try {
      setDetails(await fetchBarCampaignPerformanceDetails(row.barAssociationKey));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Kullanıcı ve işlem listesi yüklenemedi.',
        'error',
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  if (!tokenPresent) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Performans ekranı için alttan admin token kaydedin.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/v2/campaigns"
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0f5c56]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kampanyalara dön
          </Link>
          <h1 className={adminPageTitleClass}>Baro Kampanya Performansı</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[#5c6b7a]">
            Yalnız başarılı, fulfillment durumu APPLIED ve gerçek baro kampanya işlemleri gösterilir.
          </p>
        </div>
        <button
          type="button"
          className={adminAccentBtnClass}
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <SectionCard
        title="Baro performans özeti"
        description={`${rows.length} baro`}
        compact
        tintedHeader
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f5c56]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#5c6b7a]">
            Başarılı baro kampanya işlemi bulunamadı.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#dbe4ea] text-[12px] font-semibold uppercase tracking-wide text-[#5c6b7a]">
                  <th className="px-3 py-2">Baro</th>
                  <th className="px-3 py-2 text-center">Benzersiz kullanıcı</th>
                  <th className="px-3 py-2 text-center">İlk satın alma</th>
                  <th className="px-3 py-2 text-center">Yenileme</th>
                  <th className="px-3 py-2 text-right">Toplam tahsilat</th>
                  <th className="px-3 py-2">Son işlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.barAssociationKey}
                    className="cursor-pointer border-b border-[#eef3f1] hover:bg-[#f7faf9]"
                    onClick={() => void selectBar(row)}
                  >
                    <td className="px-3 py-3 font-semibold text-[#1e2a3a]">
                      {row.barAssociationName}
                    </td>
                    <td className="px-3 py-3 text-center">{row.uniqueUserCount}</td>
                    <td className="px-3 py-3 text-center">{row.firstPurchaseCount}</td>
                    <td className="px-3 py-3 text-center">{row.renewalCount}</td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatAmount(row.totalAmountKurus)}
                    </td>
                    <td className="px-3 py-3">{formatDate(row.lastTransactionAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {selected && (
        <SectionCard
          title={`${selected.barAssociationName} — kullanıcı ve işlemler`}
          description="Aynı kullanıcı birden fazla sipariş verse de kullanıcı listesinde tek satırdır."
          compact
          tintedHeader
        >
          {detailsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-[#0f5c56]" />
            </div>
          ) : details ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[#1e2a3a]">
                  <Users className="h-4 w-4" />
                  Kullanıcılar
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#dbe4ea]">
                  <table className="w-full min-w-[720px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#dbe4ea] bg-[#f7faf9] text-[11px] font-semibold uppercase text-[#5c6b7a]">
                        <th className="px-3 py-2">Ad soyad</th>
                        <th className="px-3 py-2">E-posta</th>
                        <th className="px-3 py-2 text-center">İlk satın alma</th>
                        <th className="px-3 py-2 text-center">Yenileme</th>
                        <th className="px-3 py-2 text-right">Toplam</th>
                        <th className="px-3 py-2">Son işlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.users.map((user) => (
                        <tr key={user.key} className="border-b border-[#eef3f1]">
                          <td className="px-3 py-2.5 font-medium">{user.name}</td>
                          <td className="px-3 py-2.5">{user.email ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center">{user.firstPurchaseCount}</td>
                          <td className="px-3 py-2.5 text-center">{user.renewalCount}</td>
                          <td className="px-3 py-2.5 text-right">
                            {formatAmount(user.totalAmountKurus)}
                          </td>
                          <td className="px-3 py-2.5">{formatDate(user.lastTransactionAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-[#1e2a3a]">İşlemler</h3>
                <div className="overflow-x-auto rounded-xl border border-[#dbe4ea]">
                  <table className="w-full min-w-[900px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#dbe4ea] bg-[#f7faf9] text-[11px] font-semibold uppercase text-[#5c6b7a]">
                        <th className="px-3 py-2">Sipariş</th>
                        <th className="px-3 py-2">Kullanıcı</th>
                        <th className="px-3 py-2">İşlem</th>
                        <th className="px-3 py-2">Yöntem</th>
                        <th className="px-3 py-2 text-right">Tahsilat</th>
                        <th className="px-3 py-2">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.transactions.map((transaction) => (
                        <tr key={transaction.merchantOid} className="border-b border-[#eef3f1]">
                          <td className="px-3 py-2.5 font-mono text-[12px]">
                            {transaction.merchantOid}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{transaction.name}</div>
                            <div className="text-[11px] text-[#7b8a98]">
                              {transaction.email ?? '—'}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {transaction.orderPurpose === 'RENEWAL' ? 'Yenileme' : 'İlk satın alma'}
                          </td>
                          <td className="px-3 py-2.5">{transaction.paymentMethod}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">
                            {formatAmount(transaction.amountKurus)}
                          </td>
                          <td className="px-3 py-2.5">{formatDate(transaction.transactionAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>
      )}
    </div>
  );
}
