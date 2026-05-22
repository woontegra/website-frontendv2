/** API/CMS metni yetersiz veya şablon placeholder içeriyorsa detaylı fallback kullanılır. */
export function isUsableApiLegalContent(html: string | undefined | null): boolean {
  const text = html?.trim() ?? '';
  if (text.length < 1200) return false;
  if (/\[(Şirket|E-posta|Telefon|Mersis|Vergi|Buraya|Ürün)/i.test(text)) return false;
  if (/buraya eklenecektir/i.test(text)) return false;
  return true;
}
