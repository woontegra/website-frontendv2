import { useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OdemeBasarisizPage() {
  const [searchParams] = useSearchParams();
  const merchantOid = searchParams.get('merchant_oid');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <XCircle className="mx-auto h-16 w-16 text-red-600" strokeWidth={2} />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Ödeme tamamlanamadı</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Ödeme işlemi iptal edildi veya başarısız oldu. Kart bilgilerinizi kontrol ederek tekrar
          deneyebilirsiniz.
        </p>
        {merchantOid ? (
          <p className="mt-4 text-xs text-slate-500">
            Referans{' '}
            <code className="mt-1 block break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">
              {merchantOid}
            </code>
          </p>
        ) : null}
        <p className="mt-6 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Sorun devam ederse destek ile iletişime geçebilirsiniz.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button to="/satin-al" variant="accent" className="w-full justify-center">
            Tekrar dene / Satın al
          </Button>
          <Button to="/" variant="outline" className="w-full justify-center">
            Ana sayfaya dön
          </Button>
          <Button to="/iletisim" variant="outline" className="w-full justify-center">
            Destek / iletişim
          </Button>
        </div>
      </div>
    </div>
  );
}
