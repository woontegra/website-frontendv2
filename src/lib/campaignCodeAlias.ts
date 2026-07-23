/**
 * Google Drive PDF yanlış URL ayrıştırması gibi yayınlanmış hatalı kampanya kodları.
 * Yalnız açık eşleştirmeler — genel dönüşüm yok.
 */
const CAMPAIGN_CODE_ALIASES: Readonly<Record<string, string>> = {
  // Gaziantep Barosu — Drive PDF ekstra "J" ekledi
  CMP_UF3NJKO5J5YIE: 'CMP_UF3NKO5J5YIE',
};

/** Kampanya çözümlemesinden önce kodu kanonik hale getirir. */
export function canonicalizeCampaignCode(code: string): string {
  const trimmed = String(code || '').trim();
  if (!trimmed) return trimmed;
  return CAMPAIGN_CODE_ALIASES[trimmed] ?? trimmed;
}

export function isCampaignCodeAlias(code: string): boolean {
  const trimmed = String(code || '').trim();
  return Boolean(trimmed && CAMPAIGN_CODE_ALIASES[trimmed]);
}
