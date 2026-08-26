import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAdminToken,
  hasUsableAdminToken,
  normalizeAdminToken,
  setAdminToken,
} from '@/lib/adminAuth';

type AdminTokenContextValue = {
  tokenPresent: boolean;
  revision: number;
  saveToken: (token: string) => boolean;
  removeToken: () => void;
  /** Content-bundle ve admin listelerini yeniden yükletir */
  invalidateBundle: () => void;
};

const AdminTokenContext = createContext<AdminTokenContextValue | null>(null);

export function AdminTokenProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const tokenPresent = hasUsableAdminToken();

  const bump = () => setRevision((n) => n + 1);

  const saveToken = useCallback((token: string) => {
    const normalized = normalizeAdminToken(token);
    if (!normalized) return false;
    setAdminToken(normalized);
    bump();
    return true;
  }, []);

  const removeToken = useCallback(() => {
    clearAdminToken();
    bump();
  }, []);

  const invalidateBundle = useCallback(() => {
    bump();
  }, []);

  const value = useMemo(
    () => ({
      tokenPresent: hasUsableAdminToken(),
      revision,
      saveToken,
      removeToken,
      invalidateBundle,
    }),
    [tokenPresent, revision, saveToken, removeToken, invalidateBundle],
  );

  return (
    <AdminTokenContext.Provider value={value}>{children}</AdminTokenContext.Provider>
  );
}

export function useAdminToken(): AdminTokenContextValue {
  const ctx = useContext(AdminTokenContext);
  if (!ctx) {
    return {
      tokenPresent: hasUsableAdminToken(),
      revision: 0,
      saveToken: (token: string) => {
        const normalized = normalizeAdminToken(token);
        if (!normalized) return false;
        setAdminToken(normalized);
        return true;
      },
      removeToken: clearAdminToken,
      invalidateBundle: () => {},
    };
  }
  return ctx;
}
