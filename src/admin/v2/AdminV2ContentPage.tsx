import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  fetchAdminV2ContentBundle,
  summarizeAdminContentBundle,
  type AdminContentBundleSummary,
} from '@/lib/adminContentBundle';
import { Card } from '@/components/ui/Card';

const SUMMARY_LABELS: { key: keyof AdminContentBundleSummary; label: string }[] = [
  { key: 'settings', label: 'Settings' },
  { key: 'modules', label: 'Modules' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'seo', label: 'SEO' },
  { key: 'pageContents', label: 'Page contents' },
  { key: 'pageCards', label: 'Page cards' },
  { key: 'mediaAssets', label: 'Media assets' },
];

export function AdminV2ContentPage() {
  const [summary, setSummary] = useState<AdminContentBundleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokenPresent, revision } = useAdminToken();

  const loadBundle = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const bundle = await fetchAdminV2ContentBundle();
      setSummary(summarizeAdminContentBundle(bundle));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Content bundle yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) {
      loadBundle();
    }
  }, [tokenPresent, revision]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Backend admin endpointinden okunan yayınlanmış V2 içerik özeti (salt okunur).
        </p>
        <button
          type="button"
          onClick={loadBundle}
          disabled={!tokenPresent || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div>
            <p className="font-semibold">Admin oturumu gerekli</p>
            <p className="mt-1 text-red-800">
              Token bulunamadı. Dashboard üzerinden token yapıştırıp kaydedin veya mevcut admin
              girişinden sonra <code className="rounded bg-red-100 px-1">localStorage.token</code>{' '}
              oluşmasını bekleyin.
            </p>
          </div>
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
          Content bundle yükleniyor…
        </div>
      )}

      {summary && !loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUMMARY_LABELS.map(({ key, label }) => (
            <Card key={key}>
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary[key]}</p>
            </Card>
          ))}
        </div>
      )}

      {summary && (
        <p className="text-xs text-slate-500">
          FAQ: kategori + soru toplamı. Pricing: plan + karşılaştırma kolonu. Contact: ayar
          (0/1) + destek kartı. Page cards: tüm sayfalardaki kart adedi.
        </p>
      )}
    </div>
  );
}
