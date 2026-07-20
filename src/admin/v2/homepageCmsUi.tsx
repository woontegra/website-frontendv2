import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import type { HeroSlideDraft } from '@/admin/v2/homepageAdminShared';
import type { ApiError } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  ActionButton,
  adminInputClass,
  adminMutedPanelClass,
  adminMutedPanelSubtleClass,
  EmptyState,
  FieldGrid,
  FieldGroup,
  InfoBanner,
  MetricCard,
  MetricCardButton,
  MetricCardGrid,
  MetricSaveRow,
  PageHeader,
  ReadOnlyField,
  SectionCard,
  SectionEditActions,
} from '@/admin/ui';
import {
  fetchAdminV2ContentBundle,
  parseAdminMarketing,
  type AdminCtaButtonRow,
  type AdminMediaAssetRow,
} from '@/lib/adminContentBundle';
import { adminV2Patch, ADMIN_V2_PATCH_ROUTES, parseAdminNumericId } from '@/lib/adminV2Patch';
import { MediaPickerModal } from '@/admin/v2/MediaPickerModal';
import {
  canShowMediaImagePreview,
  resolveMediaPreviewSrc,
} from '@/admin/v2/mediaPickerUtils';

export { adminInputClass as cmsInputClass };

export function HomepageCmsHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <PageHeader
      compact
      className="min-w-0 flex-1"
      title="Ana Sayfa Yönetimi"
      description="Tanıtım sitesinin ana sayfa bölümlerini buradan düzenleyin."
      actions={
        <>
          <ActionButton href="/" external icon={ExternalLink} variant="secondary" size="sm">
            Canlı site
          </ActionButton>
          <ActionButton to="/admin/v2/media" icon={ImageIcon} variant="secondary" size="sm">
            Medya
          </ActionButton>
          <ActionButton to="/admin/v2/technical/homepage-editor" icon={Wrench} variant="ghost" size="sm">
            Teknik
          </ActionButton>
          {trailing}
        </>
      }
    />
  );
}

export function CmsPanel({
  title,
  description,
  locationNote,
  editAction,
  children,
  className = '',
  tintedHeader = false,
}: {
  title: string;
  description: string;
  locationNote: string;
  editAction?: ReactNode;
  children: ReactNode;
  className?: string;
  tintedHeader?: boolean;
}) {
  return (
    <SectionCard
      compact
      tintedHeader={tintedHeader}
      className={className}
      title={title}
      description={description}
      locationNote={locationNote}
      action={editAction}
    >
      {children}
    </SectionCard>
  );
}

export function CmsEditButton(props: ComponentProps<typeof SectionEditActions>) {
  return <SectionEditActions compact {...props} />;
}

export function CmsField(props: {
  label: string;
  value: string | null | undefined;
  emptyLabel?: string;
}) {
  return <ReadOnlyField compact {...props} />;
}
export const CmsFieldGrid = FieldGrid;

export function CmsFormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FieldGroup label={label} className="lg:col-span-2">
      {children}
    </FieldGroup>
  );
}

export function CmsSaveError({ message }: { message: string | null }) {
  if (!message) return null;
  return <InfoBanner tone="error" className="mt-3">{message}</InfoBanner>;
}

export function CmsAdvancedInfo({ children }: { children: ReactNode }) {
  return (
    <details className="mt-6 group">
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-500 hover:text-slate-700">
        <span className="inline-flex items-center gap-1">
          Gelişmiş bilgi
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className={`mt-3 px-4 py-3 font-mono text-xs text-[#5c6b7a] ${adminMutedPanelClass}`}>
        {children}
      </div>
    </details>
  );
}

