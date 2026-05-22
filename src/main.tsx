import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ContentProvider } from './app/ContentProvider';
import { PublicSiteExtras } from './app/PublicSiteExtras';
import { ToastHost } from '@/components/ui/ToastHost';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <PublicSiteExtras />
        <App />
        <ToastHost />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
