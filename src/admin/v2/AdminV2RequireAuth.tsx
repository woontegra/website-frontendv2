import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';

export function AdminV2RequireAuth() {
  const { tokenPresent } = useAdminToken();
  const location = useLocation();

  if (!tokenPresent) {
    return <Navigate to="/admin/v2/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
