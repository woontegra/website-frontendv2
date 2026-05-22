import { Navigate, useLocation } from 'react-router-dom';

const legacyMap: Record<string, string> = {
  '/admin/v2/dashboard': '/admin/v2/overview',
  '/admin/v2/modules': '/admin/v2/calculations',
  '/admin/v2/content': '/admin/v2/technical/content',
  '/admin/v2/settings': '/admin/v2/technical/settings',
  '/admin/v2/pages': '/admin/v2/technical/pages',
  '/admin/v2/marketing': '/admin/v2/technical/marketing',
  '/admin/campaigns': '/admin/v2/campaigns',
  '/admin/settings': '/admin/v2/settings',
  '/admin/analytics': '/admin/v2/settings?tab=takip',
};

export function AdminLegacyRedirect() {
  const { pathname } = useLocation();
  const target = legacyMap[pathname];
  if (target) return <Navigate to={target} replace />;
  return <Navigate to="/admin/v2/overview" replace />;
}
