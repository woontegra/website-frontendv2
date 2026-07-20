import { useCallback, useEffect, useState } from 'react';
import { ImageIcon, Loader2, RefreshCw, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  fetchAdminV2ContentBundle,
  getAdminHomepageSection,
  parseAdminHomepageSections,
  parseAdminMediaAssets,
  type AdminMediaAssetRow,
} from '@/lib/adminContentBundle';
import { adminV2Patch, ADMIN_V2_PATCH_ROUTES } from '@/lib/adminV2Patch';
import {
  buildConfigJson,
  draftFromSection,
  type HeroSlideDraft,
  type SectionDraft,
} from '@/admin/v2/homepageAdminShared';
import {
  CmsHeroCarouselEditor,
  CmsHeroLayoutSettings,
  CmsSaveError,
} from '@/admin/v2/homepageCmsUi';
import {
  DEFAULT_CAROUSEL_INTERVAL_MS,
  DEFAULT_HERO_DESKTOP_HEIGHT_PX,
  DEFAULT_HERO_MOBILE_HEIGHT_PX,
} from '@/lib/homepageHero';
import { InfoBanner } from '@/admin/ui';
import {
  adminAccentBtnClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';

export function AdminV2HeroImagesPage() {
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAssetRow[]>([]);
  const [draft, setDraft] = useState<SectionDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      const sections = parseAdminHomepageSections(bundle);
      const hero = getAdminHomepageSection(sections, 'hero');
      if (!hero) {
        setDraft(null);
        setError('Hero bölümü bulunamadı. Önce v2 seed/migration çalıştırın.');
        return;
      }
      setDraft(draftFromSection(hero));
      setMediaAssets(parseAdminMediaAssets(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Hero görselleri yüklenemedi');
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenPresent) void load();
    else {
      setDraft(null);
      setMediaAssets([]);
    }
  }, [tokenPresent, revision, load]);

  const mergeUploadedMediaAsset = (asset: AdminMediaAssetRow) => {
    setMediaAssets((prev) => {
      const id = String(asset.id);
      if (prev.some((a) => String(a.id) === id)) {
        return prev.map((a) => (String(a.id) === id ? asset : a));
      }
      return [asset, ...prev];
    });
  };

  const appendHeroSlide = (value: string, asset: AdminMediaAssetRow) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const alt = asset.altText?.trim() ?? '';
      const nextIndex = prev.heroImages.length;
      const heroImages: HeroSlideDraft[] = [
        ...prev.heroImages,
        {
          url: value,
          alt,
          link: '',
          mobileUrl: '',
          isActive: true,
          sortOrder: nextIndex,
        },
      ];
      return {
        ...prev,
        heroImages,
        heroImage: heroImages.find((slide) => slide.isActive)?.url ?? value,
        heroImageAlt: prev.heroImageAlt || alt,
      };
    });
  };

  const save = async () => {
    if (!tokenPresent || !draft) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.homepageSection('hero'), {
        configJson: buildConfigJson('hero', draft, null),
      });
      setSaveSuccess('Hero görselleri kaydedildi. Canlı sitede yenilediğinizde görünür.');
      invalidateBundle();
      await load();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  if (!tokenPresent) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Hero görselleri için alttan admin token kaydedin.
      </p>
    );
  }

  const activeCount = draft?.heroImages.filter((slide) => slide.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Ana Sayfa Hero Görselleri</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5c6b7a]">
            Ana sayfa hero carousel görselleri, yükseklik ve geçiş ayarlarını buradan yönetin. Hero
            başlık, metin ve butonları{' '}
            <Link to="/admin/v2/homepage" className="font-semibold text-[#0f5c56] hover:underline">
              Ana Sayfa Yönetimi
            </Link>{' '}
            ekranından düzenlenir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px] font-medium text-[#1e2a3a] hover:bg-[#f7faf9]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading || !draft}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </button>
        </div>
      </div>

      {error && (
        <InfoBanner tone="error">{error}</InfoBanner>
      )}
      {saveSuccess && (
        <InfoBanner tone="success">{saveSuccess}</InfoBanner>
      )}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f5c56]" />
        </div>
      ) : draft ? (
        <div className="space-y-4">
          <CmsHeroLayoutSettings
            carouselIntervalMs={draft.carouselIntervalMs ?? DEFAULT_CAROUSEL_INTERVAL_MS}
            heroDesktopHeightPx={draft.heroDesktopHeightPx ?? DEFAULT_HERO_DESKTOP_HEIGHT_PX}
            heroMobileHeightPx={draft.heroMobileHeightPx ?? DEFAULT_HERO_MOBILE_HEIGHT_PX}
            heroImageFit={draft.heroImageFit ?? 'cover'}
            onIntervalChange={(carouselIntervalMs) =>
              setDraft((prev) => (prev ? { ...prev, carouselIntervalMs } : prev))
            }
            onDesktopHeightChange={(heroDesktopHeightPx) =>
              setDraft((prev) => (prev ? { ...prev, heroDesktopHeightPx } : prev))
            }
            onMobileHeightChange={(heroMobileHeightPx) =>
              setDraft((prev) => (prev ? { ...prev, heroMobileHeightPx } : prev))
            }
            onImageFitChange={(heroImageFit) =>
              setDraft((prev) => (prev ? { ...prev, heroImageFit } : prev))
            }
            saving={saving}
          />

          <div className={`${adminMutedPanelClass} space-y-4 p-4`}>
            <div className="flex items-start gap-3 rounded-xl border border-[#dbe4ea] bg-white p-4">
              <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#0f5c56]" />
              <div className="text-sm text-[#5c6b7a]">
                <p>
                  <strong className="text-[#1e2a3a]">{activeCount}</strong> aktif görsel canlı sitede
                  gösterilir.
                </p>
                <p className="mt-1">
                  {activeCount <= 1
                    ? 'Tek aktif görselde carousel kontrolleri gizlenir.'
                    : 'Birden fazla aktif görselde oklar, noktalar ve otomatik geçiş çalışır.'}
                </p>
              </div>
            </div>

            <CmsHeroCarouselEditor
              slides={draft.heroImages}
              heroImageAlt={draft.heroImageAlt}
              onSlidesChange={(heroImages) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        heroImages,
                        heroImage: heroImages.find((slide) => slide.isActive)?.url ?? '',
                      }
                    : prev,
                )
              }
              onAltChange={(heroImageAlt) =>
                setDraft((prev) => (prev ? { ...prev, heroImageAlt } : prev))
              }
              assets={mediaAssets}
              onAddSlide={appendHeroSlide}
              pickDisabled={saving}
              enableUpload
              uploadUsageLabel="Ana sayfa hero görseli"
              onAssetUploaded={mergeUploadedMediaAsset}
              saving={saving}
            />

            <CmsSaveError message={saveError} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
