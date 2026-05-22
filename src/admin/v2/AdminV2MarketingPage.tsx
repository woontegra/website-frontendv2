import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminActiveCheckbox,
  AdminEditToolbar,
  adminInputClass,
} from '@/admin/v2/adminV2EditUi';
import {
  fetchAdminV2ContentBundle,
  parseAdminMarketing,
  type AdminCtaButtonRow,
  type AdminMarketingData,
  type AdminTrustMetricRow,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { adminV2Patch } from '@/lib/adminV2Patch';
import { Card } from '@/components/ui/Card';

type TrustEditable = AdminTrustMetricRow & { isActive: boolean };
type CtaEditable = AdminCtaButtonRow & { isActive: boolean };

function enrichMarketing(bundle: AdminV2ContentBundle): {
  trustMetrics: TrustEditable[];
  ctaButtons: CtaEditable[];
} {
  const parsed = parseAdminMarketing(bundle);
  const rawTrust = bundle.trustMetrics ?? [];
  const rawCta = bundle.ctaButtons ?? [];

  const trustById = new Map<string, Record<string, unknown>>();
  for (const item of rawTrust) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.id != null) trustById.set(String(row.id), row);
  }

  const ctaById = new Map<string, Record<string, unknown>>();
  for (const item of rawCta) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.id != null) ctaById.set(String(row.id), row);
  }

  return {
    trustMetrics: parsed.trustMetrics.map((row) => {
      const raw = trustById.get(row.id);
      return {
        ...row,
        isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
      };
    }),
    ctaButtons: parsed.ctaButtons.map((row) => {
      const raw = ctaById.get(row.id);
      return {
        ...row,
        isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
      };
    }),
  };
}

