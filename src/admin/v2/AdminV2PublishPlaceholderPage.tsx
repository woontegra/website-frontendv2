import { AdminCmsPlaceholder } from '@/admin/cms/AdminCmsPlaceholder';

export function AdminV2PublishPlaceholderPage() {
  return (
    <AdminCmsPlaceholder
      title="Yayına Alma / Önizleme"
      description="Canlı site önizleme, yayın kontrol listesi ve yayın sonrası doğrulama bu ekranda toplanacak."
      technicalLinks={[
        { to: '/admin/v2/technical/publish-tools', label: 'Yayın ve önizleme araçları' },
        { to: '/admin/v2/technical/content', label: 'Yayın özeti' },
      ]}
    />
  );
}
