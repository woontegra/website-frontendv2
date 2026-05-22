import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import type { AdminMediaAssetRow } from '@/lib/adminContentBundle';
import { ActionButton } from '@/admin/ui';
import { adminInputClass, adminLabelClass, adminMutedPanelClass } from '@/admin/ui/adminUiClasses';
import {
  mediaDtoToAdminRow,
  uploadAdminV2Media,
  validateMediaUploadFile,
} from '@/lib/adminV2Media';
import { formatMediaCreateError, generateGeneralMediaAssetKey } from '@/lib/mediaUsageOptions';
import {
  canShowMediaImagePreview,
  mediaPickValue,
  resolveMediaPreviewSrc,
  truncateMediaUrl,
} from '@/admin/v2/mediaPickerUtils';

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  assets: AdminMediaAssetRow[];
  onSelect: (asset: AdminMediaAssetRow, value: string) => void;
  title?: string;
  /** Hero vb. — modal içinden Cloudinary yükleme */
  enableUpload?: boolean;
  /** true: yükleme bitince otomatik seç (hero slayt ekleme) */
  autoSelectAfterUpload?: boolean;
  uploadUsageLabel?: string;
  onAssetUploaded?: (asset: AdminMediaAssetRow) => void;
};

function MediaPickerPreview({ asset }: { asset: AdminMediaAssetRow }) {
  const [failed, setFailed] = useState(false);
  if (!asset.fileUrl || !canShowMediaImagePreview(asset) || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-[#cfe0db] bg-[#f7faf9] text-[#8a9aaa]">
        <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md border border-[#dbe4ea] bg-[#f7faf9]">
      <img
        src={resolveMediaPreviewSrc(asset.fileUrl)}
        alt={asset.altText ?? asset.title ?? 'Görsel'}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function assetCardLabel(asset: AdminMediaAssetRow, showTechnicalKey: boolean): string {
  if (asset.title?.trim()) return asset.title.trim();
  if (asset.altText?.trim()) return asset.altText.trim();
  if (showTechnicalKey) return asset.assetKey;
  return 'Görsel';
}

export function MediaPickerModal({
  open,
  onClose,
  assets,
  onSelect,
  title = 'Görsel seç',
  enableUpload = false,
  autoSelectAfterUpload = false,
  uploadUsageLabel = 'Ana sayfa hero görseli',
  onAssetUploaded,
}: MediaPickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extraAssets, setExtraAssets] = useState<AdminMediaAssetRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const displayAssets = useMemo(() => {
    const seen = new Set<string>();
    const merged: AdminMediaAssetRow[] = [];
    for (const a of [...extraAssets, ...assets]) {
      const key = String(a.id);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(a);
    }
    return merged;
  }, [assets, extraAssets]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !uploading) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, uploading]);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setAltText('');
      setUploading(false);
      setUploadError(null);
      setUploadSuccess(null);
      setExtraAssets([]);
    }
  }, [open]);

  const handleFileChange = (file: File | undefined) => {
    setUploadError(null);
    setUploadSuccess(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const err = validateMediaUploadFile(file);
    if (err) {
      setSelectedFile(null);
      setUploadError(err);
      return;
    }
    setSelectedFile(file);
  };

  const runUpload = async (selectAfterUpload: boolean) => {
    if (!selectedFile || uploading) return;
    const fileError = validateMediaUploadFile(selectedFile);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const assetKey = generateGeneralMediaAssetKey(selectedFile.name);
      const dto = await uploadAdminV2Media({
        file: selectedFile,
        assetKey,
        altText: altText.trim() || uploadUsageLabel,
        isActive: true,
      });
      const row = mediaDtoToAdminRow(dto, altText.trim() || uploadUsageLabel);
      setExtraAssets((prev) => [row, ...prev.filter((a) => a.id !== row.id)]);
      onAssetUploaded?.(row);
      setUploadSuccess('Görsel yüklendi ve listeye eklendi.');
      setSelectedFile(null);
      setAltText('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (selectAfterUpload) {
        onSelect(row, mediaPickValue(row));
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(formatMediaCreateError(msg));
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const showTechnicalKey = !enableUpload;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2433]/45 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={uploading ? undefined : onClose}
        disabled={uploading}
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#dbe4ea] bg-white shadow-[0_16px_48px_-12px_rgba(26,36,51,0.28)] sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#dbe4ea] px-4 py-3">
          <h2 id="media-picker-title" className="text-[15px] font-semibold text-[#1e2a3a]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dbe4ea] text-[#5c6b7a] hover:bg-[#f7faf9] disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {enableUpload && (
            <section className={`mb-4 space-y-3 p-3 ${adminMutedPanelClass}`}>
              <div>
                <p className="text-[13px] font-semibold text-[#1e2a3a]">Yeni görsel yükle</p>
                <p className="mt-0.5 text-[12px] text-[#5c6b7a]">
                  Kullanım: {uploadUsageLabel} · Cloudinary&apos;de saklanır (JPEG, PNG, WEBP, SVG · max 5
                  MB)
                </p>
              </div>

              <div>
                <label className={adminLabelClass}>Dosya</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} />
                    Bilgisayardan seç
                  </ActionButton>
                  {selectedFile && (
                    <span className="self-center text-[12px] text-[#5c6b7a]">
                      {selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className={adminLabelClass}>
                  Alt metin <span className="font-normal text-[#8a9aaa]">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  className={`${adminInputClass} mt-1.5`}
                  value={altText}
                  disabled={uploading}
                  placeholder={uploadUsageLabel}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              {uploadError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] text-red-800">
                  {uploadError}
                </p>
              )}
              {uploadSuccess && (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[12px] text-emerald-900">
                  {uploadSuccess}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {autoSelectAfterUpload ? (
                  <ActionButton
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={!selectedFile || uploading}
                    onClick={() => void runUpload(true)}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                        Yükleniyor…
                      </>
                    ) : (
                      'Yükle ve slayta ekle'
                    )}
                  </ActionButton>
                ) : (
                  <>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      type="button"
                      disabled={!selectedFile || uploading}
                      onClick={() => void runUpload(false)}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                          Yükleniyor…
                        </>
                      ) : (
                        'Yükle'
                      )}
                    </ActionButton>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      type="button"
                      disabled={!selectedFile || uploading}
                      onClick={() => void runUpload(true)}
                    >
                      Yükle ve seç
                    </ActionButton>
                  </>
                )}
              </div>
            </section>
          )}

          <p className="mb-2 text-[12px] font-medium text-[#5c6b7a]">Mevcut görseller</p>

          {displayAssets.length === 0 ? (
            <div className={`px-4 py-8 text-center ${adminMutedPanelClass}`}>
              <p className="text-[14px] font-medium text-[#1e2a3a]">
                {enableUpload ? 'Henüz görsel yok — yukarıdan yükleyin' : 'Henüz medya kaydı yok'}
              </p>
              {!enableUpload && (
                <p className="mt-2 text-[13px] leading-snug text-[#5c6b7a]">
                  Önce medya kayıtlarını tanımlayın; ardından buradan seçebilirsiniz.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {displayAssets.map((asset) => {
                const value = mediaPickValue(asset);
                const urlLabel = asset.fileUrl ? truncateMediaUrl(asset.fileUrl) : '—';
                const label = assetCardLabel(asset, showTechnicalKey);
                return (
                  <article
                    key={asset.id}
                    className="flex flex-col gap-2 rounded-xl border border-[#dbe4ea] bg-white p-3 shadow-[0_1px_2px_rgba(26,36,51,0.05)]"
                  >
                    <MediaPickerPreview asset={asset} />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-[12px] font-semibold text-[#1e2a3a]">{label}</p>
                      {showTechnicalKey && (
                        <p className="truncate font-mono text-[11px] text-[#8a9aaa]">{asset.assetKey}</p>
                      )}
                      <p className="truncate font-mono text-[11px] text-[#8a9aaa]" title={asset.fileUrl ?? ''}>
                        {urlLabel}
                      </p>
                    </div>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      type="button"
                      disabled={uploading}
                      onClick={() => {
                        onSelect(asset, value);
                        onClose();
                      }}
                    >
                      Seç
                    </ActionButton>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#dbe4ea] px-4 py-3 sm:flex sm:justify-end">
          <ActionButton variant="secondary" size="sm" type="button" onClick={onClose} disabled={uploading}>
            Kapat
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
