export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const faqCategories: FaqCategory[] = [
  {
    id: 'genel',
    title: 'Genel Kullanım',
    items: [
      {
        id: 'genel-1',
        question: 'Bilirkişi Hesap kimler için uygundur?',
        answer:
          'Bilirkişi Hesap; avukatlar, bilirkişiler, arabulucular ve hukuk büroları için geliştirilmiş işçilik alacakları hesaplama yazılımıdır.',
      },
      {
        id: 'genel-2',
        question: 'Programı kullanmak için teknik bilgi gerekir mi?',
        answer:
          'Hayır. Amaç, karmaşık hesaplamaları daha düzenli ve anlaşılır bir arayüzle yapabilmektir.',
      },
    ],
  },
  {
    id: 'moduller',
    title: 'Hesaplama Modülleri',
    items: [
      {
        id: 'modul-1',
        question: 'Hangi hesaplama modülleri var?',
        answer:
          'Kıdem tazminatı, ihbar tazminatı, fazla mesai, yıllık izin, UBGT, hafta tatili, ücret alacağı ve diğer işçilik alacaklarına yönelik modüller bulunur.',
      },
      {
        id: 'modul-2',
        question: 'Hesaplama sonuçları raporlanabilir mi?',
        answer:
          'Programın amacı yalnızca sonuç üretmek değil, hesaplamayı denetlenebilir ve raporlanabilir hale getirmektir.',
      },
    ],
  },
  {
    id: 'demo',
    title: 'Demo ve Abonelik',
    items: [
      {
        id: 'demo-1',
        question: 'Demo talebi nasıl oluşturulur?',
        answer:
          'Demo Talep sayfasındaki form üzerinden bilgilerinizi iletebilirsiniz. Demo bağlantısı sonraki aşamada aktif edilecektir.',
      },
      {
        id: 'demo-2',
        question: 'Demo hesabı otomatik mi açılır?',
        answer:
          'Canlı bağlantı aktif edildiğinde demo talebi mevcut sistem üzerinden değerlendirilecek ve demo erişimi sağlanacaktır.',
      },
    ],
  },
  {
    id: 'fiyat',
    title: 'Fiyatlandırma',
    items: [
      {
        id: 'fiyat-1',
        question: 'Aylık ve yıllık paket arasında fark var mı?',
        answer:
          'Erişim kapsamı aynıdır. Yıllık paket uzun süreli kullanım için daha avantajlıdır.',
      },
      {
        id: 'fiyat-2',
        question: 'Baro üyelerine özel indirim var mı?',
        answer:
          'Evet. Baro üyelerine özel kampanya ve indirimli kullanım seçenekleri planlanmıştır.',
      },
    ],
  },
  {
    id: 'rapor',
    title: 'Rapor ve Çıktı',
    items: [
      {
        id: 'rapor-1',
        question: 'Rapor çıktısı alınabilir mi?',
        answer:
          'Program, hesaplama sonuçlarının düzenli ve profesyonel şekilde raporlanmasına yönelik hazırlanmıştır.',
      },
      {
        id: 'rapor-2',
        question: 'Excel yerine neden bu program kullanılmalı?',
        answer:
          "Excel'de formül hatası, dosya karmaşası ve manuel işlem riski yüksektir. Bilirkişi Hesap, işçilik alacakları için daha düzenli ve standart bir hesaplama akışı sunar.",
      },
    ],
  },
];

/** Ana sayfa önizlemesi ve geriye dönük kullanım için düz liste */
export const faqItems: FaqItem[] = faqCategories.flatMap((c) => c.items);
