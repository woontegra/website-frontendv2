import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/toast';
import { submitContactMessage } from '@/lib/storeApi';

type ContactValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initial: ContactValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const inputClass =
  'mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15';

const labelClass = 'block text-sm font-semibold text-slate-800';

export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(initial);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      setSent(true);
      showToast('Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.', 'success');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center shadow-md">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" strokeWidth={2} />
        <p className="mt-4 text-lg font-bold text-slate-900">Teşekkürler</p>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          Mesajınız alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(false);
            setValues(initial);
          }}
        >
          Yeni mesaj
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg sm:p-8"
    >
      <h2 className="text-xl font-bold text-slate-900">İletişim formu</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sorularınızı iletin; ekibimiz en kısa sürede dönüş yapacaktır.
      </p>
      <div className="mt-6 flex flex-col gap-5">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Ad Soyad <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-name"
            required
            disabled={loading}
            className={inputClass}
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            E-posta <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            disabled={loading}
            className={inputClass}
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className={labelClass}>
            Telefon
          </label>
          <input
            id="contact-phone"
            type="tel"
            disabled={loading}
            className={inputClass}
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className={labelClass}>
            Konu <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-subject"
            required
            disabled={loading}
            className={inputClass}
            value={values.subject}
            onChange={(e) => setValues({ ...values, subject: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Mesaj <span className="text-red-600">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            required
            disabled={loading}
            className={inputClass}
            value={values.message}
            onChange={(e) => setValues({ ...values, message: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" variant="accent" size="lg" className="mt-8 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gönderiliyor…
          </>
        ) : (
          'Mesaj Gönder'
        )}
      </Button>
    </form>
  );
}
