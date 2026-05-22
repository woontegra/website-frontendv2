import type { ContentBundleView } from '@/lib/contentBundle';
import { config } from '@/lib/config';
import { fetchPublicSettings } from '@/lib/storeApi';
import type { LegalContactInfo } from './types';
import { escapeHtml } from './escapeHtml';

const COMPANY_NAME = 'Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.';

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
    phoneLabel: contactLabel(
      footer.contactPhone,
      'web sitesinde yayınlanan telefon numarası',
    ),
    addressLabel: contactLabel(
      footer.contactAddress,
      'web sitesinde yayınlanan adres bilgisi',
    ),
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
      phoneLabel: settings.phone?.trim()
        ? escapeHtml(settings.phone.trim())
        : base.phoneLabel,
      addressLabel: settings.address?.trim()
        ? escapeHtml(settings.address.trim())
        : base.addressLabel,
    };
  } catch {
    return base;
  }
}
