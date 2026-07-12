import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Check, Eye, Loader2, RefreshCw, X } from 'lucide-react';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminModalBodyClass,
  adminModalFooterClass,
  adminModalHeaderClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import {
  approveAdminBankTransferPayment,
  bankTransferApiErrorMessage,
  fetchAdminBankTransferPaymentDetail,
  fetchAdminBankTransferPayments,
  rejectAdminBankTransferPayment,
  type BankTransferPaymentDetail,
  type BankTransferPaymentListItem,
} from '@/lib/adminBankTransferPayments';

type StatusFilter = 'bank_transfer_pending' | 'success' | 'bank_transfer_rejected' | 'all';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'bank_transfer_pending', label: 'Bekleyen' },
  { value: 'success', label: 'Onaylanan' },
  { value: 'bank_transfer_rejected', label: 'Reddedilen' },
  { value: 'all', label: 'Tümü' },
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
    bank_transfer_pending: 'Bekliyor',
    success: 'Onaylandı',
    bank_transfer_rejected: 'Reddedildi',
    failed: 'Başarısız',
    pending: 'Bekliyor',
  };
  return map[status] ?? status;
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    bank_transfer_pending: 'bg-amber-100 text-amber-800',
    success: 'bg-emerald-100 text-emerald-800',
    bank_transfer_rejected: 'bg-red-100 text-red-800',
    failed: 'bg-slate-200 text-slate-700',
    pending: 'bg-amber-100 text-amber-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

function productLabel(item: BankTransferPaymentListItem): string {
  const type = item.productType ?? '—';
  if (type === 'monthly') return 'Aylık';
  if (type === 'starter') return 'Starter';
  if (type === 'annual') {
    const years = item.subscriptionPeriod ?? 1;
    return `Yıllık (${years} yıl)`;
  }
  return type;
}

