import { useEffect, useState } from 'react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { ExternalLink, LayoutGrid, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import { adminLogout } from '@/lib/adminSession';

import { cmsNavItems } from '@/admin/cms/adminNav';

import { AdminPageShell } from '@/admin/ui/AdminPageShell';

import {

  adminShellBgClass,

  adminSidebarBgClass,

  adminSidebarBorderClass,

  adminSidebarNavActiveClass,

  adminSidebarNavInactiveClass,

} from '@/admin/ui/adminUiClasses';



function AdminSidebarNav({

  pathname,

  onNavigate,

  onLogout,

}: {

  pathname: string;

  onNavigate?: () => void;

  onLogout: () => void;

}) {

  return (

    <>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">

        {cmsNavItems.map(({ to, label, icon: Icon }) => (

          <NavLink

            key={to}

            to={to}

            onClick={onNavigate}

            className={({ isActive }) => {

              const active =

                isActive ||

                (to === '/admin/v2/technical' && pathname.startsWith('/admin/v2/technical'));

              return `group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${

                active ? adminSidebarNavActiveClass : adminSidebarNavInactiveClass

              }`;

            }}

          >

            <Icon className="h-[18px] w-[18px] shrink-0 opacity-85" strokeWidth={2} />

            <span className="leading-snug">{label}</span>

          </NavLink>

        ))}

      </nav>



      <div className={`border-t ${adminSidebarBorderClass} space-y-1 p-3`}>

        <a

          href="/"

          target="_blank"

          rel="noopener noreferrer"

          onClick={onNavigate}

          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition ${adminSidebarNavInactiveClass}`}

        >

          <ExternalLink className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />

          Canlı siteyi aç

        </a>

        <button

          type="button"

          onClick={() => {

            onNavigate?.();

            onLogout();

          }}

          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition ${adminSidebarNavInactiveClass} hover:bg-red-950/40 hover:text-red-200`}

        >

          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />

          Çıkış Yap

        </button>

      </div>

    </>

  );

}



function SidebarBrand() {

  return (

    <div className={`border-b ${adminSidebarBorderClass} px-5 py-5 lg:px-5 lg:py-5`}>

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f5c56] text-white shadow-sm">

          <LayoutGrid className="h-5 w-5" strokeWidth={2} />

        </div>

        <div className="min-w-0">

          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">

            Bilirkişi Hesap

          </p>

          <p className="text-[13px] text-slate-400">İçerik Yönetimi</p>

        </div>

      </div>

    </div>

  );

}



export function AdminV2Layout() {

  const { pathname } = useLocation();

  const navigate = useNavigate();

  const { removeToken } = useAdminToken();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {

    await adminLogout();

    removeToken();

    navigate('/admin/v2/login', { replace: true });

  };



  useEffect(() => {

    setMobileNavOpen(false);

  }, [pathname]);



  useEffect(() => {

    if (!mobileNavOpen) return;

    const onKey = (e: KeyboardEvent) => {

      if (e.key === 'Escape') setMobileNavOpen(false);

    };

    document.addEventListener('keydown', onKey);

    document.body.style.overflow = 'hidden';

    return () => {

      document.removeEventListener('keydown', onKey);

      document.body.style.overflow = '';

    };

  }, [mobileNavOpen]);



  const closeMobileNav = () => setMobileNavOpen(false);



  const sidebarAsideClass = `flex w-[17.5rem] shrink-0 flex-col border-r ${adminSidebarBorderClass} ${adminSidebarBgClass}`;



  return (

    <div className={`admin-v2-root flex min-h-screen min-w-0 overflow-x-hidden antialiased ${adminShellBgClass}`}>

      {/* Desktop sidebar */}

      <aside className={`hidden lg:flex ${sidebarAsideClass}`}>

        <SidebarBrand />

        <AdminSidebarNav pathname={pathname} onLogout={handleLogout} />

      </aside>



      {/* Mobil drawer */}

      {mobileNavOpen && (

        <button

          type="button"

          aria-label="Menüyü kapat"

          className="fixed inset-0 z-40 bg-[#1a2433]/50 backdrop-blur-[2px] lg:hidden"

          onClick={closeMobileNav}

        />

      )}



      <aside

        className={`fixed inset-y-0 left-0 z-50 ${sidebarAsideClass} shadow-2xl transition-transform duration-200 ease-out lg:hidden ${

          mobileNavOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'

        } w-[min(17.5rem,85vw)] max-w-[17.5rem]`}

        aria-hidden={!mobileNavOpen}

      >

        <SidebarBrand />

        <AdminSidebarNav pathname={pathname} onNavigate={closeMobileNav} onLogout={handleLogout} />

      </aside>



      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobil üst bar */}

        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#dbe4ea] bg-[#eef3f1]/95 px-4 py-3 backdrop-blur-md lg:hidden">

          <button

            type="button"

            onClick={() => setMobileNavOpen((open) => !open)}

            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#dbe4ea] bg-white text-[#1e2a3a] shadow-[0_1px_2px_rgba(26,36,51,0.06)]"

            aria-expanded={mobileNavOpen}

            aria-label={mobileNavOpen ? 'Menüyü kapat' : 'Menüyü aç'}

          >

            {mobileNavOpen ? (

              <X className="h-5 w-5" strokeWidth={2} />

            ) : (

              <Menu className="h-5 w-5" strokeWidth={2} />

            )}

          </button>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[15px] font-semibold text-[#1e2a3a]">Bilirkişi Hesap</p>

            <p className="truncate text-[13px] text-[#5c6b7a]">İçerik Yönetimi</p>

          </div>

        </header>



        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">

          <AdminPageShell>

            <Outlet />

          </AdminPageShell>

        </main>

      </div>

    </div>

  );

}

