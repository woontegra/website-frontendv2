import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApiError } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminActiveCheckbox,
  AdminEditToolbar,
  adminInputClass,
  textUsesTextarea,
} from '@/admin/v2/adminV2EditUi';
import { AdminLabeledField } from '@/admin/cms/AdminLabeledField';
import {
  fetchAdminV2ContentBundle,
  parseAdminMarketing,
  type AdminCtaButtonRow,
  type AdminHomepageSectionRow,
} from '@/lib/adminContentBundle';
import { adminV2Patch, ADMIN_V2_PATCH_ROUTES, parseAdminNumericId } from '@/lib/adminV2Patch';
import {
  buildHeroConfigPayload,
  DEFAULT_CAROUSEL_INTERVAL_MS,
  parseCarouselIntervalMs,
  parseHeroCarouselLayout,
  parseHeroSlidesFromConfig,
  type HeroImageFit,
  type HeroSlideInput,
} from '@/lib/homepageHero';

export type HeroSlideDraft = {
  url: string;
  mobileUrl: string;
  alt: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
};

export type SectionDraft = {
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  heroImages: HeroSlideDraft[];
  heroImage: string;
  heroImageAlt: string;
  carouselIntervalMs: number;
  heroDesktopHeightPx: number;
  heroMobileHeightPx: number;
  heroImageFit: HeroImageFit;
  benefitsText: string;
  sortOrder: string;
  isActive: boolean;
};

const HERO_FALLBACK_IMAGE = '/images/hero-dashboard.png';
const HERO_FALLBACK_ALT = 'Bilirkişi Hesap yönetim paneli önizlemesi';

export function draftFromSection(section: AdminHomepageSectionRow): SectionDraft {
  const cfg = section.config ?? {};
  const benefits = Array.isArray(cfg.benefits) ? (cfg.benefits as string[]).join('\n') : '';
  const heroSlides = parseHeroSlidesFromConfig(cfg, { includeInactive: true });
  const heroImages: HeroSlideDraft[] = heroSlides.map((s, index) => ({
    url: s.url,
    mobileUrl: s.mobileUrl ?? '',
    alt: s.alt ?? '',
    link: s.link ?? '',
    isActive: s.isActive !== false,
    sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : index,
  }));
  const legacyImage =
    typeof cfg.heroImage === 'string'
      ? cfg.heroImage
      : typeof cfg.image === 'string'
        ? cfg.image
        : '';
  const heroLayout = parseHeroCarouselLayout(cfg);
  return {
    title: section.title ?? '',
    eyebrow: section.eyebrow ?? '',
    subtitle: section.subtitle ?? '',
    description: section.description ?? '',
    heroImages,
    heroImage: heroImages.find((slide) => slide.isActive)?.url || heroImages[0]?.url || legacyImage,
    heroImageAlt: typeof cfg.heroImageAlt === 'string' ? cfg.heroImageAlt : '',
    carouselIntervalMs: parseCarouselIntervalMs(cfg),
    heroDesktopHeightPx: heroLayout.desktopHeightPx,
    heroMobileHeightPx: heroLayout.mobileHeightPx,
    heroImageFit: heroLayout.imageFit,
    benefitsText: benefits,
    sortOrder: String(section.sortOrder),
    isActive: section.isActive,
  };
}

/** Ana Sayfa Yönetimi metin kaydında hero görsel/carousel alanlarını DB’den korur. */
export function withPreservedHeroImageFields(
  draft: SectionDraft,
  existing: Record<string, unknown> | null | undefined,
): SectionDraft {
  if (!existing) return draft;

  const heroSlides = parseHeroSlidesFromConfig(existing, { includeInactive: true });
  const heroImages: HeroSlideDraft[] = heroSlides.map((s, index) => ({
    url: s.url,
    mobileUrl: s.mobileUrl ?? '',
    alt: s.alt ?? '',
    link: s.link ?? '',
    isActive: s.isActive !== false,
    sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : index,
  }));
  const legacyImage =
    typeof existing.heroImage === 'string'
      ? existing.heroImage
      : typeof existing.image === 'string'
        ? existing.image
        : '';
  const heroLayout = parseHeroCarouselLayout(existing);

  return {
    ...draft,
    heroImages,
    heroImage:
      heroImages.find((slide) => slide.isActive)?.url || heroImages[0]?.url || legacyImage || draft.heroImage,
    heroImageAlt:
      typeof existing.heroImageAlt === 'string' ? existing.heroImageAlt : draft.heroImageAlt,
    carouselIntervalMs: parseCarouselIntervalMs(existing),
    heroDesktopHeightPx: heroLayout.desktopHeightPx,
    heroMobileHeightPx: heroLayout.mobileHeightPx,
    heroImageFit: heroLayout.imageFit,
  };
}

