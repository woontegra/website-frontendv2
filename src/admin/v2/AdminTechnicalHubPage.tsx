import { Link } from 'react-router-dom';
import { Database, Settings, FileText, Megaphone, Home, Rocket } from 'lucide-react';
import { AdminPageIntro } from '@/admin/cms/AdminPageIntro';

const technicalLinks = [
  {
    to: '/admin/v2/technical/content',
    label: 'Yayın özeti (content bundle)',
    icon: Database,
    description: 'Yayınlanmış kayıt sayıları ve teknik özet.',
  },
  {
    to: '/admin/v2/technical/settings',
    label: 'Site ayarları (URL ve genel)',
    icon: Settings,
    description: 'Site adı, panel giriş, ödeme linkleri ve benzeri anahtarlar.',
  },
  {
    to: '/admin/v2/technical/pages',
    label: 'Sayfa içerikleri (gelişmiş)',
    icon: FileText,
    description: 'Sayfa bazlı metin blokları — yalnızca geliştirici kullanımı.',
  },
  {
    to: '/admin/v2/technical/marketing',
    label: 'CTA ve güven metrikleri (ham)',
    icon: Megaphone,
    description: 'Ham liste görünümü; ana sayfada bölüm kartlarına taşınacak.',
  },
  {
    to: '/admin/v2/technical/homepage-editor',
    label: 'Ana sayfa bölüm editörü (gelişmiş)',
    icon: Home,
    description: 'Bölüm kartları ile ana sayfa düzenleme — geçici gelişmiş erişim.',
  },
  {
    to: '/admin/v2/technical/publish-tools',
    label: 'Yayın ve önizleme araçları',
    icon: Rocket,
    description: 'Canlı önizleme linkleri ve bundle kontrolü.',
  },
];

export function AdminTechnicalHubPage() {
  return (
    <div>
      <AdminPageIntro
        title="Teknik veri görünümü"
        description="Geliştirici ve ileri seviye kullanım için ham veri ekranları. Günlük içerik düzenleme için üst menüdeki sayfa yönetimlerini kullanın."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {technicalLinks.map(({ to, label, icon: Icon, description }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <Icon className="h-6 w-6 text-slate-500" />
            <p className="mt-3 font-semibold text-slate-900">{label}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
