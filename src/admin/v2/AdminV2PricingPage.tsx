import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pencil, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  fetchAdminV2ContentBundle,
  parseAdminPricing,
  type AdminPricingComparisonRow,
  type AdminPricingPlanRow,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { Card } from '@/components/ui/Card';

type PricingPlanEditable = AdminPricingPlanRow & {
  id: string;
  isActive: boolean;
};

type PlanDraft = {
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  ctaText: string;
  ctaUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type PatchPricingPlanResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    description: string | null;
    price: string | null;
    priceSuffix: string | null;
    ctaText: string | null;
    ctaUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    updatedAt: string;
  };
};

function enrichPlansFromBundle(bundle: AdminV2ContentBundle): PricingPlanEditable[] {
  const { plans } = parseAdminPricing(bundle);
  const rawPlans = bundle.pricing?.plans ?? [];
  const rawByCode = new Map<string, Record<string, unknown>>();

  for (const item of rawPlans) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const code = typeof row.code === 'string' ? row.code : '';
    if (code) rawByCode.set(code, row);
  }

  return plans.map((plan) => {
    const raw = rawByCode.get(plan.code);
    const id =
      raw?.id !== undefined && raw?.id !== null ? String(raw.id) : '';
    const isActive =
      raw && typeof raw.isActive === 'boolean' ? raw.isActive : true;

    return { ...plan, id, isActive };
  });
}

