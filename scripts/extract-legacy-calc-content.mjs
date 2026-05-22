import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../../website-frontend/src/pages');
const outPath = path.resolve(__dirname, '../src/data/calculationPageLegacyContent.json');

const fileToSlug = {
  'KidemTazminatiHesaplama.tsx': '/kidem-tazminati-hesaplama',
  'IhbarTazminatiHesaplama.tsx': '/ihbar-tazminati-hesaplama',
  'FazlaMesaiHesaplama.tsx': '/fazla-mesai-hesaplama',
  'YillikIzinHesaplama.tsx': '/yillik-izin-hesaplama',
  'UbgtHesaplama.tsx': '/ubgt-hesaplama',
  'HaftaTatiliHesaplama.tsx': '/hafta-tatili-hesaplama',
  'UcretAlacagiHesaplama.tsx': '/ucret-alacagi-hesaplama',
  'BakiyeUcretHesaplama.tsx': '/bakiye-ucret-hesaplama',
  'KotuNiyetTazminatiHesaplama.tsx': '/kotu-niyet-tazminati',
  'IseBaslatmamaTazminatiHesaplama.tsx': '/ise-baslatmama-tazminati',
  'BostaGecenSureUcretiHesaplama.tsx': '/bosta-gecen-sure-ucreti',
  'AyrimcilikTazminatiHesaplama.tsx': '/ayrimcilik-tazminati',
  'PrimAlacagiHesaplama.tsx': '/prim-alacagi-hesaplama',
  'HaksizFesihTazminatiHesaplama.tsx': '/haksiz-fesih-tazminati',
};

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCards(src, constName) {
  const re = new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`);
  const m = src.match(re);
  if (!m) return [];
  const block = m[1];
  const cards = [];
  const cardRe = /title:\s*'([^']*)'[\s\S]*?desc:\s*'([^']*)'/g;
  let cm;
  while ((cm = cardRe.exec(block))) {
    cards.push({ title: cm[1], description: cm[2] });
  }
  return cards;
}

function extractBenefits(src) {
  const m = src.match(/const BENEFITS = \[([\s\S]*?)\];/);
  if (!m) return [];
  const block = m[1];
  const out = [];
  const re = /title:\s*'([^']*)'[\s\S]*?text:\s*'([^']*)'/g;
  let bm;
  while ((bm = re.exec(block))) {
    out.push({ title: bm[1], text: bm[2] });
  }
  return out;
}

const skipH2 = [
  'Kolaylaştırın',
  'Hesaplama Türleri',
  'Modülleri',
  'Özellikleri',
  'Programın Sunduğu',
];

function shouldSkipH2(title) {
  return skipH2.some((s) => title.includes(s));
}

function extractArticleSections(src) {
  const sections = [];
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const h2s = [];
  let match;
  while ((match = h2Re.exec(src))) {
    const t = stripTags(match[1]);
    if (t && !shouldSkipH2(t)) {
      h2s.push({ index: match.index, title: t });
    }
  }
  for (let i = 0; i < h2s.length; i++) {
    const start = h2s[i].index;
    const end = i + 1 < h2s.length ? h2s[i + 1].index : src.length;
    const chunk = src.slice(start, end);
    const paragraphs = [];
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let pm;
    while ((pm = pRe.exec(chunk))) {
      const text = stripTags(pm[1]);
      if (text.length > 20) paragraphs.push(text);
    }
    const listItems = [];
    const ulRe = /<ul[^>]*>([\s\S]*?)<\/ul>/g;
    let um;
    while ((um = ulRe.exec(chunk))) {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
      let lim;
      while ((lim = liRe.exec(um[1]))) {
        const li = stripTags(lim[1]);
        if (li) listItems.push(li);
      }
    }
    if (paragraphs.length || listItems.length) {
      sections.push({
        heading: h2s[i].title,
        paragraphs,
        ...(listItems.length ? { listItems } : {}),
      });
    }
  }
  return sections;
}

function extractModuleTypesTitle(src) {
  const m = src.match(
    /<h2[^>]*className="text-2xl[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h2>/,
  );
  if (!m) return null;
  const t = stripTags(m[1]);
  if (t.includes('Türleri') || t.includes('Modülleri')) return t;
  return null;
}

const out = {};

for (const [file, slug] of Object.entries(fileToSlug)) {
  const src = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  let intro = '';
  const introAfterH1 = src.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (introAfterH1) {
    intro = stripTags(introAfterH1[1]);
  }

  const moduleCards =
    extractCards(src, 'MODULE_CARDS').length > 0
      ? extractCards(src, 'MODULE_CARDS')
      : extractCards(src, 'DESCRIPTION_CARDS');

  const moduleTypesTitle = extractModuleTypesTitle(src);

  out[slug] = {
    ...(intro ? { intro } : {}),
    articleSections: extractArticleSections(src),
    ...(moduleCards.length
      ? {
          moduleTypes: {
            title: moduleTypesTitle || 'Hesaplama türleri',
            cards: moduleCards,
          },
        }
      : {}),
    programBenefits: extractBenefits(src),
  };
}

// Sendikal — eski sitede ayrı sayfa yok; benzer tazminat şablonu
out['/sendikal-tazminat'] = {
  intro:
    'Sendikal nedenle fesih veya sendikal ayrımcılık kaynaklı tazminat taleplerinin mevzuata uygun hesaplanması için profesyonel modül.',
  articleSections: [
    {
      heading: 'Sendikal Tazminat Nedir?',
      paragraphs: [
        'Sendikal tazminat, işçinin sendikal faaliyetleri veya sendika üyeliği nedeniyle iş sözleşmesinin feshedilmesi veya ayrımcı uygulamalar sonucu doğan tazminat kalemlerini kapsar. İş Kanunu ve ilgili mevzuatta sendikal hakların korunmasına ilişkin hükümler dikkate alınarak hesaplama yapılır.',
      ],
    },
    {
      heading: 'Sendikal Tazminat Nasıl Hesaplanır?',
      paragraphs: [
        'Hesaplamada fesih tarihi, sendikal süreç, ücret esası ve talep edilen tazminat türü birlikte değerlendirilir. Bilirkişi Hesap programı bu parametreleri tek akışta toplayarak denetlenebilir sonuç üretir.',
      ],
    },
  ],
  programBenefits: [
    {
      title: 'Mevzuata uygun hesap',
      text: 'Sendikal tazminat kalemleri güncel iş hukuku çerçevesinde hesaplanır.',
    },
    {
      title: 'Hızlı rapor',
      text: 'Dosya bazlı hesap tablosu ve rapor çıktısı oluşturulur.',
    },
    {
      title: 'Denetlenebilir süreç',
      text: 'Girdi ve sonuçlar dosya içinde izlenebilir şekilde saklanır.',
    },
  ],
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', outPath, 'modules:', Object.keys(out).length);
