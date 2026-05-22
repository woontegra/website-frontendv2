import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type AdminPageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AdminPageShell({ children, wide = false }: AdminPageShellProps) {
  const { pathname } = useLocation();
  const isOverview = pathname === '/admin/v2/overview';
  const isFullWidthDashboard =
    pathname === '/admin/v2/homepage' || isOverview;

  if (isFullWidthDashboard) {
    return (
      <div
        className={`w-full min-w-0 max-w-none px-3 sm:px-5 lg:px-6 ${
          isOverview
            ? 'pt-4 pb-3 sm:pt-5 sm:pb-3.5 lg:pt-5 lg:pb-3'
            : 'py-4 sm:py-5 lg:py-5'
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-full min-w-0 max-w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 ${
        wide ? 'max-w-[80rem]' : 'max-w-[72rem]'
      }`}
    >
      {children}
    </div>
  );
}
