import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Percent } from 'lucide-react';
import { fetchCampaignById } from '@/lib/storeApi';

/** Eski kampanya kısa linki: /k/:id → /satin-al?c=:id */
export default function CampaignRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Kampanya doğrulanıyor…');

  useEffect(() => {
    if (!id) {
      setMessage('Geçersiz kampanya bağlantısı');
      return;
    }

    let cancelled = false;
    void fetchCampaignById(id).then((campaign) => {
      if (cancelled) return;
      if (!campaign?.isActive) {
        setMessage('Bu kampanya artık geçerli değil.');
        return;
      }
      navigate(`/satin-al?c=${id}`, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-md">
        <Percent className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-4 text-slate-700">{message}</p>
        <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-emerald-600" />
      </div>
    </div>
  );
}
