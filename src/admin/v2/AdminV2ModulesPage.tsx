import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, Pencil, RefreshCw, X } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminActiveCheckbox } from '@/admin/v2/adminV2EditUi';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminCardPaddingClass,
  adminCompactInputClass,
  adminCompactLabelClass,
  adminModalBodyClass,
  adminModalFooterClass,
  adminModalHeaderClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import {
  fetchAdminV2ContentBundle,
  parseAdminCalculationModules,
  type AdminCalculationModuleRow,
} from '@/lib/adminContentBundle';
import { patchAdminV2CalculationModule } from '@/lib/adminCalculationModule';
import { resolvePublicModulePath } from '@/data/calculationModulePaths';
import {
  draftFieldsFromLandingContent,
  getStaticLandingContent,
  hasLandingBody,
  landingContentFromDraft,
} from '@/lib/calculationLandingContent';

type ModuleDraft = {
  cardTitle: string;
  cardDescription: string;
  landingTitle: string;
  landingDescription: string;
  landingEyebrow: string;
  benefitsText: string;
  landingIntro: string;
  articleSectionsText: string;
  moduleTypesTitle: string;
  moduleTypesCardsText: string;
  programBenefitsText: string;
  ctaText: string;
  slug: string;
  iconName: string;
  sortOrder: string;
  isActive: boolean;
};

function draftFromRow(row: AdminCalculationModuleRow): ModuleDraft {
  const landing =
    row.landingContent && hasLandingBody(row.landingContent)
      ? row.landingContent
      : getStaticLandingContent(row.slug);
  const landingFields = draftFieldsFromLandingContent(landing);

  return {
    cardTitle: row.cardTitle,
    cardDescription: row.cardDescription ?? '',
    landingTitle: row.landingTitle ?? row.cardTitle,
    landingDescription: row.landingDescription ?? row.cardDescription ?? '',
    landingEyebrow: row.landingEyebrow ?? '',
    benefitsText: (row.benefits ?? []).join('\n'),
    ...landingFields,
    ctaText: row.ctaText ?? '',
    slug: row.slug,
    iconName: row.iconName ?? '',
    sortOrder: String(row.sortOrder),
    isActive: row.isActive !== false,
  };
}

