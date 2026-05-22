import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { config } from '@/lib/config';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminPageIntro } from '@/admin/cms/AdminPageIntro';
import { AdminSectionCard } from '@/admin/cms/AdminSectionCard';
import {
  fetchAdminV2ContentBundle,
  summarizeAdminContentBundle,
  type AdminContentBundleSummary,
} from '@/lib/adminContentBundle';
import type { ApiError } from '@/lib/apiClient';
import { AdminV2ContentPage } from '@/admin/v2/AdminV2ContentPage';

const previewLinks = [
  { href: '/', label: 'Ana sayfa' },
  { href: '/fiyatlandirma', label: 'Fiyatlandırma' },
  { href: '/demo-talep', label: 'Demo talep' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/sss', label: 'SSS' },
];

export function AdminV2PublishPage() {
  const [summary, setSummary] = useState<AdminContentBundleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      setSummary(summarizeAdminContentBundle(bundle));
    } catch (err) {
      setError((err as ApiError).message ?? 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) load();
  }, [tokenPresent, revision]);

  const publicBundleUrl = `${config.API_BASE_URL.replace(/\/$/, '')}/api/v2/public/content-bundle`;

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Yayına alma ve önizleme"
        description="Değişiklikler published + active kayıtlarda public content-bundle üzerinden canlı siteye yansır. Bu ekrandan önizleme linklerini ve teknik yayın özetini kontrol edin."
      />

      <AdminSectionCard title="Canlı site önizleme" description="Yeni sekmede tanıtım sitesini açın">
        <ul className="flex flex-wrap gap-3">
          {previewLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Public API:{' '}
          <a href={publicBundleUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sky-700">
            {publicBundleUrl}
          </a>
        </p>
      </AdminSectionCard>

      <AdminSectionCard
        title="Yayın özeti"
        description="Admin bundle’daki yayınlanmış kayıt sayıları"
        actions={
          <button
            type="button"
            onClick={load}
            disabled={!tokenPresent || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        }
      >
        {error && (
          <p className="mb-3 flex items-center gap-2 text-sm text-red-700" role="alert">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Özet yükleniyor…
          </p>
        )}
        {summary && !loading && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase text-slate-500">{key}</dt>
                <dd className="text-xl font-bold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-4 text-xs text-slate-500">
          publishStatus bu panelden değiştirilmez; yalnızca mevcut yayınlanmış kayıtlar düzenlenir.
        </p>
      </AdminSectionCard>

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-slate-700">
          Teknik content-bundle özeti (gelişmiş)
        </summary>
        <div className="border-t border-slate-100 p-4">
          <AdminV2ContentPage />
        </div>
      </details>
    </div>
  );
}
