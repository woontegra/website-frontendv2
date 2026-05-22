import { Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/app/ScrollToTop';
import { PageViewTracker } from '@/components/tracking/PageViewTracker';
import { SiteDocumentHead } from './SiteDocumentHead';
import { Header } from './Header';
import { Footer } from './Footer';

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <SiteDocumentHead />
      <PageViewTracker />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
