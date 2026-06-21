import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import {
  downloadLegalArchiveZip,
  downloadLegalDocument,
  fetchLegalArchiveDetail,
  fetchLegalArchives,
  type LegalArchiveDetail,
  type LegalArchiveListItem,
} from '@/lib/adminLegalArchive';

function formatMoney(amount: number, currency: string) {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('tr-TR');
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
    FAILED: 'bg-red-100 text-red-800',
    FAILED_ARCHIVE: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-slate-200 text-slate-700',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

function LegalArchiveDetailView({ id }: { id: number }) {
  const [detail, setDetail] = useState<LegalArchiveDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDetail(await fetchLegalArchiveDetail(id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Detay yüklenemedi', 'error');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!detail) {
    return <p className="text-slate-600">Kayıt bulunamadı.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/v2/legal-archive"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Listeye dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Sözleşme Arşivi Detayı</h1>
          <p className="mt-1 text-sm text-slate-500">{detail.packageNo}</p>
        </div>
        <button
          type="button"
          className={adminAccentBtnClass}
          onClick={() =>
            void downloadLegalArchiveZip(detail.id, `${detail.packageNo}.zip`).catch((e) =>
              showToast(e instanceof Error ? e.message : 'İndirme hatası', 'error'),
            )
          }
        >
          <Download className="h-4 w-4" /> ZIP İndir
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Müşteri Bilgileri" description="Satın alma sırasında kaydedilen iletişim bilgileri">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ad / Unvan</dt>
              <dd className="font-medium text-slate-900">{detail.customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">E-posta</dt>
              <dd className="font-medium text-slate-900">{detail.customerEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Telefon</dt>
              <dd>{detail.customerPhone || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Adres</dt>
              <dd className="mt-1">{detail.customerAddress || '—'}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Ödeme Bilgileri" description="Sipariş ve ödeme özeti">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Sipariş No</dt>
              <dd className="font-mono text-xs">{detail.orderNo}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ürün / Plan</dt>
              <dd>
                {detail.productName} — {detail.planName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tutar</dt>
              <dd>{formatMoney(detail.amount, detail.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Onay Tarihi</dt>
              <dd>{formatDate(detail.acceptedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Durum</dt>
              <dd>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(detail.status)}`}>
                  {detail.status}
                </span>
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Teknik Kayıtlar" description="IP adresi ve tarayıcı bilgisi">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">IP Adresi</dt>
            <dd className="font-mono text-xs">{detail.ipAddress || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">User-Agent</dt>
            <dd className="break-all font-mono text-xs">{detail.userAgent || '—'}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Onaylanan Sözleşmeler" description="Onay kodları, hash değerleri ve PDF indirme">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Belge</th>
                <th className="py-2 pr-4">Onay Kodu</th>
                <th className="py-2 pr-4">SHA256</th>
                <th className="py-2">İndir</th>
              </tr>
            </thead>
            <tbody>
              {detail.documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">{doc.documentTitle}</div>
                    <div className="text-xs text-slate-500">v{doc.documentVersion}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{doc.approvalCode}</td>
                  <td className="max-w-[12rem] truncate py-3 pr-4 font-mono text-xs" title={doc.sha256Hash || ''}>
                    {doc.sha256Hash || '—'}
                  </td>
                  <td className="py-3">
                    {doc.pdfPath ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                        onClick={() =>
                          void downloadLegalDocument(doc.id, `${doc.approvalCode}.pdf`).catch((e) =>
                            showToast(e instanceof Error ? e.message : 'PDF indirilemedi', 'error'),
                          )
                        }
                      >
                        <FileText className="h-4 w-4" /> PDF
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminV2LegalArchivePage() {
  const { id } = useParams();
  const detailId = id ? parseInt(id, 10) : null;
  const { tokenPresent } = useAdminToken();
  const [items, setItems] = useState<LegalArchiveListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchLegalArchives(page, 20);
      setItems(data.items);
      setTotalPages(data.pagination.pages || 1);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Arşiv yüklenemedi', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tokenPresent, page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (detailId && !Number.isNaN(detailId)) {
    return <LegalArchiveDetailView id={detailId} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Sözleşme Arşivi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Abonelik satın alımlarında onaylanan sözleşme paketleri
          </p>
        </div>
        <button type="button" className={adminAccentBtnClass} onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      <SectionCard title="Sözleşme paketleri" description="Tüm onay ve arşiv kayıtları">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <p className={`py-8 text-center text-sm ${adminMutedPanelClass}`}>Henüz kayıt yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sipariş No</th>
                  <th className="py-2 pr-3">Paket No</th>
                  <th className="py-2 pr-3">Müşteri</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Tutar</th>
                  <th className="py-2 pr-3">Onay</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-mono text-xs">{row.orderNo}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{row.packageNo}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium">{row.customerName}</div>
                      <div className="text-xs text-slate-500">{row.customerEmail}</div>
                    </td>
                    <td className="py-3 pr-3">{row.planName}</td>
                    <td className="py-3 pr-3">{formatMoney(row.amount, row.currency)}</td>
                    <td className="py-3 pr-3 text-xs">{formatDate(row.acceptedAt)}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/admin/v2/legal-archive/${row.id}`}
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                        >
                          <Archive className="h-4 w-4" /> Detay
                        </Link>
                        {row.status === 'COMPLETED' && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                            onClick={() =>
                              void downloadLegalArchiveZip(row.id, `${row.packageNo}.zip`).catch((e) =>
                                showToast(e instanceof Error ? e.message : 'ZIP indirilemedi', 'error'),
                              )
                            }
                          >
                            <Download className="h-4 w-4" /> ZIP
                          </button>
                        )}
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
    </div>
  );
}
