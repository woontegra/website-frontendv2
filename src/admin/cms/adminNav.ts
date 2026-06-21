import type { LucideIcon } from 'lucide-react';
import {
  Home,
  CircleDollarSign,
  Percent,
  ShoppingCart,
  Presentation,
  Mail,
  HelpCircle,
  Calculator,
  Search,
  Image,
  Rocket,
  LayoutDashboard,
  SlidersHorizontal,
  Wrench,
  PanelBottom,
  Archive,
} from 'lucide-react';

export type CmsNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

/** Ana menü — site bölümleri; teknik tablo adları burada yok */
export const cmsNavItems: CmsNavItem[] = [
  {
    to: '/admin/v2/overview',
    label: 'Genel Bakış',
    icon: LayoutDashboard,
    description: 'Ziyaret, satış, gelir ve kullanıcı özeti',
  },
  {
    to: '/admin/v2/homepage',
    label: 'Ana Sayfa Yönetimi',
    icon: Home,
    description: 'Hero, güven, modüller vitrini, Excel, alt CTA',
  },
  {
    to: '/admin/v2/calculations',
    label: 'Hesaplama Sayfaları',
    icon: Calculator,
    description: 'Modül kartları ve tanıtım metinleri',
  },
  {
    to: '/admin/v2/pricing',
    label: 'Fiyatlandırma',
    icon: CircleDollarSign,
    description: 'Paketler ve karşılaştırma metinleri',
  },
  {
    to: '/admin/v2/campaigns',
    label: 'Kampanyalar',
    icon: Percent,
    description: 'Baro indirimleri ve kampanya linkleri',
  },
  {
    to: '/admin/v2/purchase',
    label: 'Satın Al Sayfası',
    icon: ShoppingCart,
    description: 'Ürün adı, fiyatlar, galeri ve satın al metinleri',
  },
  {
    to: '/admin/v2/legal-archive',
    label: 'Sözleşme Arşivi',
    icon: Archive,
    description: 'Onaylanan sözleşme paketleri ve PDF arşivi',
  },
  {
    to: '/admin/v2/settings',
    label: 'Site Ayarları',
    icon: SlidersHorizontal,
    description: 'Genel, ödeme, SMTP, analytics ve iş raporları',
  },
  {
    to: '/admin/v2/demo-page',
    label: 'Demo Talep Sayfası',
    icon: Presentation,
    description: 'Demo talep sayfası içerikleri',
  },
  {
    to: '/admin/v2/contact',
    label: 'İletişim Sayfası',
    icon: Mail,
    description: 'İletişim bilgileri ve destek kartları',
  },
  {
    to: '/admin/v2/footer',
    label: 'Footer',
    icon: PanelBottom,
    description: 'Alt bilgi, menü linkleri ve telif metni',
  },
  {
    to: '/admin/v2/faq',
    label: 'SSS Yönetimi',
    icon: HelpCircle,
    description: 'Kategoriler ve soru-cevaplar',
  },
  {
    to: '/admin/v2/seo',
    label: 'SEO Ayarları',
    icon: Search,
    description: 'Sayfa başlıkları ve meta açıklamalar',
  },
  {
    to: '/admin/v2/media',
    label: 'Medya Kütüphanesi',
    icon: Image,
    description: 'Görseller ve dosya adresleri',
  },
  {
    to: '/admin/v2/publish',
    label: 'Yayına Alma / Önizleme',
    icon: Rocket,
    description: 'Canlı site kontrolü ve yayın doğrulama',
  },
  {
    to: '/admin/v2/technical',
    label: 'Teknik Veri Görünümü',
    icon: Wrench,
    description: 'Gelişmiş ve ham veri ekranları',
  },
];

const routeTitles: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === '/admin/v2/overview', title: 'Genel Bakış' },
  { match: (p) => p === '/admin/v2/homepage', title: 'Ana Sayfa Yönetimi' },
  { match: (p) => p === '/admin/v2/calculations', title: 'Hesaplama Sayfaları' },
  { match: (p) => p === '/admin/v2/pricing', title: 'Fiyatlandırma' },
  { match: (p) => p === '/admin/v2/campaigns', title: 'Kampanyalar' },
  { match: (p) => p === '/admin/v2/purchase', title: 'Satın Al Sayfası' },
  { match: (p) => p.startsWith('/admin/v2/legal-archive'), title: 'Sözleşme Arşivi' },
  { match: (p) => p === '/admin/v2/settings', title: 'Site Ayarları' },
  {
    match: (p) => p === '/admin/v2/demo' || p === '/admin/v2/demo-page',
    title: 'Demo Talep Sayfası',
  },
  { match: (p) => p === '/admin/v2/contact', title: 'İletişim Sayfası' },
  { match: (p) => p === '/admin/v2/footer', title: 'Footer Yönetimi' },
  { match: (p) => p === '/admin/v2/faq', title: 'SSS Yönetimi' },
  { match: (p) => p === '/admin/v2/seo', title: 'SEO Ayarları' },
  { match: (p) => p === '/admin/v2/media', title: 'Medya Kütüphanesi' },
  { match: (p) => p === '/admin/v2/publish', title: 'Yayına Alma / Önizleme' },
  { match: (p) => p.startsWith('/admin/v2/technical'), title: 'Teknik Veri Görünümü' },
];

export function cmsRouteTitle(pathname: string): string {
  const main = cmsNavItems.find(
    (nav) => pathname === nav.to || pathname.startsWith(`${nav.to}/`),
  );
  if (main) return main.label;

  const extra = routeTitles.find((r) => r.match(pathname));
  if (extra) return extra.title;

  return 'İçerik Yönetimi';
}
