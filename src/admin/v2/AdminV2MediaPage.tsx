import { useEffect, useState } from 'react';
import { ImageIcon, Loader2, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import {
  fetchAdminV2ContentBundle,
  parseAdminMediaAssets,
  type AdminMediaAssetRow,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import {
  createAdminV2Media,
  guessMimeTypeFromUrl,
  shortenUrl,
  updateAdminV2Media,
  uploadAdminV2Media,
  validateMediaUploadFile,
} from '@/lib/adminV2Media';
import {
  formatMediaCreateError,
  inferMediaUsageId,
  MEDIA_USAGE_OPTIONS,
  mediaUsageLabelForAssetKey,
  previewMediaAssetKey,
  resolveMediaAssetKey,
  type MediaUsageId,
} from '@/lib/mediaUsageOptions';

type MediaRow = AdminMediaAssetRow & { isActive: boolean; numericId: number | null };

type MediaFormState = {
  assetKey: string;
  fileUrl: string;
  altText: string;
  mimeType: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm = (): MediaFormState => ({
  assetKey: '',
  fileUrl: '',
  altText: '',
  mimeType: '',
  sortOrder: '0',
  isActive: true,
});

function enrichMedia(bundle: AdminV2ContentBundle): MediaRow[] {
  const rows = parseAdminMediaAssets(bundle);
  const rawByKey = new Map<string, Record<string, unknown>>();
  for (const item of bundle.mediaAssets ?? []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const key = typeof row.assetKey === 'string' ? row.assetKey : '';
    if (key) rawByKey.set(key, row);
  }
  return rows.map((row) => {
    const raw = rawByKey.get(row.assetKey);
    const idNum =
      raw?.id !== undefined && raw?.id !== null ? Number.parseInt(String(raw.id), 10) : NaN;
    return {
      ...row,
      numericId: Number.isInteger(idNum) && idNum > 0 ? idNum : null,
      isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
    };
  });
}

function resolvePreviewSrc(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith('//')) return fileUrl;
  if (fileUrl.startsWith('/')) return `${window.location.origin}${fileUrl}`;
  return fileUrl;
}

function MediaPreview({ fileUrl, alt }: { fileUrl: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!fileUrl || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-[#dbe4ea] bg-[#f7faf9] text-[#8a9aaa]">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[#dbe4ea] bg-[#f7faf9]">
      <img
        src={resolvePreviewSrc(fileUrl)}
        alt={alt}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

type CreateTab = 'url' | 'upload';

type MediaUploadPayload = {
  file: File;
  assetKey: string;
  altText: string;
  sortOrder: number;
  isActive: boolean;
};

function MediaUsageField({
  mode,
  assetKey,
  usageId,
  customAssetKey,
  fileName,
  saving,
  onUsageChange,
  onCustomKeyChange,
}: {
  mode: 'create' | 'edit';
  assetKey: string;
  usageId: MediaUsageId;
  customAssetKey: string;
  fileName?: string;
  saving: boolean;
  onUsageChange: (id: MediaUsageId) => void;
  onCustomKeyChange: (value: string) => void;
}) {
  const advancedPreview = previewMediaAssetKey(usageId, {
    customAssetKey,
    fileName,
  });

  if (mode === 'edit') {
    return (
      <div className="space-y-2">
        <div>
          <label className={adminLabelClass}>Bu görsel nerede kullanılacak?</label>
          <p className="mt-1.5 text-[14px] font-medium text-[#1e2a3a]">
            {mediaUsageLabelForAssetKey(assetKey)}
          </p>
        </div>
        <details className="rounded-lg border border-[#dbe4ea] bg-[#f7faf9]">
          <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-[#5c6b7a]">
            Gelişmiş bilgi
          </summary>
          <div className="border-t border-[#dbe4ea] px-3 py-2">
            <p className="text-[11px] text-[#8a9aaa]">Sistem tanımlayıcısı (assetKey)</p>
            <p className="mt-1 break-all font-mono text-[12px] text-[#4a5c6d]">{assetKey}</p>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <label className={adminLabelClass} htmlFor="media-usage-select">
          Bu görsel nerede kullanılacak? *
        </label>
        <select
          id="media-usage-select"
          className={`${adminInputClass} mt-1.5`}
          value={usageId}
          onChange={(e) => onUsageChange(e.target.value as MediaUsageId)}
          disabled={saving}
        >
          {MEDIA_USAGE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <details
        className="rounded-lg border border-[#dbe4ea] bg-[#f7faf9]"
        open={usageId === 'custom'}
      >
        <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-[#5c6b7a]">
          Gelişmiş bilgi
        </summary>
        <div className="space-y-2 border-t border-[#dbe4ea] px-3 py-2">
          {usageId === 'custom' ? (
            <>
              <label className="text-[12px] font-medium text-[#5c6b7a]">
                Özel tanımlayıcı (yalnızca gelişmiş kullanım)
              </label>
              <input
                className={`${adminInputClass} font-mono text-[12px]`}
                value={customAssetKey}
                onChange={(e) => onCustomKeyChange(e.target.value)}
                disabled={saving}
                placeholder="ornek.alan.gorsel"
              />
              <p className="text-[11px] text-[#8a9aaa]">
                Site şablonunun beklediği teknik anahtar. Emin değilseniz “Genel medya” seçin.
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] text-[#8a9aaa]">Kayıt sırasında atanacak sistem tanımlayıcısı</p>
              <p className="break-all font-mono text-[12px] text-[#4a5c6d]">{advancedPreview}</p>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

type MediaFormModalProps = {
  mode: 'create' | 'edit';
  open: boolean;
  initial: MediaFormState;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitUrl: (form: MediaFormState) => void;
  onSubmitUpload?: (payload: MediaUploadPayload) => void;
};

function MediaFormModal({
  mode,
  open,
  initial,
  saving,
  error,
  onClose,
  onSubmitUrl,
  onSubmitUpload,
}: MediaFormModalProps) {
  const [form, setForm] = useState<MediaFormState>(initial);
  const [createTab, setCreateTab] = useState<CreateTab>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [usageId, setUsageId] = useState<MediaUsageId>('general');
  const [customAssetKey, setCustomAssetKey] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial);
      setCreateTab('url');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setClientError(null);
      setUsageId(mode === 'edit' ? inferMediaUsageId(initial.assetKey) : 'general');
      setCustomAssetKey(
        mode === 'edit' && inferMediaUsageId(initial.assetKey) === 'custom'
          ? initial.assetKey
          : '',
      );
    }
  }, [open, initial, mode]);

  useEffect(() => {
    if (!filePreviewUrl) return;
    return () => URL.revokeObjectURL(filePreviewUrl);
  }, [filePreviewUrl]);

  if (!open) return null;

  const handleFileChange = (file: File | null) => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(file);
    setFilePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const isUploadTab = mode === 'create' && createTab === 'upload';

  const resolveSubmitAssetKey = (): string | null => {
    if (mode === 'edit') return form.assetKey.trim() || null;
    const key = resolveMediaAssetKey(usageId, {
      customAssetKey,
      fileName: selectedFile?.name,
    });
    if (!key) return null;
    return key;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1a2433]/40 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#dbe4ea] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#dbe4ea] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1e2a3a]">
            {mode === 'create' ? 'Yeni medya ekle' : 'Medya düzenle'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 hover:bg-[#f0f5f4]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setClientError(null);
            if (isUploadTab) {
              if (!selectedFile) {
                setClientError('Lütfen bir görsel dosyası seçin.');
                return;
              }
              const fileErr = validateMediaUploadFile(selectedFile);
              if (fileErr) {
                setClientError(fileErr);
                return;
              }
              const assetKey = resolveSubmitAssetKey();
              if (!assetKey) {
                setClientError(
                  usageId === 'custom'
                    ? 'Özel kullanım için tanımlayıcı girin.'
                    : 'Kullanım alanı seçilemedi.',
                );
                return;
              }
              const sortOrder = Number.parseInt(form.sortOrder, 10);
              if (!Number.isFinite(sortOrder)) {
                setClientError('Sıra geçerli bir sayı olmalıdır');
                return;
              }
              onSubmitUpload?.({
                file: selectedFile,
                assetKey,
                altText: form.altText,
                sortOrder,
                isActive: form.isActive,
              });
              return;
            }
            const assetKey = resolveSubmitAssetKey();
            if (!assetKey && mode === 'create') {
              setClientError(
                usageId === 'custom'
                  ? 'Özel kullanım için tanımlayıcı girin.'
                  : 'Kullanım alanı seçilemedi.',
              );
              return;
            }
            onSubmitUrl({ ...form, assetKey: assetKey ?? form.assetKey });
          }}
        >
          {(error || clientError) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error || clientError}
            </p>
          )}

          {mode === 'create' && (
            <div className="flex rounded-xl border border-[#dbe4ea] bg-[#f7faf9] p-1">
              <button
                type="button"
                onClick={() => setCreateTab('url')}
                disabled={saving}
                className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                  createTab === 'url'
                    ? 'bg-white text-[#0f5c56] shadow-sm'
                    : 'text-[#5c6b7a] hover:text-[#1e2a3a]'
                }`}
              >
                URL ile ekle
              </button>
              <button
                type="button"
                onClick={() => setCreateTab('upload')}
                disabled={saving}
                className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                  createTab === 'upload'
                    ? 'bg-white text-[#0f5c56] shadow-sm'
                    : 'text-[#5c6b7a] hover:text-[#1e2a3a]'
                }`}
              >
                Bilgisayardan yükle
              </button>
            </div>
          )}

          <MediaUsageField
            mode={mode}
            assetKey={form.assetKey}
            usageId={usageId}
            customAssetKey={customAssetKey}
            fileName={selectedFile?.name}
            saving={saving}
            onUsageChange={setUsageId}
            onCustomKeyChange={setCustomAssetKey}
          />

          {isUploadTab ? (
            <div>
              <label className={adminLabelClass}>Görsel dosyası *</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg"
                className={`${adminInputClass} mt-1.5`}
                disabled={saving}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              {selectedFile && (
                <p className="mt-1.5 text-[12px] text-[#5c6b7a]">
                  {selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              )}
              <p className="mt-1 text-[11px] text-[#8a9aaa]">
                JPEG, PNG, WEBP veya SVG · en fazla 5 MB · Vercel Blob’da saklanır
              </p>
              {filePreviewUrl && (
                <div className="mt-3">
                  <img
                    src={filePreviewUrl}
                    alt="Yükleme önizlemesi"
                    className="max-h-40 w-full rounded-lg border border-[#dbe4ea] object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className={adminLabelClass}>Görsel URL *</label>
                <input
                  type="url"
                  className={`${adminInputClass} mt-1.5`}
                  value={form.fileUrl}
                  onChange={(e) => {
                    const fileUrl = e.target.value;
                    setForm((f) => ({
                      ...f,
                      fileUrl,
                      mimeType: f.mimeType.trim() ? f.mimeType : guessMimeTypeFromUrl(fileUrl),
                    }));
                  }}
                  required={!isUploadTab}
                  disabled={saving}
                  placeholder="https://... veya /uploads/..."
                />
              </div>

              {form.fileUrl && (
                <MediaPreview
                  fileUrl={form.fileUrl}
                  alt={form.altText || form.assetKey || 'Önizleme'}
                />
              )}
            </>
          )}

          <div>
            <label className={adminLabelClass}>
              Alt metin <span className="font-normal text-[#8a9aaa]">(önerilir)</span>
            </label>
            <input
              className={`${adminInputClass} mt-1.5`}
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              disabled={saving}
              placeholder="Ekran okuyucu ve SEO için kısa açıklama"
            />
          </div>

          <div className={`grid gap-3 ${isUploadTab ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!isUploadTab && (
              <div>
                <label className={adminLabelClass}>MIME type</label>
                <input
                  className={`${adminInputClass} mt-1.5`}
                  value={form.mimeType}
                  onChange={(e) => setForm({ ...form, mimeType: e.target.value })}
                  disabled={saving}
                  placeholder="image/png"
                />
              </div>
            )}
            <div>
              <label className={adminLabelClass}>Sıra</label>
              <input
                type="number"
                className={`${adminInputClass} mt-1.5`}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] font-medium text-[#1e2a3a]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              disabled={saving}
            />
            Aktif (yayında)
          </label>

          <div className="flex justify-end gap-2 border-t border-[#eef2f5] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminV2MediaPage() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<MediaRow | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();

  const loadMedia = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setRows(enrichMedia(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setPageError(apiErr.message ?? 'Medya yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) void loadMedia();
    else setRows([]);
  }, [tokenPresent, revision]);

  const closeModal = () => {
    setModal(null);
    setEditTarget(null);
    setModalError(null);
  };

  const openCreate = () => {
    setEditTarget(null);
    setModalError(null);
    setModal('create');
  };

  const openEdit = (row: MediaRow) => {
    if (!row.numericId) {
      setPageError('Bu kayıt için geçerli id bulunamadı; yenileyip tekrar deneyin.');
      return;
    }
    setEditTarget(row);
    setModalError(null);
    setModal('edit');
  };

  const handleCreateUpload = async (payload: MediaUploadPayload) => {
    const assetKey = payload.assetKey.trim();
    if (!assetKey) {
      setModalError('Kullanım alanı belirlenemedi.');
      return;
    }
    const fileErr = validateMediaUploadFile(payload.file);
    if (fileErr) {
      setModalError(fileErr);
      return;
    }
    const sortOrder = payload.sortOrder;
    if (!Number.isFinite(sortOrder)) {
      setModalError('Sıra geçerli bir sayı olmalıdır');
      return;
    }

    setSaving(true);
    setModalError(null);
    try {
      await uploadAdminV2Media({
        file: payload.file,
        assetKey,
        altText: payload.altText,
        sortOrder,
        isActive: payload.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadMedia();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Yükleme başarısız';
      setModalError(formatMediaCreateError(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUrl = async (form: MediaFormState) => {
    const assetKey = form.assetKey.trim();
    const fileUrl = form.fileUrl.trim();
    if (!assetKey) {
      setModalError('Kullanım alanı belirlenemedi.');
      return;
    }
    if (!fileUrl) {
      setModalError('Görsel URL zorunludur');
      return;
    }
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setModalError('Sıra geçerli bir sayı olmalıdır');
      return;
    }

    setSaving(true);
    setModalError(null);
    try {
      await createAdminV2Media({
        assetKey,
        fileUrl,
        altText: form.altText,
        mimeType: form.mimeType.trim() || guessMimeTypeFromUrl(fileUrl),
        sortOrder,
        isActive: form.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadMedia();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayıt oluşturulamadı';
      setModalError(formatMediaCreateError(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: MediaFormState) => {
    if (!editTarget?.numericId) return;
    const fileUrl = form.fileUrl.trim();
    if (!fileUrl) {
      setModalError('Görsel URL zorunludur');
      return;
    }
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setModalError('Sıra geçerli bir sayı olmalıdır');
      return;
    }

    setSaving(true);
    setModalError(null);
    try {
      await updateAdminV2Media(editTarget.numericId, {
        fileUrl,
        altText: form.altText,
        mimeType: form.mimeType.trim() || guessMimeTypeFromUrl(fileUrl),
        sortOrder,
        isActive: form.isActive,
      });
      closeModal();
      invalidateBundle();
      await loadMedia();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const editInitial: MediaFormState = editTarget
    ? {
        assetKey: editTarget.assetKey,
        fileUrl: editTarget.fileUrl ?? '',
        altText: editTarget.altText ?? '',
        mimeType: editTarget.mimeType ?? '',
        sortOrder: String(editTarget.sortOrder),
        isActive: editTarget.isActive,
      }
    : emptyForm();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Medya kütüphanesi</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#5c6b7a]">
            Görselleri URL ile ekleyin veya bilgisayarınızdan yükleyin. Hangi sayfada kullanılacağını
            seçmeniz yeterli.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadMedia()}
            disabled={!tokenPresent || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px] font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={!tokenPresent || saving}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium ${adminAccentBtnClass}`}
          >
            <Plus className="h-4 w-4" />
            Yeni medya ekle
          </button>
        </div>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Medya işlemleri için admin token gerekir.
        </p>
      )}

      {pageError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {pageError}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-10 text-[#5c6b7a]">
          <Loader2 className="h-5 w-5 animate-spin text-[#0f5c56]" />
          Yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && rows.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#cfe0db] bg-white px-8 py-16 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-[#8a9aaa]" />
          <h2 className="mt-4 text-xl font-bold text-[#1e2a3a]">Henüz medya eklenmemiş</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-[#5c6b7a]">
            Ana sayfa, demo, iletişim ve fiyatlandırma görsellerini buradan tanımlayabilirsiniz.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-medium ${adminAccentBtnClass}`}
          >
            <Plus className="h-5 w-5" />
            Yeni medya ekle
          </button>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <article
              key={row.assetKey}
              className="flex flex-col rounded-2xl border border-[#dbe4ea] bg-white p-4 shadow-sm"
            >
              <MediaPreview fileUrl={row.fileUrl ?? ''} alt={row.altText ?? row.assetKey} />
              <p className="mt-3 text-[13px] font-semibold text-[#1e2a3a]">
                {mediaUsageLabelForAssetKey(row.assetKey)}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] text-[#5c6b7a]">
                {row.altText || <span className="italic text-[#8a9aaa]">Alt metin yok</span>}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-sky-800">
                {row.fileUrl ? shortenUrl(row.fileUrl) : '—'}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    row.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {row.isActive ? 'Aktif' : 'Pasif'}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#dbe4ea] px-3 py-1.5 text-[12px] font-medium hover:bg-[#f7faf9]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Düzenle
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <MediaFormModal
        mode={modal === 'edit' ? 'edit' : 'create'}
        open={modal !== null}
        initial={modal === 'edit' ? editInitial : emptyForm()}
        saving={saving}
        error={modalError}
        onClose={closeModal}
        onSubmitUrl={modal === 'edit' ? handleEdit : handleCreateUrl}
        onSubmitUpload={modal === 'create' ? handleCreateUpload : undefined}
      />
    </div>
  );
}