function Cell({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return <span className="text-slate-800">{value}</span>;
}

export function AdminV2MarketingPage() {
  const [data, setData] = useState<AdminMarketingData | null>(null);
  const [trustRows, setTrustRows] = useState<TrustEditable[]>([]);
  const [ctaRows, setCtaRows] = useState<CtaEditable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadMarketing = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setData(parseAdminMarketing(bundle));
      const enriched = enrichMarketing(bundle);
      setTrustRows(enriched.trustMetrics);
      setCtaRows(enriched.ctaButtons);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'CTA ve güven verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) loadMarketing();
    else {
      setData(null);
      setEditingKey(null);
    }
  }, [tokenPresent, revision]);

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft({});
    setSaveError(null);
  };

  const startTrustEdit = (row: TrustEditable) => {
    if (!tokenPresent || !row.id) return;
    setEditingKey(`trust:${row.id}`);
    setDraft({
      label: row.label,
      value: row.value,
      description: row.description ?? '',
      iconName: row.iconName ?? '',
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setSaveError(null);
  };

  const startCtaEdit = (row: CtaEditable) => {
    if (!tokenPresent || !row.id) return;
    setEditingKey(`cta:${row.id}`);
    setDraft({
      label: row.label,
      linkUrl: row.href ?? '',
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!tokenPresent || !editingKey) return;
    const sortOrder = Number.parseInt(String(draft.sortOrder ?? ''), 10);
    if (!Number.isFinite(sortOrder)) {
      setSaveError('Sıra numarası geçerli bir sayı olmalıdır.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingKey.startsWith('trust:')) {
        const id = editingKey.slice(6);
        await adminV2Patch(`/api/admin/v2/marketing/trust-metrics/${id}`, {
          label: String(draft.label ?? ''),
          value: String(draft.value ?? ''),
          description: String(draft.description ?? ''),
          iconName: String(draft.iconName ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      } else if (editingKey.startsWith('cta:')) {
        const id = editingKey.slice(4);
        await adminV2Patch(`/api/admin/v2/marketing/cta-buttons/${id}`, {
          label: String(draft.label ?? ''),
          linkUrl: String(draft.linkUrl ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      }
      cancelEdit();
      await loadMarketing();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const globalEdit = editingKey !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <code className="rounded bg-slate-200 px-1 text-xs">trustMetrics</code> ve{' '}
          <code className="rounded bg-slate-200 px-1 text-xs">ctaButtons</code> — code/variant salt
          okunur.
        </p>
        <button
          type="button"
          onClick={loadMarketing}
          disabled={!tokenPresent || loading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Admin token bulunamadı. Dashboard’dan token kaydedin.</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && data && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-800">Güven Metrikleri</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-bold text-emerald-800">
                {trustRows.length}
              </span>
            </div>
            {trustRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Kayıt yok.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {trustRows.map((row) => {
                  const isEditing = editingKey === `trust:${row.id}`;
                  return (
                    <div key={row.id} className="px-5 py-4">
                      {isEditing ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={String(draft.label ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                            disabled={saving}
                            className={adminInputClass}
                            placeholder="label"
                          />
                          <input
                            type="text"
                            value={String(draft.value ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                            disabled={saving}
                            className={adminInputClass}
                            placeholder="value"
                          />
                          <input
                            type="text"
                            value={String(draft.description ?? '')}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, description: e.target.value }))
                            }
                            disabled={saving}
                            className={`${adminInputClass} sm:col-span-2`}
                          />
                          <input
                            type="text"
                            value={String(draft.iconName ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, iconName: e.target.value }))}
                            disabled={saving}
                            className={adminInputClass}
                          />
                          <input
                            type="number"
                            value={String(draft.sortOrder ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                            disabled={saving}
                            className={`${adminInputClass} max-w-[100px]`}
                          />
                          <AdminActiveCheckbox
                            checked={Boolean(draft.isActive)}
                            disabled={saving}
                            onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))}
                          />
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p>
                            <span className="font-semibold">{row.label}</span> —{' '}
                            <span className="font-bold text-emerald-800">{row.value}</span>
                          </p>
                          <p className="mt-1 text-slate-600">
                            <Cell value={row.description} />
                          </p>
                          <p className="mt-1 font-mono text-xs">
                            <Cell value={row.iconName} /> · Sıra: {row.sortOrder} ·{' '}
                            {row.isActive ? 'Aktif' : 'Pasif'}
                          </p>
                        </div>
                      )}
                      <AdminEditToolbar
                        isEditing={isEditing}
                        saving={saving}
                        tokenPresent={tokenPresent}
                        editDisabled={globalEdit && !isEditing}
                        saveError={isEditing ? saveError : null}
                        onEdit={() => startTrustEdit(row)}
                        onSave={handleSave}
                        onCancel={cancelEdit}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-800">CTA Butonları</h2>
              <span className="rounded-full bg-sky-100 px-3 py-0.5 text-sm font-bold text-sky-800">
                {ctaRows.length}
              </span>
            </div>
            {ctaRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Kayıt yok.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {ctaRows.map((row) => {
                  const isEditing = editingKey === `cta:${row.id}`;
                  return (
                    <div key={row.id} className="px-5 py-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={String(draft.label ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                            disabled={saving}
                            className={adminInputClass}
                          />
                          <input
                            type="text"
                            value={String(draft.linkUrl ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
                            disabled={saving}
                            className={`${adminInputClass} font-mono text-xs`}
                          />
                          <input
                            type="number"
                            value={String(draft.sortOrder ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                            disabled={saving}
                            className={`${adminInputClass} max-w-[100px]`}
                          />
                          <AdminActiveCheckbox
                            checked={Boolean(draft.isActive)}
                            disabled={saving}
                            onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))}
                          />
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="font-mono text-xs font-semibold">{row.buttonKey}</p>
                          <p className="mt-1">{row.label}</p>
                          <p className="mt-1 break-all font-mono text-xs text-sky-800">
                            <Cell value={row.href} />
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            variant: <Cell value={row.variant} /> · Sıra: {row.sortOrder} ·{' '}
                            {row.isActive ? 'Aktif' : 'Pasif'}
                          </p>
                        </div>
                      )}
                      <AdminEditToolbar
                        isEditing={isEditing}
                        saving={saving}
                        tokenPresent={tokenPresent}
                        editDisabled={globalEdit && !isEditing}
                        saveError={isEditing ? saveError : null}
                        onEdit={() => startCtaEdit(row)}
                        onSave={handleSave}
                        onCancel={cancelEdit}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
