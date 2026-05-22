import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
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
  parseAdminPages,
  type AdminPageCardRow,
  type AdminPageContentRow,
  type AdminPagesData,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { adminV2Patch } from '@/lib/adminV2Patch';

function Cell({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return <span className="text-slate-800">{value}</span>;
}

type ContentEditable = AdminPageContentRow & { isActive: boolean };
type CardEditable = AdminPageCardRow & { isActive: boolean };

function enrichPages(bundle: AdminV2ContentBundle): AdminPagesData & {
  contentsWithActive: ContentEditable[];
} {
  const parsed = parseAdminPages(bundle);
  const rawContents = bundle.pageContents ?? [];
  const rawById = new Map<string, Record<string, unknown>>();
  for (const item of rawContents) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row.id != null) rawById.set(String(row.id), row);
  }

  const contentsWithActive: ContentEditable[] = [];
  for (const group of parsed.groups) {
    for (const c of group.contents) {
      const raw = rawById.get(c.id);
      contentsWithActive.push({
        ...c,
        isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
      });
    }
  }

  const rawCardsFlat: (AdminPageCardRow & { isActive: boolean })[] = [];
  for (const group of bundle.pageCards ?? []) {
    if (!group || typeof group !== 'object') continue;
    const g = group as Record<string, unknown>;
    const pageKey = typeof g.pageKey === 'string' ? g.pageKey : '';
    const cards = Array.isArray(g.cards) ? g.cards : [];
    for (const item of cards) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const cardKey = typeof row.cardKey === 'string' ? row.cardKey : '';
      if (!cardKey) continue;
      rawCardsFlat.push({
        id: row.id != null ? String(row.id) : `${pageKey}:${cardKey}`,
        pageKey,
        cardKey,
        title: typeof row.title === 'string' ? row.title : null,
        description: typeof row.description === 'string' ? row.description : null,
        iconName: typeof row.iconName === 'string' ? row.iconName : null,
        linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
        isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
      });
    }
  }

  const groups = parsed.groups.map((group) => ({
    ...group,
    contents: group.contents.map((c) => {
      const found = contentsWithActive.find((x) => x.id === c.id);
      return found ?? { ...c, isActive: true };
    }),
    cards: group.cards.map((card) => {
      const found = rawCardsFlat.find(
        (x) => x.pageKey === card.pageKey && x.cardKey === card.cardKey,
      );
      return found ?? { ...card, isActive: true };
    }),
  }));

  return {
    groups,
    totalContents: parsed.totalContents,
    totalCards: parsed.totalCards,
    contentsWithActive,
  };
}

