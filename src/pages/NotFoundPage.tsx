import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Sayfa bulunamadı</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
      </p>
      <Button to="/" className="mt-8">
        Ana sayfaya dön
      </Button>
      <Link to="/iletisim" className="mt-4 text-sm text-brand-600 hover:underline">
        İletişim
      </Link>
    </div>
  );
}
