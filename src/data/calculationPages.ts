import { calculationModulePaths } from '@/data/calculationModulePaths';

export type CalculationPageData = {
  title: string;
  slug: string;
  eyebrow: string;
  description: string;
  benefits: string[];
  processSteps: { title: string; description: string }[];
  ctaText: string;
};

const defaultSteps: CalculationPageData['processSteps'] = [
  {
    title: 'Dosya verilerini girin',
    description: 'İşe giriş–çıkış, ücret ve süre bilgilerini modül formuna aktarın.',
  },
  {
    title: 'Hesaplamayı çalıştırın',
    description: 'Güncel mevzuat parametreleriyle otomatik ve denetlenebilir sonuç alın.',
  },
  {
    title: 'Raporu kullanın',
    description: 'Mahkeme ve dosya formatına uygun çıktıyı kaydedin veya paylaşın.',
  },
];

function page(
  slug: string,
  title: string,
  eyebrow: string,
  description: string,
  benefits: string[],
  ctaText?: string,
): CalculationPageData {
  return {
    slug,
    title,
    eyebrow,
    description,
    benefits,
    processSteps: defaultSteps,
    ctaText: ctaText ?? `${title.replace(' Hesaplama', '')} için demo hesabı açın`,
  };
}

export const calculationPages: CalculationPageData[] = [
  page(
    calculationModulePaths.kidem,
    'Kıdem Tazminatı Hesaplama',
    'İşçilik alacağı modülü',
    'İşçinin çalışma süresi ve ücreti dikkate alınarak kıdem tazminatı hesabı yapılmasına yönelik profesyonel hesaplama modülü.',
    [
      'Kıdem süresi ve tavan uygulaması',
      'Brüt–net dönüşüm ve kesintiler',
      'Dosya bazlı rapor ve döküm',
    ],
  ),
  page(
    calculationModulePaths.ihbar,
    'İhbar Tazminatı Hesaplama',
    'İşçilik alacağı modülü',
    'İhbar süreleri ve ücret esaslarına göre ihbar tazminatı alacağının hızlı ve mevzuata uygun hesaplanması.',
    [
      'İhbar süresi tespiti',
      'Ücret ve yan hakların dahil edilmesi',
      'Karşılaştırmalı hesap tablosu',
    ],
  ),
  page(
    calculationModulePaths['fazla-mesai'],
    'Fazla Mesai Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Haftalık ve yıllık fazla çalışma sürelerine göre fazla mesai ücret alacağının profesyonel hesabı.',
    [
      'Haftalık / aylık fazla mesai dökümü',
      'Katsayı ve ücret bileşenleri',
      'Dönemsel toplam ve rapor',
    ],
  ),
  page(
    calculationModulePaths['yillik-izin'],
    'Yıllık Ücretli İzin Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Kullanılmayan yıllık izin günleri ve ücret üzerinden izin alacağının hesaplanması.',
    [
      'İzin hakediş ve kullanım analizi',
      'Ücret üzerinden izin bedeli',
      'Detaylı gün ve tutar dökümü',
    ],
  ),
  page(
    calculationModulePaths.ubgt,
    'UBGT Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Ulusal bayram ve genel tatil günlerine ilişkin ücret alacağının mevzuata uygun hesaplanması.',
    [
      'UBGT günleri ve çalışma kayıtları',
      'Günlük ücret ve katsayı uygulaması',
      'Toplam alacak özeti',
    ],
  ),
  page(
    calculationModulePaths['hafta-tatili'],
    'Hafta Tatili Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Hafta tatilinde çalışmaya ilişkin ücret alacağının süre ve ücret bileşenleriyle hesaplanması.',
    [
      'Hafta tatili çalışma süreleri',
      'Ücret ve zamlı hesaplama',
      'Dönem bazlı raporlama',
    ],
  ),
  page(
    calculationModulePaths.ucret,
    'Ücret Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Ödenmeyen veya eksik ödenen ücret alacaklarının dönemsel olarak hesaplanması.',
    [
      'Dönemsel ücret karşılaştırması',
      'Asgari ücret ve zam etkileri',
      'Faiz ve gecikme kalemleri (varsa)',
    ],
  ),
  page(
    calculationModulePaths.bakiye,
    'Bakiye Ücret Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Belirli süre veya sözleşme döneminden kaynaklanan bakiye ücret alacağının hesaplanması.',
    [
      'Sözleşme süresi analizi',
      'Bakiye ücret kalemleri',
      'Net alacak özeti',
    ],
  ),
  page(
    calculationModulePaths['kotu-niyet'],
    'Kötü Niyet Tazminatı Hesaplama',
    'Tazminat modülü',
    'İş güvencesi kapsamı dışındaki hallerde kötü niyet tazminatının hesaplanmasına yönelik modül.',
    [
      'Kötü niyet şartlarının değerlendirilmesi',
      'Ücret esasının belirlenmesi',
      'Tazminat tutarı dökümü',
    ],
  ),
  page(
    calculationModulePaths['ise-baslatmama'],
    'İşe Başlatmama Tazminatı Hesaplama',
    'Tazminat modülü',
    'İşe iade sonrası işverenin işe başlatmaması halinde doğan tazminatın hesaplanması.',
    [
      'İşe iade ve başlatmama süreleri',
      'Ücret kaybı hesabı',
      'Tazminat raporu',
    ],
  ),
  page(
    calculationModulePaths['bosta-gecen'],
    'Boşta Geçen Süre Ücreti Hesaplama',
    'Tazminat modülü',
    'İşe iade davasında boşta geçen süreye ilişkin ücret hesabının yapılması.',
    [
      'Boşta geçen süre tespiti',
      'Ücret ve yan hak bileşenleri',
      'Dönemsel ücret dökümü',
    ],
  ),
  page(
    calculationModulePaths.ayrimcilik,
    'Ayrımcılık Tazminatı Hesaplama',
    'Tazminat modülü',
    'Ayrımcılık yasağına aykırılık nedeniyle talep edilebilecek tazminatın hesaplanması.',
    [
      'Ayrımcılık türü ve süre analizi',
      'Tazminat esasının belirlenmesi',
      'Hesap ve rapor çıktısı',
    ],
  ),
  page(
    calculationModulePaths.prim,
    'Prim Alacağı Hesaplama',
    'İşçilik alacağı modülü',
    'Prim ve ikramiye niteliğindeki ödenmeyen alacakların hesaplanması.',
    [
      'Prim dönemleri ve tutarları',
      'Ücretle ilişkilendirme',
      'Alacak özeti ve rapor',
    ],
  ),
  page(
    calculationModulePaths['haksiz-fesih'],
    'Haksız Fesih Tazminatı Hesaplama',
    'Tazminat modülü',
    'Haksız fesih nedeniyle doğan tazminat ve ilgili alacak kalemlerinin hesaplanması.',
    [
      'Fesih tarihi ve süre analizi',
      'Tazminat esasları',
      'Detaylı hesap tablosu',
    ],
  ),
  page(
    calculationModulePaths.sendikal,
    'Sendikal Tazminat Hesaplama',
    'Tazminat modülü',
    'Sendikal nedenle fesih veya ayrımcılık kaynaklı tazminat taleplerinin hesaplanması.',
    [
      'Sendikal süreç ve tarih kaydı',
      'Tazminat kalemleri',
      'Rapor ve döküm çıktısı',
    ],
  ),
];

export const calculationPagesBySlug: Record<string, CalculationPageData> =
  Object.fromEntries(calculationPages.map((p) => [p.slug, p]));

export const calculationPageSlugs = calculationPages.map((p) => p.slug);

export function getCalculationPageByPath(pathname: string): CalculationPageData | undefined {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  return calculationPagesBySlug[normalized];
}
