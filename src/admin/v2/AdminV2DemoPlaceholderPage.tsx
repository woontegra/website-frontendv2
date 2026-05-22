import { AdminCmsPlaceholder } from '@/admin/cms/AdminCmsPlaceholder';

export function AdminV2DemoPlaceholderPage() {
  return (
    <AdminCmsPlaceholder
      title="Demo Talep Sayfası"
      description="Demo hero, adımlar ve sık sorulanlar bu ekranda form olarak düzenlenecek."
      technicalLinks={[
        { to: '/admin/v2/faq', label: 'SSS Yönetimi (demo kategorisi)' },
        { to: '/admin/v2/technical/settings', label: 'Site ayarları' },
      ]}
    />
  );
}
