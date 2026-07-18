import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDistrictsForProvinceName, TURKEY_PROVINCES } from '@/data/turkeyCities';

export type BillingFormData = {
  invoiceType: 'individual' | 'corporate';
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  city: string;
  district: string;
  address: string;
};

type BillingInfoModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BillingFormData) => void;
  processing: boolean;
  lockedAccountEmail?: string | null;
};

const inputClass =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';
const selectClass = inputClass;

const initialForm: BillingFormData = {
  invoiceType: 'individual',
  fullName: '',
  email: '',
  phone: '',
  identityNumber: '',
  companyName: '',
  taxNumber: '',
  taxOffice: '',
  city: '',
  district: '',
  address: '',
};

function digitsOnly(value: string, maxLen?: number): string {
  const d = value.replace(/\D/g, '');
  return maxLen != null ? d.slice(0, maxLen) : d;
}

export function BillingInfoModal({
  open,
  onClose,
  onSubmit,
  processing,
  lockedAccountEmail,
}: BillingInfoModalProps) {
  const [form, setForm] = useState<BillingFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BillingFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...initialForm, email: lockedAccountEmail ?? '' });
      setErrors({});
    }
  }, [lockedAccountEmail, open]);

  const districtOptions = useMemo(() => getDistrictsForProvinceName(form.city), [form.city]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: Partial<Record<keyof BillingFormData, string>> = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim()) next.email = 'E-posta zorunludur';
    else if (!emailRe.test(form.email.trim())) next.email = 'Geçerli bir e-posta girin';

    if (!form.phone.trim()) next.phone = 'Telefon zorunludur';

    if (!form.city.trim()) next.city = 'İl seçimi zorunludur';
    if (!form.district.trim()) next.district = 'İlçe seçimi zorunludur';
    if (!form.address.trim()) next.address = 'Açık adres zorunludur';

    if (form.invoiceType === 'individual') {
      if (!form.fullName.trim()) next.fullName = 'Ad soyad zorunludur';
      const tc = form.identityNumber.replace(/\D/g, '');
      if (tc.length > 0 && tc.length !== 11) next.identityNumber = 'T.C. kimlik numarası 11 hane olmalıdır';
    } else {
      if (!form.companyName.trim()) next.companyName = 'Firma unvanı zorunludur';
      if (!form.taxNumber.trim()) next.taxNumber = 'Vergi numarası zorunludur';
      else if (!/^\d{10,11}$/.test(form.taxNumber.trim()))
        next.taxNumber = 'Vergi numarası 10 veya 11 haneli sayı olmalıdır';
      if (!form.taxOffice.trim()) next.taxOffice = 'Vergi dairesi zorunludur';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 id="billing-modal-title" className="text-xl font-bold text-slate-900">
            Fatura ve iletişim bilgileri
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) onSubmit(form);
          }}
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Fatura tipi *</p>
            <div className="grid grid-cols-2 gap-3">
              {(['individual', 'corporate'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setErrors({});
                    setForm((prev) => ({
                      ...prev,
                      invoiceType: type,
                      ...(type === 'individual'
                        ? { companyName: '', taxNumber: '', taxOffice: '' }
                        : { fullName: '', identityNumber: '' }),
                    }));
                  }}
                  className={`rounded-xl border-2 p-4 transition-colors ${
                    form.invoiceType === type
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {type === 'individual' ? (
                    <User className="mx-auto h-6 w-6 text-slate-700" />
                  ) : (
                    <Building2 className="mx-auto h-6 w-6 text-slate-700" />
                  )}
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {type === 'individual' ? 'Bireysel' : 'Kurumsal'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {form.invoiceType === 'individual' ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ad soyad *</label>
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={processing}
                  autoComplete="name"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Firma unvanı *</label>
                <input
                  className={inputClass}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  disabled={processing}
                  autoComplete="organization"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Vergi no *</label>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={form.taxNumber}
                    onChange={(e) => setForm({ ...form, taxNumber: digitsOnly(e.target.value, 11) })}
                    disabled={processing}
                    autoComplete="off"
                  />
                  {errors.taxNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.taxNumber}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Vergi dairesi *</label>
                  <input
                    className={inputClass}
                    value={form.taxOffice}
                    onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                    disabled={processing}
                    autoComplete="off"
                  />
                  {errors.taxOffice && (
                    <p className="mt-1 text-sm text-red-600">{errors.taxOffice}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta *</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={processing || Boolean(lockedAccountEmail)}
              readOnly={Boolean(lockedAccountEmail)}
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            <p className="mt-1 text-xs text-slate-500">
              {lockedAccountEmail
                ? 'Yenilenecek hesabın e-posta adresi değiştirilemez.'
                : 'Panel giriş bilgileri bu adrese gönderilir.'}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Telefon *</label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={processing}
              autoComplete="tel"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {form.invoiceType === 'individual' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">T.C. kimlik no</label>
              <input
                className={inputClass}
                inputMode="numeric"
                maxLength={11}
                value={form.identityNumber}
                onChange={(e) => setForm({ ...form, identityNumber: digitsOnly(e.target.value, 11) })}
                disabled={processing}
                autoComplete="off"
                placeholder="İsteğe bağlı"
              />
              {errors.identityNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.identityNumber}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Fatura düzenleme sürecinde gerekebileceği için isteğe bağlıdır.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">İl *</label>
              <select
                className={selectClass}
                value={form.city}
                disabled={processing}
                onChange={(e) => {
                  const city = e.target.value;
                  setForm({ ...form, city, district: '' });
                }}
              >
                <option value="">İl seçin</option>
                {TURKEY_PROVINCES.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">İlçe *</label>
              <select
                className={selectClass}
                value={form.district}
                disabled={processing || !form.city}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              >
                <option value="">{form.city ? 'İlçe seçin' : 'Önce il seçin'}</option>
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Açık adres *</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={processing}
              autoComplete="street-address"
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Ödeme sonrası panel giriş bilgileriniz e-posta ile iletilecektir.
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={processing}>
              İptal
            </Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> İşleniyor…
                </>
              ) : (
                'Ödemeye geç'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
