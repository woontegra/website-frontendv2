import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Percent } from 'lucide-react';

/** Eski ID ve yeni publicCode kısa linkleri: /k/:code → /satin-al?c=:code */
export default function CampaignRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/satin-al?c=${encodeURIComponent(id)}`, { replace: true });
  }, [id, navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-md">
        <Percent className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-4 text-slate-700">
          {id ? 'Kampanya doğrulanıyor…' : 'Geçersiz kampanya bağlantısı'}
        </p>
        <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-emerald-600" />
      </div>
    </div>
  );
}
