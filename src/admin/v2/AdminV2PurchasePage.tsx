import { useCallback, useEffect, useState } from 'react';
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { uploadAdminImage } from '@/lib/adminSiteSettings';
import {
  fetchAdminProduct,
  updateAdminProduct,
  type AdminProductForm,
} from '@/lib/adminProduct';
import { resolveAdminAssetUrl } from '@/lib/resolvePublicAssetUrl';
import { showToast } from '@/components/ui/toast';

const emptyForm = (): AdminProductForm => ({
  name: '',
  priceAnnualTl: '',
  priceMonthlyTl: '',
  originalPriceTl: '',
  imageUrls: [],
  shortDescription: '',
  longDescription: '',
  features: [],
  targetAudience: [],
  trustInfo: { securePayment: '', invoiceReceipt: '' },
  isActive: true,
});

function StringListEditor({
  label,
  hint,
  items,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  disabled,
}: {
  label: string;
  hint?: string;
  items: string[];
  draft: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      {hint && <p className="mt-0.5 text-[12px] text-[#8a9aaa]">{hint}</p>}
      <div className="mt-2 flex gap-2">
        <input
          className={adminInputClass}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || !draft.trim()}
          className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#dbe4ea] bg-[#f7faf9] px-3 py-2 text-[13px]"
            >
              <span className="min-w-0 flex-1">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={disabled}
                className="rounded p-1 text-[#8a9aaa] hover:bg-white hover:text-red-600 disabled:opacity-50"
                aria-label="Kaldır"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminV2PurchasePage() {
  const { tokenPresent } = useAdminToken();
  const [form, setForm] = useState<AdminProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setForm(emptyForm());
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageError(null);
    try {
      const data = await fetchAdminProduct();
      setForm(data ?? emptyForm());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ürün bilgisi yüklenemedi';
      setPageError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [tokenPresent]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenPresent) return;
    setSaving(true);
    setPageError(null);
    try {
      await updateAdminProduct(form);
      showToast('Satın al sayfası kaydedildi', 'success');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayıt başarısız';
      setPageError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !tokenPresent) return;
    setUploading(true);
    try {
      const url = await uploadAdminImage(file);
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
      showToast('Görsel yüklendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Yükleme başarısız', 'error');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
    setNewImageUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Satın Al Sayfası</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#5c6b7a]">
            <code className="rounded bg-white px-1 text-[13px]">/satin-al</code> sayfasındaki ürün
            adı, fiyatlar, galeri ve metinleri buradan yönetin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={!tokenPresent || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px] font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <a
            href="/satin-al"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px] font-medium hover:bg-[#f7faf9]"
          >
            <ExternalLink className="h-4 w-4" />
            Sayfayı aç
          </a>
        </div>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Düzenleme için admin token gerekir.
        </p>
      )}

      {pageError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {pageError}
        </p>
      )}

      <div className={adminMutedPanelClass}>
        <p className="px-4 py-3 text-[13px] text-[#5c6b7a]">
          <strong>Kampanya indirimleri</strong> ayrı ekrandan yönetilir:{' '}
          <Link to="/admin/v2/campaigns" className="font-semibold text-[#0f5c56] underline">
            Kampanyalar
          </Link>
          . Yasal metinler (ön bilgilendirme, mesafeli satış) sayfa slug’ları üzerinden yayınlanır.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#5c6b7a]">
          <Loader2 className="h-5 w-5 animate-spin text-[#0f5c56]" />
          Yükleniyor…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <SectionCard
            title="Genel bilgiler"
            description="Hero başlığı ve kısa tanıtım metni"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={adminLabelClass}>Ürün / program adı *</label>
                <input
                  className={`${adminInputClass} mt-1.5`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={saving}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={adminLabelClass}>Kısa açıklama (hero alt metni)</label>
                <textarea
                  className={`${adminInputClass} mt-1.5`}
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  disabled={saving}
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  disabled={saving}
                />
                Yayında (pasifse ziyaretçiler ürünü göremez)
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Fiyatlar (TL)"
            description="Aylık ve yıllık abonelik tutarları"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={adminLabelClass}>Yıllık abonelik *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${adminInputClass} mt-1.5`}
                  value={form.priceAnnualTl}
                  onChange={(e) => setForm({ ...form, priceAnnualTl: e.target.value })}
                  disabled={saving}
                  placeholder="22000.00"
                  required
                />
              </div>
              <div>
                <label className={adminLabelClass}>Aylık abonelik</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${adminInputClass} mt-1.5`}
                  value={form.priceMonthlyTl}
                  onChange={(e) => setForm({ ...form, priceMonthlyTl: e.target.value })}
                  disabled={saving}
                  placeholder="1800.00"
                />
              </div>
              <div>
                <label className={adminLabelClass}>
                  İndirimli yıllık <span className="font-normal text-[#8a9aaa]">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${adminInputClass} mt-1.5`}
                  value={form.originalPriceTl}
                  onChange={(e) => setForm({ ...form, originalPriceTl: e.target.value })}
                  disabled={saving}
                  placeholder="Boş bırakılabilir"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Ürün galerisi"
            description="Satın al sayfasındaki ürün görselleri"
          >
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#dbe4ea] px-4 py-2 text-[13px] font-medium hover:bg-[#f7faf9] ${
                  uploading || saving ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'Yükleniyor…' : 'Bilgisayardan yükle'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading || saving}
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className={adminInputClass}
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                disabled={saving}
                placeholder="/uploads/... veya https://..."
              />
              <button
                type="button"
                onClick={addImageUrl}
                disabled={saving || !newImageUrl.trim()}
                className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
              >
                URL ekle
              </button>
            </div>
            {form.imageUrls.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.imageUrls.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative overflow-hidden rounded-xl border border-[#dbe4ea] bg-[#f7faf9]"
                  >
                    <img
                      src={resolveAdminAssetUrl(url)}
                      alt=""
                      className="aspect-[4/3] w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageUrls: f.imageUrls.filter((_, idx) => idx !== i),
                        }))
                      }
                      disabled={saving}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                      aria-label="Görseli kaldır"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                    <p className="truncate px-2 py-1 font-mono text-[10px] text-[#8a9aaa]">{url}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] italic text-[#8a9aaa]">
                Görsel yok — sayfa varsayılan tanıtım görsellerini kullanır.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="İçerik blokları"
            description="Özellikler, hedef kitle ve güven metinleri"
          >
            <div className="space-y-6">
              <StringListEditor
                label="Neler dahil (özellikler)"
                items={form.features}
                draft={newFeature}
                onDraftChange={setNewFeature}
                onAdd={() => {
                  if (!newFeature.trim()) return;
                  setForm((f) => ({ ...f, features: [...f.features, newFeature.trim()] }));
                  setNewFeature('');
                }}
                onRemove={(i) =>
                  setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
                }
                disabled={saving}
              />
              <StringListEditor
                label="Kimler için"
                items={form.targetAudience}
                draft={newAudience}
                onDraftChange={setNewAudience}
                onAdd={() => {
                  if (!newAudience.trim()) return;
                  setForm((f) => ({
                    ...f,
                    targetAudience: [...f.targetAudience, newAudience.trim()],
                  }));
                  setNewAudience('');
                }}
                onRemove={(i) =>
                  setForm((f) => ({
                    ...f,
                    targetAudience: f.targetAudience.filter((_, idx) => idx !== i),
                  }))
                }
                disabled={saving}
              />
              <div>
                <label className={adminLabelClass}>Güvenli ödeme metni</label>
                <textarea
                  className={`${adminInputClass} mt-1.5`}
                  rows={2}
                  value={form.trustInfo.securePayment}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      trustInfo: { ...form.trustInfo, securePayment: e.target.value },
                    })
                  }
                  disabled={saving}
                />
              </div>
              <div>
                <label className={adminLabelClass}>Fatura / makbuz metni</label>
                <textarea
                  className={`${adminInputClass} mt-1.5`}
                  rows={2}
                  value={form.trustInfo.invoiceReceipt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      trustInfo: { ...form.trustInfo, invoiceReceipt: e.target.value },
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!tokenPresent || saving}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
