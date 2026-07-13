import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Eye, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminModalBodyClass,
  adminModalHeaderClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import {
  fetchAdminOrderDetail,
  fetchAdminOrders,
  type OrderDetail,
  type OrderListItem,
  type OrderStatus,
  type PaymentMethodFilter,
} from '@/lib/adminOrders';

type StatusFilter = OrderStatus | 'all';
type MethodFilter = PaymentMethodFilter;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tüm durumlar' },
  { value: 'pending', label: 'Kart ödeme bekliyor' },
  { value: 'success', label: 'Başarılı' },
  { value: 'failed', label: 'Başarısız' },
  { value: 'bank_transfer_pending', label: 'Havale bekliyor' },
  { value: 'bank_transfer_rejected', label: 'Havale reddedildi' },
];

const METHOD_OPTIONS: { value: MethodFilter; label: string }[] = [
  { value: 'all', label: 'Tüm yöntemler' },
  { value: 'PAYTR', label: 'Kredi/Banka Kartı' },
  { value: 'BANK_TRANSFER', label: 'Havale/EFT' },
];

function formatKurus(kurus: number | null | undefined): string {
  const value = typeof kurus === 'number' ? kurus : 0;
  return `₺${(value / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR');
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Kart ödeme bekliyor',
    success: 'Başarılı',
    failed: 'Başarısız',
    bank_transfer_pending: 'Havale bekliyor',
    bank_transfer_rejected: 'Havale reddedildi',
  };
  return map[status] ?? status;
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    success: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    bank_transfer_pending: 'bg-amber-100 text-amber-800',
    bank_transfer_rejected: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

function paymentMethodLabel(method: string): string {
  if (method === 'BANK_TRANSFER') return 'Havale/EFT';
  if (method === 'PAYTR') return 'Kredi/Banka Kartı';
  return method;
}

function productLabel(item: Pick<OrderListItem, 'productType' | 'subscriptionPeriod' | 'productName'>): string {
  const name = item.productName ?? '—';
  const type = item.productType;
  if (type === 'monthly') return `${name} · Aylık`;
  if (type === 'starter') return `${name} · Starter`;
  if (type === 'annual') {
    const years = item.subscriptionPeriod ?? 1;
    return `${name} · Yıllık (${years} yıl)`;
  }
  return name;
}

function durationLabel(item: Pick<OrderListItem, 'productType' | 'subscriptionPeriod'>): string {
  const type = item.productType;
  if (type === 'monthly') return '1 ay';
  if (type === 'starter') return 'Starter';
  if (type === 'annual') {
    const years = item.subscriptionPeriod ?? 1;
    return `${years} yıl`;
  }
  return '—';
}

function campaignSummary(item: OrderListItem): string {
  if (!item.campaignNameSnapshot && !item.discountRate) return '—';
  const parts: string[] = [];
  if (item.campaignNameSnapshot) parts.push(item.campaignNameSnapshot);
  if (item.discountRate) parts.push(`%${item.discountRate}`);
  if (item.discountAmountKurus) parts.push(`-${formatKurus(item.discountAmountKurus)}`);
  return parts.join(' · ');
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#1a2433]/45 p-4 backdrop-blur-sm sm:p-6">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#dbe4ea] bg-white shadow-xl">
        <div className={`flex items-center justify-between gap-3 ${adminModalHeaderClass}`}>
          <h2 className="text-[1.05rem] font-semibold text-[#1e2a3a]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={adminModalBodyClass}>{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function OrderDetailModal({
  merchantOid,
  onClose,
}: {
  merchantOid: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchAdminOrderDetail(merchantOid)
      .then(setDetail)
      .catch((e) => {
        showToast(e instanceof Error ? e.message : 'Detay yüklenemedi', 'error');
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [merchantOid]);

  return (
    <ModalShell title="Sipariş Detayı" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : !detail ? (
        <p className="text-sm text-slate-600">Kayıt bulunamadı.</p>
      ) : (
        <div className="space-y-5">
          <dl>
            <DetailRow label="Sipariş No" value={<span className="font-mono text-xs">{detail.merchantOid}</span>} />
            <DetailRow label="E-posta" value={detail.email ?? '—'} />
            <DetailRow label="Ödeme yöntemi" value={paymentMethodLabel(detail.paymentMethod)} />
            <DetailRow
              label="Durum"
              value={
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.status)}`}>
                  {statusLabel(detail.status)}
                </span>
              }
            />
            <DetailRow label="Tutar" value={formatKurus(detail.finalPriceKurus ?? detail.amount)} />
            <DetailRow label="Normal tutar" value={detail.normalPriceKurus ? formatKurus(detail.normalPriceKurus) : '—'} />
            <DetailRow
              label="İndirim"
              value={
                detail.discountRate || detail.discountAmountKurus
                  ? [
                      detail.discountRate ? `%${detail.discountRate}` : null,
                      detail.discountAmountKurus ? formatKurus(detail.discountAmountKurus) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : '—'
              }
            />
            <DetailRow label="Kampanya" value={detail.campaignNameSnapshot ?? '—'} />
            <DetailRow
              label="Ürün / paket"
              value={productLabel({
                productName: detail.product?.name ?? null,
                productType: detail.productType,
                subscriptionPeriod: detail.subscriptionPeriod,
              })}
            />
            <DetailRow
              label="Süre"
              value={durationLabel({
                productType: detail.productType,
                subscriptionPeriod: detail.subscriptionPeriod,
              })}
            />
            <DetailRow label="Oluşturma" value={formatDate(detail.createdAt)} />
          </dl>

          {detail.paymentMethod === 'BANK_TRANSFER' && (
            <div className={`rounded-xl p-4 ${adminMutedPanelClass}`}>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Havale bilgileri</h3>
              <dl>
                <DetailRow label="Açıklama kodu" value={detail.bankTransferReference ?? detail.merchantOid} />
                <DetailRow label="Müşteri notu" value={detail.customerNote ?? '—'} />
                <DetailRow label="Onaylayan" value={detail.bankTransferApprovedBy ?? '—'} />
                <DetailRow label="Onay tarihi" value={formatDate(detail.bankTransferApprovedAt)} />
                <DetailRow label="Reddeden" value={detail.bankTransferRejectedBy ?? '—'} />
                <DetailRow label="Red tarihi" value={formatDate(detail.bankTransferRejectedAt)} />
                <DetailRow label="Red notu" value={detail.bankTransferRejectionNote ?? '—'} />
              </dl>
              {detail.status === 'bank_transfer_pending' && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Bu ödeme Havale Ödemeleri ekranından onaylanabilir.
                  <Link
                    to="/admin/v2/bank-transfer-payments"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    Havale Ödemeleri ekranına git <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {detail.legalPackage && (
            <div className={`rounded-xl p-4 ${adminMutedPanelClass}`}>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Yasal belge paketi</h3>
              <dl>
                <DetailRow label="Paket No" value={detail.legalPackage.packageNo} />
                <DetailRow label="Durum" value={detail.legalPackage.status} />
                <DetailRow label="Ürün / plan" value={`${detail.legalPackage.productName} — ${detail.legalPackage.planName}`} />
                <DetailRow label="Arşiv" value={detail.legalPackage.hasArchive ? 'Mevcut' : 'Yok'} />
              </dl>
              <Link
                to={`/admin/v2/legal-archive/${detail.legalPackage.id}`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Sözleşme arşivinde aç <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {detail.userProduct && (
            <div className={`rounded-xl p-4 ${adminMutedPanelClass}`}>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Website abonelik kaydı</h3>
              <dl>
                <DetailRow label="Satın alma" value={formatDate(detail.userProduct.purchasedAt)} />
                <DetailRow label="Bitiş tarihi" value={formatDate(detail.userProduct.expiresAt)} />
                <DetailRow label="Süre (ay)" value={detail.userProduct.duration} />
                <DetailRow
                  label="Durum"
                  value={detail.userProduct.isExpired ? 'Süresi dolmuş' : 'Aktif'}
                />
              </dl>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

export function AdminV2OrdersPage() {
  const { tokenPresent } = useAdminToken();
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [detailOid, setDetailOid] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdminOrders({
        status: statusFilter,
        paymentMethod: methodFilter,
        q: search || undefined,
        page,
        limit: 20,
      });
      setItems(data.items);
      setTotalPages(data.pagination.pages || 1);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Siparişler yüklenemedi', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tokenPresent, statusFilter, methodFilter, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Siparişler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tüm ödeme kayıtlarını (kart ve havale) salt okunur olarak görüntüleyin.
          </p>
        </div>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium ${adminAccentBtnClass}`}
          onClick={() => void load()}
        >
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Listeyi görmek için admin token girin.
        </p>
      )}

      <SectionCard title="Filtreler" description="Durum, ödeme yöntemi ve arama ile siparişleri süzün" compact tintedHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={adminLabelClass} htmlFor="orders-status">
              Durum
            </label>
            <select
              id="orders-status"
              className={adminInputClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass} htmlFor="orders-method">
              Ödeme yöntemi
            </label>
            <select
              id="orders-method"
              className={adminInputClass}
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as MethodFilter);
                setPage(1);
              }}
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={adminLabelClass} htmlFor="orders-search">
              Arama
            </label>
            <div className="flex gap-2">
              <input
                id="orders-search"
                type="search"
                className={adminInputClass}
                placeholder="E-posta, sipariş no veya havale referansı"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }
                }}
              />
              <button
                type="button"
                className={`shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium ${adminAccentBtnClass}`}
                onClick={() => {
                  setSearch(searchInput.trim());
                  setPage(1);
                }}
              >
                Ara
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sipariş listesi" description="Son kayıtlar önce gösterilir" compact tintedHeader>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Kayıt bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Tarih</th>
                  <th className="py-2 pr-3">E-posta</th>
                  <th className="py-2 pr-3">Yöntem</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2 pr-3">Ürün / paket</th>
                  <th className="py-2 pr-3">Süre</th>
                  <th className="py-2 pr-3">Tutar</th>
                  <th className="py-2 pr-3">Kampanya</th>
                  <th className="py-2 pr-3">Referans</th>
                  <th className="py-2">Detay</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.merchantOid} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="py-2.5 pr-3">{item.email ?? '—'}</td>
                    <td className="py-2.5 pr-3">{paymentMethodLabel(item.paymentMethod)}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">{productLabel(item)}</td>
                    <td className="py-2.5 pr-3">{durationLabel(item)}</td>
                    <td className="py-2.5 pr-3 font-medium">{formatKurus(item.finalPriceKurus ?? item.amount)}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{campaignSummary(item)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">{item.merchantOid}</td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setDetailOid(item.merchantOid)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Önceki
            </button>
            <span className="text-sm text-slate-600">
              Sayfa {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </button>
          </div>
        )}
      </SectionCard>

      {detailOid && <OrderDetailModal merchantOid={detailOid} onClose={() => setDetailOid(null)} />}
    </div>
  );
}
