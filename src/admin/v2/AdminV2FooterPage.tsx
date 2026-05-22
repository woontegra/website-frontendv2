import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { AdminActiveCheckbox } from '@/admin/v2/adminV2EditUi';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminCardPaddingClass,
  adminCompactInputClass,
  adminCompactLabelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { config } from '@/lib/config';
import {
  fetchAdminV2ContentBundle,
  parseAdminContact,
  parseAdminFooter,
  type AdminFooterData,
} from '@/lib/adminContentBundle';
import { ensureAdminV2FooterLayout } from '@/lib/adminFooter';
import { ADMIN_V2_PATCH_ROUTES, adminV2Patch } from '@/lib/adminV2Patch';

type LinkDraft = {
  id: string;
  title: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type FooterForm = {
  siteName: string;
  tagline: string;
  copyrightNote: string;
  links: LinkDraft[];
};

const footerCardClass = `${adminCardClass} ${adminCardPaddingClass}`;

function formFromData(data: AdminFooterData): FooterForm {
  return {
    siteName: data.brand.title ?? '',
    tagline: data.brand.description ?? '',
    copyrightNote: data.copyright.subtitle ?? '',
    links: data.navCards.map((card) => ({
      id: card.id,
      title: card.title ?? '',
      linkUrl: card.linkUrl ?? '',
      sortOrder: String(card.sortOrder),
      isActive: card.isActive,
    })),
  };
}

function FooterPreview({
  form,
  contactEmail,
  contactPhone,
  contactAddress,
}: {
  form: FooterForm;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}) {
  const year = new Date().getFullYear();
  const activeLinks = form.links
    .filter((l) => l.isActive && l.title.trim() && l.linkUrl.trim())
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-200 shadow-lg">
      <div className="border-b border-slate-700 bg-slate-800/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Canlı site önizlemesi
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">
            {form.siteName.trim() || 'Site adı'}
          </p>
          <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-slate-300">
            {form.tagline.trim() || 'Tanıtım metni…'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white">Sayfalar</p>
          <ul className="mt-2 space-y-1 text-[11px]">
            {activeLinks.length === 0 ? (
              <li className="text-slate-500">Aktif link yok</li>
            ) : (
              activeLinks.map((link) => (
                <li key={link.id} className="text-emerald-400/90">
                  {link.title}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white">İletişim</p>
          <ul className="mt-2 space-y-1.5 text-[10px] text-slate-300">
            <li className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              {contactEmail}
            </li>
            <li className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              {contactPhone}
            </li>
            <li className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {contactAddress}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-700 px-4 py-2.5 text-center text-[10px] text-slate-400">
        © {year} {form.siteName.trim() || 'Site'}. {form.copyrightNote.trim() || 'Telif metni…'}
      </div>
    </div>
  );
}

export function AdminV2FooterPage() {
  const { tokenPresent, revision, invalidateBundle } = useAdminToken();
  const [data, setData] = useState<AdminFooterData | null>(null);
  const [form, setForm] = useState<FooterForm | null>(null);
  const [contactPreview, setContactPreview] = useState<{
    email: string;
    phone: string;
    address: string;
  }>({
    email: config.contactEmail,
    phone: config.contactPhone,
    address: config.contactAddress,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<'text' | 'link' | null>(null);
  const [ensuring, setEnsuring] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [missingFooter, setMissingFooter] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const bundle = await fetchAdminV2ContentBundle();
      const contact = parseAdminContact(bundle);
      if (contact.setting) {
        setContactPreview({
          email: contact.setting.contactEmail ?? config.contactEmail,
          phone: contact.setting.contactPhone ?? config.contactPhone,
          address: contact.setting.contactAddress ?? config.contactAddress,
        });
      }
      const parsed = parseAdminFooter(bundle);
      if (!parsed) {
        setData(null);
        setForm(null);
        setMissingFooter(true);
        return;
      }
      setMissingFooter(false);
      setData(parsed);
      setForm(formFromData(parsed));
      setEditingLinkId(null);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Footer yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenPresent) void load();
    else {
      setData(null);
      setForm(null);
    }
  }, [tokenPresent, revision]);

  const previewForm: FooterForm = form ?? {
    siteName: '',
    tagline: '',
    copyrightNote: '',
    links: [],
  };

  const handleEnsureFooter = async () => {
    if (!tokenPresent) return;
    setEnsuring(true);
    setMessage(null);
    try {
      await ensureAdminV2FooterLayout();
      invalidateBundle();
      await load();
      setMessage({ type: 'ok', text: 'Varsayılan footer oluşturuldu.' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Footer oluşturulamadı' });
    } finally {
      setEnsuring(false);
    }
  };

  const saveTexts = async () => {
    if (!data || !form || !tokenPresent) return;
    setSavingSection('text');
    setMessage(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.pageContent(data.brand.id), {
        title: form.siteName.trim(),
        description: form.tagline,
      });
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.pageContent(data.copyright.id), {
        subtitle: form.copyrightNote.trim(),
      });
      invalidateBundle();
      await load();
      setMessage({ type: 'ok', text: 'Marka ve telif metni kaydedildi.' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Kaydedilemedi' });
    } finally {
      setSavingSection(null);
    }
  };

  const saveLink = async (linkId: string) => {
    if (!form || !tokenPresent) return;
    const link = form.links.find((l) => l.id === linkId);
    if (!link) return;
    const sortOrder = Number.parseInt(link.sortOrder, 10);
    if (!Number.isFinite(sortOrder)) {
      setMessage({ type: 'err', text: 'Sıra geçerli bir sayı olmalıdır.' });
      return;
    }
    if (!link.title.trim() || !link.linkUrl.trim()) {
      setMessage({ type: 'err', text: 'Başlık ve link zorunludur.' });
      return;
    }
    setSavingSection('link');
    setMessage(null);
    try {
      await adminV2Patch(ADMIN_V2_PATCH_ROUTES.pageCard(linkId), {
        title: link.title.trim(),
        linkUrl: link.linkUrl.trim(),
        sortOrder,
        isActive: link.isActive,
      });
      setEditingLinkId(null);
      invalidateBundle();
      await load();
      setMessage({ type: 'ok', text: 'Link kaydedildi.' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Link kaydedilemedi' });
    } finally {
      setSavingSection(null);
    }
  };

  const updateLink = (id: string, patch: Partial<LinkDraft>) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            links: prev.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
          }
        : prev,
    );
  };

  const busy = savingSection !== null || ensuring;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminPageTitleClass}>Footer Yönetimi</h1>
          <p className="mt-1 max-w-xl text-[13px] text-[#5c6b7a]">
            Alt bilgi metinleri ve menü linkleri. Telefon/e-posta{' '}
            <Link to="/admin/v2/contact" className="font-semibold text-[#0f5c56] hover:underline">
              İletişim sayfasından
            </Link>{' '}
            gelir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#0f5c56] shadow-sm hover:bg-[#f7faf9]"
          >
            Canlı site <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={() => void load()}
            disabled={!tokenPresent || loading || busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-semibold shadow-sm hover:bg-[#f7faf9] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] ${
            message.type === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {message.type === 'ok' ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {missingFooter && !loading && tokenPresent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[14px] font-semibold text-amber-950">Footer henüz kurulmamış</p>
          <p className="mt-1 text-[13px] text-amber-900">
            Varsayılan içerikle tek tıkla başlayın; sonra aşağıdaki formdan düzenlersiniz.
          </p>
          <button
            type="button"
            onClick={() => void handleEnsureFooter()}
            disabled={ensuring}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
          >
            {ensuring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Varsayılan footer&apos;ı oluştur
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[#5c6b7a]">
          <Loader2 className="h-5 w-5 animate-spin text-[#0f5c56]" />
          Yükleniyor…
        </div>
      )}

      {form && data && !loading && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
          <div className="min-w-0 space-y-4">
            <section className={`${footerCardClass} !py-4 space-y-3 sm:!py-5`}>
              <div className="flex items-start justify-between gap-3 border-b border-[#eef2f5] pb-3">
                <div className="min-w-0 pr-2">
                  <h2 className="text-[14px] font-bold text-[#1e2a3a]">Marka ve telif</h2>
                  <p className="text-[11px] text-[#5c6b7a]">Sol sütun metni ve alt telif satırı</p>
                </div>
                <button
                  type="button"
                  onClick={() => void saveTexts()}
                  disabled={!tokenPresent || busy}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
                >
                  {savingSection === 'text' ? (
                    <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
              <div className="grid min-w-0 gap-3">
                <div className="min-w-0">
                  <label className={adminCompactLabelClass}>Site / marka adı</label>
                  <input
                    className={`${adminCompactInputClass} mt-1`}
                    value={form.siteName}
                    onChange={(e) => setForm((f) => f && { ...f, siteName: e.target.value })}
                    disabled={busy}
                  />
                </div>
                <div className="min-w-0">
                  <label className={adminCompactLabelClass}>Kısa tanıtım</label>
                  <textarea
                    className={`${adminCompactInputClass} mt-1 resize-y`}
                    rows={2}
                    value={form.tagline}
                    onChange={(e) => setForm((f) => f && { ...f, tagline: e.target.value })}
                    disabled={busy}
                  />
                </div>
                <div className="min-w-0">
                  <label className={adminCompactLabelClass}>Telif metni</label>
                  <input
                    className={`${adminCompactInputClass} mt-1`}
                    value={form.copyrightNote}
                    onChange={(e) => setForm((f) => f && { ...f, copyrightNote: e.target.value })}
                    disabled={busy}
                    placeholder="Tüm hakları saklıdır."
                  />
                  <p className="mt-1 text-[10px] text-[#8a9aaa]">
                    Önizlemede: © {new Date().getFullYear()} [site adı]. [bu metin]
                  </p>
                </div>
              </div>
            </section>

            <section className={`${adminCardClass} ${adminCardPaddingClass}`}>
              <div className="mb-3 border-b border-[#eef2f5] pb-3">
                <h2 className="text-[14px] font-bold text-[#1e2a3a]">Menü linkleri</h2>
                <p className="text-[11px] text-[#5c6b7a]">Düzenlemek için satırdaki kalem</p>
              </div>
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full table-fixed text-left text-[12px]">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[34%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#fafbfc] text-[10px] font-bold uppercase tracking-wide text-[#5c6b7a]">
                      <th className="px-2 py-2 pl-0">Başlık</th>
                      <th className="px-2 py-2">Link</th>
                      <th className="px-1 py-2 text-center">Sıra</th>
                      <th className="px-1 py-2 text-center">Durum</th>
                      <th className="px-2 py-2 pr-0 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...form.links]
                      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                      .map((link) => {
                        const editing = editingLinkId === link.id;
                        return (
                          <tr
                            key={link.id}
                            className={`border-t border-[#eef2f5] ${editing ? 'bg-[#f7faf9]' : 'hover:bg-[#fafbfc]'}`}
                          >
                            <td className="px-2 py-1.5 pl-0 align-middle">
                              {editing ? (
                                <input
                                  className={adminCompactInputClass}
                                  value={link.title}
                                  onChange={(e) => updateLink(link.id, { title: e.target.value })}
                                  disabled={busy}
                                />
                              ) : (
                                <span
                                  className="block truncate font-medium text-[#1e2a3a]"
                                  title={link.title}
                                >
                                  {link.title}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 align-middle">
                              {editing ? (
                                <input
                                  className={`${adminCompactInputClass} font-mono text-[11px]`}
                                  value={link.linkUrl}
                                  onChange={(e) => updateLink(link.id, { linkUrl: e.target.value })}
                                  disabled={busy}
                                  placeholder="/sayfa"
                                />
                              ) : (
                                <span
                                  className="block truncate font-mono text-[11px] text-[#0f5c56]"
                                  title={link.linkUrl}
                                >
                                  {link.linkUrl}
                                </span>
                              )}
                            </td>
                            <td className="px-1 py-1.5 text-center align-middle text-[11px] tabular-nums">
                              {editing ? (
                                <input
                                  type="number"
                                  className={`${adminCompactInputClass} mx-auto w-10 px-1 text-center`}
                                  value={link.sortOrder}
                                  onChange={(e) =>
                                    updateLink(link.id, { sortOrder: e.target.value })
                                  }
                                  disabled={busy}
                                />
                              ) : (
                                link.sortOrder
                              )}
                            </td>
                            <td className="px-1 py-1.5 text-center align-middle">
                              {editing ? (
                                <AdminActiveCheckbox
                                  checked={link.isActive}
                                  disabled={busy}
                                  onChange={(v) => updateLink(link.id, { isActive: v })}
                                />
                              ) : (
                                <span
                                  className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                    link.isActive
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {link.isActive ? 'Aktif' : 'Kapalı'}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 pr-0 text-right align-middle">
                              {editing ? (
                                <div className="flex justify-end gap-0.5">
                                  <button
                                    type="button"
                                    title="Kaydet"
                                    onClick={() => void saveLink(link.id)}
                                    disabled={busy}
                                    className="rounded-md bg-[#0f5c56] p-1 text-white disabled:opacity-50"
                                  >
                                    {savingSection === 'link' ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="Vazgeç"
                                    onClick={() => {
                                      setEditingLinkId(null);
                                      if (data) setForm(formFromData(data));
                                    }}
                                    disabled={busy}
                                    className="rounded-md border border-[#dbe4ea] bg-white p-1"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  title="Düzenle"
                                  onClick={() => setEditingLinkId(link.id)}
                                  disabled={!tokenPresent || busy || editingLinkId !== null}
                                  className="inline-flex rounded-md border border-[#dbe4ea] p-1 hover:bg-white disabled:opacity-50"
                                >
                                  <Pencil className="h-3 w-3 text-[#5c6b7a]" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
            <FooterPreview
              form={previewForm}
              contactEmail={contactPreview.email}
              contactPhone={contactPreview.phone}
              contactAddress={contactPreview.address}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-[#8a9aaa]">
              Önizleme kaydedilmeden önce formdaki değişiklikleri yansıtır. İletişim bilgisi{' '}
              <Link to="/admin/v2/contact" className="text-[#0f5c56] underline">
                buradan
              </Link>{' '}
              güncellenir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
