import type { ContentBundleView } from '@/lib/contentBundle';
import { config } from '@/lib/config';
import { fetchPublicSettings } from '@/lib/storeApi';
import type { LegalContactInfo } from './types';
import { escapeHtml } from './escapeHtml';

const COMPANY_NAME = 'Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.';

/** Yasal metinlerde (veri sorumlusu vb.) gösterilen sabit iletişim */
export const LEGAL_CONTACT_PHONE = '0531 586 17 55';
export const LEGAL_CONTACT_ADDRESS =
  'İskele Mahallesi Bademli Caddesi 43/6 Datça-Muğla';

function contactLabel(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return v ? escapeHtml(v) : fallback;
}

export function buildLegalContactFromBundle(content: ContentBundleView): LegalContactInfo {
  const { footer } = content;
  return {
    platformName: escapeHtml(footer.siteName?.trim() || config.siteName),
    companyName: escapeHtml(COMPANY_NAME),
    emailLabel: contactLabel(
      footer.contactEmail,
      'web sitesinde yayınlanan iletişim e-posta adresi',
    ),
    phoneLabel: escapeHtml(LEGAL_CONTACT_PHONE),
    addressLabel: escapeHtml(LEGAL_CONTACT_ADDRESS),
  };
}

/** Footer + public settings birleşimi (e-posta/telefon/adres). */
export async function resolveLegalContact(content: ContentBundleView): Promise<LegalContactInfo> {
  const base = buildLegalContactFromBundle(content);
  try {
    const settings = await fetchPublicSettings();
    return {
      ...base,
      emailLabel: settings.contactEmail?.trim()
        ? escapeHtml(settings.contactEmail.trim())
        : base.emailLabel,
      phoneLabel: escapeHtml(LEGAL_CONTACT_PHONE),
      addressLabel: escapeHtml(LEGAL_CONTACT_ADDRESS),
    };
  } catch {
    return base;
  }
}
