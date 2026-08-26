import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { SectionCard } from '@/admin/ui/SectionCard';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminInputClass,
  adminLabelClass,
  adminModalBodyClass,
  adminModalFooterClass,
  adminModalHeaderClass,
  adminMutedPanelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { showToast } from '@/components/ui/toast';
import { CompactTablePagination } from '@/components/ui/CompactTablePagination';
import {
  AFFILIATE_TABLE_PAGE_SIZE,
  emptyAffiliatePagination,
  normalizeAffiliatePagination,
  type AffiliateListPagination,
} from '@/lib/affiliatePagination';
import {
  activateAdminAffiliate,
  activateAdminAffiliateLink,
  affiliateReferralPublicLink,
  createAdminAffiliate,
  createAdminAffiliateLink,
  createAdminAffiliatePayout,
  deactivateAdminAffiliate,
  deactivateAdminAffiliateLink,
  fetchAdminAffiliate,
  fetchAdminAffiliateCommissions,
  fetchAdminAffiliatePayouts,
  fetchAdminAffiliateSummary,
  fetchAdminAffiliates,
  fetchAdminEarnedCommissions,
  formatAffiliateTry,
  inviteAdminPartnerAccess,
  revokeAdminPartnerAccess,
  saleTypeLabel,
  updateAdminAffiliate,
  updateAdminAffiliateLink,
  type AdminAffiliate,
  type AdminAffiliateCommission,
  type AdminAffiliateCommissionPayload,
  type AdminAffiliateLink,
  type AdminAffiliatePlatformSummary,
  type AdminAffiliatePayout,
} from '@/lib/adminAffiliates';
import {
  affiliateCommissionStatusLabel,
  affiliatePackageLabel,
  affiliatePaymentMethodLabel,
  affiliatePayoutStatusLabel,
} from '@/lib/affiliateUiLabels';

type SummaryPreset = 'all' | 'this_month' | 'last_month' | 'this_year';
type ActiveFilter = 'all' | 'active' | 'inactive';
type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'OTHER';

type FormState = {
  name: string;
  defaultCommissionRate: string;
  contactName: string;
  email: string;
  phone: string;
  internalNotes: string;
};

type LinkFormState = {
  customerDiscountRate: string;
  commissionMode: 'default' | 'override';
  commissionRateOverride: string;
};

type PayoutFormState = {
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  paidAt: string;
};

const emptyForm: FormState = {
  name: '',
  defaultCommissionRate: '30',
  contactName: '',
  email: '',
  phone: '',
  internalNotes: '',
};

const emptyLinkForm: LinkFormState = {
  customerDiscountRate: '0',
  commissionMode: 'default',
  commissionRateOverride: '',
};

const emptyPayoutForm: PayoutFormState = {
  paymentMethod: 'BANK_TRANSFER',
  reference: '',
  notes: '',
  paidAt: '',
};

const PRESET_OPTIONS: { value: SummaryPreset; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'this_month', label: 'Bu ay' },
  { value: 'last_month', label: 'Geçen ay' },
  { value: 'this_year', label: 'Bu yıl' },
];

const ACTIVE_FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Banka havalesi' },
  { value: 'CASH', label: 'Nakit' },
  { value: 'OTHER', label: 'Diğer' },
];

const primaryBtnClass = `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`;
const secondaryBtnClass =
  'inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-3 py-2 text-[13px] font-medium text-[#1e2a3a] shadow-sm hover:bg-[#f7faf9] disabled:opacity-50';
const dangerBtnClass =
  'inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-[13px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50';
const smallTableBtnClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4ea] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1e2a3a] hover:bg-[#f7faf9]';
const metricCardClass =
  'rounded-xl border border-[#dbe4ea]/90 bg-gradient-to-br from-white to-[#f8fafb] px-4 py-3 shadow-[0_1px_3px_rgba(26,36,51,0.06)]';

function formatDateTr(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR');
}

function packageLabel(row: AdminAffiliateCommission): string {
  return affiliatePackageLabel(row.productType, row.subscriptionPeriod);
}

function paymentMethodLabel(method: string): string {
  const found = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found?.label ?? affiliatePaymentMethodLabel(method);
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `payout-${Date.now()}-${Math.random()}`;
}

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return fallback;
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#1a2433]/45 p-4 backdrop-blur-sm sm:p-6">
      <div
        className={`my-auto w-full overflow-hidden rounded-2xl border border-[#dbe4ea] bg-white shadow-xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className={`flex items-center justify-between gap-3 ${adminModalHeaderClass}`}>
          <h2 className="text-[1.05rem] font-semibold text-[#1e2a3a]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={adminModalBodyClass}>{children}</div>
        {footer ? <div className={adminModalFooterClass}>{footer}</div> : null}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={metricCardClass}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9aaa]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[#1e2a3a]">{value}</p>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
        Aktif
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
      Pasif
    </span>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  const label = affiliateCommissionStatusLabel(status);
  if (status === 'EARNED') {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
        {label}
      </span>
    );
  }
  if (status === 'PARTIALLY_PAID') {
    return (
      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900 ring-1 ring-sky-200">
        {label}
      </span>
    );
  }
  if (status === 'PAID') {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
        {label}
      </span>
    );
  }
  if (status === 'REVERSED' || status === 'CANCELLED' || status === 'CANCELED') {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 ring-1 ring-red-200">
        {label}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function commissionRemainingKurus(c: AdminAffiliateCommission): number {
  if (typeof c.remainingAmountKurus === 'number') return c.remainingAmountKurus;
  return Math.max(0, c.commissionAmountKurus - (c.paidAmountKurus ?? 0));
}

function commissionPaidKurus(c: AdminAffiliateCommission): number {
  if (typeof c.paidAmountKurus === 'number') return c.paidAmountKurus;
  return Math.max(0, c.commissionAmountKurus - commissionRemainingKurus(c));
}

/** Parse TL input (tr or en) → kurus integer, or null if invalid. */
function parseTlToKurus(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function kurusToTlInput(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-[#dbe4ea] bg-[#f7faf9] p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={
              active
                ? `rounded-lg px-3 py-1.5 text-[13px] font-medium ${adminAccentBtnClass}`
                : 'rounded-lg border border-transparent px-3 py-1.5 text-[13px] font-medium text-[#1e2a3a] hover:border-[#dbe4ea] hover:bg-white'
            }
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminV2AffiliatesPage() {
  const { tokenPresent } = useAdminToken();

  const [preset, setPreset] = useState<SummaryPreset>('all');
  const [summary, setSummary] = useState<AdminAffiliatePlatformSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [items, setItems] = useState<AdminAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminAffiliate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminAffiliate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkFormState>(emptyLinkForm);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [commissions, setCommissions] = useState<AdminAffiliateCommissionPayload | null>(null);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [payouts, setPayouts] = useState<AdminAffiliatePayout[]>([]);
  const [payoutsPagination, setPayoutsPagination] = useState<AffiliateListPagination>(
    emptyAffiliatePagination(),
  );
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [earnedLoading, setEarnedLoading] = useState(false);
  const [earnedItems, setEarnedItems] = useState<AdminAffiliateCommission[]>([]);
  /** commissionId → TL amount string for this payout */
  const [allocationTlById, setAllocationTlById] = useState<Record<string, string>>({});
  const [payoutForm, setPayoutForm] = useState<PayoutFormState>(emptyPayoutForm);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [inviteMagicUrl, setInviteMagicUrl] = useState<string | null>(null);
  const [partnerBusy, setPartnerBusy] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!tokenPresent) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);
    try {
      const data = await fetchAdminAffiliateSummary({ preset });
      setSummary(data);
    } catch (e) {
      showToast(errorMessage(e, 'Özet yüklenemedi'), 'error');
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [tokenPresent, preset]);

  const load = useCallback(async () => {
    if (!tokenPresent) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isActive =
        activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;
      const data = await fetchAdminAffiliates({
        search: search.trim() || undefined,
        isActive,
        pageSize: 50,
        preset,
      });
      setItems(data.items);
    } catch (e) {
      showToast(errorMessage(e, 'Liste yüklenemedi'), 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tokenPresent, search, activeFilter, preset]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetailCommissions = useCallback(async (id: string, page: number) => {
    setCommissionsLoading(true);
    try {
      const comm = await fetchAdminAffiliateCommissions(id, {
        page,
        limit: AFFILIATE_TABLE_PAGE_SIZE,
      });
      setCommissions({
        ...comm,
        pagination: normalizeAffiliatePagination(comm.pagination),
      });
    } catch (e) {
      showToast(errorMessage(e, 'Komisyonlar yüklenemedi'), 'error');
      setCommissions(null);
    } finally {
      setCommissionsLoading(false);
    }
  }, []);

  const loadDetailPayouts = useCallback(async (id: string, page: number) => {
    setPayoutsLoading(true);
    try {
      const pay = await fetchAdminAffiliatePayouts(id, {
        page,
        limit: AFFILIATE_TABLE_PAGE_SIZE,
      });
      setPayouts(pay.items);
      setPayoutsPagination(normalizeAffiliatePagination(pay.pagination));
    } catch (e) {
      showToast(errorMessage(e, 'Ödemeler yüklenemedi'), 'error');
      setPayouts([]);
      setPayoutsPagination(emptyAffiliatePagination());
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string, options?: { preserveInviteUrl?: boolean }) => {
    setSelectedId(id);
    setDetailLoading(true);
    setCommissionsLoading(true);
    setPayoutsLoading(true);
    if (!options?.preserveInviteUrl) {
      setInviteMagicUrl(null);
    }
    try {
      const aff = await fetchAdminAffiliate(id);
      setDetail(aff);
      await Promise.all([loadDetailCommissions(id, 1), loadDetailPayouts(id, 1)]);
    } catch (e) {
      showToast(errorMessage(e, 'Detay yüklenemedi'), 'error');
      setDetail(null);
      setCommissions(null);
      setPayouts([]);
      setPayoutsPagination(emptyAffiliatePagination());
      setCommissionsLoading(false);
      setPayoutsLoading(false);
    } finally {
      setDetailLoading(false);
    }
  }, [loadDetailCommissions, loadDetailPayouts]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadSummary(), load()]);
    if (selectedId) await loadDetail(selectedId);
  }, [loadSummary, load, selectedId, loadDetail]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: AdminAffiliate) => {
    setEditing(row);
    setForm({
      name: row.name,
      defaultCommissionRate: String(row.defaultCommissionRate),
      contactName: row.contactName ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      internalNotes: row.internalNotes ?? '',
    });
    setShowForm(true);
    void loadDetail(row.id);
  };

  const submitForm = async () => {
    const rate = Number(form.defaultCommissionRate);
    if (!form.name.trim()) {
      showToast('İsim zorunlu', 'error');
      return;
    }
    if (!Number.isInteger(rate) || rate < 0 || rate > 100) {
      showToast('Komisyon oranı 0–100 arası tam sayı olmalı', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        defaultCommissionRate: rate,
        contactName: form.contactName.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
      };
      if (editing) {
        await updateAdminAffiliate(editing.id, payload);
        showToast('İş ortağı güncellendi', 'success');
        setShowForm(false);
        setEditing(null);
        await load();
        await loadDetail(editing.id);
      } else {
        const created = await createAdminAffiliate(payload);
        showToast('İş ortağı oluşturuldu', 'success');
        setShowForm(false);
        setEditing(null);
        await load();
        await loadDetail(created.id);
      }
      await loadSummary();
    } catch (e) {
      showToast(errorMessage(e, 'Kayıt başarısız'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAffiliate = async (row: AdminAffiliate) => {
    try {
      if (row.isActive) await deactivateAdminAffiliate(row.id);
      else await activateAdminAffiliate(row.id);
      await load();
      await loadSummary();
      if (selectedId === row.id) await loadDetail(row.id);
    } catch (e) {
      showToast(errorMessage(e, 'Durum değiştirilemedi'), 'error');
    }
  };

  const parseLinkCommercial = (): {
    customerDiscountRate: number;
    commissionRateOverride: number | null;
  } | null => {
    const discount = Number(linkForm.customerDiscountRate);
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      showToast('Müşteri indirimi 0–100 arası tam sayı olmalı', 'error');
      return null;
    }
    if (linkForm.commissionMode === 'default') {
      return { customerDiscountRate: discount, commissionRateOverride: null };
    }
    const override = Number(linkForm.commissionRateOverride);
    if (!Number.isInteger(override) || override < 0 || override > 100) {
      showToast('Komisyon oranı 0–100 arası tam sayı olmalı', 'error');
      return null;
    }
    return { customerDiscountRate: discount, commissionRateOverride: override };
  };

  const addLinkFor = async (affiliateId: string) => {
    const commercial = parseLinkCommercial();
    if (!commercial) return;
    try {
      const link = await createAdminAffiliateLink(affiliateId, commercial);
      showToast(`Link oluşturuldu: ${link.code}`, 'success');
      setLinkForm(emptyLinkForm);
      setEditingLinkId(null);
      await load();
      await loadDetail(affiliateId);
    } catch (e) {
      showToast(errorMessage(e, 'Link oluşturulamadı'), 'error');
    }
  };

  const addLink = async () => {
    if (!selectedId) {
      showToast('Önce listeden iş ortağını seçin.', 'error');
      return;
    }
    await addLinkFor(selectedId);
  };

  const startEditLink = (link: AdminAffiliateLink) => {
    setEditingLinkId(link.id);
    setLinkForm({
      customerDiscountRate: String(link.customerDiscountRate ?? 0),
      commissionMode: link.commissionRateOverride == null ? 'default' : 'override',
      commissionRateOverride:
        link.commissionRateOverride == null ? '' : String(link.commissionRateOverride),
    });
  };

  const saveLinkCommercial = async () => {
    if (!editingLinkId || !selectedId) return;
    const commercial = parseLinkCommercial();
    if (!commercial) return;
    try {
      await updateAdminAffiliateLink(editingLinkId, commercial);
      showToast('Link ticari kuralları güncellendi', 'success');
      setEditingLinkId(null);
      setLinkForm(emptyLinkForm);
      await loadDetail(selectedId);
    } catch (e) {
      showToast(errorMessage(e, 'Link güncellenemedi'), 'error');
    }
  };

  const toggleLink = async (link: AdminAffiliateLink) => {
    try {
      if (link.isActive) await deactivateAdminAffiliateLink(link.id);
      else await activateAdminAffiliateLink(link.id);
      if (selectedId) await loadDetail(selectedId);
    } catch (e) {
      showToast(errorMessage(e, 'Link durumu değiştirilemedi'), 'error');
    }
  };

  const copyText = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg, 'success');
    } catch {
      showToast('Kopyalama başarısız', 'error');
    }
  };

  const copyReferralLink = async (link: AdminAffiliateLink) => {
    await copyText(affiliateReferralPublicLink(link), 'Referral linki kopyalandı.');
  };

  const openPayoutModal = async () => {
    if (!selectedId) return;
    setPayoutModalOpen(true);
    setPayoutForm(emptyPayoutForm);
    setAllocationTlById({});
    setEarnedLoading(true);
    try {
      const earned = await fetchAdminEarnedCommissions(selectedId);
      setEarnedItems(earned);
      const initial: Record<string, string> = {};
      for (const c of earned) {
        initial[c.id] = kurusToTlInput(commissionRemainingKurus(c));
      }
      setAllocationTlById(initial);
    } catch (e) {
      showToast(errorMessage(e, 'Bekleyen komisyonlar yüklenemedi'), 'error');
      setEarnedItems([]);
    } finally {
      setEarnedLoading(false);
    }
  };

  const closePayoutModal = () => {
    setPayoutModalOpen(false);
    setEarnedItems([]);
    setAllocationTlById({});
    setPayoutForm(emptyPayoutForm);
  };

  const pendingTotalKurus = useMemo(
    () => earnedItems.reduce((sum, c) => sum + commissionRemainingKurus(c), 0),
    [earnedItems],
  );

  const payoutAllocations = useMemo(() => {
    const rows: Array<{ commissionId: string; amountKurus: number }> = [];
    for (const c of earnedItems) {
      const kurus = parseTlToKurus(allocationTlById[c.id] ?? '');
      if (kurus == null || kurus <= 0) continue;
      rows.push({ commissionId: c.id, amountKurus: kurus });
    }
    return rows;
  }, [earnedItems, allocationTlById]);

  const selectedPayoutTotal = useMemo(
    () => payoutAllocations.reduce((sum, a) => sum + a.amountKurus, 0),
    [payoutAllocations],
  );

  const submitPayout = async () => {
    if (!selectedId) return;
    if (payoutAllocations.length === 0) {
      showToast('En az bir komisyon için ödeme tutarı girin', 'error');
      return;
    }
    for (const a of payoutAllocations) {
      const c = earnedItems.find((x) => x.id === a.commissionId);
      if (!c) continue;
      const remaining = commissionRemainingKurus(c);
      if (a.amountKurus > remaining) {
        showToast('Ödeme tutarı kalan bakiyeyi aşamaz', 'error');
        return;
      }
    }
    setPayoutSubmitting(true);
    try {
      const body: {
        allocations: Array<{ commissionId: string; amountKurus: number }>;
        paymentMethod: string;
        reference?: string;
        notes?: string;
        paidAt?: string;
        idempotencyKey: string;
      } = {
        allocations: payoutAllocations,
        paymentMethod: payoutForm.paymentMethod,
        idempotencyKey: makeIdempotencyKey(),
      };
      if (payoutForm.reference.trim()) body.reference = payoutForm.reference.trim();
      if (payoutForm.notes.trim()) body.notes = payoutForm.notes.trim();
      if (payoutForm.paidAt.trim()) {
        body.paidAt = new Date(payoutForm.paidAt).toISOString();
      }
      await createAdminAffiliatePayout(selectedId, body);
      showToast('Komisyon ödemesi kaydedildi', 'success');
      closePayoutModal();
      await loadDetail(selectedId);
      await load();
      await loadSummary();
    } catch (e) {
      showToast(errorMessage(e, 'Ödeme kaydı oluşturulamadı'), 'error');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const invitePartner = async () => {
    if (!selectedId) return;
    setPartnerBusy(true);
    try {
      const result = await inviteAdminPartnerAccess(selectedId);
      setInviteMagicUrl(result.magicUrl);
      showToast('Partner giriş linki oluşturuldu.', 'success');
      await loadDetail(selectedId, { preserveInviteUrl: true });
    } catch (e) {
      showToast(errorMessage(e, 'Partner erişimi oluşturulamadı'), 'error');
    } finally {
      setPartnerBusy(false);
    }
  };

  const revokePartner = async () => {
    if (!selectedId) return;
    setPartnerBusy(true);
    try {
      await revokeAdminPartnerAccess(selectedId);
      setInviteMagicUrl(null);
      showToast('Partner erişimi iptal edildi', 'success');
      await loadDetail(selectedId);
    } catch (e) {
      showToast(errorMessage(e, 'Partner erişimi iptal edilemedi'), 'error');
    } finally {
      setPartnerBusy(false);
    }
  };

  const financialSummary = useMemo(() => {
    if (detail?.financials) return detail.financials;
    if (commissions?.summary) {
      return {
        saleCount: commissions.summary.saleCount,
        totalGrossPaidAmountKurus: commissions.summary.totalGrossPaidAmountKurus,
        lifetimeEarnedCommissionKurus: commissions.summary.lifetimeEarnedCommissionKurus,
        paidCommissionKurus: commissions.summary.paidCommissionKurus,
        pendingCommissionKurus: commissions.summary.pendingCommissionKurus,
        totalCommissionBaseAmountKurus: commissions.summary.totalCommissionBaseAmountKurus,
      };
    }
    return null;
  }, [detail, commissions]);

  const clearSelection = () => {
    setSelectedId(null);
    setDetail(null);
    setCommissions(null);
    setPayouts([]);
    setPayoutsPagination(emptyAffiliatePagination());
    setInviteMagicUrl(null);
    setEditingLinkId(null);
    setLinkForm(emptyLinkForm);
  };

  const partnerAccessActive = Boolean(detail?.partnerAccess && !detail.partnerAccess.isRevoked);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={adminPageTitleClass}>İş Ortakları</h1>
          <p className="mt-1 text-sm text-[#5c6b7a]">
            Affiliate raporlama, komisyon ve ödeme yönetimi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryBtnClass} onClick={() => void refreshAll()}>
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button type="button" className={primaryBtnClass} onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni İş Ortağı
          </button>
        </div>
      </div>

      <SectionCard title="Platform özeti" description="Dönem filtresine göre toplamlar">
        <div className="mb-4">
          <SegmentedControl options={PRESET_OPTIONS} value={preset} onChange={setPreset} />
        </div>
        {summaryLoading ? (
          <div className="flex items-center gap-2 text-[#5c6b7a]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Özet yükleniyor…
          </div>
        ) : summary ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric label="Toplam iş ortağı" value={String(summary.totalAffiliates)} />
            <SummaryMetric label="Aktif" value={String(summary.activeAffiliates)} />
            <SummaryMetric label="Satış" value={String(summary.saleCount)} />
            <SummaryMetric
              label="Tahsilat"
              value={formatAffiliateTry(summary.totalGrossPaidAmountKurus)}
            />
            <SummaryMetric
              label="Matrah"
              value={formatAffiliateTry(summary.totalCommissionBaseAmountKurus)}
            />
            <SummaryMetric
              label="Hak edilen"
              value={formatAffiliateTry(summary.lifetimeEarnedCommissionKurus)}
            />
            <SummaryMetric
              label="Ödenen"
              value={formatAffiliateTry(summary.paidCommissionKurus)}
            />
            <SummaryMetric
              label="Bekleyen"
              value={formatAffiliateTry(summary.pendingCommissionKurus)}
            />
          </div>
        ) : (
          <p className="text-sm text-[#5c6b7a]">Özet yüklenemedi.</p>
        )}
      </SectionCard>

      <SectionCard title="Liste" description="Arama, durum filtresi ve finansal özet">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block min-w-[220px] flex-1">
            <span className={adminLabelClass}>Ara</span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9aaa]" />
              <input
                className={`${adminInputClass} pl-9`}
                placeholder="İsim / e-posta ara"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchInput.trim());
                }}
              />
            </div>
          </label>
          <button
            type="button"
            className={primaryBtnClass}
            onClick={() => setSearch(searchInput.trim())}
          >
            <Search className="h-4 w-4" />
            Ara
          </button>
          <div>
            <span className={adminLabelClass}>Durum</span>
            <div className="mt-1">
              <SegmentedControl
                options={ACTIVE_FILTER_OPTIONS}
                value={activeFilter}
                onChange={setActiveFilter}
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-[#5c6b7a]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        ) : items.length === 0 ? (
          <div className={`${adminMutedPanelClass} px-4 py-6 text-sm text-[#5c6b7a]`}>
            Kayıt yok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#dbe4ea] text-[12px] uppercase tracking-wide text-[#8a9aaa]">
                <tr>
                  <th className="py-2.5 pr-3 font-semibold">İş Ortağı</th>
                  <th className="py-2.5 pr-3 font-semibold">Durum</th>
                  <th className="py-2.5 pr-3 font-semibold">Default komisyon</th>
                  <th className="py-2.5 pr-3 font-semibold">Link</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Satış</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Tahsilat</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Hak edilen</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Ödenen</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Bekleyen</th>
                  <th className="py-2.5 font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const fin = row.financials;
                  return (
                    <tr key={row.id} className="border-b border-[#eef2f5]">
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          className="font-medium text-[#0f5c56] hover:underline"
                          onClick={() => void loadDetail(row.id)}
                        >
                          {row.name}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge active={row.isActive} />
                      </td>
                      <td className="py-3 pr-3 tabular-nums">%{row.defaultCommissionRate}</td>
                      <td className="py-3 pr-3 tabular-nums">{row._count?.links ?? '—'}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{fin?.saleCount ?? 0}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {formatAffiliateTry(fin?.totalGrossPaidAmountKurus)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {formatAffiliateTry(fin?.lifetimeEarnedCommissionKurus)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {formatAffiliateTry(fin?.paidCommissionKurus)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {formatAffiliateTry(fin?.pendingCommissionKurus)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className={smallTableBtnClass}
                            onClick={() => void loadDetail(row.id)}
                          >
                            Detay
                          </button>
                          <button
                            type="button"
                            className={smallTableBtnClass}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className={smallTableBtnClass}
                            onClick={() => void toggleAffiliate(row)}
                          >
                            {row.isActive ? (
                              <>
                                <ToggleRight className="h-3.5 w-3.5" /> Pasifleştir
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3.5 w-3.5" /> Aktifleştir
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showForm && (
        <SectionCard
          title={editing ? 'İş ortağı düzenle' : 'Yeni İş Ortağı'}
          description="Zorunlu alanlar: isim, oran"
          action={
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              <X className="h-4 w-4" />
              Kapat
            </button>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className={adminLabelClass}>İsim</span>
              <input
                className={adminInputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>Komisyon oranı (%)</span>
              <input
                className={adminInputClass}
                value={form.defaultCommissionRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultCommissionRate: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>İletişim adı</span>
              <input
                className={adminInputClass}
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>E-posta</span>
              <input
                className={adminInputClass}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>Telefon</span>
              <input
                className={adminInputClass}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="block md:col-span-2">
              <span className={adminLabelClass}>İç not</span>
              <textarea
                className={adminInputClass}
                rows={3}
                value={form.internalNotes}
                onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryBtnClass}
              disabled={submitting}
              onClick={() => void submitForm()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor…
                </>
              ) : (
                'Kaydet'
              )}
            </button>
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              İptal
            </button>
          </div>
        </SectionCard>
      )}

      {selectedId && (
        <SectionCard
          title="İş ortağı detayı"
          description="Profil, partner paneli, linkler, finans ve ödemeler"
          action={
            <button type="button" className={secondaryBtnClass} onClick={clearSelection}>
              <X className="h-4 w-4" />
              Kapat
            </button>
          }
        >
          {detailLoading || !detail ? (
            <div className="flex items-center gap-2 text-[#5c6b7a]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yükleniyor…
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${adminCardClass} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1e2a3a]">{detail.name}</h3>
                      <StatusBadge active={detail.isActive} />
                    </div>
                    <div className="space-y-0.5 text-sm text-[#5c6b7a]">
                      {detail.contactName ? <p>İletişim: {detail.contactName}</p> : null}
                      {detail.email ? <p>E-posta: {detail.email}</p> : null}
                      {detail.phone ? <p>Telefon: {detail.phone}</p> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={secondaryBtnClass}
                    onClick={() => openEdit(detail)}
                  >
                    <Pencil className="h-4 w-4" />
                    Düzenle
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className={`${adminCardClass} p-5`}>
                  <h4 className="text-[15px] font-semibold text-[#1e2a3a]">Genel Bilgiler</h4>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#8a9aaa]">Varsayılan komisyon</dt>
                      <dd className="font-medium tabular-nums text-[#1e2a3a]">
                        %{detail.defaultCommissionRate}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#8a9aaa]">Durum</dt>
                      <dd>
                        <StatusBadge active={detail.isActive} />
                      </dd>
                    </div>
                    {detail.internalNotes ? (
                      <div className="pt-1">
                        <dt className="text-[#8a9aaa]">İç not</dt>
                        <dd className="mt-1 text-[#1e2a3a]">{detail.internalNotes}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className={`${adminCardClass} p-5`}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0f5c56]" />
                    <h4 className="text-[15px] font-semibold text-[#1e2a3a]">Partner Paneli</h4>
                  </div>
                  <div className="mt-3 space-y-3">
                    {partnerAccessActive ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge active />
                          <span className="text-sm text-[#5c6b7a]">
                            {detail.partnerAccess?.email}
                            {' · '}
                            {formatDateTr(detail.partnerAccess?.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={primaryBtnClass}
                            disabled={partnerBusy || !detail.email}
                            title={
                              !detail.email
                                ? 'Davet için iş ortağının e-postası gerekli'
                                : undefined
                            }
                            onClick={() => void invitePartner()}
                          >
                            {partnerBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Yeni Giriş Linki Oluştur
                          </button>
                          <button
                            type="button"
                            className={dangerBtnClass}
                            disabled={partnerBusy}
                            onClick={() => void revokePartner()}
                          >
                            Erişimi İptal Et
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#5c6b7a]">
                          {detail.partnerAccess?.isRevoked
                            ? 'Partner erişimi iptal edilmiş.'
                            : 'Bu iş ortağı için henüz partner paneli erişimi oluşturulmamış.'}
                        </p>
                        <button
                          type="button"
                          className={primaryBtnClass}
                          disabled={partnerBusy || !detail.email}
                          title={
                            !detail.email
                              ? 'Davet için iş ortağının e-postası gerekli'
                              : undefined
                          }
                          onClick={() => void invitePartner()}
                        >
                          {partnerBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Partner Erişimi Oluştur
                        </button>
                      </>
                    )}

                    {inviteMagicUrl ? (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-emerald-900">Partner giriş linki</p>
                        <p className="mt-2 break-all font-mono text-[13px] leading-relaxed text-[#1e2a3a]">
                          {inviteMagicUrl}
                        </p>
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                          onClick={() =>
                            void copyText(inviteMagicUrl, 'Partner giriş linki kopyalandı.')
                          }
                        >
                          <Copy className="h-4 w-4" />
                          Kopyala
                        </button>
                        <p className="mt-3 text-xs text-emerald-800/90">
                          Bu bağlantı tek kullanımlıktır ve yaklaşık 30 dakika geçerlidir. Sayfa
                          yenilenince tekrar gösterilmez; gerekirse yeni giriş linki oluşturun.
                        </p>
                      </div>
                    ) : (
                      partnerAccessActive && (
                        <p className="text-xs text-[#8a9aaa]">
                          Magic giriş linki yalnızca oluşturulduğu anda gösterilir (güvenlik). Yeni
                          link için “Yeni Giriş Linki Oluştur” kullanın.
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>

              <SectionCard
                compact
                title="Referral Linkleri"
                description="İndirim ve komisyon kurallarıyla paylaşım linkleri"
                action={
                  editingLinkId ? undefined : (
                    <button
                      type="button"
                      className={primaryBtnClass}
                      disabled={!detail.isActive}
                      onClick={() => void addLink()}
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Link
                    </button>
                  )
                }
              >
                <div className="grid gap-3 rounded-xl border border-[#dbe4ea] bg-[#f7faf9] p-3 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className={adminLabelClass}>Müşteri indirimi %</span>
                    <input
                      className={adminInputClass}
                      value={linkForm.customerDiscountRate}
                      onChange={(e) =>
                        setLinkForm((f) => ({ ...f, customerDiscountRate: e.target.value }))
                      }
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className={adminLabelClass}>Affiliate komisyonu</span>
                    <select
                      className={adminInputClass}
                      value={linkForm.commissionMode}
                      onChange={(e) =>
                        setLinkForm((f) => ({
                          ...f,
                          commissionMode: e.target.value === 'override' ? 'override' : 'default',
                        }))
                      }
                    >
                      <option value="default">
                        Varsayılanı kullan (%{detail.defaultCommissionRate})
                      </option>
                      <option value="override">Özel oran</option>
                    </select>
                  </label>
                  {linkForm.commissionMode === 'override' && (
                    <label className="block text-sm">
                      <span className={adminLabelClass}>Özel komisyon %</span>
                      <input
                        className={adminInputClass}
                        value={linkForm.commissionRateOverride}
                        onChange={(e) =>
                          setLinkForm((f) => ({
                            ...f,
                            commissionRateOverride: e.target.value,
                          }))
                        }
                        inputMode="numeric"
                      />
                    </label>
                  )}
                  {editingLinkId ? (
                    <div className="flex flex-wrap items-end gap-2 sm:col-span-3">
                      <button
                        type="button"
                        className={primaryBtnClass}
                        onClick={() => void saveLinkCommercial()}
                      >
                        Linki kaydet
                      </button>
                      <button
                        type="button"
                        className={secondaryBtnClass}
                        onClick={() => {
                          setEditingLinkId(null);
                          setLinkForm(emptyLinkForm);
                        }}
                      >
                        İptal
                      </button>
                    </div>
                  ) : null}
                </div>
                {!detail.isActive && (
                  <p className="mt-2 text-sm text-amber-700">
                    Pasif iş ortağı için yeni link oluşturulamaz.
                  </p>
                )}
                <ul className="mt-3 space-y-2">
                  {(detail.links ?? []).map((link) => {
                    const referralUrl = affiliateReferralPublicLink(link);
                    const effective =
                      link.commissionRateOverride == null
                        ? detail.defaultCommissionRate
                        : link.commissionRateOverride;
                    return (
                      <li
                        key={link.id}
                        className="flex flex-col gap-2 rounded-xl border border-[#dbe4ea] bg-white px-3 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="break-all font-mono text-[12px] text-[#1e2a3a]">
                              {referralUrl}
                            </p>
                            <p className="text-[12px] text-[#5c6b7a]">
                              Müşteri indirimi: %{link.customerDiscountRate ?? 0}
                            </p>
                            <p className="text-[12px] text-[#5c6b7a]">
                              Affiliate komisyonu:{' '}
                              {link.commissionRateOverride == null
                                ? `Varsayılan (%${detail.defaultCommissionRate})`
                                : `%${link.commissionRateOverride}`}{' '}
                              <span className="text-[#8a9aaa]">(effective %{effective})</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <StatusBadge active={link.isActive} />
                            <button
                              type="button"
                              className={smallTableBtnClass}
                              onClick={() => void copyReferralLink(link)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Kopyala
                            </button>
                            <button
                              type="button"
                              className={smallTableBtnClass}
                              onClick={() => startEditLink(link)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className={smallTableBtnClass}
                              onClick={() => void toggleLink(link)}
                            >
                              {link.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {(detail.links ?? []).length === 0 && (
                    <li className={`${adminMutedPanelClass} px-4 py-3 text-sm text-[#5c6b7a]`}>
                      Henüz link yok.
                    </li>
                  )}
                </ul>
              </SectionCard>

              <SectionCard
                compact
                title="Finansal Özet"
                description="Bu iş ortağına ait tahsilat ve komisyon özeti"
                action={
                  <button
                    type="button"
                    className={primaryBtnClass}
                    onClick={() => void openPayoutModal()}
                  >
                    <Wallet className="h-4 w-4" />
                    Komisyon Ödemesi Yap
                  </button>
                }
              >
                {financialSummary ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SummaryMetric label="Satış" value={String(financialSummary.saleCount)} />
                    <SummaryMetric
                      label="Tahsilat"
                      value={formatAffiliateTry(financialSummary.totalGrossPaidAmountKurus)}
                    />
                    <SummaryMetric
                      label="Matrah"
                      value={formatAffiliateTry(
                        financialSummary.totalCommissionBaseAmountKurus ??
                          commissions?.summary.totalCommissionBaseAmountKurus,
                      )}
                    />
                    <SummaryMetric
                      label="Hak edilen"
                      value={formatAffiliateTry(financialSummary.lifetimeEarnedCommissionKurus)}
                    />
                    <SummaryMetric
                      label="Ödenen"
                      value={formatAffiliateTry(financialSummary.paidCommissionKurus)}
                    />
                    <SummaryMetric
                      label="Bekleyen"
                      value={formatAffiliateTry(financialSummary.pendingCommissionKurus)}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[#5c6b7a]">Finansal özet yok.</p>
                )}
              </SectionCard>

              <SectionCard compact title="Komisyonlar" description="Satış bazlı komisyon kayıtları">
                {commissionsLoading ? (
                  <div className="flex items-center gap-2 text-[#5c6b7a]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Komisyonlar yükleniyor…
                  </div>
                ) : !commissions || (commissions.pagination?.total ?? commissions.items.length) === 0 ? (
                  <div className={`${adminMutedPanelClass} px-4 py-4 text-sm text-[#5c6b7a]`}>
                    Henüz satış yok.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[#dbe4ea] text-[12px] uppercase tracking-wide text-[#8a9aaa]">
                          <tr>
                            <th className="py-2.5 pr-3 font-semibold">Tarih</th>
                            <th className="py-2.5 pr-3 font-semibold">Satış tipi</th>
                            <th className="py-2.5 pr-3 font-semibold">Paket</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">İndirim %</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Tahsilat</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Matrah</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Oran</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Komisyon</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Ödenen</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Kalan</th>
                            <th className="py-2.5 font-semibold">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commissions.items.map((row) => (
                            <tr key={row.id} className="border-b border-[#eef2f5]">
                              <td className="py-2.5 pr-3 whitespace-nowrap">
                                {formatDateTr(row.createdAt)}
                              </td>
                              <td className="py-2.5 pr-3">{saleTypeLabel(row.saleType)}</td>
                              <td className="py-2.5 pr-3">{packageLabel(row)}</td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                %{row.effectiveCustomerDiscountRateSnapshot ?? 0}
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                {formatAffiliateTry(row.grossPaidAmountKurus)}
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                {formatAffiliateTry(row.commissionBaseAmountKurus)}
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                %{row.commissionRateSnapshot}
                              </td>
                              <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                                {formatAffiliateTry(row.commissionAmountKurus)}
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                {formatAffiliateTry(commissionPaidKurus(row))}
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">
                                {formatAffiliateTry(commissionRemainingKurus(row))}
                              </td>
                              <td className="py-2.5">
                                <CommissionStatusBadge status={row.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedId ? (
                      <CompactTablePagination
                        pagination={normalizeAffiliatePagination(commissions.pagination)}
                        disabled={commissionsLoading}
                        onPageChange={(page) => void loadDetailCommissions(selectedId, page)}
                      />
                    ) : null}
                  </>
                )}
              </SectionCard>

              <SectionCard compact title="Ödeme Geçmişi" description="Kaydedilmiş komisyon ödemeleri">
                {payoutsLoading ? (
                  <div className="flex items-center gap-2 text-[#5c6b7a]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ödemeler yükleniyor…
                  </div>
                ) : payoutsPagination.total === 0 ? (
                  <div className={`${adminMutedPanelClass} px-4 py-4 text-sm text-[#5c6b7a]`}>
                    Henüz ödeme kaydı yok.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[#dbe4ea] text-[12px] uppercase tracking-wide text-[#8a9aaa]">
                          <tr>
                            <th className="py-2.5 pr-3 font-semibold">Tarih</th>
                            <th className="py-2.5 pr-3 font-semibold text-right">Tutar</th>
                            <th className="py-2.5 pr-3 font-semibold">Yöntem</th>
                            <th className="py-2.5 pr-3 font-semibold">Referans</th>
                            <th className="py-2.5 pr-3 font-semibold">Durum</th>
                            <th className="py-2.5 font-semibold">Not</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.map((p) => (
                            <tr key={p.id} className="border-b border-[#eef2f5]">
                              <td className="py-2.5 pr-3 whitespace-nowrap">
                                {formatDateTr(p.paidAt || p.createdAt)}
                              </td>
                              <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                                {formatAffiliateTry(p.amountKurus)}
                              </td>
                              <td className="py-2.5 pr-3">{paymentMethodLabel(p.paymentMethod)}</td>
                              <td className="py-2.5 pr-3">{p.reference ?? '—'}</td>
                              <td className="py-2.5 pr-3">{affiliatePayoutStatusLabel(p.status)}</td>
                              <td className="py-2.5 max-w-[240px] truncate">{p.notes ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedId ? (
                      <CompactTablePagination
                        pagination={payoutsPagination}
                        disabled={payoutsLoading}
                        onPageChange={(page) => void loadDetailPayouts(selectedId, page)}
                      />
                    ) : null}
                  </>
                )}
              </SectionCard>
            </div>
          )}
        </SectionCard>
      )}

      {payoutModalOpen && (
        <ModalShell
          title="Komisyon Ödemesi Yap"
          onClose={closePayoutModal}
          wide
          footer={
            <>
              <button
                type="button"
                className={secondaryBtnClass}
                onClick={closePayoutModal}
                disabled={payoutSubmitting}
              >
                İptal
              </button>
              <button
                type="button"
                className={primaryBtnClass}
                disabled={payoutSubmitting || payoutAllocations.length === 0}
                onClick={() => void submitPayout()}
              >
                {payoutSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kaydediliyor…
                  </>
                ) : (
                  <>Ödemeyi kaydet ({formatAffiliateTry(selectedPayoutTotal)})</>
                )}
              </button>
            </>
          }
        >
          {earnedLoading ? (
            <div className="flex items-center gap-2 text-[#5c6b7a]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Bekleyen komisyonlar yükleniyor…
            </div>
          ) : earnedItems.length === 0 ? (
            <p className="text-sm text-[#5c6b7a]">Ödenecek kalan komisyon yok.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#dbe4ea] bg-[#f7faf9] px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-[#5c6b7a]">Toplam bekleyen komisyon</span>
                  <span className="font-semibold tabular-nums text-[#1e2a3a]">
                    {formatAffiliateTry(pendingTotalKurus)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-2">
                  <span className="text-[#5c6b7a]">Bu ödemede toplam</span>
                  <span className="font-semibold tabular-nums text-[#0f5c56]">
                    {formatAffiliateTry(selectedPayoutTotal)}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#1e2a3a]">Komisyon bazlı ödeme</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={smallTableBtnClass}
                      onClick={() => {
                        const next: Record<string, string> = {};
                        for (const c of earnedItems) {
                          next[c.id] = kurusToTlInput(commissionRemainingKurus(c));
                        }
                        setAllocationTlById(next);
                      }}
                    >
                      Kalanların tamamı
                    </button>
                    <button
                      type="button"
                      className={smallTableBtnClass}
                      onClick={() => {
                        const next: Record<string, string> = {};
                        for (const c of earnedItems) next[c.id] = '';
                        setAllocationTlById(next);
                      }}
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <ul className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[#dbe4ea] p-2">
                  {earnedItems.map((c) => {
                    const remaining = commissionRemainingKurus(c);
                    const paid = commissionPaidKurus(c);
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border border-[#eef2f5] bg-white px-3 py-2.5 text-sm"
                      >
                        <p className="text-[12px] text-[#8a9aaa]">
                          {formatDateTr(c.createdAt)} · {saleTypeLabel(c.saleType)} ·{' '}
                          {packageLabel(c)}
                        </p>
                        <div className="mt-1.5 grid gap-1 text-[12px] text-[#5c6b7a] sm:grid-cols-3">
                          <span>
                            Hak edilen:{' '}
                            <strong className="text-[#1e2a3a]">
                              {formatAffiliateTry(c.commissionAmountKurus)}
                            </strong>
                          </span>
                          <span>
                            Ödenen:{' '}
                            <strong className="text-[#1e2a3a]">{formatAffiliateTry(paid)}</strong>
                          </span>
                          <span>
                            Kalan:{' '}
                            <strong className="text-[#1e2a3a]">
                              {formatAffiliateTry(remaining)}
                            </strong>
                          </span>
                        </div>
                        <label className="mt-2 block">
                          <span className={adminLabelClass}>Bu ödemede (TL)</span>
                          <input
                            className={adminInputClass}
                            inputMode="decimal"
                            value={allocationTlById[c.id] ?? ''}
                            onChange={(e) =>
                              setAllocationTlById((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder={kurusToTlInput(remaining)}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={adminLabelClass}>Ödeme yöntemi</span>
                  <select
                    className={adminInputClass}
                    value={payoutForm.paymentMethod}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'BANK_TRANSFER' || v === 'CASH' || v === 'OTHER') {
                        setPayoutForm((f) => ({ ...f, paymentMethod: v }));
                      }
                    }}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={adminLabelClass}>Referans</span>
                  <input
                    className={adminInputClass}
                    value={payoutForm.reference}
                    onChange={(e) =>
                      setPayoutForm((f) => ({ ...f, reference: e.target.value }))
                    }
                    placeholder="Dekont no vb."
                  />
                </label>
                <label className="block">
                  <span className={adminLabelClass}>Ödeme tarihi (opsiyonel)</span>
                  <input
                    type="datetime-local"
                    className={adminInputClass}
                    value={payoutForm.paidAt}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, paidAt: e.target.value }))}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={adminLabelClass}>Notlar</span>
                  <textarea
                    className={adminInputClass}
                    rows={2}
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}
