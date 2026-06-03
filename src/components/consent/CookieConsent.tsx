import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  type CookieCategory,
  hasCookieConsentChoice,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookieConsent';
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner';
import { CookiePreferencesModal } from '@/components/consent/CookiePreferencesModal';

export function CookieConsent() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selected, setSelected] = useState<Set<CookieCategory>>(new Set(['necessary']));

  const isAdmin = location.pathname.startsWith('/admin');

  const closePreferencesModal = useCallback(() => {
    setManageOpen(false);
    if (hasCookieConsentChoice()) {
      setVisible(false);
    }
  }, []);

  const openPreferencesModal = useCallback(() => {
    const existing = readCookieConsent();
    setSelected(new Set(existing?.categories ?? ['necessary']));
    setManageOpen(true);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (isAdmin) return;

    (window as Window & { openCookiePreferences?: () => void }).openCookiePreferences =
      openPreferencesModal;
    return () => {
      delete (window as Window & { openCookiePreferences?: () => void }).openCookiePreferences;
    };
  }, [isAdmin, openPreferencesModal]);

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

  useEffect(() => {
    if (!manageOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreferencesModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [manageOpen, closePreferencesModal]);

  if (isAdmin || !visible) return null;

  const save = (categories: CookieCategory[]) => {
    writeCookieConsent(categories);
    setVisible(false);
    setManageOpen(false);
  };

  const acceptAll = () => save(['necessary', 'analytics', 'marketing', 'functional']);

  const rejectAll = () => save(['necessary']);

  const savePreferences = () => {
    const cats: CookieCategory[] = ['necessary'];
    if (selected.has('analytics')) cats.push('analytics');
    if (selected.has('marketing')) cats.push('marketing');
    if (selected.has('functional')) cats.push('functional');
    save(cats);
  };

  const setCategoryEnabled = (key: CookieCategory, enabled: boolean) => {
    if (key === 'necessary') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <>
      {manageOpen ? (
        <CookiePreferencesModal
          selected={selected}
          onToggleCategory={setCategoryEnabled}
          onClose={closePreferencesModal}
          onSave={savePreferences}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
        />
      ) : null}
      {!manageOpen ? (
        <CookieConsentBanner
          onManage={openPreferencesModal}
          onRejectAll={rejectAll}
          onAcceptAll={acceptAll}
        />
      ) : null}
    </>
  );
}
