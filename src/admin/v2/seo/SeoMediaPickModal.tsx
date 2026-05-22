import { useEffect, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import {
  fetchAdminV2ContentBundle,
  parseAdminMediaAssets,
} from '@/lib/adminContentBundle';
import { resolveAdminAssetUrl } from '@/lib/resolvePublicAssetUrl';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function SeoMediaPickModal({ open, onClose, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ label: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchAdminV2ContentBundle()
      .then((bundle) => {
        if (cancelled) return;
        const rows = parseAdminMediaAssets(bundle);
        setItems(
          rows
            .filter((r) => r.fileUrl?.trim())
            .map((r) => ({
              label: r.assetKey,
              url: r.fileUrl!.trim(),
            })),
        );
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Medya listesi yüklenemedi');
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a2433]/50 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-[#dbe4ea] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seo-media-pick-title"
      >
        <div className="flex items-center justify-between border-b border-[#dbe4ea] px-4 py-3">
          <h3 id="seo-media-pick-title" className="text-base font-bold text-[#1e2a3a]">
            Medya seç
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f0f5f4]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-[#5c6b7a]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yükleniyor…
            </div>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-[13px] text-[#5c6b7a]">
              Yayınlanmış medya bulunamadı. Önce Medya Kütüphanesi’nden görsel ekleyin veya URL
              yazın.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => {
                  onSelect(item.url);
                  onClose();
                }}
                className="overflow-hidden rounded-xl border border-[#dbe4ea] text-left transition-shadow hover:border-[#0f5c56] hover:shadow-md"
              >
                <div className="aspect-video bg-[#f7faf9]">
                  <img
                    src={resolveAdminAssetUrl(item.url)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="truncate px-2 py-1.5 font-mono text-[10px] text-[#5c6b7a]">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
