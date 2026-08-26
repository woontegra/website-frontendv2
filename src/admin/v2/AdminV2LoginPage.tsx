import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { adminLogin } from '@/lib/adminSession';
import { hasUsableAdminToken } from '@/lib/adminAuth';
import { adminAccentBtnClass, adminCardClass, adminInputClass, adminLabelClass } from '@/admin/ui/adminUiClasses';

export function AdminV2LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/admin/v2/overview';

  // Expired localStorage tokens are cleared by hasUsableAdminToken()
  if (hasUsableAdminToken()) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef3f1] px-4 py-10">
      <div className={`${adminCardClass} w-full max-w-md`}>
        <div className="border-b border-[#dbe4ea] px-6 py-5">
          <h1 className="text-xl font-bold text-[#1e2a3a]">İçerik Paneli Girişi</h1>
          <p className="mt-1 text-[13px] text-[#5c6b7a]">
            Admin hesabınızla giriş yapın; oturum bu tarayıcıda saklanır.
          </p>
        </div>
        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          {error && (
            <p
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div>
            <label className={adminLabelClass} htmlFor="admin-email">
              E-posta
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`${adminInputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className={adminLabelClass} htmlFor="admin-password">
              Şifre
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`${adminInputClass} mt-1.5`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-semibold disabled:opacity-50 ${adminAccentBtnClass}`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
