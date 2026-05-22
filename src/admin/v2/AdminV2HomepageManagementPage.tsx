import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ActionButton, adminMutedPanelClass, adminMutedPanelSubtleClass, InfoBanner } from '@/admin/ui';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  fetchAdminV2ContentBundle,
  getAdminHomepageSection,
  parseAdminCalculationModules,
  parseAdminHomepageSections,
  parseAdminMediaAssets,
  type AdminCalculationModuleRow,
  type AdminHomepageSectionRow,
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
  CmsAdvancedInfo,
  CmsEditButton,
  CmsEmptyState,
  CmsField,
  CmsFieldGrid,
  CmsFormField,
  CmsHeroCarouselEditor,
  CmsMediaBlock,
  CmsPanel,
  CmsPrimaryButton,
  CmsSaveError,
  cmsInputClass,
  CtaButtonsCmsCards,
  HeroButtonsPreview,
  HomepageCmsHeader,
  resolveMediaSummary,
  TrustMetricsCmsGrid,
} from '@/admin/v2/homepageCmsUi';
import { isStaleHeroPlaceholderPath, parseHeroSlidesFromConfig } from '@/lib/homepageHero';
import { syncAdminV2MediaFromCloudinary } from '@/lib/adminV2Media';
import { textUsesTextarea } from '@/admin/v2/adminV2EditUi';

const HOMEPAGE_SECTION_SAVE_LABELS: Record<string, string> = {
  hero: 'Hero alanı',
  modules: 'Modül vitrini',
  excel: 'Excel karşılaştırma',
  faq_preview: 'SSS önizleme',
  pricing_cta: 'Fiyatlandırma CTA',
};

function publishedModuleCount(modules: AdminCalculationModuleRow[]): number {
  return modules.filter(
    (m) => m.isActive !== false && (m.publishStatus === 'published' || m.publishStatus == null),
  ).length;
}

