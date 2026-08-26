import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { partnerConsumeMagicOnce } from '@/lib/partnerAffiliate';
import { PartnerBrandMark } from '@/partner/PartnerBrandMark';
import { partnerHomePath } from '@/partner/partnerPaths';

/**
 * Magic-link landing: /partner/auth?token=... (path) or /auth?token=... (subdomain).
 * Consumes one-time token → HttpOnly session cookie → redirect partner home.
 * Token is never stored in localStorage; query cleared via navigate replace.
 *
 * Uses partnerConsumeMagicOnce so React StrictMode double-mount does not
 * burn a single-use token twice (first 200, second 401 → false error UI).
 */
export default function PartnerAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('missing');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await partnerConsumeMagicOnce(token);
        if (!cancelled) navigate(partnerHomePath(), { replace: true });
      } catch {
        if (!cancelled) setError('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, navigate]);

  return (
    <div className="flex min-h-[42vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[#e4ebf0] bg-white px-6 py-7 text-center">
        <PartnerBrandMark variant="auth" />
        <p className="mt-1.5 text-[11px] font-normal text-[#8a9aaa]">İş Ortağı Portalı</p>
        <h1 className="mt-2 text-[15px] font-medium text-[#2a3848]">İş Ortağı Girişi</h1>
        {error ? (
          <>
            <p className="mt-3 text-[12px] font-normal leading-relaxed text-[#6b7c8c]">
              Giriş bağlantısı geçersiz veya süresi dolmuş.
            </p>
            <p className="mt-1.5 text-[12px] font-normal text-[#6b7c8c]">
              Yeni giriş bağlantısı için Bilirkişi Hesap ile iletişime geçin.
            </p>
            <a
              href="mailto:info@bilirkisihesap.com"
              className="mt-4 inline-flex items-center justify-center rounded-md border border-[#e4ebf0] bg-white px-3 py-1.5 text-[12px] font-normal text-[#3d4d5c] hover:bg-[#f7faf9]"
            >
              Yeni giriş bağlantısı için iletişime geç
            </a>
          </>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-2 text-[12px] font-normal text-[#8a9aaa]">
            <Loader2 className="h-4 w-4 animate-spin text-[#0f5c56]/80" />
            <p>Giriş doğrulanıyor…</p>
          </div>
        )}
      </div>
    </div>
  );
}