export function buildConfigJson(
  sectionKey: string,
  draft: SectionDraft,
  existing: Record<string, unknown> | null,
): string {
  if (sectionKey === 'hero') {
    const slides: HeroSlideInput[] = draft.heroImages.map((s, index) => ({
      url: s.url,
      mobileUrl: s.mobileUrl,
      alt: s.alt,
      link: s.link,
      isActive: s.isActive,
      sortOrder: Number.isFinite(s.sortOrder) ? s.sortOrder : index,
    }));
    return JSON.stringify(
      buildHeroConfigPayload(
        slides,
        draft.heroImageAlt,
        HERO_FALLBACK_IMAGE,
        HERO_FALLBACK_ALT,
        {
          carouselIntervalMs: draft.carouselIntervalMs || DEFAULT_CAROUSEL_INTERVAL_MS,
          desktopHeightPx: draft.heroDesktopHeightPx,
          mobileHeightPx: draft.heroMobileHeightPx,
          imageFit: draft.heroImageFit,
        },
      ),
    );
  }
  if (sectionKey === 'excel') {
    const benefits = draft.benefitsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return JSON.stringify({
      ...(existing ?? {}),
      benefits: benefits.length > 0 ? benefits : (existing?.benefits ?? []),
      image: draft.heroImage || existing?.image || '/images/excel-vs-program.png',
    });
  }
  return existing ? JSON.stringify(existing) : '';
}

type SectionEditorProps = {
  section: AdminHomepageSectionRow;
  editingKey: string | null;
  saving: boolean;
  saveError: string | null;
  tokenPresent: boolean;
  globalEdit: boolean;
  onStart: () => void;
  onCancel: () => void;
  onSave: (draft: SectionDraft) => void;
  /** Gelişmiş editörde tüm alanlar; ana sayfa yönetiminde sadeleştirilmiş */
  mode?: 'full' | 'compact';
};

export function HomepageSectionEditor({
  section,
  editingKey,
  saving,
  saveError,
  tokenPresent,
  globalEdit,
  onStart,
  onCancel,
  onSave,
  mode = 'full',
}: SectionEditorProps) {
  const isEditing = editingKey === section.sectionKey;
  const [draft, setDraft] = useState<SectionDraft>(() => draftFromSection(section));

  useEffect(() => {
    if (!isEditing) setDraft(draftFromSection(section));
  }, [section, isEditing]);

  const showBenefits = section.sectionKey === 'excel';
  const showHeroImage = section.sectionKey === 'hero' || section.sectionKey === 'excel';
  const compact = mode === 'compact';

  return (
    <div className="space-y-3">
      {isEditing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {!compact && (
            <AdminLabeledField label="Üst etiket">
              <input
                type="text"
                value={draft.eyebrow}
                onChange={(e) => setDraft((d) => ({ ...d, eyebrow: e.target.value }))}
                disabled={saving}
                className={adminInputClass}
              />
            </AdminLabeledField>
          )}
          <AdminLabeledField label="Başlık">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              disabled={saving}
              className={adminInputClass}
            />
          </AdminLabeledField>
          {!compact && section.subtitle && (
            <AdminLabeledField label="Alt başlık">
              <input
                type="text"
                value={draft.subtitle}
                onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                disabled={saving}
                className={adminInputClass}
              />
            </AdminLabeledField>
          )}
          <div className={compact ? '' : 'sm:col-span-2'}>
            <AdminLabeledField label="Açıklama">
              {textUsesTextarea(draft.description) ? (
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  disabled={saving}
                  className={adminInputClass}
                />
              ) : (
                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  disabled={saving}
                  className={adminInputClass}
                />
              )}
            </AdminLabeledField>
          </div>
          {showHeroImage && (
            <>
              <AdminLabeledField
                label="Görsel (assetKey veya URL)"
                hint="Medya kütüphanesindeki anahtar veya tam dosya yolu"
              >
                <input
                  type="text"
                  value={draft.heroImage}
                  onChange={(e) => setDraft((d) => ({ ...d, heroImage: e.target.value }))}
                  disabled={saving}
                  className={`${adminInputClass} font-mono text-xs`}
                />
              </AdminLabeledField>
              {section.sectionKey === 'hero' && (
                <AdminLabeledField label="Görsel alt metni">
                  <input
                    type="text"
                    value={draft.heroImageAlt}
                    onChange={(e) => setDraft((d) => ({ ...d, heroImageAlt: e.target.value }))}
                    disabled={saving}
                    className={adminInputClass}
                  />
                </AdminLabeledField>
              )}
            </>
          )}
          {showBenefits && (
            <div className="sm:col-span-2">
              <AdminLabeledField label="Madde listesi" hint="Her satır bir madde">
                <textarea
                  value={draft.benefitsText}
                  onChange={(e) => setDraft((d) => ({ ...d, benefitsText: e.target.value }))}
                  rows={4}
                  disabled={saving}
                  className={adminInputClass}
                />
              </AdminLabeledField>
            </div>
          )}
          {!compact && (
            <AdminActiveCheckbox
              checked={draft.isActive}
              disabled={saving}
              onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))}
            />
          )}
        </div>
      ) : (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {!compact && section.eyebrow && (
            <div>
              <dt className="text-xs font-semibold text-slate-500">Üst etiket</dt>
              <dd>{section.eyebrow}</dd>
            </div>
          )}
          {section.title && (
            <div>
              <dt className="text-xs font-semibold text-slate-500">Başlık</dt>
              <dd className="font-semibold text-slate-900">{section.title}</dd>
            </div>
          )}
          {section.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">Açıklama</dt>
              <dd className="text-slate-700">{section.description}</dd>
            </div>
          )}
          {showHeroImage && draftFromSection(section).heroImage && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">Görsel</dt>
              <dd className="font-mono text-xs text-slate-700">{draftFromSection(section).heroImage}</dd>
            </div>
          )}
        </dl>
      )}
      <AdminEditToolbar
        isEditing={isEditing}
        saving={saving}
        tokenPresent={tokenPresent}
        editDisabled={globalEdit && !isEditing}
        saveError={isEditing ? saveError : null}
        onEdit={onStart}
        onSave={() => onSave(draft)}
        onCancel={onCancel}
      />
    </div>
  );
}

