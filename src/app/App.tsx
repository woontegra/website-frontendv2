import { Navigate, Routes, Route } from 'react-router-dom';
import { AdminV2Layout } from '@/admin/v2/AdminV2Layout';
import { AdminV2LoginPage } from '@/admin/v2/AdminV2LoginPage';
import { AdminV2RequireAuth } from '@/admin/v2/AdminV2RequireAuth';
import { AdminTokenProvider } from '@/admin/v2/AdminTokenContext';
import { AdminV2FooterPage } from '@/admin/v2/AdminV2FooterPage';
import { AdminLegacyRedirect } from '@/admin/v2/AdminLegacyRedirects';
import { AdminV2OverviewPage } from '@/admin/v2/AdminV2OverviewPage';
import { AdminV2HomepageManagementPage } from '@/admin/v2/AdminV2HomepageManagementPage';
import { AdminV2HomepagePage } from '@/admin/v2/AdminV2HomepagePage';
import { AdminV2SettingsPage } from '@/admin/v2/AdminV2SettingsPage';
import { AdminV2SiteSettingsPage } from '@/admin/v2/AdminV2SiteSettingsPage';
import { AdminV2ModulesPage } from '@/admin/v2/AdminV2ModulesPage';
import { AdminV2PricingPage } from '@/admin/v2/AdminV2PricingPage';
import { AdminV2CampaignsPage } from '@/admin/v2/AdminV2CampaignsPage';
import { AdminV2PurchasePage } from '@/admin/v2/AdminV2PurchasePage';
import { AdminV2LegalArchivePage } from '@/admin/v2/AdminV2LegalArchivePage';
import { AdminV2FaqPage } from '@/admin/v2/AdminV2FaqPage';
import { AdminV2ContactPage } from '@/admin/v2/AdminV2ContactPage';
import { AdminV2MediaPage } from '@/admin/v2/AdminV2MediaPage';
import { AdminV2SeoPage } from '@/admin/v2/AdminV2SeoPage';
import { AdminV2PublishPage } from '@/admin/v2/AdminV2PublishPage';
import { AdminV2PublishPlaceholderPage } from '@/admin/v2/AdminV2PublishPlaceholderPage';
import { AdminV2DemoPageManagement } from '@/admin/v2/AdminV2DemoPageManagement';
import { AdminTechnicalHubPage } from '@/admin/v2/AdminTechnicalHubPage';
import { AdminV2ContentPage } from '@/admin/v2/AdminV2ContentPage';
import { AdminV2PagesPage } from '@/admin/v2/AdminV2PagesPage';
import { AdminV2MarketingPage } from '@/admin/v2/AdminV2MarketingPage';
import { SiteLayout } from '@/components/layout/SiteLayout';
import HomePage from '@/pages/HomePage';
import PricingPage from '@/pages/PricingPage';
import DemoRequestPage from '@/pages/DemoRequestPage';
import ContactPage from '@/pages/ContactPage';
import FaqPage from '@/pages/FaqPage';
import NotFoundPage from '@/pages/NotFoundPage';
import CalculationLandingPage from '@/pages/CalculationLandingPage';
import SatinAlPage from '@/pages/SatinAlPage';
import OdemeBasariliPage from '@/pages/OdemeBasariliPage';
import OdemeBasarisizPage from '@/pages/OdemeBasarisizPage';
import CampaignRedirectPage from '@/pages/CampaignRedirectPage';
import LegalDocumentPage from '@/pages/LegalDocumentPage';
import { LEGAL_PAGES, type LegalPageKey } from '@/data/legalPages';
import { calculationPageSlugs } from '@/data/calculationPages';
import { calculationModulePathRedirects } from '@/data/calculationModulePaths';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/admin/v2/login" replace />} />
      <Route path="/admin/v2/login" element={<AdminV2LoginPage />} />

      <Route
        path="/admin/v2"
        element={
          <AdminTokenProvider>
            <AdminV2Layout />
          </AdminTokenProvider>
        }
      >
        <Route element={<AdminV2RequireAuth />}>
          <Route index element={<Navigate to="overview" replace />} />

          {/* Ana CMS menüsü */}
          <Route path="overview" element={<AdminV2OverviewPage />} />
        <Route path="homepage" element={<AdminV2HomepageManagementPage />} />
        <Route path="calculations" element={<AdminV2ModulesPage />} />
        <Route path="pricing" element={<AdminV2PricingPage />} />
        <Route path="campaigns" element={<AdminV2CampaignsPage />} />
        <Route path="purchase" element={<AdminV2PurchasePage />} />
        <Route path="legal-archive" element={<AdminV2LegalArchivePage />} />
        <Route path="legal-archive/:id" element={<AdminV2LegalArchivePage />} />
        <Route path="settings" element={<AdminV2SiteSettingsPage />} />
        <Route path="demo-page" element={<AdminV2DemoPageManagement />} />
        <Route path="demo" element={<Navigate to="demo-page" replace />} />
        <Route path="contact" element={<AdminV2ContactPage />} />
        <Route path="faq" element={<AdminV2FaqPage />} />
        <Route path="footer" element={<AdminV2FooterPage />} />
        <Route path="seo" element={<AdminV2SeoPage />} />
        <Route path="media" element={<AdminV2MediaPage />} />
        <Route path="publish" element={<AdminV2PublishPlaceholderPage />} />
        <Route path="technical" element={<AdminTechnicalHubPage />} />

        {/* Teknik veri — mevcut ekranlar korunur */}
        <Route path="technical/content" element={<AdminV2ContentPage />} />
        <Route path="technical/settings" element={<AdminV2SettingsPage />} />
        <Route path="technical/pages" element={<AdminV2PagesPage />} />
        <Route path="technical/marketing" element={<AdminV2MarketingPage />} />
        <Route path="technical/homepage-editor" element={<AdminV2HomepagePage />} />
        <Route path="technical/publish-tools" element={<AdminV2PublishPage />} />

        {/* Eski URL yönlendirmeleri */}
        <Route path="dashboard" element={<AdminLegacyRedirect />} />
        <Route path="content" element={<AdminLegacyRedirect />} />
        <Route path="modules" element={<AdminLegacyRedirect />} />
        <Route path="marketing" element={<AdminLegacyRedirect />} />
        <Route path="pages" element={<AdminLegacyRedirect />} />
        </Route>
      </Route>

      <Route path="/admin/campaigns" element={<Navigate to="/admin/v2/campaigns" replace />} />
      <Route path="/admin/settings" element={<Navigate to="/admin/v2/settings" replace />} />
      <Route
        path="/admin/analytics"
        element={<Navigate to="/admin/v2/settings?tab=takip" replace />}
      />

      <Route path="odeme-basarili" element={<OdemeBasariliPage />} />
      <Route path="odeme-basarisiz" element={<OdemeBasarisizPage />} />

      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="k/:id" element={<CampaignRedirectPage />} />
        <Route path="satin-al" element={<SatinAlPage />} />
        <Route path="bilirkisi-hesap" element={<Navigate to="/satin-al" replace />} />
        <Route path="fiyatlandirma" element={<PricingPage />} />
        <Route path="demo-talep" element={<DemoRequestPage />} />
        <Route path="iletisim" element={<ContactPage />} />
        <Route path="sss" element={<FaqPage />} />
        {LEGAL_PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path.slice(1)}
            element={<LegalDocumentPage pageKey={page.path.slice(1) as LegalPageKey} />}
          />
        ))}
        {calculationModulePathRedirects.map(({ from, to }) => (
          <Route
            key={`redirect-${from}`}
            path={from}
            element={<Navigate to={`/${to}`} replace />}
          />
        ))}
        {calculationPageSlugs.map((slug) => (
          <Route
            key={slug}
            path={slug.replace(/^\//, '')}
            element={<CalculationLandingPage />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
