import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminActiveCheckbox,
  AdminEditToolbar,
  adminInputClass,
} from '@/admin/v2/adminV2EditUi';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminLabelClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import {
  fetchAdminV2ContentBundle,
  parseAdminFaq,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import { createAdminV2FaqCategory, createAdminV2FaqItem } from '@/lib/adminFaq';
import { adminV2Patch } from '@/lib/adminV2Patch';
import { Card } from '@/components/ui/Card';

type FaqItemEditable = {
  id: string;
  code: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqCategoryEditable = {
  id: string;
  code: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  items: FaqItemEditable[];
};

type FaqDataEditable = {
  categories: FaqCategoryEditable[];
  totalCategories: number;
  totalQuestions: number;
};

function enrichFaq(bundle: AdminV2ContentBundle): FaqDataEditable {
  const parsed = parseAdminFaq(bundle);
  const rawCategories = bundle.faq?.categories ?? [];
  const rawByCode = new Map<string, Record<string, unknown>>();

  for (const item of rawCategories) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const code = typeof row.code === 'string' ? row.code : '';
    if (code) rawByCode.set(code, row);
  }

  const categories = parsed.categories.map((cat) => {
    const raw = rawByCode.get(cat.code);
    const rawItems = Array.isArray(raw?.items) ? raw.items : [];
    const rawItemByCode = new Map<string, Record<string, unknown>>();
    for (const q of rawItems) {
      if (!q || typeof q !== 'object') continue;
      const item = q as Record<string, unknown>;
      const code = typeof item.code === 'string' ? item.code : '';
      if (code) rawItemByCode.set(code, item);
    }

    return {
      id: raw?.id != null ? String(raw.id) : '',
      code: cat.code,
      title: cat.title,
      sortOrder: cat.sortOrder,
      isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
      items: cat.items.map((item) => {
        const rawItem = rawItemByCode.get(item.code);
        return {
          id: rawItem?.id != null ? String(rawItem.id) : '',
          code: item.code,
          question: item.question,
          answer: item.answer,
          sortOrder: item.sortOrder,
          isActive: typeof rawItem?.isActive === 'boolean' ? rawItem.isActive : true,
        };
      }),
    };
  });

  return {
    categories,
    totalCategories: parsed.totalCategories,
    totalQuestions: parsed.totalQuestions,
  };
}

export function AdminV2FaqPage() {
  const [data, setData] = useState<FaqDataEditable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modal, setModal] = useState<'category' | 'item' | null>(null);
  const [itemTarget, setItemTarget] = useState<{ id: number; title: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [catForm, setCatForm] = useState({ title: '', code: '', sortOrder: '0', isActive: true });
  const [itemForm, setItemForm] = useState({
    question: '',
    answer: '',
    sortOrder: '0',
    isActive: true,
  });

  const { tokenPresent, revision, invalidateBundle } = useAdminToken();

  const loadFaq = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setData(enrichFaq(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'SSS yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) loadFaq();
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

  const startCategoryEdit = (cat: FaqCategoryEditable) => {
    if (!tokenPresent || !cat.id) return;
    setSaveError(null);
    setEditingKey(`cat:${cat.id}`);
    setDraft({
      title: cat.title,
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
    });
  };

  const startItemEdit = (item: FaqItemEditable) => {
    if (!tokenPresent || !item.id) return;
    setSaveError(null);
    setEditingKey(`item:${item.id}`);
    setDraft({
      question: item.question,
      answer: item.answer,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
  };

  const handleSave = async () => {
    if (!tokenPresent || !editingKey) return;
    setSaving(true);
    setSaveError(null);
    try {
      const sortOrder = Number.parseInt(String(draft.sortOrder ?? ''), 10);
      if (!Number.isFinite(sortOrder)) {
        setSaveError('Sıra numarası geçerli bir sayı olmalıdır.');
        return;
      }

      if (editingKey.startsWith('cat:')) {
        const id = editingKey.slice(4);
        await adminV2Patch(`/api/admin/v2/faq/categories/${id}`, {
          title: String(draft.title ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      } else if (editingKey.startsWith('item:')) {
        const id = editingKey.slice(5);
        await adminV2Patch(`/api/admin/v2/faq/items/${id}`, {
          question: String(draft.question ?? ''),
          answer: String(draft.answer ?? ''),
          sortOrder,
          isActive: Boolean(draft.isActive),
        });
      }

      cancelEdit();
      await loadFaq();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const globalEditActive = editingKey !== null;

  const openCategoryModal = () => {
    setModalError(null);
    setCatForm({ title: '', code: '', sortOrder: '0', isActive: true });
    setModal('category');
  };

  const openItemModal = (cat: FaqCategoryEditable) => {
    const id = Number.parseInt(cat.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Bu kategori için geçerli id bulunamadı; yenileyip tekrar deneyin.');
      return;
    }
    setModalError(null);
    setItemTarget({ id, title: cat.title });
    setItemForm({ question: '', answer: '', sortOrder: '0', isActive: true });
    setModal('item');
  };

  const closeModal = () => {
    setModal(null);
    setItemTarget(null);
    setModalError(null);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenPresent) return;
    const title = catForm.title.trim();
    if (!title) {
      setModalError('Kategori başlığı zorunludur.');
      return;
    }
    const sortOrder = Number.parseInt(catForm.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setModalError('Sıra geçerli bir sayı olmalıdır.');
      return;
    }
    setModalSaving(true);
    setModalError(null);
    try {
      await createAdminV2FaqCategory({
        title,
        code: catForm.code.trim() || undefined,
        sortOrder,
        isActive: catForm.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadFaq();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Kategori eklenemedi');
    } finally {
      setModalSaving(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenPresent || !itemTarget) return;
    const question = itemForm.question.trim();
    if (!question) {
      setModalError('Soru metni zorunludur.');
      return;
    }
    const sortOrder = Number.parseInt(itemForm.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setModalError('Sıra geçerli bir sayı olmalıdır.');
      return;
    }
    setModalSaving(true);
    setModalError(null);
    try {
      await createAdminV2FaqItem({
        categoryId: itemTarget.id,
        question,
        answer: itemForm.answer,
        sortOrder,
        isActive: itemForm.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadFaq();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Soru eklenemedi');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>SSS Yönetimi</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[#5c6b7a]">
            Kategori ve soru-cevap ekleyin; değişiklikler /sss sayfasına yansır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadFaq()}
            disabled={!tokenPresent || loading || saving || modalSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-semibold shadow-sm hover:bg-[#f7faf9] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={openCategoryModal}
            disabled={!tokenPresent || saving || modalSaving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
          >
            <Plus className="h-4 w-4" />
            Yeni kategori ekle
          </button>
        </div>
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
          SSS yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && data && (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Toplam kategori</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalCategories}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Toplam soru</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalQuestions}</p>
            </div>
          </div>

          {data.categories.length === 0 ? (
            <Card>
              <p className="text-center text-sm text-slate-500">
                Henüz SSS kategorisi yok.{' '}
                <button
                  type="button"
                  onClick={openCategoryModal}
                  disabled={!tokenPresent}
                  className="font-semibold text-[#0f5c56] underline disabled:opacity-50"
                >
                  İlk kategoriyi ekleyin
                </button>
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.categories.map((category) => {
                const catEditing = editingKey === `cat:${category.id}`;
                return (
                  <details
                    key={category.code}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:ring-2 open:ring-emerald-500/20"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        {catEditing ? (
                          <input
                            type="text"
                            value={String(draft.title ?? '')}
                            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                            disabled={saving}
                            className={adminInputClass}
                            onClick={(e) => e.preventDefault()}
                          />
                        ) : (
                          <p className="font-bold text-slate-900">{category.title}</p>
                        )}
                        <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="font-mono">code: {category.code}</span>
                          <span>Sıra: {catEditing ? draft.sortOrder : category.sortOrder}</span>
                          <span>{category.items.length} soru</span>
                          <span>{category.isActive ? 'Aktif' : 'Pasif'}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openItemModal(category);
                        }}
                        disabled={!tokenPresent || modalSaving || globalEditActive}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#cfe0db] bg-[#f7faf9] px-3 py-1.5 text-[12px] font-semibold text-[#0f5c56] hover:bg-[#eef5f3] disabled:opacity-50"
                        title="Bu kategoriye yeni soru-cevap ekler"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Soru ekle
                      </button>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 px-5 py-4">
                      {catEditing && (
                        <div className="mb-4 space-y-2" onClick={(e) => e.stopPropagation()}>
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
                      )}
                      <AdminEditToolbar
                        isEditing={catEditing}
                        saving={saving}
                        tokenPresent={tokenPresent}
                        editDisabled={globalEditActive && !catEditing}
                        saveError={catEditing ? saveError : null}
                        onEdit={() => startCategoryEdit(category)}
                        onSave={handleSave}
                        onCancel={cancelEdit}
                      />

                      {category.items.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">Bu kategoride soru yok.</p>
                      ) : (
                        <ul className="mt-4 space-y-4">
                          {category.items.map((item) => {
                            const itemEditing = editingKey === `item:${item.id}`;
                            return (
                              <li
                                key={item.code}
                                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                              >
                                {itemEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={String(draft.question ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, question: e.target.value }))
                                      }
                                      disabled={saving}
                                      className={adminInputClass}
                                    />
                                    <textarea
                                      value={String(draft.answer ?? '')}
                                      onChange={(e) =>
                                        setDraft((d) => ({ ...d, answer: e.target.value }))
                                      }
                                      rows={4}
                                      disabled={saving}
                                      className={adminInputClass}
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
                                  <>
                                    <p className="font-semibold text-slate-900">{item.question}</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                      {item.answer || (
                                        <span className="italic text-slate-400">(cevap boş)</span>
                                      )}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-400">
                                      <span className="font-mono">{item.code}</span> · Sıra:{' '}
                                      {item.sortOrder} · {item.isActive ? 'Aktif' : 'Pasif'}
                                    </p>
                                  </>
                                )}
                                <AdminEditToolbar
                                  isEditing={itemEditing}
                                  saving={saving}
                                  tokenPresent={tokenPresent}
                                  editDisabled={globalEditActive && !itemEditing}
                                  saveError={itemEditing ? saveError : null}
                                  onEdit={() => startItemEdit(item)}
                                  onSave={handleSave}
                                  onCancel={cancelEdit}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </>
      )}

      {modal === 'category' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1a2433]/40 p-4 backdrop-blur-sm">
          <div className={`${adminCardClass} w-full max-w-md`} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-[#dbe4ea] px-5 py-4">
              <h2 className="text-lg font-bold text-[#1e2a3a]">Yeni kategori</h2>
              <button type="button" onClick={closeModal} disabled={modalSaving} className="rounded-lg p-2 hover:bg-[#f0f5f4]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4 p-5" onSubmit={handleCreateCategory}>
              {modalError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
                  {modalError}
                </p>
              )}
              <div>
                <label className={adminLabelClass}>Kategori başlığı *</label>
                <input
                  className={`${adminInputClass} mt-1.5`}
                  value={catForm.title}
                  onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={modalSaving}
                  required
                  placeholder="Örn. Genel sorular"
                />
              </div>
              <div>
                <label className={adminLabelClass}>Sıra</label>
                <input
                  type="number"
                  className={`${adminInputClass} mt-1.5 max-w-[100px]`}
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  disabled={modalSaving}
                />
              </div>
              <AdminActiveCheckbox
                checked={catForm.isActive}
                disabled={modalSaving}
                onChange={(v) => setCatForm((f) => ({ ...f, isActive: v }))}
              />
              <details className={adminMutedPanelClass}>
                <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-[#5c6b7a]">
                  Gelişmiş bilgi
                </summary>
                <div className="border-t border-[#dbe4ea] px-3 py-3">
                  <label className={adminLabelClass}>Code (isteğe bağlı)</label>
                  <p className="mt-0.5 text-[11px] text-[#8a9aaa]">
                    Boş bırakılırsa başlıktan otomatik üretilir.
                  </p>
                  <input
                    className={`${adminInputClass} mt-1.5 font-mono text-[12px]`}
                    value={catForm.code}
                    onChange={(e) => setCatForm((f) => ({ ...f, code: e.target.value }))}
                    disabled={modalSaving}
                    placeholder="genel-sorular"
                  />
                </div>
              </details>
              <div className="flex justify-end gap-2 border-t border-[#eef2f5] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSaving}
                  className="rounded-lg border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
                >
                  {modalSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'item' && itemTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1a2433]/40 p-4 backdrop-blur-sm">
          <div className={`${adminCardClass} w-full max-w-lg`} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-[#dbe4ea] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#1e2a3a]">Yeni soru-cevap</h2>
                <p className="text-[13px] text-[#0f5c56]">{itemTarget.title}</p>
              </div>
              <button type="button" onClick={closeModal} disabled={modalSaving} className="rounded-lg p-2 hover:bg-[#f0f5f4]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4 p-5" onSubmit={handleCreateItem}>
              {modalError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
                  {modalError}
                </p>
              )}
              <div>
                <label className={adminLabelClass}>Soru *</label>
                <input
                  className={`${adminInputClass} mt-1.5`}
                  value={itemForm.question}
                  onChange={(e) => setItemForm((f) => ({ ...f, question: e.target.value }))}
                  disabled={modalSaving}
                  required
                />
              </div>
              <div>
                <label className={adminLabelClass}>Cevap *</label>
                <textarea
                  className={`${adminInputClass} mt-1.5`}
                  rows={5}
                  value={itemForm.answer}
                  onChange={(e) => setItemForm((f) => ({ ...f, answer: e.target.value }))}
                  disabled={modalSaving}
                />
              </div>
              <div>
                <label className={adminLabelClass}>Sıra</label>
                <input
                  type="number"
                  className={`${adminInputClass} mt-1.5 max-w-[100px]`}
                  value={itemForm.sortOrder}
                  onChange={(e) => setItemForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  disabled={modalSaving}
                />
              </div>
              <AdminActiveCheckbox
                checked={itemForm.isActive}
                disabled={modalSaving}
                onChange={(v) => setItemForm((f) => ({ ...f, isActive: v }))}
              />
              <div className="flex justify-end gap-2 border-t border-[#eef2f5] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSaving}
                  className="rounded-lg border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
                >
                  {modalSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