function parseBenefits(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminV2ModulesPage() {
  const [rows, setRows] = useState<AdminCalculationModuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<AdminCalculationModuleRow | null>(null);
  const [draft, setDraft] = useState<ModuleDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();

  const loadModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setRows(parseAdminCalculationModules(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Modüller yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) loadModules();
    else {
      setRows([]);
      closeModal();
    }
  }, [tokenPresent, revision]);

  const closeModal = () => {
    setEditRow(null);
    setDraft(null);
    setSaveError(null);
  };

  const openEdit = (row: AdminCalculationModuleRow) => {
    if (!tokenPresent) return;
    setSaveError(null);
    setEditRow(row);
    setDraft(draftFromRow(row));
  };

  const handleSave = async () => {
    if (!tokenPresent || !editRow || !draft) return;

    const sortOrder = Number.parseInt(draft.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setSaveError('Sıra geçerli bir sayı olmalıdır.');
      return;
    }
    if (!draft.cardTitle.trim() || !draft.landingTitle.trim()) {
      setSaveError('Kart ve tanıtım başlığı zorunludur.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await patchAdminV2CalculationModule(editRow.id, {
        cardTitle: draft.cardTitle,
        cardDescription: draft.cardDescription,
        landingTitle: draft.landingTitle,
        landingDescription: draft.landingDescription,
        landingEyebrow: draft.landingEyebrow,
        benefits: parseBenefits(draft.benefitsText),
        landingContent: landingContentFromDraft(draft),
        ctaText: draft.ctaText,
        slug: draft.slug,
        iconName: draft.iconName,
        sortOrder,
        isActive: draft.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadModules();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Modül kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const publicPath = editRow ? resolvePublicModulePath(editRow.slug) : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Hesaplama Modülleri</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[#5c6b7a]">
            Ana sayfa kartları ve modül tanıtım sayfası (makale metinleri, hesaplama türleri, program
            özellikleri). Link path eski site yapısıyla uyumlu tutulmalıdır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadModules()}
          disabled={!tokenPresent || loading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-semibold shadow-sm hover:bg-[#f7faf9] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Düzenlemek için{' '}
          <a href="/admin/v2/login" className="font-semibold underline">
            panele giriş
          </a>{' '}
          yapın.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Modüller yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && (
        <div className={`${adminCardClass} min-w-0`}>
          <div className={`${adminCardPaddingClass} !py-4 overflow-x-auto`}>
            <table className="w-full min-w-0 table-fixed text-left text-[12px]">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[30%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#dbe4ea] bg-[#fafbfc] text-[10px] font-bold uppercase tracking-wide text-[#5c6b7a]">
                  <th className="py-2 pr-2 text-left">Ana sayfa kartı</th>
                  <th className="px-3 py-2">Sayfa linki</th>
                  <th className="px-2 py-2 text-center">Sıra</th>
                  <th className="px-2 py-2 text-center">Durum</th>
                  <th className="py-2 pl-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#eef2f5] hover:bg-[#fafbfc]">
                    <td className="py-2.5 pr-2 align-middle">
                      <p className="truncate text-[12px] font-semibold text-[#1e2a3a]" title={row.cardTitle}>
                        {row.cardTitle}
                      </p>
                      <p
                        className="mt-0.5 line-clamp-2 text-[11px] text-[#5c6b7a]"
                        title={row.cardDescription ?? ''}
                      >
                        {row.cardDescription}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span
                        className="block truncate font-mono text-[11px] text-[#0f5c56]"
                        title={resolvePublicModulePath(row.slug)}
                      >
                        {resolvePublicModulePath(row.slug)}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center align-middle text-[11px] tabular-nums">
                      {row.sortOrder}
                    </td>
                    <td className="px-2 py-2.5 text-center align-middle">
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          row.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.isActive !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        disabled={!tokenPresent || saving || editRow !== null}
                        className="inline-flex items-center gap-1 rounded-md border border-[#dbe4ea] bg-white px-2 py-1 text-[11px] font-semibold shadow-sm hover:bg-[#f7faf9] disabled:opacity-50"
                      >
                        <Pencil className="h-3 w-3" />
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editRow && draft && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#1a2433]/45 p-4 backdrop-blur-sm sm:p-6">
          <div className={`${adminCardClass} my-4 w-full max-w-2xl min-w-0 overflow-hidden`}>
            <div className={`flex items-start justify-between gap-3 ${adminModalHeaderClass}`}>
              <div className="min-w-0 pr-2">
                <h2 className="truncate text-[15px] font-bold text-[#1e2a3a]">{editRow.code}</h2>
                <p className="text-[11px] text-[#5c6b7a]">Ana sayfa + tanıtım sayfası</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="shrink-0 rounded-md p-1.5 hover:bg-[#f0f5f4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`${adminModalBodyClass} max-h-[min(85vh,720px)] space-y-4 overflow-y-auto`}>
              {saveError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                  {saveError}
                </p>
              )}

              <section className="min-w-0">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#5c6b7a]">
                  Ana sayfa kartı
                </h3>
                <div className="mt-2 grid min-w-0 gap-2.5 sm:grid-cols-2">
                  <div className="min-w-0 sm:col-span-2">
                    <label className={adminCompactLabelClass}>Kart başlığı</label>
                    <input
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.cardTitle}
                      onChange={(e) => setDraft((d) => d && { ...d, cardTitle: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <label className={adminCompactLabelClass}>Kart açıklaması</label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y`}
                      rows={2}
                      value={draft.cardDescription}
                      onChange={(e) => setDraft((d) => d && { ...d, cardDescription: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>İkon adı</label>
                    <input
                      className={`${adminCompactInputClass} mt-1 font-mono text-[11px]`}
                      value={draft.iconName}
                      onChange={(e) => setDraft((d) => d && { ...d, iconName: e.target.value })}
                      disabled={saving}
                      placeholder="Calculator"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Sıra</label>
                    <input
                      type="number"
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.sortOrder}
                      onChange={(e) => setDraft((d) => d && { ...d, sortOrder: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </section>

              <section className="min-w-0">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#5c6b7a]">
                  Tanıtım sayfası
                </h3>
                <div className="mt-2 grid min-w-0 gap-2.5">
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Üst etiket (eyebrow)</label>
                    <input
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.landingEyebrow}
                      onChange={(e) => setDraft((d) => d && { ...d, landingEyebrow: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Sayfa başlığı</label>
                    <input
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.landingTitle}
                      onChange={(e) => setDraft((d) => d && { ...d, landingTitle: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Sayfa açıklaması</label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y`}
                      rows={3}
                      value={draft.landingDescription}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, landingDescription: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>
                      Kısa özellikler (hero altı, her satır bir madde)
                    </label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y`}
                      rows={3}
                      value={draft.benefitsText}
                      onChange={(e) => setDraft((d) => d && { ...d, benefitsText: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Alt CTA metni</label>
                    <input
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.ctaText}
                      onChange={(e) => setDraft((d) => d && { ...d, ctaText: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </section>

              <section className="min-w-0 rounded-lg border border-[#cfe0db]/80 bg-[#f7faf9] p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#0f5c56]">
                  Sayfa makale içeriği (eski site metinleri)
                </h3>
                <p className="mt-1 text-[10px] leading-snug text-[#5c6b7a]">
                  Ziyaretçinin modül sayfasında gördüğü uzun açıklamalar. Kaydedince canlı sitede
                  güncellenir.
                </p>
                <div className="mt-3 grid min-w-0 gap-2.5">
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Üst giriş paragrafı (hero altı)</label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y`}
                      rows={2}
                      value={draft.landingIntro}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, landingIntro: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>
                      Makale bölümleri
                    </label>
                    <p className="mt-0.5 text-[10px] text-[#8a9aaa]">
                      Her bölüm: <code className="rounded bg-white px-1">=== Başlık ===</code> sonra
                      paragraflar; madde listesi için satır başına{' '}
                      <code className="rounded bg-white px-1">* madde</code>
                    </p>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y font-mono text-[11px]`}
                      rows={10}
                      value={draft.articleSectionsText}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, articleSectionsText: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>Hesaplama türleri başlığı</label>
                    <input
                      className={`${adminCompactInputClass} mt-1`}
                      value={draft.moduleTypesTitle}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, moduleTypesTitle: e.target.value })
                      }
                      disabled={saving}
                      placeholder="Kıdem Tazminatı Hesaplama Türleri"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>
                      Hesaplama türü kartları (her satır: Başlık|Açıklama)
                    </label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y font-mono text-[11px]`}
                      rows={5}
                      value={draft.moduleTypesCardsText}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, moduleTypesCardsText: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={adminCompactLabelClass}>
                      Program özellikleri (her satır: Başlık|Metin)
                    </label>
                    <textarea
                      className={`${adminCompactInputClass} mt-1 resize-y font-mono text-[11px]`}
                      rows={4}
                      value={draft.programBenefitsText}
                      onChange={(e) =>
                        setDraft((d) => d && { ...d, programBenefitsText: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                </div>
              </section>

              <details className={`${adminMutedPanelClass} min-w-0`}>
                <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-[#5c6b7a]">
                  Gelişmiş — sayfa linki (path)
                </summary>
                <div className="border-t border-[#dbe4ea] px-3 py-2.5">
                  <label className={adminCompactLabelClass}>Slug / URL path</label>
                  <input
                    className={`${adminCompactInputClass} mt-1 font-mono text-[11px]`}
                    value={draft.slug}
                    onChange={(e) => setDraft((d) => d && { ...d, slug: e.target.value })}
                    disabled={saving}
                  />
                  <p className="mt-1.5 break-all text-[10px] text-[#8a9aaa]">
                    Canlı:{' '}
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#0f5c56]"
                    >
                      {publicPath}
                      <ExternalLink className="ml-0.5 inline h-3 w-3" />
                    </a>
                  </p>
                </div>
              </details>

              <AdminActiveCheckbox
                checked={draft.isActive}
                disabled={saving}
                onChange={(v) => setDraft((d) => d && { ...d, isActive: v })}
              />
            </div>

            <div className={`flex justify-end gap-2 ${adminModalFooterClass}`}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-md border border-[#dbe4ea] px-3 py-1.5 text-[12px] font-medium"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
