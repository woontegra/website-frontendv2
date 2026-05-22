import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  FileSearch,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Share2,
} from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminActiveCheckbox,
  adminInputClass,
  textUsesTextarea,
} from '@/admin/v2/adminV2EditUi';
import {
  fetchAdminV2ContentBundle,
  parseAdminSeo,
  type AdminSeoRow,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { adminV2Patch } from '@/lib/adminV2Patch';
import { resolveAdminAssetUrl } from '@/lib/resolvePublicAssetUrl';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminLabelClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { SeoMediaPickModal } from '@/admin/v2/seo/SeoMediaPickModal';
import {
  CharCounter,
  GoogleSearchPreview,
  SeoQualityAlerts,
  SocialSharePreview,
} from '@/admin/v2/seo/seoAdminPreviews';
import {
  computeSeoDraftWarnings,
  computeSeoStats,
  seoPageLabel,
  sortSeoRowsByKnownPaths,
} from '@/admin/v2/seo/seoAdminHelpers';

type SeoRowEditable = AdminSeoRow & {
  isActive: boolean;
  noIndex: boolean;
  keywords: string | null;
  publishStatus: string | null;
};

type SeoDraft = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  sortOrder: string;
  isActive: boolean;
  noIndex: boolean;
};

const badge =
  'inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none';

function enrichSeo(bundle: AdminV2ContentBundle): SeoRowEditable[] {
  const rows = parseAdminSeo(bundle);
  const rawByPath = new Map<string, Record<string, unknown>>();
  for (const item of bundle.seo ?? []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const path = typeof row.path === 'string' ? row.path : '';
    if (path) rawByPath.set(path, row);
  }
  return rows.map((row) => {
    const raw = rawByPath.get(row.path);
    const publishStatus =
      typeof raw?.publishStatus === 'string'
        ? raw.publishStatus
        : typeof raw?.publish_status === 'string'
          ? raw.publish_status
          : null;
    const keywords =
      typeof raw?.keywords === 'string' ? raw.keywords : null;
    return {
      ...row,
      keywords,
      isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
      noIndex: typeof raw?.noIndex === 'boolean' ? raw.noIndex : false,
      publishStatus,
    };
  });
}

function rowToDraft(row: SeoRowEditable): SeoDraft {
  return {
    title: row.title ?? '',
    description: row.description ?? '',
    ogTitle: row.ogTitle ?? '',
    ogDescription: row.ogDescription ?? '',
    ogImage: row.ogImage ?? '',
    sortOrder: String(row.sortOrder),
    isActive: row.isActive,
    noIndex: row.noIndex,
  };
}

function CompactStatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: typeof FileSearch;
  tone?: 'default' | 'warn' | 'danger';
}) {
  const valueClass =
    tone === 'danger'
      ? 'text-orange-700'
      : tone === 'warn'
        ? 'text-amber-700'
        : 'text-[#0f5c56]';

  return (
    <div className={`${adminCardClass} px-3 py-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-[#5c6b7a]">{label}</p>
          <p className={`text-xl font-semibold tabular-nums leading-tight ${valueClass}`}>
            {value}
          </p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-[#8a9aaa]" />
      </div>
    </div>
  );
}

function PageListItem({
  row,
  selected,
  onSelect,
}: {
  row: SeoRowEditable;
  selected: boolean;
  onSelect: () => void;
}) {
  const hasTitle = Boolean(row.title?.trim());
  const hasDesc = Boolean(row.description?.trim());
  const hasOg = Boolean(row.ogImage?.trim());
  const label = seoPageLabel(row.path, row.pageKey);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-[#0f5c56] bg-[#eef5f3] shadow-sm'
          : 'border-transparent bg-white hover:border-[#dbe4ea] hover:bg-[#fafcfc]'
      }`}
    >
      <p className="text-[14px] font-semibold text-[#1e2a3a]">{label}</p>
      <p className="mt-0.5 font-mono text-[11px] text-[#0f5c56]">{row.path}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={`${badge} ${hasTitle ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
        >
          Başlık {hasTitle ? '✓' : '—'}
        </span>
        <span
          className={`${badge} ${hasDesc ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
        >
          Açıklama {hasDesc ? '✓' : '—'}
        </span>
        <span
          className={`${badge} ${hasOg ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
        >
          OG {hasOg ? '✓' : '—'}
        </span>
        <span
          className={`${badge} ${row.noIndex ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-600'}`}
        >
          {row.noIndex ? 'noIndex' : 'Index'}
        </span>
      </div>
    </button>
  );
}

function SeoEditorPanel({
  row,
  draft,
  setDraft,
  saving,
  saveError,
  onSave,
  tokenPresent,
}: {
  row: SeoRowEditable;
  draft: SeoDraft;
  setDraft: React.Dispatch<React.SetStateAction<SeoDraft | null>>;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
  tokenPresent: boolean;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const label = seoPageLabel(row.path, row.pageKey);
  const warnings = useMemo(() => computeSeoDraftWarnings(draft), [draft]);

  const saveBtn = (
    <button
      type="button"
      onClick={onSave}
      disabled={!tokenPresent || saving}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      SEO Ayarlarını Kaydet
    </button>
  );

  return (
    <>
      <div className={`${adminCardClass} flex max-h-[calc(100vh-12rem)] min-h-[480px] flex-col`}>
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe4ea] bg-white px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1e2a3a]">SEO Düzenle</h2>
            <p className="truncate text-[13px] font-medium text-[#0f5c56]">{label}</p>
            <p className="font-mono text-[11px] text-[#8a9aaa]">{row.path}</p>
          </div>
          {saveBtn}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {saveError && (
            <div
              className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-900"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{saveError}</p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="max-w-xl space-y-3.5">
              <div>
                <label className={adminLabelClass}>Tarayıcı / Google Başlığı</label>
                <p className="text-[11px] text-[#8a9aaa]">
                  Tarayıcı sekmesi ve Google arama sonucu.
                </p>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                  disabled={saving}
                  className={`${adminInputClass} mt-1`}
                />
                <CharCounter value={draft.title} idealMin={50} idealMax={60} required />
              </div>

              <div>
                <label className={adminLabelClass}>Meta Açıklama</label>
                <p className="text-[11px] text-[#8a9aaa]">Google sonucunda başlığın altı.</p>
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                  }
                  rows={3}
                  disabled={saving}
                  className={`${adminInputClass} mt-1`}
                />
                <CharCounter
                  value={draft.description}
                  idealMin={140}
                  idealMax={160}
                  required
                />
              </div>

              <div className="rounded-md border border-[#dbe4ea] bg-[#f7faf9] px-3 py-2.5">
                <p className="text-[12px] font-semibold text-[#5c6b7a]">Anahtar kelimeler</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c6b7a]">
                  Anahtar kelime alanı şu an veritabanında desteklenmiyor. SEO için başlık,
                  açıklama, içerik başlıkları ve sayfa metinleri önceliklidir.
                </p>
              </div>

              <div className="border-t border-[#eef2f5] pt-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#8a9aaa]">
                  Sosyal medya
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={adminLabelClass}>Sosyal Medya Başlığı</label>
                    <input
                      type="text"
                      value={draft.ogTitle}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, ogTitle: e.target.value } : d))
                      }
                      disabled={saving}
                      className={`${adminInputClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className={adminLabelClass}>Sosyal Medya Açıklaması</label>
                    {textUsesTextarea(draft.ogDescription) ? (
                      <textarea
                        value={draft.ogDescription}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, ogDescription: e.target.value } : d))
                        }
                        rows={2}
                        disabled={saving}
                        className={`${adminInputClass} mt-1`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={draft.ogDescription}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, ogDescription: e.target.value } : d))
                        }
                        disabled={saving}
                        className={`${adminInputClass} mt-1`}
                      />
                    )}
                  </div>
                  <div>
                    <label className={adminLabelClass}>Sosyal Medya Görseli</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={draft.ogImage}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, ogImage: e.target.value } : d))
                        }
                        disabled={saving}
                        className={`${adminInputClass} min-w-0 flex-1`}
                        placeholder="URL"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaOpen(true)}
                        disabled={saving}
                        className="shrink-0 rounded-lg border border-[#dbe4ea] px-2.5 py-2 text-[12px] font-semibold hover:bg-[#f7faf9] disabled:opacity-50"
                      >
                        Medya Seç
                      </button>
                    </div>
                    {draft.ogImage.trim() && (
                      <img
                        src={resolveAdminAssetUrl(draft.ogImage.trim())}
                        alt=""
                        className="mt-1.5 h-14 max-w-full rounded border border-[#dbe4ea] object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[#dbe4ea] bg-[#f7faf9] px-3 py-2.5">
                <label className="flex cursor-pointer items-start gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={draft.noIndex}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, noIndex: e.target.checked } : d))
                    }
                    disabled={saving}
                    className="mt-0.5 h-4 w-4 rounded text-orange-600"
                  />
                  <span>
                    <span className="font-semibold text-[#1e2a3a]">
                      Arama sonuçlarında gizle (noIndex)
                    </span>
                    <span className="mt-0.5 block font-normal text-[#5c6b7a]">
                      Açılırsa sayfa arama motorlarında listelenmeyebilir.
                    </span>
                  </span>
                </label>
              </div>

              <details className={adminMutedPanelClass}>
                <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-[#5c6b7a]">
                  Gelişmiş ayarlar
                </summary>
                <div className="space-y-2 border-t border-[#dbe4ea] px-3 py-2 text-[12px]">
                  <div>
                    <label className={adminLabelClass}>Sıra</label>
                    <input
                      type="number"
                      value={draft.sortOrder}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, sortOrder: e.target.value } : d))
                      }
                      disabled={saving}
                      className={`${adminInputClass} mt-1 w-20`}
                    />
                  </div>
                  <AdminActiveCheckbox
                    checked={draft.isActive}
                    disabled={saving}
                    onChange={(v) => setDraft((d) => (d ? { ...d, isActive: v } : d))}
                  />
                  <p className="font-mono text-[10px] text-[#8a9aaa]">ID: {row.id}</p>
                </div>
              </details>
            </div>

            <div className="space-y-3 lg:sticky lg:top-14 lg:self-start">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aaa]">
                  Durum
                </p>
                <SeoQualityAlerts warnings={warnings} />
              </div>
              <GoogleSearchPreview
                path={row.path}
                title={draft.title}
                description={draft.description}
              />
              <SocialSharePreview
                path={row.path}
                ogTitle={draft.ogTitle || draft.title}
                ogDescription={draft.ogDescription || draft.description}
                ogImage={draft.ogImage}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex justify-end border-t border-[#dbe4ea] bg-white/95 px-4 py-2.5 backdrop-blur-sm">
          {saveBtn}
        </div>
      </div>

      <SeoMediaPickModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setDraft((d) => (d ? { ...d, ogImage: url } : d))}
      />
    </>
  );
}

export function AdminV2SeoPage() {
  const [rows, setRows] = useState<SeoRowEditable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SeoDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();

  const sortedRows = useMemo(() => sortSeoRowsByKnownPaths(rows), [rows]);
  const stats = useMemo(() => computeSeoStats(rows), [rows]);

  const selectedRow = useMemo(
    () => sortedRows.find((r) => r.id === selectedId) ?? null,
    [sortedRows, selectedId],
  );

  const loadSeo = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      const next = enrichSeo(bundle);
      setRows(next);
      const sorted = sortSeoRowsByKnownPaths(next);
      if (sorted.length > 0) {
        const keep = selectedId && sorted.some((r) => r.id === selectedId);
        const id = keep ? selectedId! : sorted[0].id;
        setSelectedId(id);
        const row = sorted.find((r) => r.id === id);
        if (row) setDraft(rowToDraft(row));
      } else {
        setSelectedId(null);
        setDraft(null);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'SEO verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) void loadSeo();
    else {
      setRows([]);
      setSelectedId(null);
      setDraft(null);
    }
  }, [tokenPresent, revision]);

  const selectRow = (row: SeoRowEditable) => {
    setSelectedId(row.id);
    setDraft(rowToDraft(row));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!tokenPresent || !draft || !selectedRow?.id) return;
    const sortOrder = Number.parseInt(draft.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setSaveError('Sıra numarası geçerli bir sayı olmalıdır.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(`/api/admin/v2/seo/${selectedRow.id}`, {
        title: draft.title,
        description: draft.description,
        ogTitle: draft.ogTitle,
        ogDescription: draft.ogDescription,
        ogImage: draft.ogImage,
        sortOrder,
        isActive: draft.isActive,
        noIndex: draft.noIndex,
      });
      invalidateBundle();
      await loadSeo();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'SEO kaydı güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={adminPageTitleClass}>SEO Ayarları</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[#5c6b7a]">
            Soldan sayfa seçin; sağda tarayıcı başlığı, meta açıklama ve sosyal medya ayarlarını
            düzenleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSeo()}
          disabled={!tokenPresent || loading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ea] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7faf9] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-900"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Admin token bulunamadı.</p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-900"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[#5c6b7a]">
          <Loader2 className="h-4 w-4 animate-spin text-[#0f5c56]" />
          Yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <CompactStatCard label="Toplam sayfa" value={stats.total} icon={FileSearch} />
            <CompactStatCard
              label="Eksik açıklama"
              value={stats.missingDescription}
              icon={Search}
              tone={stats.missingDescription > 0 ? 'warn' : 'default'}
            />
            <CompactStatCard
              label="Eksik OG görsel"
              value={stats.missingOgImage}
              icon={ImageIcon}
              tone={stats.missingOgImage > 0 ? 'warn' : 'default'}
            />
            <CompactStatCard
              label="noIndex"
              value={stats.noIndexCount}
              icon={Share2}
              tone={stats.noIndexCount > 0 ? 'danger' : 'default'}
            />
          </div>

          {sortedRows.length === 0 ? (
            <div className={`${adminCardClass} p-6 text-center text-[13px] text-[#5c6b7a]`}>
              Yayınlanmış SEO kaydı bulunamadı.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_1fr] lg:items-start">
              <aside className={`${adminCardClass} p-3`}>
                <h2 className="px-2 pb-2 text-[13px] font-bold uppercase tracking-wide text-[#5c6b7a]">
                  Sayfalar
                </h2>
                <nav className="space-y-1">
                  {sortedRows.map((row) => (
                    <PageListItem
                      key={row.id}
                      row={row}
                      selected={row.id === selectedId}
                      onSelect={() => selectRow(row)}
                    />
                  ))}
                </nav>
              </aside>

              {selectedRow && draft ? (
                <SeoEditorPanel
                  row={selectedRow}
                  draft={draft}
                  setDraft={setDraft}
                  saving={saving}
                  saveError={saveError}
                  onSave={() => void handleSave()}
                  tokenPresent={tokenPresent}
                />
              ) : (
                <div className={`${adminCardClass} flex min-h-[320px] items-center justify-center p-8 text-[13px] text-[#5c6b7a]`}>
                  Düzenlemek için soldan bir sayfa seçin.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
