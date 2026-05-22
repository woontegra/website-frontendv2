import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie, Settings, X } from 'lucide-react';
import {
  type CookieCategory,
  hasCookieConsentChoice,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookieConsent';

const CATEGORIES: { key: CookieCategory; label: string; hint: string; locked?: boolean }[] = [
  { key: 'necessary', label: 'Zorunlu', hint: 'Sitenin çalışması için gereklidir.', locked: true },
  { key: 'analytics', label: 'Analitik', hint: 'Kullanım istatistikleri.' },
  { key: 'marketing', label: 'Pazarlama', hint: 'Meta Pixel ve reklam ölçümü.' },
  { key: 'functional', label: 'Fonksiyonel', hint: 'Tercihlerin hatırlanması.' },
];

export function CookieConsent() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selected, setSelected] = useState<Set<CookieCategory>>(new Set(['necessary']));

  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;

    const openPrefs = () => {
      const existing = readCookieConsent();
      setSelected(new Set(existing?.categories ?? ['necessary']));
      setManageOpen(true);
      setVisible(true);
    };
    (window as Window & { openCookiePreferences?: () => void }).openCookiePreferences = openPrefs;
    return () => {
      delete (window as Window & { openCookiePreferences?: () => void }).openCookiePreferences;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setVisible(false);
      return;
    }
    if (!hasCookieConsentChoice()) {
      setSelected(new Set(['necessary', 'analytics', 'marketing', 'functional']));
      setVisible(true);
    }
  }, [isAdmin, location.pathname]);

  if (isAdmin || !visible) return null;

  const save = (categories: CookieCategory[]) => {
    writeCookieConsent(categories);
    setVisible(false);
    setManageOpen(false);
  };

  const acceptAll = () => save(['necessary', 'analytics', 'marketing', 'functional']);

  const essentialOnly = () => save(['necessary']);

  const savePreferences = () => {
    const cats: CookieCategory[] = ['necessary'];
    if (selected.has('analytics')) cats.push('analytics');
    if (selected.has('marketing')) cats.push('marketing');
    if (selected.has('functional')) cats.push('functional');
    save(cats);
  };

  const toggle = (key: CookieCategory) => {
    if (key === 'necessary') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (manageOpen) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
        role="dialog"
        aria-labelledby="cookie-prefs-title"
        data-cookie-consent="preferences"
      >
        <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 id="cookie-prefs-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Settings className="h-5 w-5 text-emerald-600" />
              Çerez tercihleri
            </h2>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Kapat"
              onClick={() => {
                if (!hasCookieConsentChoice()) return;
                setManageOpen(false);
                setVisible(false);
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto px-5 py-4">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.key}
                className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  checked={selected.has(cat.key)}
                  disabled={cat.locked}
                  onChange={() => toggle(cat.key)}
                />
                <span>
                  <span className="font-semibold text-slate-900">{cat.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{cat.hint}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-slate-500">
              <Link to="/cerez-politikasi" className="font-medium text-emerald-700 hover:underline">
                Çerez Politikası
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={savePreferences}
            >
              Kaydet
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={acceptAll}
            >
              Tümünü kabul et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      data-cookie-consent="banner"
    >
      <div className="container-page flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <div className="flex min-w-0 flex-1 gap-3">
          <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p id="cookie-banner-title" className="font-semibold text-slate-900">
              Çerez kullanımı
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Pazarlama çerezleri yalnızca izninizle
              etkinleştirilir.{' '}
              <Link to="/cerez-politikasi" className="font-medium text-emerald-700 hover:underline">
                Çerez Politikası
              </Link>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={acceptAll}
          >
            Tümünü kabul et
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={essentialOnly}
          >
            Zorunlu çerezlerle devam et
          </button>
          <button
            type="button"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            onClick={() => setManageOpen(true)}
          >
            Tercihleri yönet
          </button>
        </div>
      </div>
    </div>
  );
}
