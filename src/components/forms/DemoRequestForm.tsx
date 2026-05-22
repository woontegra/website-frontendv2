import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type DemoFormValues = {
  fullName: string;
  email: string;
  phone: string;
  barAssociation: string;
};

const initialValues: DemoFormValues = {
  fullName: '',
  email: '',
  phone: '',
  barAssociation: '',
};

const inputClass =
  'mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15';

const labelClass = 'block text-sm font-semibold text-slate-800';

export function DemoRequestForm() {
  const [values, setValues] = useState<DemoFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const field = (
    id: keyof DemoFormValues,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className={inputClass}
        value={values[id]}
        onChange={(ev) => setValues({ ...values, [id]: ev.target.value })}
      />
    </div>
  );

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center shadow-md">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" strokeWidth={2} />
        <p className="mt-4 text-lg font-bold text-slate-900">Teşekkürler</p>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          Demo talep bağlantısı sonraki aşamada aktif edilecektir.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Bu aşamada bilgileriniz sunucuya gönderilmedi; yalnızca arayüz önizlemesidir.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSubmitted(false);
            setValues(initialValues);
          }}
        >
          Formu yeniden doldur
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg sm:p-8">
      <h2 className="text-xl font-bold text-slate-900">Demo talep formu</h2>
      <p className="mt-1 text-sm text-slate-600">
        Zorunlu alanları doldurun; ekibimiz sizinle iletişime geçecektir.
      </p>
      <div className="mt-6 flex flex-col gap-5">
        {field('fullName', 'Ad Soyad', 'text', true)}
        {field('email', 'E-posta', 'email', true)}
        {field('phone', 'Telefon', 'tel', true)}
        {field('barAssociation', 'Baro')}
      </div>
      <Button type="submit" variant="accent" size="lg" className="mt-8 w-full">
        Demo Talebi Oluştur
      </Button>
    </form>
  );
}
