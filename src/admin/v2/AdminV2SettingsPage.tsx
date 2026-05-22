import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pencil, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  fetchAdminV2ContentBundle,
  parseAdminSettings,
  type AdminSettingRow,
} from '@/lib/adminContentBundle';
import { Card } from '@/components/ui/Card';

type PatchSettingResponse = {
  success: boolean;
  data: {
    key: string;
    value: string | null;
    updatedAt: string;
  };
};

async function patchAdminV2SiteSetting(key: string, value: string): Promise<PatchSettingResponse> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token bulunamadı. Kaydetmek için önce token kaydedin.',
    };
    throw error;
  }

  return apiRequest<PatchSettingResponse>(
    `/api/admin/v2/settings/${encodeURIComponent(key)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: { value },
    },
  );
}

function valueUsesTextarea(value: string): boolean {
  return value.length > 80 || value.includes('\n');
}

export function AdminV2SettingsPage() {
  const [rows, setRows] = useState<AdminSettingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const bundle = await fetchAdminV2ContentBundle();
      setRows(parseAdminSettings(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Site ayarları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) {
      loadSettings();
    } else {
      setRows([]);
      setEditingKey(null);
    }
  }, [tokenPresent, revision]);

  const startEdit = (row: AdminSettingRow) => {
    if (!tokenPresent) return;
    setSaveError(null);
    setEditingKey(row.key);
    setDraftValue(row.value ?? '');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraftValue('');
    setSaveError(null);
  };

  const handleSave = async (key: string) => {
    if (!tokenPresent) {
      setSaveError('Admin token bulunamadı. Kaydetmek için önce token kaydedin.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const result = await patchAdminV2SiteSetting(key, draftValue);
      const savedValue = result.data.value;

      setRows((prev) =>
        prev.map((row) =>
          row.key === key ? { ...row, value: savedValue } : row,
        ),
      );
      setEditingKey(null);
      setDraftValue('');

      await loadSettings();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Site ayarı kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Content bundle içindeki <code className="rounded bg-slate-200 px-1 text-xs">settings</code>{' '}
          kayıtları — yalnızca value alanı düzenlenebilir.
        </p>
        <button
          type="button"
          onClick={loadSettings}
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
          <p>
            Admin token bulunamadı. Dashboard’dan token kaydedin; token olmadan kayıt
            düzenlenemez.
          </p>
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
          Ayarlar yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-700">Toplam kayıt</p>
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-bold text-emerald-800">
              {rows.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Yayınlanmış site ayarı bulunamadı. Backend content-bundle boş veya henüz seed
              edilmemiş olabilir.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Key</th>
                    <th className="px-5 py-3">Label / açıklama</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isEditing = editingKey === row.key;

                    return (
                      <tr
                        key={row.key}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800">
                          {row.key}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {row.label ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="max-w-md px-5 py-3 break-words text-slate-900">
                          {isEditing ? (
                            <div className="space-y-2">
                              {valueUsesTextarea(draftValue) ? (
                                <textarea
                                  value={draftValue}
                                  onChange={(e) => setDraftValue(e.target.value)}
                                  rows={4}
                                  disabled={saving}
                                  className="w-full min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={draftValue}
                                  onChange={(e) => setDraftValue(e.target.value)}
                                  disabled={saving}
                                  className="w-full min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                                />
                              )}
                              {saveError && isEditing && (
                                <p
                                  className="flex items-start gap-1.5 text-xs text-red-700"
                                  role="alert"
                                >
                                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  {saveError}
                                </p>
                              )}
                            </div>
                          ) : row.value ? (
                            row.value
                          ) : (
                            <span className="italic text-slate-400">(boş)</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isEditing ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSave(row.key)}
                                disabled={!tokenPresent || saving}
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
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              disabled={!tokenPresent || saving || editingKey !== null}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Düzenle
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