async function patchAdminV2PricingPlan(
  id: string,
  body: {
    name: string;
    description: string;
    price: string;
    priceSuffix: string;
    ctaText: string;
    ctaUrl: string;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<PatchPricingPlanResponse> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token bulunamadı. Kaydetmek için önce token kaydedin.',
    };
    throw error;
  }

  return apiRequest<PatchPricingPlanResponse>(
    `/api/admin/v2/pricing/plans/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  );
}

function draftFromPlan(plan: PricingPlanEditable): PlanDraft {
  return {
    name: plan.name,
    description: plan.description ?? '',
    price: plan.priceDisplay ?? '',
    priceSuffix: plan.period ?? '',
    ctaText: plan.ctaText ?? '',
    ctaUrl: plan.ctaLink ?? '',
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
  };
}

function textUsesTextarea(value: string): boolean {
  return value.length > 80 || value.includes('\n');
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60';

export function AdminV2PricingPage() {
  const [plans, setPlans] = useState<PricingPlanEditable[]>([]);
  const [columns, setColumns] = useState<AdminPricingComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadPricing = async () => {
    setLoading(true);
    setError(null);

    try {
      const bundle = await fetchAdminV2ContentBundle();
      const parsed = parseAdminPricing(bundle);
      setPlans(enrichPlansFromBundle(bundle));
      setColumns(parsed.comparisonColumns);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Fiyatlandırma yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) {
      loadPricing();
    } else {
      setPlans([]);
      setColumns([]);
      setEditingId(null);
      setDraft(null);
    }
  }, [tokenPresent, revision]);

  const startEdit = (plan: PricingPlanEditable) => {
    if (!tokenPresent) return;
    if (!plan.id) {
      setSaveError('Paket id bulunamadı; kayıt güncellenemez.');
      return;
    }
    setSaveError(null);
    setEditingId(plan.id);
    setDraft(draftFromPlan(plan));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setSaveError(null);
  };

  const handleSave = async (plan: PricingPlanEditable) => {
    if (!tokenPresent || !draft) {
      setSaveError('Admin token bulunamadı. Kaydetmek için önce token kaydedin.');
      return;
    }

    if (!plan.id) {
      setSaveError('Paket id bulunamadı.');
      return;
    }

    const sortOrder = Number.parseInt(draft.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setSaveError('Sıra numarası geçerli bir sayı olmalıdır.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await patchAdminV2PricingPlan(plan.id, {
        name: draft.name,
        description: draft.description,
        price: draft.price,
        priceSuffix: draft.priceSuffix,
        ctaText: draft.ctaText,
        ctaUrl: draft.ctaUrl,
        sortOrder,
        isActive: draft.isActive,
      });

      const { data } = result;
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id
            ? {
                ...p,
                name: data.name,
                description: data.description,
                priceDisplay: data.price,
                period: data.priceSuffix,
                ctaText: data.ctaText,
                ctaLink: data.ctaUrl,
                sortOrder: data.sortOrder,
                isActive: data.isActive,
              }
            : p,
        ),
      );
      cancelEdit();
      await loadPricing();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Paket kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (patch: Partial<PlanDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Abonelik paketleri ve fiyat metinleri. Paket kodu, özellik listesi ve karşılaştırma kolonları bu ekrandan değişmez.
        </p>
        <button
          type="button"
          onClick={loadPricing}
          disabled={!tokenPresent || loading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Admin token bulunamadı. Dashboard’dan token kaydedin; token olmadan düzenleme yapılamaz.</p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Fiyatlandırma yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && (
        <>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-700">Toplam paket</p>
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-bold text-emerald-800">
              {plans.length}
            </span>
          </div>

          {plans.length === 0 ? (
            <Card>
              <p className="text-center text-sm text-slate-500">Yayınlanmış paket bulunamadı.</p>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const isEditing = editingId === plan.id && plan.id !== '';

                return (
                  <Card key={plan.code} highlighted={plan.isFeatured && !isEditing}>
                    <div className="flex items-start justify-between gap-2">
                      {isEditing && draft ? (
                        <div className="flex-1 space-y-2">
                          <label className="block text-xs font-semibold text-slate-500">Ad</label>
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateDraft({ name: e.target.value })}
                            disabled={saving}
                            className={inputClass}
                          />
                        </div>
                      ) : (
                        <p className="font-bold text-slate-900">{plan.name}</p>
                      )}
                      <span className="shrink-0 font-mono text-xs text-slate-500">{plan.code}</span>
                    </div>

                    {isEditing && draft ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Fiyat
                          </label>
                          <input
                            type="text"
                            value={draft.price}
                            onChange={(e) => updateDraft({ price: e.target.value })}
                            disabled={saving}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Fiyat soneki
                          </label>
                          <input
                            type="text"
                            value={draft.priceSuffix}
                            onChange={(e) => updateDraft({ priceSuffix: e.target.value })}
                            disabled={saving}
                            className={inputClass}
                            placeholder="/ay"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Açıklama
                          </label>
                          {textUsesTextarea(draft.description) ? (
                            <textarea
                              value={draft.description}
                              onChange={(e) => updateDraft({ description: e.target.value })}
                              rows={3}
                              disabled={saving}
                              className={inputClass}
                            />
                          ) : (
                            <input
                              type="text"
                              value={draft.description}
                              onChange={(e) => updateDraft({ description: e.target.value })}
                              disabled={saving}
                              className={inputClass}
                            />
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            CTA metni
                          </label>
                          <input
                            type="text"
                            value={draft.ctaText}
                            onChange={(e) => updateDraft({ ctaText: e.target.value })}
                            disabled={saving}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            CTA URL
                          </label>
                          <input
                            type="text"
                            value={draft.ctaUrl}
                            onChange={(e) => updateDraft({ ctaUrl: e.target.value })}
                            disabled={saving}
                            className={`${inputClass} font-mono text-xs`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Sıra
                          </label>
                          <input
                            type="number"
                            value={draft.sortOrder}
                            onChange={(e) => updateDraft({ sortOrder: e.target.value })}
                            disabled={saving}
                            className={`${inputClass} max-w-[100px]`}
                          />
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            onChange={(e) => updateDraft({ isActive: e.target.checked })}
                            disabled={saving}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          Aktif
                        </label>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {plan.priceDisplay ?? '—'}
                          {plan.period && (
                            <span className="text-base font-semibold text-slate-600">
                              {' '}
                              {plan.period}
                            </span>
                          )}
                        </p>
                        {plan.description && (
                          <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {plan.isActive ? 'Aktif' : 'Pasif'}
                          {plan.isFeatured && ' · Öne çıkan'}
                        </p>
                      </>
                    )}

                    {plan.features.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-700">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <span className="text-emerald-600">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {!isEditing && (plan.ctaText || plan.ctaLink) && (
                      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {plan.ctaText && (
                          <p>
                            <span className="font-semibold">CTA:</span> {plan.ctaText}
                          </p>
                        )}
                        {plan.ctaLink && (
                          <p className="mt-1 break-all font-mono text-sky-800">{plan.ctaLink}</p>
                        )}
                      </div>
                    )}

                    {!isEditing && (
                      <p className="mt-3 text-xs text-slate-400">Sıra: {plan.sortOrder}</p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSave(plan)}
                            disabled={!tokenPresent || saving || !plan.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {saving ? (
                              <span className="inline-flex items-center gap-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Kaydediliyor…
                              </span>
                            ) : (
                              'Kaydet'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Vazgeç
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(plan)}
                          disabled={
                            !tokenPresent || saving || editingId !== null || !plan.id
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Düzenle
                        </button>
                      )}
                    </div>

                    {saveError && isEditing && (
                      <p
                        className="mt-3 flex items-start gap-1.5 text-xs text-red-700"
                        role="alert"
                      >
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {saveError}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="!p-0 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Karşılaştırma kolonları ({columns.length}) — salt okunur
              </p>
            </div>
            {columns.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Karşılaştırma kolonu yok.
              </p>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-3">
                {columns.map((col) => (
                  <div
                    key={col.title}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-bold text-slate-900">{col.title}</p>
                    <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                      {col.variant}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                      {col.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