export function AdminV2PagesPage() {
  const [data, setData] = useState<ReturnType<typeof enrichPages> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setData(enrichPages(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Sayfa içerikleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) loadPages();
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

  const startContentEdit = (row: ContentEditable) => {
    if (!tokenPresent || !row.id) return;
    setEditingKey(`content:${row.id}`);
    setDraft({
      title: row.title ?? '',
      eyebrow: row.eyebrow ?? '',
      subtitle: row.subtitle ?? '',
      description: row.description ?? '',
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setSaveError(null);
  };

  const startCardEdit = (row: CardEditable) => {
    if (!tokenPresent || !row.id) return;
    setEditingKey(`card:${row.id}`);
    setDraft({
      title: row.title ?? '',
      description: row.description ?? '',
      iconName: row.iconName ?? '',
      linkUrl: row.linkUrl ?? '',
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
      if (editingKey.startsWith('content:')) {
        const id = editingKey.slice(8);
        await adminV2Patch(`/api/admin/v2/pages/contents/${id}`, {
          title: String(draft.title ?? ''),
          eyebrow: String(draft.eyebrow ?? ''),
          subtitle: String(draft.subtitle ?? ''),
          description: String(draft.description ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      } else if (editingKey.startsWith('card:')) {
        const id = editingKey.slice(5);
        await adminV2Patch(`/api/admin/v2/pages/cards/${id}`, {
          title: String(draft.title ?? ''),
          description: String(draft.description ?? ''),
          iconName: String(draft.iconName ?? ''),
          linkUrl: String(draft.linkUrl ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      }
      cancelEdit();
      await loadPages();
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
          <code className="rounded bg-slate-200 px-1 text-xs">pageContents</code> ve{' '}
          <code className="rounded bg-slate-200 px-1 text-xs">pageCards</code> — pageKey/sectionKey/cardKey
          salt okunur.
        </p>
        <button
          type="button"
          onClick={loadPages}
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
          Sayfa içerikleri yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && data && (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">pageContents</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalContents}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">pageCards</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalCards}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Sayfa (pageKey)</p>
              <p className="text-2xl font-bold text-slate-900">{data.groups.length}</p>
            </div>
          </div>

          {data.groups.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              Yayınlanmış sayfa içeriği veya kartı bulunamadı.
            </p>
          ) : (
            <div className="space-y-3">
              {data.groups.map((group) => (
                <details
                  key={group.pageKey}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:ring-2 open:ring-emerald-500/20"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none hover:bg-slate-50">
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-900">{group.pageKey}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.contents.length} içerik · {group.cards.length} kart
                      </p>
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="space-y-6 border-t border-slate-100 px-5 py-4">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        pageContents
                      </h3>
                      {group.contents.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Bu sayfada içerik yok.</p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {group.contents.map((row) => {
                            const isEditing = editingKey === `content:${row.id}`;
                            return (
                              <li
                                key={row.id}
                                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
                              >
                                <p className="font-mono text-xs text-slate-500">
                                  sectionKey: {row.sectionKey}
                                </p>
                                {isEditing ? (
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {(
                                      [
                                        ['eyebrow', 'eyebrow'],
                                        ['title', 'title'],
                                        ['subtitle', 'subtitle'],
                                        ['description', 'description'],
                                      ] as const
                                    ).map(([key, label]) => (
                                      <div
                                        key={key}
                                        className={key === 'description' ? 'sm:col-span-2' : ''}
                                      >
                                        <label className="text-xs font-semibold text-slate-500">
                                          {label}
                                        </label>
                                        {textUsesTextarea(String(draft[key] ?? '')) ? (
                                          <textarea
                                            value={String(draft[key] ?? '')}
                                            onChange={(e) =>
                                              setDraft((d) => ({ ...d, [key]: e.target.value }))
                                            }
                                            rows={2}
                                            disabled={saving}
                                            className={`${adminInputClass} mt-1`}
                                          />
                                        ) : (
                                          <input
                                            type="text"
                                            value={String(draft[key] ?? '')}
                                            onChange={(e) =>
                                              setDraft((d) => ({ ...d, [key]: e.target.value }))
                                            }
                                            disabled={saving}
                                            className={`${adminInputClass} mt-1`}
                                          />
                                        )}
                                      </div>
                                    ))}
                                    <input
                                      type="number"
                                      value={String(draft.sortOrder ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, sortOrder: e.target.value }))
                                      }
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
                                  <dl className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                                    <div>
                                      eyebrow: <Cell value={row.eyebrow} />
                                    </div>
                                    <div>
                                      title: <Cell value={row.title} />
                                    </div>
                                    <div className="sm:col-span-2">
                                      description: <Cell value={row.description} />
                                    </div>
                                    <div>
                                      sıra: {row.sortOrder} · {row.isActive ? 'Aktif' : 'Pasif'}
                                    </div>
                                  </dl>
                                )}
                                <AdminEditToolbar
                                  isEditing={isEditing}
                                  saving={saving}
                                  tokenPresent={tokenPresent}
                                  editDisabled={globalEdit && !isEditing}
                                  saveError={isEditing ? saveError : null}
                                  onEdit={() => startContentEdit(row)}
                                  onSave={handleSave}
                                  onCancel={cancelEdit}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>

                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        pageCards
                      </h3>
                      {group.cards.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Bu sayfada kart yok.</p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {group.cards.map((row) => {
                            const isEditing = editingKey === `card:${row.id}`;
                            return (
                              <li
                                key={row.id}
                                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
                              >
                                <p className="font-mono text-xs text-slate-500">
                                  cardKey: {row.cardKey}
                                </p>
                                {isEditing ? (
                                  <div className="mt-2 space-y-2">
                                    <input
                                      type="text"
                                      value={String(draft.title ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, title: e.target.value }))
                                      }
                                      disabled={saving}
                                      className={adminInputClass}
                                      placeholder="title"
                                    />
                                    <textarea
                                      value={String(draft.description ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, description: e.target.value }))
                                      }
                                      rows={2}
                                      disabled={saving}
                                      className={adminInputClass}
                                    />
                                    <input
                                      type="text"
                                      value={String(draft.iconName ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, iconName: e.target.value }))
                                      }
                                      disabled={saving}
                                      className={adminInputClass}
                                    />
                                    <input
                                      type="text"
                                      value={String(draft.linkUrl ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, linkUrl: e.target.value }))
                                      }
                                      disabled={saving}
                                      className={`${adminInputClass} font-mono text-xs`}
                                    />
                                    <input
                                      type="number"
                                      value={String(draft.sortOrder ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, sortOrder: e.target.value }))
                                      }
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
                                  <dl className="mt-2 space-y-1 text-xs">
                                    <div>
                                      title: <Cell value={row.title} />
                                    </div>
                                    <div>
                                      linkUrl: <Cell value={row.linkUrl} />
                                    </div>
                                    <div>
                                      sıra: {row.sortOrder} · {row.isActive ? 'Aktif' : 'Pasif'}
                                    </div>
                                  </dl>
                                )}
                                <AdminEditToolbar
                                  isEditing={isEditing}
                                  saving={saving}
                                  tokenPresent={tokenPresent}
                                  editDisabled={globalEdit && !isEditing}
                                  saveError={isEditing ? saveError : null}
                                  onEdit={() => startCardEdit(row)}
                                  onSave={handleSave}
                                  onCancel={cancelEdit}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
