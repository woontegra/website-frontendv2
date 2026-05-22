import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  X,
  Calendar,
  Users,
  Percent,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import {
  campaignCheckoutLink,
  campaignPublicLink,
  createAdminCampaign,
  deleteAdminCampaign,
  fetchAdminCampaigns,
  updateAdminCampaign,
  type AdminCampaign,
} from '@/lib/adminCampaigns';

type FormData = {
  name: string;
  discountRate: string;
  usageLimit: string;
  expiresAt: string;
};

const emptyForm: FormData = {
  name: '',
  discountRate: '',
  usageLimit: '',
  expiresAt: '',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR');
}

export function AdminV2CampaignsPage() {
  const { tokenPresent } = useAdminToken();
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminCampaign | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setCampaigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCampaigns(await fetchAdminCampaigns());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Kampanyalar yüklenemedi', 'error');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [tokenPresent]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    setCreatedCampaignId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: AdminCampaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      discountRate: String(c.discountRate),
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '',
    });
    setCreatedCampaignId(null);
    setShowForm(true);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link kopyalandı', 'success');
    } catch {
      showToast('Kopyalama başarısız', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.discountRate.trim()) {
      showToast('Baro adı ve indirim oranı zorunludur', 'warning');
      return;
    }
    const discountRate = parseInt(form.discountRate, 10);
    if (Number.isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
      showToast('İndirim oranı 0–100 arasında olmalıdır', 'warning');
      return;
    }

    const payload = {
      name: form.name.trim(),
      discountRate,
      ...(form.usageLimit.trim() ? { usageLimit: parseInt(form.usageLimit, 10) } : {}),
      ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await updateAdminCampaign(editing.id, payload);
        showToast('Kampanya güncellendi', 'success');
      } else {
        const { campaign } = await createAdminCampaign(payload);
        setCreatedCampaignId(campaign.id);
        showToast('Kampanya oluşturuldu', 'success');
      }
      await load();
      if (editing) resetForm();
      else {
        setForm(emptyForm);
        setEditing(null);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kayıt başarısız', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (c: AdminCampaign) => {
    try {
      await updateAdminCampaign(c.id, { isActive: !c.isActive });
      showToast(c.isActive ? 'Kampanya pasifleştirildi' : 'Kampanya aktifleştirildi', 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'İşlem başarısız', 'error');
    }
  };

  const handleDelete = async (c: AdminCampaign) => {
    if (!confirm(`"${c.name}" kampanyasını silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteAdminCampaign(c.id);
      showToast('Kampanya silindi', 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Silinemedi', 'error');
    }
  };

  if (!tokenPresent) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Kampanya yönetimi için alttan admin token kaydedin.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Kampanyalar</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5c6b7a]">
            Baro ve özel indirim linkleri. Kısa link{' '}
            <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">/k/{'{id}'}</code>, satın
            alma sayfası{' '}
            <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">/satin-al?c=…</code>
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
          {!showForm && (
            <button
              type="button"
              onClick={openCreate}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium ${adminAccentBtnClass}`}
            >
              <Plus className="h-4 w-4" />
              Yeni kampanya
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <SectionCard
          title={editing ? 'Kampanya düzenle' : 'Yeni kampanya'}
          description="İndirim oranı satın alma sayfasında otomatik uygulanır."
          action={
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-[#5c6b7a] hover:bg-[#f0f5f4]"
              aria-label="Formu kapat"
            >
              <X className="h-5 w-5" />
            </button>
          }
          tintedHeader
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabelClass}>Baro / kampanya adı *</label>
                <input
                  className={`${adminInputClass} mt-1.5`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn: Ankara Barosu"
                  required
                />
              </div>
              <div>
                <label className={adminLabelClass}>İndirim oranı (%) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${adminInputClass} mt-1.5`}
                  value={form.discountRate}
                  onChange={(e) => setForm({ ...form, discountRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={adminLabelClass}>Kullanım limiti</label>
                <input
                  type="number"
                  min={1}
                  className={`${adminInputClass} mt-1.5`}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Boş = limitsiz"
                />
              </div>
              <div>
                <label className={adminLabelClass}>Bitiş tarihi</label>
                <input
                  type="date"
                  className={`${adminInputClass} mt-1.5`}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px] font-medium text-[#4a5c6d]"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
            {createdCampaignId && (
              <div className={`${adminMutedPanelClass} space-y-2 px-4 py-3`}>
                <p className="text-[13px] font-semibold text-[#1e2a3a]">Paylaşım linkleri</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-all font-mono text-[12px] text-[#5c6b7a]">
                    Kısa: {campaignPublicLink(createdCampaignId)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyText(campaignPublicLink(createdCampaignId))}
                    className="shrink-0 rounded-lg border border-[#dbe4ea] bg-white px-2 py-1 text-[12px]"
                  >
                    Kopyala
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-all font-mono text-[12px] text-[#5c6b7a]">
                    Satın al: {campaignCheckoutLink(createdCampaignId)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyText(campaignCheckoutLink(createdCampaignId))}
                    className="shrink-0 rounded-lg border border-[#dbe4ea] bg-white px-2 py-1 text-[12px]"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="Kampanya listesi"
        description={`${campaigns.length} kayıt`}
        compact
        tintedHeader
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f5c56]" />
          </div>
        ) : campaigns.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#5c6b7a]">
            Henüz kampanya yok. Yeni kampanya ile başlayın.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#dbe4ea] text-[12px] font-semibold uppercase tracking-wide text-[#5c6b7a]">
                  <th className="px-3 py-2">Kampanya</th>
                  <th className="px-3 py-2">İndirim</th>
                  <th className="px-3 py-2">Kullanım</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Bitiş</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-[#eef3f1] hover:bg-[#f7faf9]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-[#0f5c56]" />
                        <span className="font-medium text-[#1e2a3a]">{c.name}</span>
                      </div>
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          title="Kısa link"
                          onClick={() => void copyText(campaignPublicLink(c.id))}
                          className="rounded p-1 text-[#5c6b7a] hover:bg-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Satın al linki"
                          onClick={() => void copyText(campaignCheckoutLink(c.id))}
                          className="rounded p-1 text-[#5c6b7a] hover:bg-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                        %{c.discountRate}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-[#4a5c6d]">
                        <Users className="h-3.5 w-3.5" />
                        {c.usageCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggle(c)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.isActive ? (
                          <ToggleRight className="h-3.5 w-3.5" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5" />
                        )}
                        {c.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[#5c6b7a]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(c.expiresAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-lg p-2 text-sky-700 hover:bg-sky-50"
                        title="Düzenle"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(c)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
