import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { getAdminToken } from '@/lib/adminAuth';
import { fetchAdminV2ContentBundle } from '@/lib/adminContentBundle';
import { analyzeAdminToken } from '@/lib/adminTokenDebug';
import type { ApiError } from '@/lib/apiClient';
import { ActionButton } from '@/admin/ui';
import { adminCardClass, adminInputClass, adminMutedPanelClass } from '@/admin/ui/adminUiClasses';

function TokenDebugPanel({ label, raw }: { label: string; raw: string }) {
  const info = useMemo(() => analyzeAdminToken(raw), [raw]);
  if (!raw.trim()) return null;

  return (
    <div className={`mt-3 p-3 ${adminMutedPanelClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b7a]">{label}</p>
      {info.errors.map((err) => (
        <p key={err} className="mt-2 text-[12px] font-medium text-red-700">
          {err}
        </p>
      ))}
      {info.jwtValid && (
        <dl className="mt-2 grid gap-1.5 text-[12px] sm:grid-cols-2">
          <div>
            <dt className="text-[#8a9aaa]">userId</dt>
            <dd className="font-mono text-[#1e2a3a]">{info.userId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[#8a9aaa]">role</dt>
            <dd className="text-[#1e2a3a]">{info.role ?? '—'}</dd>
          </div>
        </dl>
      )}
      {info.warnings.map((warn) => (
        <p key={warn} className="mt-2 flex items-start gap-1.5 text-[12px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warn}
        </p>
      ))}
    </div>
  );
}

export function AdminTokenStatusCard() {
  const { tokenPresent, saveToken, removeToken, revision } = useAdminToken();
  const [expanded, setExpanded] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [apiTest, setApiTest] = useState<{
    loading: boolean;
    status: number | null;
    backendMessage: string | null;
    ok: boolean;
  }>({ loading: false, status: null, backendMessage: null, ok: false });

  const storedToken = tokenPresent ? getAdminToken() ?? '' : '';

  const handleSave = () => {
    if (!saveToken(tokenInput)) {
      setMessage('Geçerli bir token girin.');
      return;
    }
    setTokenInput('');
    setMessage('Token kaydedildi.');
    setApiTest({ loading: false, status: null, backendMessage: null, ok: false });
  };

  const handleRemove = () => {
    removeToken();
    setTokenInput('');
    setMessage('Token silindi.');
    setApiTest({ loading: false, status: null, backendMessage: null, ok: false });
  };

  const handleTestBundle = async () => {
    setApiTest({ loading: true, status: null, backendMessage: null, ok: false });
    try {
      await fetchAdminV2ContentBundle();
      setApiTest({
        loading: false,
        status: 200,
        backendMessage: 'content-bundle okundu.',
        ok: true,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      setApiTest({
        loading: false,
        status: apiErr.status ?? null,
        backendMessage: apiErr.message,
        ok: false,
      });
    }
  };

  return (
    <section className={`${adminCardClass} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-lg p-2 ${
              tokenPresent ? 'bg-[#e6f3f1] text-[#0f5c56]' : 'bg-red-50 text-red-700'
            }`}
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#1e2a3a]">Admin bağlantı durumu</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#5c6b7a]">
              {tokenPresent ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c56]" />
                  Token kayıtlı — API istekleri gönderilebilir
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  Token yok — içerik yüklenemez
                </>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4ea] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1e2a3a] hover:bg-[#f7faf9]"
        >
          {expanded ? 'Token yönetimini kapat' : 'Token yönetimini aç'}
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-[#dbe4ea] pt-4">
          <label className="text-[12px] font-medium text-[#5c6b7a]" htmlFor="admin-token-input">
            Token (geliştirme)
          </label>
          <textarea
            id="admin-token-input"
            rows={3}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Bearer eyJ… veya JWT"
            className={`mt-2 ${adminInputClass} font-mono text-[11px]`}
            spellCheck={false}
          />
          <TokenDebugPanel label="Yapıştırılan token" raw={tokenInput} />
          {storedToken && (
            <TokenDebugPanel
              key={`stored-${revision}`}
              label="Kayıtlı token"
              raw={storedToken}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton variant="primary" size="sm" type="button" onClick={handleSave}>
              Kaydet
            </ActionButton>
            <ActionButton variant="secondary" size="sm" type="button" onClick={handleRemove}>
              Sil
            </ActionButton>
            <ActionButton
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleTestBundle}
              disabled={!tokenPresent || apiTest.loading}
            >
              {apiTest.loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Test…
                </>
              ) : (
                'Bundle test'
              )}
            </ActionButton>
          </div>
          {message && (
            <p className="mt-2 text-[12px] text-[#5c6b7a]" role="status">
              {message}
            </p>
          )}
          {apiTest.backendMessage && (
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-[12px] ${
                apiTest.ok
                  ? 'bg-[#e6f3f1] text-[#0f5c56]'
                  : 'bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {apiTest.status != null && apiTest.status >= 400 && `HTTP ${apiTest.status}: `}
              {apiTest.backendMessage}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
