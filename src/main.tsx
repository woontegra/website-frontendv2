import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ContentProvider } from './app/ContentProvider';
import { ToastHost } from '@/components/ui/ToastHost';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <App />
        <ToastHost />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
