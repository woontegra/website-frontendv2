import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminPageIntro } from '@/admin/cms/AdminPageIntro';
import { AdminPageHeroSection } from '@/admin/v2/AdminPageHeroSection';
import {
  AdminEditToolbar,
  adminInputClass,
  textUsesTextarea,
} from '@/admin/v2/adminV2EditUi';
import { Card } from '@/components/ui/Card';
import {
  fetchAdminV2ContentBundle,
  type AdminV2ContentBundle,
} from '@/lib/adminContentBundle';
import {
  findAdminPageContent,
  saveAdminPageContentSection,
} from '@/lib/adminPageContent';

const DEMO_PATH = '/demo-talep';

const HERO_DEFAULTS = {
  eyebrow: '',
  title: '',
  description: '',
};

const CTA_DEFAULTS = {
  title: '',
  description: '',
};

export function AdminV2DemoPageManagement() {
  const [bundle, setBundle] = useState<AdminV2ContentBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBundle(await fetchAdminV2ContentBundle());
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Demo sayfası verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenPresent) void load();
    else setBundle(null);
  }, [tokenPresent, revision, load]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Demo Talep Sayfası"
        description="Hero metinleri ve alt CTA alanı. Form gönderimi bu ekrandan yönetilmez."
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={!tokenPresent || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {!tokenPresent && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Admin token bulunamadı. Dashboard’dan token kaydedin.</p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Yükleniyor…
        </div>
      )}

      {!loading && tokenPresent && !error && bundle && (
        <>
          <AdminPageHeroSection
            bundle={bundle}
            pagePath={DEMO_PATH}
            sectionKey="hero"
            cardTitle="Sayfa hero"
            cardDescription="Üst etiket, başlık ve açıklama /demo-talep sayfasının üst bölümünde görünür."
            fieldLabels={{
              eyebrow: 'Hero üst etiket',
              title: 'Hero başlık',
              description: 'Hero açıklama',
            }}
            defaults={HERO_DEFAULTS}
            liveUrl="/demo-talep"
            onSaved={load}
          />

          <DemoCtaSection bundle={bundle} onSaved={load} />

          <Card>
            <h2 className="text-sm font-bold text-slate-900">SEO</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sayfa başlığı ve meta açıklama için{' '}
              <Link to="/admin/v2/seo" className="font-semibold text-emerald-700 hover:underline">
                SEO Ayarları
              </Link>{' '}
              ekranını kullanın (yol: /demo-talep).
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function DemoCtaSection({
  bundle,
  onSaved,
}: {
  bundle: AdminV2ContentBundle;
  onSaved: () => void | Promise<void>;
}) {
  const snapshot = findAdminPageContent(bundle, DEMO_PATH, 'cta');
  const { tokenPresent, invalidateBundle } = useAdminToken();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(snapshot?.title ?? '');
  const [description, setDescription] = useState(snapshot?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setTitle(snapshot?.title ?? '');
      setDescription(snapshot?.description ?? '');
    }
  }, [snapshot?.title, snapshot?.description, editing]);

  const handleSave = async () => {
    if (!tokenPresent) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      await saveAdminPageContentSection(
        DEMO_PATH,
        'cta',
        { title: title.trim(), description: description.trim() },
        snapshot?.id ?? null,
      );
      invalidateBundle();
      setEditing(false);
      setSaveOk('Alt CTA kaydedildi.');
      await onSaved();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="text-sm font-bold text-slate-900">Alt CTA</h2>
      <p className="mt-1 text-sm text-slate-600">Sayfa altındaki çağrı kutusu başlık ve metni.</p>

      {saveOk && !editing && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {saveOk}
        </p>
      )}

      {editing ? (
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-semibold text-slate-500">CTA başlık</dt>
            <dd className="mt-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className={adminInputClass}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">CTA metin</dt>
            <dd className="mt-1">
              {textUsesTextarea(description) ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={saving}
                  className={adminInputClass}
                />
              ) : (
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  className={adminInputClass}
                />
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-4 divide-y divide-slate-100">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-sm font-semibold text-slate-600">CTA başlık</dt>
            <dd className="text-sm text-slate-900">
              {title || snapshot?.title || CTA_DEFAULTS.title || (
                <span className="italic text-slate-400">(boş)</span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-sm font-semibold text-slate-600">CTA metin</dt>
            <dd className="text-sm text-slate-900">
              {description || snapshot?.description || (
                <span className="italic text-slate-400">(boş)</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      <AdminEditToolbar
        isEditing={editing}
        saving={saving}
        tokenPresent={tokenPresent}
        saveError={saveError}
        onEdit={() => {
          setSaveOk(null);
          setEditing(true);
        }}
        onSave={() => void handleSave()}
        onCancel={() => {
          setEditing(false);
          setTitle(snapshot?.title ?? '');
          setDescription(snapshot?.description ?? '');
          setSaveError(null);
        }}
      />
    </Card>
  );
}
