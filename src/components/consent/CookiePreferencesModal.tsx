import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { CookieCategory } from '@/lib/cookieConsent';
import { getInventoryByCategory } from '@/lib/cookieInventory';
import { CookieConsentToggle } from '@/components/consent/CookieConsentToggle';
import { CookieInventoryList } from '@/components/consent/CookieInventoryList';
import {
  COOKIE_MODAL_TABS,
  FUNCTIONAL_CATEGORY_EMPTY_MESSAGE,
  PAYTR_NOTE,
  type CookieModalTabId,
} from '@/components/consent/cookieConsentUi';

type Props = {
  selected: Set<CookieCategory>;
  onToggleCategory: (key: CookieCategory, enabled: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
};

export function CookiePreferencesModal({
  selected,
  onToggleCategory,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: Props) {
  const [activeTab, setActiveTab] = useState<CookieModalTabId>('necessary');
  const tab = COOKIE_MODAL_TABS.find((t) => t.id === activeTab)!;

  const isCategoryOn = (key: CookieCategory) => selected.has(key);

  const listItems = (() => {
    switch (activeTab) {
      case 'necessary':
        return getInventoryByCategory('necessary');
      case 'analytics':
        return getInventoryByCategory('analytics');
      case 'functional':
        return getInventoryByCategory('functional');
      case 'marketing':
        return getInventoryByCategory('marketing');
      default:
        return [];
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
      data-cookie-consent="preferences"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 id="cookie-settings-title" className="text-lg font-bold text-slate-900 sm:text-xl">
            Çerez Ayarları
          </h2>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </header>

        <nav
          className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80"
          aria-label="Çerez kategorileri"
        >
          {COOKIE_MODAL_TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`relative shrink-0 border-r border-slate-200 px-4 py-3.5 text-left text-xs font-semibold transition-colors last:border-r-0 sm:min-w-[7.5rem] sm:text-sm ${
                  isActive
                    ? 'bg-white text-emerald-800'
                    : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab(t.id)}
              >
                {isActive ? (
                  <span
                    className="absolute inset-y-0 left-0 w-1 bg-emerald-600"
                    aria-hidden
                  />
                ) : null}
                <span className="block max-w-[9rem] leading-snug sm:max-w-none">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">{tab.label}</h3>
            {tab.locked ? (
              <span className="text-sm font-semibold text-emerald-700">Her zaman aktif</span>
            ) : tab.toggleCategory ? (
              <CookieConsentToggle
                id={`toggle-${tab.toggleCategory}`}
                checked={isCategoryOn(tab.toggleCategory)}
                onChange={(next) => onToggleCategory(tab.toggleCategory!, next)}
              />
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{tab.shortDescription}</p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tab.label}
            </p>
            {activeTab === 'functional' ? (
              <CookieInventoryList items={[]} emptyMessage={FUNCTIONAL_CATEGORY_EMPTY_MESSAGE} />
            ) : (
              <CookieInventoryList items={listItems} />
            )}
          </div>

          {activeTab === 'necessary' ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ödeme sürecinde (PayTR)
              </p>
              <p className="mb-3 text-sm text-slate-600">{PAYTR_NOTE}</p>
              <CookieInventoryList items={getInventoryByCategory('payment_third_party')} />
            </div>
          ) : null}

          <p className="mt-4 text-xs text-slate-500">
            Bu panel yalnızca <strong>public website</strong> çerez tercihlerini yönetir; Bilirkişi
            Hesap programı oturum ve lisans kayıtlarını kapsamaz. Tercihleriniz en fazla{' '}
            <strong>12 ay</strong> saklanır; süre sonunda yeniden onay istenir.
          </p>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50/50">
          <p className="border-b border-slate-200 px-4 py-3 text-center text-sm text-slate-600 sm:px-6">
            Detaylar için{' '}
            <Link
              to="/cerez-politikasi"
              className="font-semibold text-emerald-700 underline decoration-emerald-700/40 hover:text-emerald-800"
              onClick={(e) => e.stopPropagation()}
            >
              Çerez ve Benzeri Teknolojiler Politikası
            </Link>{' '}
            ve{' '}
            <Link
              to="/kvkk-aydinlatma-metni"
              className="font-semibold text-emerald-700 underline decoration-emerald-700/40 hover:text-emerald-800"
              onClick={(e) => e.stopPropagation()}
            >
              KVKK Aydınlatma Metni
            </Link>{' '}
            sayfalarını inceleyebilirsiniz.
          </p>
          <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
            <button
              type="button"
              className="order-3 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:order-1"
              onClick={onRejectAll}
            >
              Tümünü Reddet
            </button>
            <button
              type="button"
              className="order-1 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:order-2"
              onClick={onAcceptAll}
            >
              Hepsine İzin Ver
            </button>
            <button
              type="button"
              className="order-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:order-3"
              onClick={onSave}
            >
              Ayarları Kaydet
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
