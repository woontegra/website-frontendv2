import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { resolveApiUrl } from '@/lib/apiClient';

/**
 * Public affiliate short link: /r/:code
 * Hands off to backend GET /api/r/:code which sets HttpOnly referral cookie
 * and 302-redirects to the clean /satin-al page (no affiliate details in the URL).
 */
export default function AffiliateReferralRedirectPage() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (!code) {
      window.location.replace('/');
      return;
    }
    // Full navigation so Set-Cookie + 302 homepage work on same-origin /api proxy.
    window.location.replace(resolveApiUrl(`/api/r/${encodeURIComponent(code)}`));
  }, [code]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-md">
        <p className="text-slate-700">Yönlendiriliyorsunuz…</p>
        <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-emerald-600" />
      </div>
    </div>
  );
}
