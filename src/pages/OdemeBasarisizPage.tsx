import { useSearchParams, Link } from 'react-router-dom';
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
        {merchantOid && (
          <p className="mt-4 text-xs text-slate-500">
            Referans: <span className="font-mono">{merchantOid}</span>
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button to="/satin-al" variant="accent">
            Tekrar dene
          </Button>
          <Button to="/" variant="outline">
            Ana sayfa
          </Button>
        </div>
        <Link to="/iletisim" className="mt-4 inline-block text-sm text-sky-700 hover:underline">
          Destek ile iletişim
        </Link>
      </div>
    </div>
  );
}
