import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminPageIntro } from '@/admin/cms/AdminPageIntro';
import { AdminSectionCard } from '@/admin/cms/AdminSectionCard';
import {
  fetchAdminV2ContentBundle,
  getAdminHomepageSection,
  parseAdminHomepageSections,
  parseAdminMarketing,
  type AdminHomepageSectionRow,
} from '@/lib/adminContentBundle';
import { adminV2Patch } from '@/lib/adminV2Patch';
import {
  buildConfigJson,
  HomepageSectionEditor,
  TrustMetricsInline,
  type SectionDraft,
} from '@/admin/v2/homepageAdminShared';

export function AdminV2HomepagePage() {
  const [sections, setSections] = useState<AdminHomepageSectionRow[]>([]);
  const [trustCount, setTrustCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setSections(parseAdminHomepageSections(bundle));
      setTrustCount(parseAdminMarketing(bundle).trustMetrics.length);
      setModuleCount(bundle.calculationModules?.length ?? 0);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Ana sayfa verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenPresent) load();
    else setSections([]);
  }, [tokenPresent, revision, load]);

  const saveSection = async (sectionKey: string, draft: SectionDraft) => {
    if (!tokenPresent) return;
    const section = getAdminHomepageSection(sections, sectionKey);
    if (!section) return;

    setSaving(true);
    setSaveError(null);
    try {
      await adminV2Patch(`/api/admin/v2/homepage/sections/${encodeURIComponent(sectionKey)}`, {
        title: draft.title,
        eyebrow: draft.eyebrow,
        subtitle: draft.subtitle,
        description: draft.description,
        configJson: buildConfigJson(sectionKey, draft, section.config),
        isActive: draft.isActive,
      });
      setEditingKey(null);
      await load();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const hero = getAdminHomepageSection(sections, 'hero');
  const trust = getAdminHomepageSection(sections, 'trust');
  const modules = getAdminHomepageSection(sections, 'modules');
  const excel = getAdminHomepageSection(sections, 'excel');
  const pricingCta = getAdminHomepageSection(sections, 'pricing_cta');
  const faqPreview = getAdminHomepageSection(sections, 'faq_preview');

  const editorProps = {
    editingKey,
    saving,
    saveError,
    tokenPresent,
    globalEdit: editingKey !== null,
  };

  return (
    <div>
      <AdminPageIntro
        title="Gelişmiş ana sayfa editörü"
        description="Tüm bölüm anahtarları, üst etiket ve aktiflik alanları. Günlük düzenleme için Ana Sayfa Yönetimi menüsünü kullanın."
      >
        <Link
          to="/admin/v2/homepage"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          ← Ana Sayfa Yönetimi
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          Canlı site
          <ExternalLink className="h-4 w-4" />
        </a>
      </AdminPageIntro>

      {!tokenPresent && (
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Admin token gerekli.</p>
        </div>
      )}

      {error && (
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={load}
          disabled={!tokenPresent || loading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Yükleniyor…
        </div>
      ) : (
        <div className="space-y-5">
          {hero && (
            <AdminSectionCard title="hero" description="sectionKey: hero">
              <HomepageSectionEditor
                section={hero}
                mode="full"
                {...editorProps}
                onStart={() => {
                  setSaveError(null);
                  setEditingKey('hero');
                }}
                onCancel={() => setEditingKey(null)}
                onSave={(d) => saveSection('hero', d)}
              />
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Sabit butonlar: /demo-talep · /fiyatlandirma · {config.PANEL_LOGIN_URL}
              </p>
            </AdminSectionCard>
          )}

          <AdminSectionCard title="trust" description={`${trustCount} metrik · sectionKey: trust`}>
            {trust && (
              <p className="mb-3 text-sm text-slate-600">
                Başlık: <strong>{trust.title ?? '—'}</strong>
              </p>
            )}
            <TrustMetricsInline />
          </AdminSectionCard>

          <AdminSectionCard title="modules" description={`${moduleCount} modül`}>
            {modules && (
              <p className="text-sm text-slate-700">
                {modules.title} — {modules.description}
              </p>
            )}
            <Link to="/admin/v2/calculations" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
              calculations →
            </Link>
          </AdminSectionCard>

          {excel && (
            <AdminSectionCard title="excel" description="sectionKey: excel">
              <HomepageSectionEditor
                section={excel}
                mode="full"
                {...editorProps}
                onStart={() => {
                  setSaveError(null);
                  setEditingKey('excel');
                }}
                onCancel={() => setEditingKey(null)}
                onSave={(d) => saveSection('excel', d)}
              />
            </AdminSectionCard>
          )}

          {pricingCta && (
            <AdminSectionCard title="pricing_cta" description="sectionKey: pricing_cta">
              <HomepageSectionEditor
                section={pricingCta}
                mode="full"
                {...editorProps}
                onStart={() => {
                  setSaveError(null);
                  setEditingKey('pricing_cta');
                }}
                onCancel={() => setEditingKey(null)}
                onSave={(d) => saveSection('pricing_cta', d)}
              />
            </AdminSectionCard>
          )}

          {faqPreview && (
            <AdminSectionCard title="faq_preview" description="sectionKey: faq_preview">
              <HomepageSectionEditor
                section={faqPreview}
                mode="full"
                {...editorProps}
                onStart={() => {
                  setSaveError(null);
                  setEditingKey('faq_preview');
                }}
                onCancel={() => setEditingKey(null)}
                onSave={(d) => saveSection('faq_preview', d)}
              />
            </AdminSectionCard>
          )}
        </div>
      )}
    </div>
  );
}
