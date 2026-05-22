import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminActiveCheckbox,
  AdminEditToolbar,
  adminInputClass,
  textUsesTextarea,
} from '@/admin/v2/adminV2EditUi';
import {
  fetchAdminV2ContentBundle,
  parseAdminContact,
  type AdminContactData,
  type AdminContactSettingView,
  type AdminSupportCardRow,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { adminV2Patch } from '@/lib/adminV2Patch';
import { Card } from '@/components/ui/Card';

const SETTING_EDIT_KEY = 'setting';

type SupportCardEditable = AdminSupportCardRow & { isActive: boolean };

function enrichSupportCards(bundle: AdminV2ContentBundle): SupportCardEditable[] {
  const parsed = parseAdminContact(bundle).supportCards;
  const raw = bundle.contact?.supportCards ?? [];
  const rawById = new Map<string, Record<string, unknown>>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.id != null) rawById.set(String(row.id), row);
  }
  return parsed.map((card) => {
    const r = rawById.get(card.id);
    return {
      ...card,
      isActive: typeof r?.isActive === 'boolean' ? r.isActive : true,
    };
  });
}

export function AdminV2ContactPage() {
  const [data, setData] = useState<AdminContactData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [settingDraft, setSettingDraft] = useState<AdminContactSettingView | null>(null);
  const [cardDraft, setCardDraft] = useState<{
    title: string;
    description: string;
    iconName: string;
    sortOrder: string;
    isActive: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadContact = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      const parsed = parseAdminContact(bundle);
      setData({
        ...parsed,
        supportCards: enrichSupportCards(bundle),
      });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'İletişim verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) loadContact();
    else {
      setData(null);
      setEditingKey(null);
    }
  }, [tokenPresent, revision]);

  const cancelEdit = () => {
    setEditingKey(null);
    setSettingDraft(null);
    setCardDraft(null);
    setSaveError(null);
  };

  const startSettingEdit = () => {
    if (!tokenPresent || !data?.setting) return;
    setSaveError(null);
    setEditingKey(SETTING_EDIT_KEY);
    setSettingDraft({ ...data.setting });
  };

  const startCardEdit = (card: SupportCardEditable) => {
    if (!tokenPresent || !card.id) return;
    setSaveError(null);
    setEditingKey(card.id);
    setCardDraft({
      title: card.title,
      description: card.description ?? '',
      iconName: card.iconName ?? '',
      sortOrder: String(card.sortOrder),
      isActive: card.isActive,
    });
  };

  const handleSave = async () => {
    if (!tokenPresent || !editingKey) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editingKey === SETTING_EDIT_KEY && settingDraft) {
        await adminV2Patch('/api/admin/v2/contact/setting', {
          contactEmail: settingDraft.contactEmail ?? '',
          contactPhone: settingDraft.contactPhone ?? '',
          phoneNote: settingDraft.phoneNote ?? '',
          contactAddress: settingDraft.contactAddress ?? '',
          panelLoginUrl: settingDraft.panelLoginUrl ?? '',
        });
      } else if (cardDraft) {
        const sortOrder = Number.parseInt(cardDraft.sortOrder, 10);
        if (!Number.isFinite(sortOrder)) {
          setSaveError('Sıra numarası geçerli bir sayı olmalıdır.');
          return;
        }
        await adminV2Patch(`/api/admin/v2/contact/support-cards/${editingKey}`, {
          title: cardDraft.title,
          description: cardDraft.description,
          iconName: cardDraft.iconName,
          sortOrder,
          isActive: cardDraft.isActive,
        });
      }
      cancelEdit();
      await loadContact();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const settingEditing = editingKey === SETTING_EDIT_KEY;
  const globalEdit = editingKey !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Content bundle <code className="rounded bg-slate-200 px-1 text-xs">contact</code> — iletişim
          alanları ve destek kartları düzenlenebilir.
        </p>
        <button
          type="button"
          onClick={loadContact}
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
          İletişim yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && data && (
        <>
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              contact.setting
            </h2>
            {!data.setting ? (
              <p className="mt-4 text-sm text-slate-500">İletişim ayarı kaydı yok.</p>
            ) : settingEditing && settingDraft ? (
              <dl className="mt-4 space-y-3">
                {(
                  [
                    ['contactEmail', 'E-posta'],
                    ['contactPhone', 'Telefon'],
                    ['phoneNote', 'Telefon notu'],
                    ['contactAddress', 'Adres'],
                    ['panelLoginUrl', 'Panel giriş URL'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                    <dd className="mt-1">
                      {key === 'contactAddress' && textUsesTextarea(settingDraft[key] ?? '') ? (
                        <textarea
                          value={settingDraft[key] ?? ''}
                          onChange={(e) =>
                            setSettingDraft((s) =>
                              s ? { ...s, [key]: e.target.value } : s,
                            )
                          }
                          rows={3}
                          disabled={saving}
                          className={adminInputClass}
                        />
                      ) : (
                        <input
                          type="text"
                          value={settingDraft[key] ?? ''}
                          onChange={(e) =>
                            setSettingDraft((s) =>
                              s ? { ...s, [key]: e.target.value } : s,
                            )
                          }
                          disabled={saving}
                          className={adminInputClass}
                        />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <dl className="mt-4 divide-y divide-slate-100">
                {(
                  [
                    ['contactEmail', 'E-posta'],
                    ['contactPhone', 'Telefon'],
                    ['phoneNote', 'Telefon notu'],
                    ['contactAddress', 'Adres'],
                    ['panelLoginUrl', 'Panel giriş URL'],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4 sm:py-3.5"
                  >
                    <dt className="w-40 shrink-0 text-sm font-semibold text-slate-600">{label}</dt>
                    <dd className="min-w-0 flex-1 break-words text-sm text-slate-900">
                      {data.setting[key] ?? (
                        <span className="italic text-slate-400">(boş)</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {data.setting && (
              <AdminEditToolbar
                isEditing={settingEditing}
                saving={saving}
                tokenPresent={tokenPresent}
                editDisabled={globalEdit && !settingEditing}
                saveError={settingEditing ? saveError : null}
                onEdit={startSettingEdit}
                onSave={handleSave}
                onCancel={cancelEdit}
              />
            )}
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                contact.supportCards
              </h2>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-bold text-emerald-800">
                {data.totalSupportCards}
              </span>
            </div>

            {data.supportCards.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">Destek kartı bulunamadı.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.supportCards.map((card) => {
                  const isEditing = editingKey === card.id;
                  return (
                    <div key={card.id} className="px-5 py-4">
                      {isEditing && cardDraft ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={cardDraft.title}
                            onChange={(e) =>
                              setCardDraft((d) => (d ? { ...d, title: e.target.value } : d))
                            }
                            disabled={saving}
                            className={adminInputClass}
                          />
                          <textarea
                            value={cardDraft.description}
                            onChange={(e) =>
                              setCardDraft((d) =>
                                d ? { ...d, description: e.target.value } : d,
                              )
                            }
                            rows={2}
                            disabled={saving}
                            className={adminInputClass}
                          />
                          <input
                            type="text"
                            value={cardDraft.iconName}
                            onChange={(e) =>
                              setCardDraft((d) => (d ? { ...d, iconName: e.target.value } : d))
                            }
                            disabled={saving}
                            className={adminInputClass}
                            placeholder="iconName"
                          />
                          <input
                            type="number"
                            value={cardDraft.sortOrder}
                            onChange={(e) =>
                              setCardDraft((d) => (d ? { ...d, sortOrder: e.target.value } : d))
                            }
                            disabled={saving}
                            className={`${adminInputClass} max-w-[100px]`}
                          />
                          <AdminActiveCheckbox
                            checked={cardDraft.isActive}
                            disabled={saving}
                            onChange={(v) =>
                              setCardDraft((d) => (d ? { ...d, isActive: v } : d))
                            }
                          />
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="font-semibold text-slate-900">{card.title}</p>
                          <p className="mt-1 text-slate-600">{card.description ?? '—'}</p>
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {card.iconName ?? '—'} · Sıra: {card.sortOrder}
                          </p>
                        </div>
                      )}
                      <AdminEditToolbar
                        isEditing={isEditing}
                        saving={saving}
                        tokenPresent={tokenPresent}
                        editDisabled={globalEdit && !isEditing}
                        saveError={isEditing ? saveError : null}
                        onEdit={() => startCardEdit(card)}
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