export function AdminV2HomepageManagementPage() {
  const [sections, setSections] = useState<AdminHomepageSectionRow[]>([]);
  const [modules, setModules] = useState<AdminCalculationModuleRow[]>([]);
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<SectionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [syncingCloudinary, setSyncingCloudinary] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setSections(parseAdminHomepageSections(bundle));
      setModules(parseAdminCalculationModules(bundle));
      setMediaAssets(parseAdminMediaAssets(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Ana sayfa verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenPresent) load();
    else {
      setSections([]);
      setModules([]);
      setMediaAssets([]);
    }
  }, [tokenPresent, revision, load]);

  const hero = getAdminHomepageSection(sections, 'hero');
  const modulesSection = getAdminHomepageSection(sections, 'modules');
  const excel = getAdminHomepageSection(sections, 'excel');
  const pricingCta = getAdminHomepageSection(sections, 'pricing_cta');
  const faqPreview = getAdminHomepageSection(sections, 'faq_preview');

  const moduleCount = publishedModuleCount(modules);

  const beginEdit = (key: string, section: AdminHomepageSectionRow) => {
    if (activeEdit !== null && activeEdit !== key) return;
    setActiveEdit(key);
    setDraft(draftFromSection(section));
    setSaveError(null);
    setSaveSuccess(null);
  };

  const cancelEdit = () => {
    setActiveEdit(null);
    setDraft(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const saveSection = async (sectionKey: string) => {
    if (!tokenPresent || !draft) return;
    const section = getAdminHomepageSection(sections, sectionKey);
    if (!section) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.homepageSection(sectionKey), {
        title: draft.title,
        eyebrow: draft.eyebrow,
        subtitle: draft.subtitle,
        description: draft.description,
        configJson: buildConfigJson(sectionKey, draft, section.config),
        isActive: draft.isActive,
      });
      const label = HOMEPAGE_SECTION_SAVE_LABELS[sectionKey] ?? 'Bölüm';
      setSaveSuccess(`${label} kaydedildi. Canlı sitede yenilediğinizde görünür.`);
      cancelEdit();
      invalidateBundle();
      await load();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const sectionEditKeys = ['hero', 'modules', 'excel', 'faq_preview', 'pricing_cta'];
  const isSectionEditing = activeEdit !== null && sectionEditKeys.includes(activeEdit);
  const isTrustEditing = activeEdit === 'trust';
  const isCtaEditing = activeEdit === 'cta';

  const conflictUnless = (allowed: string) => activeEdit !== null && activeEdit !== allowed;

  const mergeUploadedMediaAsset = (asset: AdminMediaAssetRow) => {
    setMediaAssets((prev) => {
      const id = String(asset.id);
      if (prev.some((a) => String(a.id) === id)) {
        return prev.map((a) => (String(a.id) === id ? asset : a));
      }
      return [asset, ...prev];
    });
  };

  const appendHeroSlide = (prev: SectionDraft, value: string, asset: AdminMediaAssetRow): SectionDraft => {
    const alt = asset.altText?.trim() ?? '';
    const heroImages: HeroSlideDraft[] = [...prev.heroImages, { url: value, alt }];
    return {
      ...prev,
      heroImages,
      heroImage: heroImages[0]?.url ?? value,
      heroImageAlt: prev.heroImageAlt || alt,
    };
  };

  const syncCloudinaryToMediaDb = async () => {
    setSyncingCloudinary(true);
    setSyncMessage(null);
    setSaveError(null);
    try {
      const result = await syncAdminV2MediaFromCloudinary({
        includeAll: true,
        attachToHero: false,
      });
      setSyncMessage(
        `Cloudinary: ${result.cloudinaryCount} görsel · medya tablosuna ${result.created} yeni kayıt. Hero için Düzenle → Görsel ekle ile seçin.`,
      );
      invalidateBundle();
      await load();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Cloudinary senkronizasyonu başarısız');
    } finally {
      setSyncingCloudinary(false);
    }
  };

  const applyHeroMediaAdd = async (value: string, asset: AdminMediaAssetRow) => {
    if (!hero) return;

    const baseDraft = activeEdit === 'hero' && draft ? draft : draftFromSection(hero);
    const nextDraft = appendHeroSlide(baseDraft, value, asset);
    if (activeEdit === 'hero') {
      setDraft(nextDraft);
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.homepageSection('hero'), {
        title: nextDraft.title,
        eyebrow: nextDraft.eyebrow,
        subtitle: nextDraft.subtitle,
        description: nextDraft.description,
        configJson: buildConfigJson('hero', nextDraft, hero.config),
        isActive: nextDraft.isActive,
      });
      setSaveSuccess('Hero görselleri kaydedildi. Canlı sitede yenilediğinizde görünür.');
      invalidateBundle();
      await load();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Hero görselleri kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const applyExcelMediaPick = (value: string) => {
    setDraft((d) => (d ? { ...d, heroImage: value } : d));
  };

  const heroDraft = activeEdit === 'hero' ? draft : null;
  const heroSlidesReadOnly: HeroSlideDraft[] = parseHeroSlidesFromConfig(hero?.config ?? null).map(
    (s) => ({ url: s.url, alt: s.alt ?? '' }),
  );
  const heroSlidesEdit = heroDraft?.heroImages ?? heroSlidesReadOnly;
  const heroCarouselWasReset =
    heroSlidesReadOnly.length === 0 &&
    typeof hero?.config?.heroImage === 'string' &&
    isStaleHeroPlaceholderPath(hero.config.heroImage as string);
  const heroImagePath = heroSlidesReadOnly[0]?.url ?? '';
  const heroMedia = resolveMediaSummary(mediaAssets, heroImagePath);

  const excelDraft = activeEdit === 'excel' ? draft : null;
  const excelImagePath =
    excelDraft?.heroImage ||
    (excel?.config?.image as string | undefined) ||
    '';
  const excelMedia = resolveMediaSummary(mediaAssets, excelImagePath);

  const excelBenefits =
    activeEdit === 'excel' && draft
      ? draft.benefitsText
      : Array.isArray(excel?.config?.benefits)
        ? (excel.config.benefits as string[]).join('\n')
        : '';

  const refreshBtn = (
    <ActionButton
      variant="secondary"
      icon={RefreshCw}
      size="sm"
      onClick={load}
      disabled={!tokenPresent || loading || saving}
    >
      Yenile
    </ActionButton>
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#dbe4ea] pb-4 lg:flex-row lg:items-start lg:justify-between">
        <HomepageCmsHeader trailing={refreshBtn} />
      </div>

      {!tokenPresent && (
        <InfoBanner tone="error" className="mb-4">
          Düzenleme için oturum gerekli. <strong>Genel Bakış</strong> ekranından admin token
          kaydedin.
        </InfoBanner>
      )}

      {error && (
        <InfoBanner tone="error" className="mb-4">
          {error}
        </InfoBanner>
      )}

      {saveSuccess && !activeEdit && (
        <InfoBanner tone="success" className="mb-4">
          {saveSuccess}
        </InfoBanner>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-[13px] text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          Yükleniyor…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-4 lg:gap-y-4">
          {/* Hero — 8 */}
          <CmsPanel
            tintedHeader
            className="lg:col-span-8"
            title="Hero Alanı"
            description="Ziyaretçinin ilk gördüğü karşılama bölümü."
            locationNote="Canlı sitede sayfanın en üstünde, koyu arka planlı geniş alanda görünür."
            editAction={
              hero ? (
                <CmsEditButton
                  isEditing={activeEdit === 'hero'}
                  saving={saving}
                  disabled={!tokenPresent || conflictUnless('hero')}
                  onEdit={() => beginEdit('hero', hero)}
                  onSave={() => saveSection('hero')}
                  onCancel={cancelEdit}
                />
              ) : undefined
            }
          >
            {!hero ? (
              <CmsEmptyState>
                Hero içeriği henüz hazır değil. Gelişmiş teknik görünümden tanımlanabilir.
              </CmsEmptyState>
            ) : activeEdit === 'hero' && draft ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <CmsFormField label="Üst etiket">
                    <input
                      className={cmsInputClass}
                      value={draft.eyebrow}
                      onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                      disabled={saving}
                    />
                  </CmsFormField>
                  <CmsFormField label="Başlık">
                    <input
                      className={cmsInputClass}
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      disabled={saving}
                    />
                  </CmsFormField>
                  <div className="sm:col-span-2">
                    <CmsFormField label="Açıklama">
                      {textUsesTextarea(draft.description) ? (
                        <textarea
                          className={cmsInputClass}
                          rows={4}
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          disabled={saving}
                        />
                      ) : (
                        <input
                          className={cmsInputClass}
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          disabled={saving}
                        />
                      )}
                    </CmsFormField>
                  </div>
                </div>
                {heroCarouselWasReset && (
                  <InfoBanner tone="info" className="mb-3">
                    Hero kaydında <code className="text-xs">heroImages</code> yok — sadece seed placeholder var.
                    <strong> Düzenle</strong> → Cloudinary linki yapıştır veya <strong>Görsel ekle</strong> → Kaydet.
                  </InfoBanner>
                )}
                {syncMessage && (
                  <InfoBanner tone="success" className="mb-3">
                    {syncMessage}
                  </InfoBanner>
                )}
                <CmsHeroCarouselEditor
                  slides={heroSlidesEdit}
                  heroImageAlt={draft.heroImageAlt}
                  assets={mediaAssets}
                  onSlidesChange={(heroImages) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            heroImages,
                            heroImage: heroImages[0]?.url ?? '',
                          }
                        : d,
                    )
                  }
                  onAltChange={(heroImageAlt) => setDraft((d) => (d ? { ...d, heroImageAlt } : d))}
                  onAddSlide={applyHeroMediaAdd}
                  pickDisabled={saving}
                  enableUpload
                  uploadUsageLabel="Ana sayfa hero görseli"
                  onAssetUploaded={mergeUploadedMediaAsset}
                  saving={saving}
                  onSyncCloudinary={syncCloudinaryToMediaDb}
                  syncingCloudinary={syncingCloudinary}
                />
                <HeroButtonsPreview />
                <CmsSaveError message={saveError} />
              </div>
            ) : (
              <>
                <CmsFieldGrid className="grid-cols-1 gap-3 lg:grid-cols-2">
                  <CmsField label="Üst etiket" value={hero.eyebrow} />
                  <CmsField label="Başlık" value={hero.title} />
                  <CmsField label="Açıklama" value={hero.description} />
                </CmsFieldGrid>
                {heroSlidesReadOnly.length === 0 && (
                  <InfoBanner tone="info" className="mb-3">
                    Hero’da görsel yok (DB’de <code className="text-xs">heroImages</code> boş).{' '}
                    <strong>Düzenle</strong> ile görsel ekleyin veya Medya sayfasından Cloudinary → DB senkronu yapıp
                    buradan seçin.
                  </InfoBanner>
                )}
                <CmsHeroCarouselEditor
                  slides={heroSlidesReadOnly}
                  heroImageAlt={
                    typeof hero.config?.heroImageAlt === 'string' ? hero.config.heroImageAlt : ''
                  }
                  assets={mediaAssets}
                  readOnly
                />
                {heroSlidesReadOnly.length > 1 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {heroSlidesReadOnly.length} görsel carousel olarak canlı sitede gösterilir.
                  </p>
                )}
                <HeroButtonsPreview />
                {heroMedia.technical && (
                  <CmsAdvancedInfo>{heroMedia.technical}</CmsAdvancedInfo>
                )}
              </>
            )}
          </CmsPanel>

          {/* Güven — 4 */}
          <CmsPanel
            className="lg:col-span-4"
            title="Güven Metrikleri"
            description="Kullanıcıya güven veren sayı ve kısa açıklamalar."
            locationNote="Hero’nun hemen altında, yan yana küçük istatistik kartları olarak görünür."
          >
            <TrustMetricsCmsGrid
              disabled={isSectionEditing || isCtaEditing || !tokenPresent}
              onEditConflict={() => conflictUnless('trust')}
              onEditingChange={(editing) => setActiveEdit(editing ? 'trust' : null)}
            />
          </CmsPanel>

          {/* Excel — 8 */}
          <CmsPanel
            tintedHeader
            className="lg:col-span-8"
            title="Excel Karşılaştırma"
            description="Excel ile program karşılaştırması."
            locationNote="Modül vitrininin altında, iki sütunlu alan."
            editAction={
              excel ? (
                <CmsEditButton
                  isEditing={activeEdit === 'excel'}
                  saving={saving}
                  disabled={!tokenPresent || conflictUnless('excel')}
                  onEdit={() => beginEdit('excel', excel)}
                  onSave={() => saveSection('excel')}
                  onCancel={cancelEdit}
                />
              ) : undefined
            }
          >
            {!excel ? (
              <CmsEmptyState>
                Bu bölüm henüz yapılandırılmamış.
              </CmsEmptyState>
            ) : activeEdit === 'excel' && draft ? (
              <div className="space-y-3">
                <CmsFormField label="Üst etiket">
                  <input
                    className={cmsInputClass}
                    value={draft.eyebrow}
                    onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Başlık">
                  <input
                    className={cmsInputClass}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Açıklama">
                  <textarea
                    className={cmsInputClass}
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Maddeler">
                  <textarea
                    className={cmsInputClass}
                    rows={4}
                    value={draft.benefitsText}
                    onChange={(e) => setDraft({ ...draft, benefitsText: e.target.value })}
                    disabled={saving}
                    placeholder="Her satır bir madde"
                  />
                </CmsFormField>
                <CmsMediaBlock
                  defined={excelMedia.defined}
                  summary={excelMedia.summary}
                  assets={mediaAssets}
                  currentValue={draft.heroImage}
                  onPick={applyExcelMediaPick}
                  pickDisabled={saving}
                  pickTitle="Excel görseli seç"
                />
                <CmsSaveError message={saveError} />
              </div>
            ) : (
              <>
                <CmsFieldGrid className="grid-cols-1 gap-3">
                  <CmsField label="Üst etiket" value={excel.eyebrow} />
                  <CmsField label="Başlık" value={excel.title} />
                  <CmsField label="Açıklama" value={excel.description} />
                </CmsFieldGrid>
                {excelBenefits.trim() && (
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-[13px] text-slate-700">
                    {excelBenefits
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                )}
                <CmsMediaBlock
                  defined={excelMedia.defined}
                  summary={excelMedia.summary}
                  assets={mediaAssets}
                  currentValue={excelImagePath}
                />
              </>
            )}
          </CmsPanel>

          {/* Modüller — 4 */}
          <CmsPanel
            className="lg:col-span-4"
            title="Modül Vitrini"
            description="Ana sayfada öne çıkan hesaplama türleri."
            locationNote="Sayfa ortasında, modül kartları ızgarası olarak listelenir."
            editAction={
              modulesSection ? (
                <CmsEditButton
                  isEditing={activeEdit === 'modules'}
                  saving={saving}
                  disabled={!tokenPresent || conflictUnless('modules')}
                  onEdit={() => beginEdit('modules', modulesSection)}
                  onSave={() => saveSection('modules')}
                  onCancel={cancelEdit}
                />
              ) : undefined
            }
          >
            {!modulesSection ? (
              <CmsEmptyState>Bu bölüm henüz yapılandırılmamış.</CmsEmptyState>
            ) : activeEdit === 'modules' && draft ? (
              <div className="space-y-3">
                <CmsFormField label="Başlık">
                  <input
                    className={cmsInputClass}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Açıklama">
                  <textarea
                    className={cmsInputClass}
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsSaveError message={saveError} />
              </div>
            ) : (
              <>
                <CmsFieldGrid className="grid-cols-1 gap-3">
                  <CmsField label="Başlık" value={modulesSection.title} />
                  <CmsField label="Açıklama" value={modulesSection.description} />
                </CmsFieldGrid>
                <div className={`mt-3 p-4 ${adminMutedPanelClass}`}>
                  <p className="text-3xl font-semibold leading-none tracking-tight text-slate-900">
                    {moduleCount}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600">hesaplama sayfası yayında</p>
                </div>
              </>
            )}
            <p className="mt-3 text-[12px] leading-snug text-slate-500">
              Kart içerikleri Hesaplama Sayfaları ekranından yönetilir.
            </p>
            <CmsPrimaryButton to="/admin/v2/calculations">Modülleri Yönet</CmsPrimaryButton>
          </CmsPanel>

          {/* Alt CTA — 8 */}
          <CmsPanel
            tintedHeader
            className="lg:col-span-8"
            title="Alt CTA"
            description="Sayfa sonu harekete geçirici alan."
            locationNote="En altta; fiyatlandırma ve demo yönlendirmeleri."
            editAction={
              pricingCta ? (
                <CmsEditButton
                  isEditing={activeEdit === 'pricing_cta'}
                  saving={saving}
                  disabled={!tokenPresent || conflictUnless('pricing_cta')}
                  onEdit={() => beginEdit('pricing_cta', pricingCta)}
                  onSave={() => saveSection('pricing_cta')}
                  onCancel={cancelEdit}
                />
              ) : undefined
            }
          >
            {pricingCta && (
              <div className="mb-3">
                {activeEdit === 'pricing_cta' && draft ? (
                  <div className={`grid grid-cols-1 gap-3 p-3 lg:grid-cols-2 ${adminMutedPanelSubtleClass}`}>
                    <CmsFormField label="Üst etiket">
                      <input
                        className={cmsInputClass}
                        value={draft.eyebrow}
                        onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                        disabled={saving}
                      />
                    </CmsFormField>
                    <CmsFormField label="Başlık">
                      <input
                        className={cmsInputClass}
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        disabled={saving}
                      />
                    </CmsFormField>
                    <CmsFormField label="Açıklama">
                      <textarea
                        className={cmsInputClass}
                        rows={2}
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        disabled={saving}
                      />
                    </CmsFormField>
                    <CmsSaveError message={saveError} />
                  </div>
                ) : (
                  <CmsFieldGrid className="grid-cols-1 gap-3 lg:grid-cols-2">
                    <CmsField label="Üst etiket" value={pricingCta.eyebrow} />
                    <CmsField label="Başlık" value={pricingCta.title} />
                    <CmsField label="Açıklama" value={pricingCta.description} />
                  </CmsFieldGrid>
                )}
              </div>
            )}
            <p className="mb-2 text-[12px] font-medium text-slate-500">Sayfa butonları</p>
            <CtaButtonsCmsCards
              disabled={isSectionEditing || isTrustEditing}
              onEditConflict={() => conflictUnless('cta')}
              onEditingChange={(editing) => setActiveEdit(editing ? 'cta' : null)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <CmsPrimaryButton to="/admin/v2/pricing">Fiyatlandırma</CmsPrimaryButton>
              <CmsPrimaryButton to="/admin/v2/demo">Demo Talep</CmsPrimaryButton>
            </div>
          </CmsPanel>

          {/* SSS — 4 */}
          <CmsPanel
            className="lg:col-span-4"
            title="SSS Önizleme"
            description="Ana sayfada gösterilen SSS giriş metni."
            locationNote="Alt bölümde soru özeti ve SSS linki."
            editAction={
              faqPreview ? (
                <CmsEditButton
                  isEditing={activeEdit === 'faq_preview'}
                  saving={saving}
                  disabled={!tokenPresent || conflictUnless('faq_preview')}
                  onEdit={() => beginEdit('faq_preview', faqPreview)}
                  onSave={() => saveSection('faq_preview')}
                  onCancel={cancelEdit}
                />
              ) : undefined
            }
          >
            {!faqPreview ? (
              <CmsEmptyState>SSS önizleme metni henüz tanımlanmamış.</CmsEmptyState>
            ) : activeEdit === 'faq_preview' && draft ? (
              <div className="grid gap-6">
                <CmsFormField label="Üst etiket">
                  <input
                    className={cmsInputClass}
                    value={draft.eyebrow}
                    onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Bölüm başlığı">
                  <input
                    className={cmsInputClass}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsFormField label="Kısa açıklama">
                  <textarea
                    className={cmsInputClass}
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    disabled={saving}
                  />
                </CmsFormField>
                <CmsSaveError message={saveError} />
              </div>
            ) : (
              <CmsFieldGrid className="grid-cols-1 gap-3">
                <CmsField label="Üst etiket" value={faqPreview.eyebrow} />
                <CmsField label="Başlık" value={faqPreview.title} />
                <CmsField label="Açıklama" value={faqPreview.description} />
              </CmsFieldGrid>
            )}
            <p className="mt-3 text-[12px] leading-snug text-slate-500">
              Sorular SSS Yönetimi ekranından düzenlenir.
            </p>
            <CmsPrimaryButton to="/admin/v2/faq">SSS Yönetimi</CmsPrimaryButton>
          </CmsPanel>
        </div>
      )}
    </div>
  );
}