function CmsMediaThumb({
  assets,
  value,
}: {
  assets: AdminMediaAssetRow[];
  value?: string;
}) {
  const [failed, setFailed] = useState(false);
  const asset = useMemo(() => {
    const raw = value?.trim() ?? '';
    if (!raw) return null;
    return (
      assets.find(
        (a) =>
          a.assetKey === raw ||
          a.fileUrl === raw ||
          raw.endsWith(a.assetKey) ||
          (a.fileUrl && raw.includes(a.fileUrl)),
      ) ?? null
    );
  }, [assets, value]);

  const raw = value?.trim() ?? '';
  const src = useMemo(() => {
    if (asset?.fileUrl && canShowMediaImagePreview(asset)) return asset.fileUrl.trim();
    if (raw.startsWith('/') || /^https?:\/\//i.test(raw)) return raw;
    return null;
  }, [asset, raw]);

  if (!src || failed) {
    return (
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
          value ? 'bg-[#0f5c56] text-white' : 'bg-[#e4ebe8] text-[#8a9aaa]'
        }`}
      >
        <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#dbe4ea] bg-[#f7faf9]">
      <img
        src={resolveMediaPreviewSrc(src)}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function CmsMediaBlock({
  defined: _defined,
  summary,
  assets = [],
  currentValue,
  onPick,
  pickDisabled,
  pickTitle = 'Görsel seç',
  enableUpload,
  uploadUsageLabel,
  onAssetUploaded,
}: {
  defined: boolean;
  summary: string;
  assets?: AdminMediaAssetRow[];
  /** Formdaki heroImage / excel image değeri */
  currentValue?: string;
  onPick?: (value: string, asset: AdminMediaAssetRow) => void | Promise<void>;
  pickDisabled?: boolean;
  pickTitle?: string;
  enableUpload?: boolean;
  uploadUsageLabel?: string;
  onAssetUploaded?: (asset: AdminMediaAssetRow) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div
        className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between ${adminMutedPanelClass}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <CmsMediaThumb assets={assets} value={currentValue} />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#5c6b7a]">Görsel</p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-[#1e2a3a]">{summary}</p>
            {currentValue?.trim() && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-[#8a9aaa]">{currentValue}</p>
            )}
          </div>
        </div>
        {onPick ? (
          <ActionButton
            variant="secondary"
            size="sm"
            type="button"
            disabled={pickDisabled}
            onClick={() => setPickerOpen(true)}
          >
            Görsel Seç
          </ActionButton>
        ) : null}
      </div>

      {onPick && (
        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          assets={assets}
          title={pickTitle}
          enableUpload={enableUpload}
          uploadUsageLabel={uploadUsageLabel}
          onAssetUploaded={onAssetUploaded}
          onSelect={(asset, value) => void onPick(value, asset)}
        />
      )}
    </>
  );
}

export function CmsHeroCarouselEditor({
  slides,
  heroImageAlt,
  carouselIntervalMs,
  onSlidesChange,
  onAltChange,
  onIntervalChange,
  assets,
  onAddSlide,
  readOnly = false,
  pickDisabled,
  enableUpload,
  uploadUsageLabel,
  onAssetUploaded,
  saving,
}: {
  slides: HeroSlideDraft[];
  heroImageAlt: string;
  carouselIntervalMs?: number;
  onSlidesChange?: (slides: HeroSlideDraft[]) => void;
  onAltChange?: (alt: string) => void;
  onIntervalChange?: (intervalMs: number) => void;
  assets: AdminMediaAssetRow[];
  onAddSlide?: (value: string, asset: AdminMediaAssetRow) => void | Promise<void>;
  readOnly?: boolean;
  pickDisabled?: boolean;
  enableUpload?: boolean;
  uploadUsageLabel?: string;
  onAssetUploaded?: (asset: AdminMediaAssetRow) => void;
  saving?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobilePickerIndex, setMobilePickerIndex] = useState<number | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const moveSlide = (index: number, direction: -1 | 1) => {
    if (!onSlidesChange) return;
    const next = index + direction;
    if (next < 0 || next >= slides.length) return;
    const copy = [...slides];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onSlidesChange(
      copy.map((slide, slideIndex) => ({
        ...slide,
        sortOrder: slideIndex,
      })),
    );
  };

  const removeSlide = (index: number) => {
    if (!onSlidesChange) return;
    onSlidesChange(
      slides
        .filter((_, i) => i !== index)
        .map((slide, slideIndex) => ({ ...slide, sortOrder: slideIndex })),
    );
  };

  const updateSlideField = (
    index: number,
    patch: Partial<Pick<HeroSlideDraft, 'alt' | 'link' | 'isActive' | 'mobileUrl'>>,
  ) => {
    if (!onSlidesChange) return;
    onSlidesChange(slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  };

  const activeCount = slides.filter((slide) => slide.isActive).length;

  const addSlideFromUrl = (rawUrl: string) => {
    if (!onAddSlide) return;
    const url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setPasteError('Geçerli bir https:// görsel adresi girin (Blob medya URL’si).');
      return;
    }
    setPasteError(null);
    const asset: AdminMediaAssetRow = {
      id: `paste-${url}`,
      assetKey: 'paste.url',
      fileUrl: url,
      altText: null,
      mimeType: null,
      width: null,
      height: null,
      sortOrder: 0,
      title: null,
    };
    void onAddSlide(url, asset);
    setPasteUrl('');
  };

  return (
    <div className={`space-y-3 ${adminMutedPanelClass} p-3`}>
      <div>
        <p className="text-[12px] font-medium text-[#5c6b7a]">Ana sayfa hero görselleri</p>
        <p className="mt-0.5 text-[11px] text-[#8a9aaa]">
          Tek aktif görsel sabit gösterilir. Birden fazla aktif görselde otomatik carousel çalışır.
          {activeCount > 0 && (
            <span className="ml-1 font-medium text-[#0f5c56]">
              ({activeCount} aktif / {slides.length} toplam)
            </span>
          )}
        </p>
      </div>

      {!readOnly && onIntervalChange && (
        <FieldGroup label="Otomatik geçiş süresi (ms)" hint="2000–30000 arası; yalnızca 2+ aktif görselde uygulanır">
          <input
            type="number"
            min={2000}
            max={30000}
            step={500}
            value={carouselIntervalMs ?? 5500}
            disabled={saving}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(next)) onIntervalChange(next);
            }}
            className={`${adminInputClass} max-w-[12rem]`}
          />
        </FieldGroup>
      )}
      {readOnly && carouselIntervalMs != null && (
        <p className="text-xs text-slate-600">
          Otomatik geçiş: <span className="font-medium">{carouselIntervalMs} ms</span>
        </p>
      )}

      {slides.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz görsel yok. İlk görseli ekleyin.</p>
      ) : (
        <ul className="space-y-2">
          {slides.map((slide, index) => (
            <li
              key={`${slide.url}-${index}`}
              className={`flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-start ${
                slide.isActive ? 'border-[#dbe4ea]' : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    Sıra {slide.sortOrder + 1}
                  </span>
                  {!slide.isActive && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Pasif
                    </span>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <CmsMediaThumb assets={assets} value={slide.url} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#5c6b7a]">Masaüstü görseli</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-[#5c6b7a]">{slide.url}</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <CmsMediaThumb assets={assets} value={slide.mobileUrl || slide.url} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[12px] font-medium text-[#5c6b7a]">Mobil görseli</p>
                    {!readOnly && onSlidesChange ? (
                      <>
                        <input
                          type="url"
                          value={slide.mobileUrl}
                          onChange={(e) => updateSlideField(index, { mobileUrl: e.target.value })}
                          disabled={saving}
                          placeholder="Boş bırakılırsa masaüstü görseli kullanılır"
                          className={`${adminInputClass} font-mono text-xs`}
                        />
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          type="button"
                          disabled={pickDisabled || saving}
                          onClick={() => setMobilePickerIndex(index)}
                        >
                          Mobil görsel seç
                        </ActionButton>
                      </>
                    ) : slide.mobileUrl ? (
                      <p className="truncate font-mono text-[11px] text-[#5c6b7a]">{slide.mobileUrl}</p>
                    ) : (
                      <p className="text-[11px] text-[#8a9aaa]">Masaüstü görseli kullanılıyor</p>
                    )}
                  </div>
                </div>

                {!readOnly && onSlidesChange ? (
                  <>
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-[#5c6b7a]">Alt metin</p>
                      <input
                        type="text"
                        value={slide.alt}
                        onChange={(e) => updateSlideField(index, { alt: e.target.value })}
                        disabled={saving}
                        placeholder="Alternatif metin"
                        className={`${adminInputClass} text-xs`}
                      />
                    </div>
                    <input
                      type="text"
                      value={slide.link}
                      onChange={(e) => updateSlideField(index, { link: e.target.value })}
                      disabled={saving}
                      placeholder="İsteğe bağlı bağlantı (/fiyatlandirma veya https://…)"
                      className={`${adminInputClass} font-mono text-xs`}
                    />
                    <label className="flex items-center gap-2 text-[12px] text-[#334155]">
                      <input
                        type="checkbox"
                        checked={slide.isActive}
                        disabled={saving}
                        onChange={(e) => updateSlideField(index, { isActive: e.target.checked })}
                      />
                      Aktif (canlı sitede göster)
                    </label>
                  </>
                ) : (
                  <>
                    {slide.alt ? <p className="text-xs text-slate-600">Alt: {slide.alt}</p> : null}
                    {slide.link ? (
                      <p className="truncate font-mono text-xs text-sky-800">{slide.link}</p>
                    ) : null}
                  </>
                )}
              </div>
              {!readOnly && onSlidesChange && (
                <div className="flex shrink-0 gap-1 self-end sm:self-start">
                  <button
                    type="button"
                    disabled={saving || index === 0}
                    onClick={() => moveSlide(index, -1)}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Yukarı taşı"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={saving || index === slides.length - 1}
                    onClick={() => moveSlide(index, 1)}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Aşağı taşı"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => removeSlide(index)}
                    className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                    aria-label="Kaldır"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && onAddSlide && (
        <>
          <div className="space-y-2 rounded-lg border border-dashed border-[#cfe0db] bg-white/80 p-3">
            <p className="text-[12px] font-medium text-[#5c6b7a]">Görsel URL’si yapıştır</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={pasteUrl}
                disabled={pickDisabled || saving}
                placeholder="https://…blob.vercel-storage.com/…"
                className={`${adminInputClass} flex-1 font-mono text-xs`}
                onChange={(e) => {
                  setPasteUrl(e.target.value);
                  setPasteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSlideFromUrl(pasteUrl);
                  }
                }}
              />
              <ActionButton
                variant="secondary"
                size="sm"
                type="button"
                disabled={pickDisabled || saving || !pasteUrl.trim()}
                onClick={() => addSlideFromUrl(pasteUrl)}
              >
                Ekle
              </ActionButton>
            </div>
            {pasteError && (
              <p className="text-[12px] text-red-700">{pasteError}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              variant="secondary"
              size="sm"
              type="button"
              icon={Plus}
              disabled={pickDisabled || saving}
              onClick={() => setPickerOpen(true)}
            >
              Görsel ekle
            </ActionButton>
          </div>
          <MediaPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            assets={assets}
            title="Hero slaydı ekle"
            enableUpload={enableUpload}
            autoSelectAfterUpload
            uploadUsageLabel={uploadUsageLabel}
            onAssetUploaded={onAssetUploaded}
            onSelect={(asset, value) => {
              void onAddSlide(value, asset);
              setPickerOpen(false);
            }}
          />
        </>
      )}

      {mobilePickerIndex !== null && onSlidesChange && (
        <MediaPickerModal
          open={mobilePickerIndex !== null}
          onClose={() => setMobilePickerIndex(null)}
          assets={assets}
          title="Mobil hero görseli seç"
          enableUpload={enableUpload}
          autoSelectAfterUpload
          uploadUsageLabel={uploadUsageLabel}
          onAssetUploaded={onAssetUploaded}
          onSelect={(_asset, value) => {
            updateSlideField(mobilePickerIndex, { mobileUrl: value });
            setMobilePickerIndex(null);
          }}
        />
      )}

      <FieldGroup
        label="Varsayılan alt metin"
        hint="Slaytta özel alt metin yoksa bu kullanılır"
      >
        {readOnly || !onAltChange ? (
          <p className="text-sm text-slate-700">{heroImageAlt || '—'}</p>
        ) : (
          <input
            type="text"
            value={heroImageAlt}
            onChange={(e) => onAltChange(e.target.value)}
            disabled={saving}
            className={adminInputClass}
          />
        )}
      </FieldGroup>
    </div>
  );
}

export function resolveMediaSummary(
  assets: AdminMediaAssetRow[],
  pathOrKey: string | undefined,
): { defined: boolean; summary: string; technical?: string } {
  const raw = pathOrKey?.trim() ?? '';
  if (!raw) {
    return { defined: false, summary: 'Görsel tanımlı değil' };
  }
  const asset = assets.find(
    (a) =>
      a.assetKey === raw ||
      a.fileUrl === raw ||
      raw.endsWith(a.assetKey) ||
      (a.fileUrl && raw.includes(a.fileUrl)),
  );
  if (asset?.title) {
    return {
      defined: true,
      summary: asset.title,
      technical: asset.assetKey,
    };
  }
  if (raw.startsWith('/images/') || raw.includes('.')) {
    return { defined: true, summary: 'Site görseli bağlı', technical: raw };
  }
  return { defined: true, summary: 'Görsel bağlantısı mevcut', technical: raw };
}

export const CmsEmptyState = EmptyState;

export function CmsPrimaryButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <ActionButton to={to} variant="primary" size="sm">
      {children}
    </ActionButton>
  );
}

/** Canlı sitede hero butonları kodda sabit; kullanıcıya anlaşılır özet */
export function HeroButtonsPreview() {
  const buttons = [
    { role: 'Ana buton', label: 'Demo Talep Et', href: '/demo-talep' },
    { role: 'İkincil buton', label: 'Abone Ol', href: '/fiyatlandirma' },
    { role: 'Ek bağlantı', label: 'Programa Giriş', href: config.PANEL_LOGIN_URL },
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {buttons.slice(0, 2).map((b) => (
        <div key={b.role} className={`px-3 py-2 ${adminMutedPanelSubtleClass}`}>
          <p className="text-[11px] font-medium text-slate-500">{b.role}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{b.label}</p>
          <p className="text-[12px] text-slate-500">
            {b.href.startsWith('http') ? 'Harici' : b.href}
          </p>
        </div>
      ))}
      <p className="sm:col-span-2 text-[12px] text-slate-500">
        Hero butonları <code className="text-xs">hero_*</code> kodlu kayıtlardan canlı siteye yansır.
      </p>
    </div>
  );
}

type TrustMetric = {
  id: string;
  numericId: number | null;
  label: string;
  value: string;
  description: string;
};

export function TrustMetricsCmsGrid({
  disabled,
  onEditConflict,
  onEditingChange,
}: {
  disabled?: boolean;
  onEditConflict?: () => boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [metrics, setMetrics] = useState<TrustMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ value: '', label: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const load = () => {
    if (!tokenPresent) return;
    setLoading(true);
    fetchAdminV2ContentBundle()
      .then((bundle) => {
        const raw = bundle.trustMetrics ?? [];
        setMetrics(
          raw.map((item) => {
            const row = item as Record<string, unknown>;
            const id = String(row.id ?? '');
            return {
              id,
              numericId: parseAdminNumericId(id),
              label: String(row.labelText ?? row.label ?? ''),
              value: String(row.valueText ?? row.value ?? ''),
              description: typeof row.description === 'string' ? row.description : '',
            };
          }),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tokenPresent, revision]);

  const startEdit = (m: TrustMetric) => {
    if (!m.numericId) return;
    if (onEditConflict?.()) return;
    setEditingId(m.id);
    onEditingChange?.(true);
    setDraft({ value: m.value, label: m.label, description: m.description });
    setSaveError(null);
  };

  const endEdit = () => {
    setEditingId(null);
    onEditingChange?.(false);
  };

  const save = async () => {
    if (!editingId) return;
    const metric = metrics.find((m) => m.id === editingId);
    const numericId = metric?.numericId ?? parseAdminNumericId(editingId);
    if (!numericId) {
      setSaveError('Bu metrik kaydı düzenlenemiyor (geçersiz kimlik). Gelişmiş teknik görünümü kullanın.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.trustMetric(numericId), {
        label: draft.label,
        value: draft.value,
        description: draft.description,
      });
      endEdit();
      load();
    } catch (err) {
      setSaveError((err as ApiError).message ?? 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-base text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        Yükleniyor…
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <CmsEmptyState>
        Henüz güven metriği eklenmemiş. Gelişmiş teknik görünümden ekleyebilirsiniz.
      </CmsEmptyState>
    );
  }

  return (
    <>
      <MetricCardGrid>
        {metrics.map((m) => {
          const isEditing = editingId === m.id;
          return (
            <MetricCard
              key={m.id}
              compact
              value={m.value}
              label={m.label}
              description={m.description}
              editing={isEditing}
              highlight={!isEditing}
              editForm={
                <>
                  <input
                    className={adminInputClass}
                    value={draft.value}
                    onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    placeholder="Örn. 40+"
                    disabled={saving}
                  />
                  <input
                    className={`${adminInputClass} mt-3`}
                    value={draft.label}
                    onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                    placeholder="Etiket"
                    disabled={saving}
                  />
                  <input
                    className={`${adminInputClass} mt-3`}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Kısa açıklama"
                    disabled={saving}
                  />
                  <MetricSaveRow saving={saving} onSave={save} onCancel={endEdit} />
                </>
              }
              footer={
                m.numericId ? (
                  <MetricCardButton
                    onClick={() => startEdit(m)}
                    disabled={disabled || !tokenPresent || (editingId !== null && !isEditing)}
                  >
                    Düzenle
                  </MetricCardButton>
                ) : (
                  <p className="text-[14px] text-slate-500">
                    <Link
                      to="/admin/v2/technical/marketing"
                      className="font-medium text-slate-800 underline-offset-2 hover:underline"
                    >
                      Teknik görünüm
                    </Link>
                  </p>
                )
              }
            />
          );
        })}
      </MetricCardGrid>
      <CmsSaveError message={saveError} />
    </>
  );
}

type CtaRow = AdminCtaButtonRow & { isActive: boolean; numericId: number | null };

function isHomepageCta(row: CtaRow): boolean {
  const pk = row.pageKey?.toLowerCase() ?? '';
  const sk = row.sectionKey?.toLowerCase() ?? '';
  const key = row.buttonKey.toLowerCase();
  if (!pk && !sk) return true;
  return (
    pk === 'homepage' ||
    pk === 'home' ||
    sk.includes('home') ||
    sk.includes('cta') ||
    key.includes('hero') ||
    key.includes('demo') ||
    key.includes('pricing') ||
    key.includes('fiyat')
  );
}

export function CtaButtonsCmsCards({
  disabled,
  onEditConflict,
  onEditingChange,
}: {
  disabled?: boolean;
  onEditConflict?: () => boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [rows, setRows] = useState<CtaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ label: '', linkUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const load = () => {
    if (!tokenPresent) return;
    setLoading(true);
    fetchAdminV2ContentBundle()
      .then((bundle) => {
        const parsed = parseAdminMarketing(bundle).ctaButtons;
        const raw = bundle.ctaButtons ?? [];
        const byId = new Map<string, Record<string, unknown>>();
        for (const item of raw) {
          if (!item || typeof item !== 'object') continue;
          const row = item as Record<string, unknown>;
          if (row.id != null) byId.set(String(row.id), row);
        }
        const all: CtaRow[] = parsed.map((row) => {
          const rawRow = byId.get(row.id);
          const rawId = rawRow?.id != null ? String(rawRow.id) : row.id;
          return {
            ...row,
            id: rawId,
            numericId: parseAdminNumericId(rawId),
            isActive: typeof rawRow?.isActive === 'boolean' ? rawRow.isActive : true,
          };
        });
        setRows(all.filter(isHomepageCta));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tokenPresent, revision]);

  const save = async () => {
    if (!editingId) return;
    const row = rows.find((r) => r.id === editingId);
    const numericId = row?.numericId ?? parseAdminNumericId(editingId);
    if (!numericId) {
      setSaveError('Bu buton kaydı düzenlenemiyor (geçersiz kimlik). Gelişmiş teknik görünümü kullanın.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.ctaButton(numericId), {
        label: draft.label,
        linkUrl: draft.linkUrl,
      });
      setEditingId(null);
      onEditingChange?.(false);
      load();
    } catch (err) {
      setSaveError((err as ApiError).message ?? 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-base text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Butonlar yükleniyor…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-base text-slate-600">
        Kayıtlı alt sayfa butonu yok. Fiyatlandırma ve demo bağlantıları canlı sitede sabit
        rotalara gider.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => {
          const isEditing = editingId === row.id;
          const linkLabel = row.href?.startsWith('http')
            ? 'Harici bağlantı'
            : row.href || 'Bağlantı tanımlı değil';
          return (
            <div
              key={row.id}
              className={`rounded-xl border p-4 ${
                isEditing
                  ? 'border-[#b8cdc8] bg-white ring-2 ring-[#0f5c56]/10 shadow-sm'
                  : `${adminMutedPanelClass} shadow-[0_1px_2px_rgba(26,36,51,0.05)]`
              }`}
            >
              {isEditing ? (
                <div className="space-y-4">
                  <FieldGroup label="Buton metni">
                    <input
                      className={adminInputClass}
                      value={draft.label}
                      onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                      disabled={saving}
                    />
                  </FieldGroup>
                  <FieldGroup label="Bağlantı">
                    <input
                      className={adminInputClass}
                      value={draft.linkUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
                      disabled={saving}
                    />
                  </FieldGroup>
                  <MetricSaveRow
                    saving={saving}
                    onSave={save}
                    onCancel={() => {
                      setEditingId(null);
                      onEditingChange?.(false);
                    }}
                  />
                </div>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-slate-900">{row.label}</p>
                  <p className="mt-1.5 text-[14px] text-slate-500">{linkLabel}</p>
                  {!row.isActive && (
                    <span className="mt-3 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-900 ring-1 ring-amber-200/80">
                      Yayında değil
                    </span>
                  )}
                  {row.numericId ? (
                    <MetricCardButton
                      onClick={() => {
                        if (onEditConflict?.()) return;
                        setEditingId(row.id);
                        onEditingChange?.(true);
                        setDraft({ label: row.label, linkUrl: row.href ?? '' });
                        setSaveError(null);
                      }}
                      disabled={disabled || !tokenPresent || (editingId !== null && !isEditing)}
                    >
                      Düzenle
                    </MetricCardButton>
                  ) : (
                    <p className="mt-4 text-[14px] text-slate-500">
                      <Link
                        to="/admin/v2/technical/marketing"
                        className="font-medium text-slate-800 underline-offset-2 hover:underline"
                      >
                        Teknik görünüm
                      </Link>
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <CmsSaveError message={saveError} />
    </>
  );
}

