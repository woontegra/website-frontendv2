import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Percent } from 'lucide-react';
import { canonicalizeCampaignCode } from '@/lib/campaignCodeAlias';

const WOONTEGRA_BH_CHECKOUT =
  'https://www.woontegra.com/yazilimlar/bilirkisi-hesap/satin-al';

/** Legacy short links: /k/:code → Woontegra Bilirkişi Hesap checkout ?c=:code */
export default function CampaignRedirectPage() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;
    const code = canonicalizeCampaignCode(id);
    const target = `${WOONTEGRA_BH_CHECKOUT}?c=${encodeURIComponent(code)}`;
    window.location.replace(target);
  }, [id]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-md">
        <Percent className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-4 text-slate-700">
          {id ? 'Kampanya sayfasına yönlendiriliyorsunuz…' : 'Geçersiz kampanya bağlantısı'}
        </p>
        <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-emerald-600" />
      </div>
    </div>
  );
}