export function TrustMetricsInline() {
  const [metrics, setMetrics] = useState<
    {
      id: string;
      label: string;
      value: string;
      description: string;
      iconName: string;
      isActive: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  useEffect(() => {
    if (!tokenPresent) return;
    fetchAdminV2ContentBundle()
      .then((bundle) => {
        const raw = bundle.trustMetrics ?? [];
        setMetrics(
          raw.map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row.id ?? ''),
              label: String(row.labelText ?? row.label ?? ''),
              value: String(row.valueText ?? row.value ?? ''),
              description: typeof row.description === 'string' ? row.description : '',
              iconName: typeof row.iconName === 'string' ? row.iconName : '',
              isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
            };
          }),
        );
      })
      .finally(() => setLoading(false));
  }, [tokenPresent, revision]);

  const handleSave = async (id: string) => {
    const numericId = parseAdminNumericId(id);
    if (!numericId) {
      setSaveError('Geçersiz kayıt kimliği.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.trustMetric(numericId), {
        label: String(draft.label ?? ''),
        value: String(draft.value ?? ''),
        description: String(draft.description ?? ''),
        iconName: String(draft.iconName ?? ''),
        isActive: Boolean(draft.isActive),
      });
      setEditingId(null);
      const bundle = await fetchAdminV2ContentBundle();
      const raw = bundle.trustMetrics ?? [];
      setMetrics(
        raw.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id ?? ''),
            label: String(row.labelText ?? row.label ?? ''),
            value: String(row.valueText ?? row.value ?? ''),
            description: typeof row.description === 'string' ? row.description : '',
            iconName: typeof row.iconName === 'string' ? row.iconName : '',
            isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
          };
        }),
      );
    } catch (err) {
      setSaveError((err as ApiError).message ?? 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Metrikler yükleniyor…</p>;
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Henüz güven metriği yok.{' '}
        <Link to="/admin/v2/technical/marketing" className="font-semibold text-emerald-700 hover:underline">
          Teknik pazarlama ekranı
        </Link>
      </p>
    );
  }

  return (
    <div id="trust" className="space-y-3">
      {metrics.map((m) => {
        const isEditing = editingId === m.id;
        return (
          <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            {isEditing ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <AdminLabeledField label="Değer">
                  <input
                    className={adminInputClass}
                    value={String(draft.value ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    disabled={saving}
                  />
                </AdminLabeledField>
                <AdminLabeledField label="Etiket">
                  <input
                    className={adminInputClass}
                    value={String(draft.label ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                    disabled={saving}
                  />
                </AdminLabeledField>
                <div className="sm:col-span-2">
                  <AdminLabeledField label="Açıklama">
                    <input
                      className={adminInputClass}
                      value={String(draft.description ?? '')}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      disabled={saving}
                    />
                  </AdminLabeledField>
                </div>
              </div>
            ) : (
              <p className="text-sm">
                <span className="font-bold text-emerald-800">{m.value}</span> {m.label}
                {m.description && <span className="block text-slate-600">{m.description}</span>}
              </p>
            )}
            <AdminEditToolbar
              isEditing={isEditing}
              saving={saving}
              tokenPresent={tokenPresent}
              editDisabled={editingId !== null && !isEditing}
              saveError={isEditing ? saveError : null}
              onEdit={() => {
                setEditingId(m.id);
                setDraft({
                  label: m.label,
                  value: m.value,
                  description: m.description,
                  iconName: m.iconName,
                  isActive: m.isActive,
                });
              }}
              onSave={() => handleSave(m.id)}
              onCancel={() => setEditingId(null)}
            />
          </div>
        );
      })}
    </div>
  );
}

type CtaRow = AdminCtaButtonRow & { isActive: boolean };

function isHomepageCta(row: CtaRow): boolean {
  const pk = row.pageKey?.toLowerCase() ?? '';
  const sk = row.sectionKey?.toLowerCase() ?? '';
  if (!pk && !sk) return true;
  return pk === 'homepage' || pk === 'home' || sk.includes('home') || sk.includes('cta');
}

export function CtaButtonsInline({ homepageOnly = false }: { homepageOnly?: boolean }) {
  const [rows, setRows] = useState<CtaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  useEffect(() => {
    if (!tokenPresent) return;
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
          return {
            ...row,
            isActive: typeof rawRow?.isActive === 'boolean' ? rawRow.isActive : true,
          };
        });
        setRows(homepageOnly ? all.filter(isHomepageCta) : all);
      })
      .finally(() => setLoading(false));
  }, [tokenPresent, revision, homepageOnly]);

  const handleSave = async (id: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      const numericId = parseAdminNumericId(id);
      if (!numericId) {
        setSaveError('Geçersiz kayıt kimliği.');
        return;
      }
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.ctaButton(numericId), {
        label: String(draft.label ?? ''),
        linkUrl: String(draft.linkUrl ?? ''),
        isActive: Boolean(draft.isActive),
      });
      setEditingId(null);
      const bundle = await fetchAdminV2ContentBundle();
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
        return {
          ...row,
          isActive: typeof rawRow?.isActive === 'boolean' ? rawRow.isActive : true,
        };
      });
      setRows(homepageOnly ? all.filter(isHomepageCta) : all);
    } catch (err) {
      setSaveError((err as ApiError).message ?? 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Butonlar yükleniyor…</p>;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Kayıtlı CTA butonu yok.{' '}
        <Link to="/admin/v2/technical/marketing" className="font-semibold text-emerald-700 hover:underline">
          Teknik pazarlama ekranı
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const isEditing = editingId === row.id;
        return (
          <div key={row.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            {isEditing ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <AdminLabeledField label="Buton metni">
                  <input
                    className={adminInputClass}
                    value={String(draft.label ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                    disabled={saving}
                  />
                </AdminLabeledField>
                <AdminLabeledField label="Link">
                  <input
                    className={`${adminInputClass} font-mono text-xs`}
                    value={String(draft.linkUrl ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
                    disabled={saving}
                  />
                </AdminLabeledField>
              </div>
            ) : (
              <p className="text-sm">
                <span className="font-semibold text-slate-900">{row.label}</span>
                {row.href && (
                  <span className="mt-1 block font-mono text-xs text-sky-800">{row.href}</span>
                )}
                {!row.isActive && (
                  <span className="mt-1 block text-xs text-amber-700">Pasif</span>
                )}
              </p>
            )}
            <AdminEditToolbar
              isEditing={isEditing}
              saving={saving}
              tokenPresent={tokenPresent}
              editDisabled={editingId !== null && !isEditing}
              saveError={isEditing ? saveError : null}
              onEdit={() => {
                setEditingId(row.id);
                setDraft({ label: row.label, linkUrl: row.href ?? '', isActive: row.isActive });
              }}
              onSave={() => handleSave(row.id)}
              onCancel={() => setEditingId(null)}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Canlı sitede hero butonları şu an sabit; bilgi amaçlı */
export function HeroCtaReadOnly() {
  const items = [
    { label: 'Demo Talep Et', href: '/demo-talep' },
    { label: 'Abone Ol', href: '/fiyatlandirma' },
    { label: 'Programa Giriş', href: config.PANEL_LOGIN_URL },
  ];
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero butonları</p>
      <p className="mt-1 text-xs text-slate-600">
        Canlı sitede metin ve linkler şu an kodda sabit; CMS’den henüz değiştirilemiyor.
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.label}>
            <span className="font-medium text-slate-800">{item.label}</span>
            <span className="ml-2 font-mono text-xs text-slate-500">{item.href}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
