import { useState } from 'react';
import { X, Loader2, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type BillingFormData = {
  fullName: string;
  email: string;
  phone: string;
  invoiceType: 'individual' | 'corporate';
  address: string;
  taxNumber?: string;
};

type BillingInfoModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BillingFormData) => void;
  processing: boolean;
};

const inputClass =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export function BillingInfoModal({ open, onClose, onSubmit, processing }: BillingInfoModalProps) {
  const [form, setForm] = useState<BillingFormData>({
    fullName: '',
    email: '',
    phone: '',
    invoiceType: 'individual',
    address: '',
    taxNumber: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BillingFormData, string>>>({});

  if (!open) return null;

  const validate = (): boolean => {
    const next: Partial<Record<keyof BillingFormData, string>> = {};
    if (!form.fullName.trim()) next.fullName = 'Ad soyad zorunludur';
    if (!form.email.trim()) next.email = 'E-posta zorunludur';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Geçerli bir e-posta girin';
    if (!form.phone.trim()) next.phone = 'Telefon zorunludur';
    if (!form.address.trim()) next.address = 'Adres zorunludur';
    if (form.invoiceType === 'corporate' && !form.taxNumber?.trim())
      next.taxNumber = 'Vergi numarası zorunludur';
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
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ad soyad *</label>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              disabled={processing}
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta *</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={processing}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            <p className="mt-1 text-xs text-slate-500">Panel giriş bilgileri bu adrese gönderilir.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Telefon *</label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={processing}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Fatura tipi *</p>
            <div className="grid grid-cols-2 gap-3">
              {(['individual', 'corporate'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={processing}
                  onClick={() =>
                    setForm({
                      ...form,
                      invoiceType: type,
                      taxNumber: type === 'individual' ? '' : form.taxNumber,
                    })
                  }
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
          {form.invoiceType === 'corporate' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Vergi numarası *
              </label>
              <input
                className={inputClass}
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                disabled={processing}
              />
              {errors.taxNumber && <p className="mt-1 text-sm text-red-600">{errors.taxNumber}</p>}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Adres *</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={processing}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Ödeme sonrası panel giriş bilgileriniz e-posta ile iletilecektir.
          </div>
          <div className="flex gap-3 pt-2">
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