function campaignSummary(item: BankTransferPaymentListItem): string {
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
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#1a2433]/45 p-4 backdrop-blur-sm sm:p-6">
      <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#dbe4ea] bg-white shadow-xl">
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
        {footer ? <div className={adminModalFooterClass}>{footer}</div> : null}
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

function PaymentDetailModal({
  merchantOid,
  onClose,
}: {
  merchantOid: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<BankTransferPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchAdminBankTransferPaymentDetail(merchantOid)
      .then(setDetail)
      .catch((e) => {
        showToast(bankTransferApiErrorMessage(e), 'error');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [merchantOid, onClose]);

  return (
    <ModalShell title="Havale / EFT Detayı" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
      ) : detail ? (
        <dl>
          <DetailRow label="Açıklama kodu" value={<span className="font-mono text-xs">{detail.merchantOid}</span>} />
          <DetailRow
            label="Referans"
            value={
              <span className="font-mono text-xs">{detail.bankTransferReference ?? detail.merchantOid}</span>
            }
          />
          <DetailRow label="E-posta" value={detail.email ?? '—'} />
          <DetailRow label="Müşteri" value={detail.name ?? detail.billingInfo?.name ?? '—'} />
          <DetailRow label="Ürün tipi" value={productLabel(detail)} />
          <DetailRow label="Normal tutar" value={formatKurus(detail.normalPriceKurus ?? detail.amount)} />
          <DetailRow
            label="İndirim"
            value={
              detail.discountRate
                ? `%${detail.discountRate} (${formatKurus(detail.discountAmountKurus)})`
                : '—'
            }
          />
          <DetailRow label="Ödenecek tutar" value={formatKurus(detail.finalPriceKurus ?? detail.amount)} />
          <DetailRow label="Kampanya" value={detail.campaignNameSnapshot ?? '—'} />
          <DetailRow label="Müşteri notu" value={detail.customerNote ?? '—'} />
          <DetailRow label="Oluşturulma" value={formatDate(detail.createdAt)} />
          <DetailRow
            label="Durum"
            value={
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.status)}`}>
                {statusLabel(detail.status)}
              </span>
            }
          />
          {detail.bankTransferApprovedAt ? (
            <DetailRow
              label="Onay"
              value={`${formatDate(detail.bankTransferApprovedAt)}${detail.bankTransferApprovedBy ? ` · ${detail.bankTransferApprovedBy}` : ''}`}
            />
          ) : null}
          {detail.bankTransferRejectedAt ? (
            <DetailRow
              label="Red"
              value={`${formatDate(detail.bankTransferRejectedAt)}${detail.bankTransferRejectedBy ? ` · ${detail.bankTransferRejectedBy}` : ''}`}
            />
          ) : null}
          {detail.bankTransferRejectionNote ? (
            <DetailRow label="Red notu" value={detail.bankTransferRejectionNote} />
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-slate-600">Kayıt bulunamadı.</p>
      )}
    </ModalShell>
  );
}

export function AdminV2BankTransferPaymentsPage() {
  const { tokenPresent } = useAdminToken();
  const [items, setItems] = useState<BankTransferPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('bank_transfer_pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [detailOid, setDetailOid] = useState<string | null>(null);
  const [approveOid, setApproveOid] = useState<string | null>(null);
  const [rejectOid, setRejectOid] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdminBankTransferPayments({
        status: statusFilter,
        q: search || undefined,
        page,
        limit: 20,
      });
      setItems(data.items);
      setTotalPages(data.pagination.pages || 1);
    } catch (e) {
      showToast(bankTransferApiErrorMessage(e), 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tokenPresent, statusFilter, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async () => {
    if (!approveOid) return;
    setActionLoading(true);
    try {
      await approveAdminBankTransferPayment(approveOid);
      showToast('Havale/EFT ödemesi onaylandı', 'success');
      setApproveOid(null);
      await load();
    } catch (e) {
      showToast(bankTransferApiErrorMessage(e), 'error');
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveModal = async (merchantOid: string, currentStatus: string) => {
    if (currentStatus !== 'bank_transfer_pending') {
      showToast(`Bu ödeme bekleyen durumda değil (${statusLabel(currentStatus)}).`, 'warning');
      await load();
      return;
    }
    try {
      const detail = await fetchAdminBankTransferPaymentDetail(merchantOid);
      if (detail.status !== 'bank_transfer_pending') {
        showToast(`Bu ödeme artık onaylanamaz (${statusLabel(detail.status)}).`, 'warning');
        await load();
        return;
      }
      setApproveOid(merchantOid);
    } catch (e) {
      showToast(bankTransferApiErrorMessage(e), 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectOid) return;
    setActionLoading(true);
    try {
      await rejectAdminBankTransferPayment(rejectOid, rejectNote);
      showToast('Havale/EFT ödemesi reddedildi', 'success');
      setRejectOid(null);
      setRejectNote('');
      await load();
    } catch (e) {
      showToast(bankTransferApiErrorMessage(e), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Havale / EFT Ödemeleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Havale ile oluşturulan ödeme kayıtlarını listeleyin, onaylayın veya reddedin.
          </p>
        </div>
        <button type="button" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium ${adminAccentBtnClass}`} onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Listeyi görmek ve işlem yapmak için admin token girin.
        </p>
      )}

      <SectionCard title="Filtreler" description="Durum ve arama ile havale kayıtlarını süzün" compact tintedHeader>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[180px]">
            <label className={adminLabelClass}>Durum</label>
            <select
              className={`${adminInputClass} mt-1.5`}
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
          <div className="min-w-[240px] flex-1">
            <label className={adminLabelClass}>Arama (e-posta, kod, referans)</label>
            <div className="mt-1.5 flex gap-2">
              <input
                className={adminInputClass}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="E-posta veya açıklama kodu"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-medium hover:bg-slate-50"
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

      <SectionCard title="Ödeme listesi" description="Bekleyen havale kayıtları varsayılan olarak gösterilir" compact tintedHeader>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <p className={`py-8 text-center text-sm ${adminMutedPanelClass}`}>Kayıt bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Tarih</th>
                  <th className="py-2 pr-3">Müşteri / E-posta</th>
                  <th className="py-2 pr-3">Açıklama kodu</th>
                  <th className="py-2 pr-3">Paket / Dönem</th>
                  <th className="py-2 pr-3">Tutar</th>
                  <th className="py-2 pr-3">Kampanya</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.merchantOid} className="border-b border-slate-100">
                    <td className="py-3 pr-3 text-xs text-slate-600">{formatDate(row.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-slate-900">{row.name ?? '—'}</div>
                      <div className="text-xs text-slate-500">{row.email ?? '—'}</div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">{row.merchantOid}</td>
                    <td className="py-3 pr-3">{productLabel(row)}</td>
                    <td className="py-3 pr-3 font-medium">{formatKurus(row.finalPriceKurus ?? row.amount)}</td>
                    <td className="py-3 pr-3 text-xs text-slate-600">{campaignSummary(row)}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                          onClick={() => setDetailOid(row.merchantOid)}
                        >
                          <Eye className="h-4 w-4" /> Detay
                        </button>
                        {row.status === 'bank_transfer_pending' ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={actionLoading}
                              onClick={() => void openApproveModal(row.merchantOid, row.status)}
                            >
                              <Check className="h-4 w-4" /> Onayla
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-red-700 hover:underline"
                              onClick={() => {
                                setRejectOid(row.merchantOid);
                                setRejectNote('');
                              }}
                            >
                              <X className="h-4 w-4" /> Reddet
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Önceki
            </button>
            <span className="px-2 py-1 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </button>
          </div>
        )}
      </SectionCard>

      {detailOid ? (
        <PaymentDetailModal merchantOid={detailOid} onClose={() => setDetailOid(null)} />
      ) : null}

      {approveOid ? (
        <ModalShell
          title="Havale ödemesini onayla"
          onClose={() => !actionLoading && setApproveOid(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={actionLoading}
                className="rounded-lg border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium disabled:opacity-50"
                onClick={() => setApproveOid(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={actionLoading}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
                onClick={() => void handleApprove()}
              >
                {actionLoading ? 'Onaylanıyor…' : 'Onayla'}
              </button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-slate-700">
            Bu havale ödemesini onaylarsanız abonelik/lisans aktif edilecektir. Devam etmek istiyor musunuz?
          </p>
          <p className="mt-3 font-mono text-xs text-slate-500">{approveOid}</p>
        </ModalShell>
      ) : null}

      {rejectOid ? (
        <ModalShell
          title="Havale ödemesini reddet"
          onClose={() => !actionLoading && setRejectOid(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={actionLoading}
                className="rounded-lg border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium disabled:opacity-50"
                onClick={() => setRejectOid(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => void handleReject()}
              >
                {actionLoading ? 'Reddediliyor…' : 'Reddet'}
              </button>
            </div>
          }
        >
          <p className="mb-3 text-sm text-slate-700">
            Bu havale ödemesi reddedilecek; abonelik aktivasyonu yapılmayacaktır.
          </p>
          <label className={adminLabelClass}>Red açıklaması</label>
          <textarea
            rows={4}
            className={`${adminInputClass} mt-1.5`}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="İsteğe bağlı açıklama"
          />
          <p className="mt-2 font-mono text-xs text-slate-500">{rejectOid}</p>
        </ModalShell>
      ) : null}
    </div>
  );
}
