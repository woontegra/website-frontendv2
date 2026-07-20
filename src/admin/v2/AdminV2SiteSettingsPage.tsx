import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Upload, X } from 'lucide-react';
import { AdminBusinessAnalyticsPanel } from '@/admin/v2/siteSettings/AdminBusinessAnalyticsPanel';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  adminAccentBtnClass,
  adminInputClass,
  adminLabelClass,
  adminPageTitleClass,
} from '@/admin/ui/adminUiClasses';
import {
  fetchGeneralSettings,
  fetchPaymentSettings,
  fetchBankTransferSettings,
  fetchSmtpSettings,
  fetchTrackingSettings,
  testSmtpSettings,
  updateGeneralSettings,
  updatePaymentSettings,
  updateBankTransferSettings,
  updateSmtpSettings,
  updateTrackingSettings,
  type GeneralSettings,
  type PaymentSettings,
  type BankTransferSettings,
  type SmtpSettings,
  type TrackingSettings,
} from '@/lib/adminSiteSettings';
import { SectionCard } from '@/admin/ui/SectionCard';
import { uploadAdminV2Media } from '@/lib/adminV2Media';
import { generateGeneralMediaAssetKey } from '@/lib/mediaUsageOptions';
import { showToast } from '@/components/ui/toast';

const TABS = [
  { id: 'genel', label: 'Genel' },
  { id: 'odeme', label: 'Ödeme' },
  { id: 'smtp', label: 'SMTP' },
  { id: 'takip', label: 'Analytics & Takip' },
  { id: 'raporlar', label: 'İş raporları' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SaveButton({ saving, label = 'Kaydet' }: { saving: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={`rounded-xl px-5 py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
    >
      {saving ? 'Kaydediliyor…' : label}
    </button>
  );
}

function GeneralTab() {
  const [data, setData] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchGeneralSettings()
      .then(setData)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (file: File, field: 'logoUrl' | 'faviconUrl') => {
    if (!file.type.startsWith('image/')) {
      showToast('Resim dosyası seçin', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Dosya 5MB altında olmalı', 'warning');
      return;
    }
    const setUp = field === 'logoUrl' ? setUploadingLogo : setUploadingFavicon;
    setUp(true);
    try {
      const dto = await uploadAdminV2Media({
        file,
        assetKey: generateGeneralMediaAssetKey(file.name),
        altText: field === 'logoUrl' ? 'Site logosu' : 'Site favicon',
      });
      const url = dto.fileUrl?.trim();
      if (!url) throw new Error('Blob görsel URL alınamadı');
      const next = data ? { ...data, [field]: url } : data;
      if (!next) throw new Error('Ayarlar yüklenemedi');
      setData(next);
      await updateGeneralSettings({
        siteTitle: next.siteTitle,
        siteDescription: next.siteDescription,
        contactEmail: next.contactEmail,
        phone: next.phone,
        address: next.address,
        logoUrl: next.logoUrl,
        faviconUrl: next.faviconUrl,
      });
      showToast(
        field === 'logoUrl' ? 'Logo kaydedildi' : 'Favicon kaydedildi',
        'success',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Yükleme hatası', 'error');
    } finally {
      setUp(false);
    }
  };

  if (loading) return <LoaderRow />;
  if (!data) return null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        void updateGeneralSettings(data)
          .then(() => showToast('Genel ayarlar kaydedildi', 'success'))
          .catch((err) => showToast(err instanceof Error ? err.message : 'Hata', 'error'))
          .finally(() => setSaving(false));
      }}
    >
      {(
        [
          ['siteTitle', 'Site başlığı', 'text'],
          ['siteDescription', 'Site açıklaması', 'textarea'],
          ['contactEmail', 'İletişim e-posta', 'email'],
          ['phone', 'Telefon', 'tel'],
          ['address', 'Adres', 'textarea'],
        ] as const
      ).map(([key, label, type]) => (
        <div key={key}>
          <label className={adminLabelClass}>{label}</label>
          {type === 'textarea' ? (
            <textarea
              className={`${adminInputClass} mt-1.5`}
              rows={key === 'address' ? 3 : 4}
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
            />
          ) : (
            <input
              type={type}
              className={`${adminInputClass} mt-1.5`}
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
            />
          )}
        </div>
      ))}
      {(['logoUrl', 'faviconUrl'] as const).map((field) => (
        <div key={field}>
          <label className={adminLabelClass}>{field === 'logoUrl' ? 'Logo' : 'Favicon'}</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              ref={field === 'logoUrl' ? logoRef : faviconRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, field);
              }}
            />
            <button
              type="button"
              onClick={() =>
                (field === 'logoUrl' ? logoRef : faviconRef).current?.click()
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ea] bg-white px-3 py-2 text-[13px]"
            >
              <Upload className="h-4 w-4" />
              {field === 'logoUrl'
                ? uploadingLogo
                  ? 'Yükleniyor…'
                  : 'Dosya seç'
                : uploadingFavicon
                  ? 'Yükleniyor…'
                  : 'Dosya seç'}
            </button>
            {data[field] && (
              <button
                type="button"
                onClick={() => setData({ ...data, [field]: '' })}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <input
            className={`${adminInputClass} mt-2`}
            value={data[field]}
            onChange={(e) => setData({ ...data, [field]: e.target.value })}
          />
          {data[field] && (
            <img src={data[field]} alt="" className="mt-2 h-14 w-auto rounded border border-[#dbe4ea]" />
          )}
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function PaytrBildirimUrlNotu() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const primary = origin ? `${origin}/api/paytr-callback` : 'https://www.bilirkisihesap.com/api/paytr-callback';
  const alternate = origin ? `${origin}/api/payment/callback` : 'https://www.bilirkisihesap.com/api/payment/callback';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-[13px] leading-relaxed text-[#1e293b]">
      <p className="font-semibold text-amber-900">PayTR “Bildirim URL” (sunucu bildirimi)</p>
      <p className="mt-1.5 text-[#5c6b7a]">
        Ödeme ekranındaki hata, bu adresin <strong>PayTR mağaza panelinizde</strong> (paytr.com › Mağaza › Ayarlar /
        Entegrasyon) tanımlı olmamasından kaynaklanır. Burada ayrı bir “Bildirim URL” alanı yoktur; aşağıdaki
        adreslerden <strong>birini</strong> PayTR&apos;ye yapıştırın (genelde POST, form verisi).
      </p>
      <p className="mt-2 font-medium text-slate-800">Önerilen:</p>
      <code className="mt-1 block break-all rounded border border-amber-100 bg-white px-2 py-1.5 font-mono text-[11px]">
        {primary}
      </code>
      <p className="mt-2 text-[12px] text-[#5c6b7a]">
        Alternatif (aynı işlev):{' '}
        <code className="rounded bg-white px-1 font-mono text-[11px]">{alternate}</code>
      </p>
      <p className="mt-2 text-[12px] text-[#64748b]">
        “Başarılı URL” ve “Hata URL” alanları ödeme bitince kullanıcının tarayıcıya yönlenmesi içindir; PayTR’nin
        sunucunuza sonuç bildirmesi (callback) değildir.
      </p>
      {origin.startsWith('http://localhost') ? (
        <p className="mt-2 text-[12px] font-medium text-amber-800">
          Yerelde test ediyorsanız PayTR&apos;ye canlı, dışarıdan erişilebilir bir HTTPS adresi yazmanız gerekir
          (ör. production domain veya ngrok).
        </p>
      ) : null}
    </div>
  );
}

function PaymentTab() {
  return (
    <div className="space-y-8">
      <PaytrSettingsSection />
      <BankTransferSettingsSection />
    </div>
  );
}

function PaytrSettingsSection() {
  const [data, setData] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchPaymentSettings()
      .then(setData)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoaderRow />;
  if (!data) return null;

  return (
    <SectionCard
      title="PayTR"
      description="Kredi kartı ödeme altyapısı merchant bilgileri."
      compact
      tintedHeader
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          void updatePaymentSettings(data)
            .then(() => {
              showToast('PayTR ayarları kaydedildi', 'success');
              return fetchPaymentSettings().then(setData);
            })
            .catch((err) => showToast(err instanceof Error ? err.message : 'Hata', 'error'))
            .finally(() => setSaving(false));
        }}
      >
        <PaytrBildirimUrlNotu />
        <div>
          <label className={adminLabelClass}>Merchant ID</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data.merchantId}
            onChange={(e) => setData({ ...data, merchantId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={adminLabelClass}>Merchant Key</label>
          <input
            type="password"
            className={`${adminInputClass} mt-1.5`}
            value={data.merchantKey}
            onChange={(e) => setData({ ...data, merchantKey: e.target.value })}
            placeholder={data.merchantKey === '***' ? 'Değiştirmek için yeni değer' : ''}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Merchant Salt</label>
          <input
            type="password"
            className={`${adminInputClass} mt-1.5`}
            value={data.merchantSalt}
            onChange={(e) => setData({ ...data, merchantSalt: e.target.value })}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Başarılı URL</label>
          <input
            type="url"
            className={`${adminInputClass} mt-1.5`}
            value={data.successUrl}
            onChange={(e) => setData({ ...data, successUrl: e.target.value })}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Hata URL</label>
          <input
            type="url"
            className={`${adminInputClass} mt-1.5`}
            value={data.failUrl}
            onChange={(e) => setData({ ...data, failUrl: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
          />
          Aktif
        </label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[13px] font-semibold text-slate-900">Test Modu</span>
              <span className="mt-1 block text-[12px] text-slate-600">
                PayTR kart işlemlerini test tahsilatı olarak başlatır.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={data.testMode}
              onClick={() => setData({ ...data, testMode: !data.testMode })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                data.testMode ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  data.testMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          {data.testMode && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-900">
              Test modu açık, gerçek tahsilat yapılmaz
            </p>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SectionCard>
  );
}

function BankTransferSettingsSection() {
  const [data, setData] = useState<BankTransferSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchBankTransferSettings()
      .then(setData)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoaderRow />;
  if (!data) return null;

  return (
    <SectionCard
      title="Havale / EFT Ayarları"
      description="Satın alma sayfasında havale seçildiğinde gösterilecek banka hesap bilgileri. Henüz kullanıcıya açılmamıştır."
      compact
      tintedHeader
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (data.isActive && (!data.accountHolderName.trim() || !data.iban.trim())) {
            showToast('Havale/EFT aktifken alıcı adı ve IBAN zorunludur', 'warning');
            return;
          }
          setSaving(true);
          void updateBankTransferSettings(data)
            .then(() => {
              showToast('Havale/EFT ayarları kaydedildi', 'success');
              return fetchBankTransferSettings().then(setData);
            })
            .catch((err) => showToast(err instanceof Error ? err.message : 'Hata', 'error'))
            .finally(() => setSaving(false));
        }}
      >
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
          />
          Havale/EFT aktif mi?
        </label>
        <div>
          <label className={adminLabelClass}>Banka adı</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data.bankName}
            onChange={(e) => setData({ ...data, bankName: e.target.value })}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Alıcı adı</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data.accountHolderName}
            onChange={(e) => setData({ ...data, accountHolderName: e.target.value })}
          />
        </div>
        <div>
          <label className={adminLabelClass}>IBAN</label>
          <input
            className={`${adminInputClass} mt-1.5 font-mono`}
            value={data.iban}
            onChange={(e) => setData({ ...data, iban: e.target.value })}
            placeholder="TR..."
          />
        </div>
        <div>
          <label className={adminLabelClass}>Şube bilgisi</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data.branchInfo}
            onChange={(e) => setData({ ...data, branchInfo: e.target.value })}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Ödeme talimatı / açıklama metni</label>
          <textarea
            rows={4}
            className={`${adminInputClass} mt-1.5`}
            value={data.instructions}
            onChange={(e) => setData({ ...data, instructions: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SectionCard>
  );
}

function SmtpTab() {
  const [data, setData] = useState<(SmtpSettings & { password: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void fetchSmtpSettings()
      .then((s) => setData({ ...s, password: '' }))
      .catch((e) => showToast(e instanceof Error ? e.message : 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoaderRow />;
  if (!data) return null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        const { password, ...rest } = data;
        void updateSmtpSettings({ ...rest, ...(password ? { password } : {}) })
          .then(() => {
            showToast('SMTP kaydedildi', 'success');
            setData((d) => (d ? { ...d, password: '' } : d));
          })
          .catch((err) => showToast(err instanceof Error ? err.message : 'Hata', 'error'))
          .finally(() => setSaving(false));
      }}
    >
      {(
        [
          ['host', 'SMTP sunucusu'],
          ['username', 'Kullanıcı adı'],
          ['fromEmail', 'Gönderen e-posta'],
          ['fromName', 'Gönderen isim'],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <label className={adminLabelClass}>{label}</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data[key]}
            onChange={(e) => setData({ ...data, [key]: e.target.value })}
            required={key !== 'fromName'}
          />
        </div>
      ))}
      <div>
        <label className={adminLabelClass}>Port</label>
        <input
          type="number"
          className={`${adminInputClass} mt-1.5`}
          value={data.port}
          onChange={(e) => setData({ ...data, port: parseInt(e.target.value, 10) || 587 })}
        />
      </div>
      <div>
        <label className={adminLabelClass}>Şifre (boş = değişmez)</label>
        <input
          type="password"
          className={`${adminInputClass} mt-1.5`}
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={data.secure}
          onChange={(e) => setData({ ...data, secure: e.target.checked })}
        />
        SSL/TLS
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={data.isActive}
          onChange={(e) => setData({ ...data, isActive: e.target.checked })}
        />
        Aktif
      </label>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={testing || !data.isActive}
          onClick={() => {
            if (!data.fromEmail) {
              showToast('Gönderen e-posta gerekli', 'warning');
              return;
            }
            setTesting(true);
            void testSmtpSettings(data.fromEmail)
              .then((msg) => showToast(msg, 'success'))
              .catch((err) => showToast(err instanceof Error ? err.message : 'Test başarısız', 'error'))
              .finally(() => setTesting(false));
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4ea] bg-white px-4 py-2 text-[13px]"
        >
          <Mail className="h-4 w-4" />
          {testing ? 'Gönderiliyor…' : 'Test et'}
        </button>
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function TrackingTab() {
  const empty: TrackingSettings = {
    ga4MeasurementId: '',
    gtmId: '',
    metaPixelId: '',
    metaAccessToken: '',
    metaDatasetId: '',
    metaTestEventCode: '',
    enableMetaCapi: false,
    customHeadScript: '',
    customBodyScript: '',
  };
  const [data, setData] = useState<TrackingSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchTrackingSettings()
      .then(setData)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoaderRow />;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        void updateTrackingSettings(data)
          .then(() => showToast('Takip ayarları kaydedildi', 'success'))
          .catch((err) => showToast(err instanceof Error ? err.message : 'Hata', 'error'))
          .finally(() => setSaving(false));
      }}
    >
      <p className="text-[13px] text-[#5c6b7a]">
        GA4, GTM, Meta Pixel ve özel scriptler. Public sitede Pixel yalnızca ziyaretçi
        &quot;Pazarlama çerezleri&quot;ni kabul ederse yüklenir; admin panelde çalışmaz.
      </p>
      {!data.metaPixelId.trim() && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <strong>Meta Pixel ID boş.</strong> CAPI (Dataset ID, Access Token) tek başına
          tarayıcıda Pixel Helper göstermez. Events Manager → Veri Kümeleri → Pikseliniz →
          <strong> Piksel Kimliği</strong> (genelde 15–16 haneli sayı; Dataset ID ile aynı değil).
        </div>
      )}
      {(
        [
          ['ga4MeasurementId', 'GA4 Measurement ID'],
          ['gtmId', 'Google Tag Manager ID'],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <label className={adminLabelClass}>{label}</label>
          <input
            className={`${adminInputClass} mt-1.5`}
            value={data[key]}
            onChange={(e) => setData({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}
      <div>
        <label className={adminLabelClass}>Meta Pixel ID</label>
        <input
          className={`${adminInputClass} mt-1.5`}
          placeholder="Örn. 123456789012345"
          value={data.metaPixelId}
          onChange={(e) => setData({ ...data, metaPixelId: e.target.value.trim() })}
        />
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#5c6b7a]">
          Tarayıcı pikseli (fbq). <code className="text-[11px]">metaDatasetId</code> alanı
          Conversion API içindir; buraya yazmayın.
        </p>
      </div>
      <label className="flex items-center gap-2 text-[13px] font-medium">
        <input
          type="checkbox"
          checked={data.enableMetaCapi}
          onChange={(e) => setData({ ...data, enableMetaCapi: e.target.checked })}
        />
        Meta Conversion API (CAPI)
      </label>
      {(['metaDatasetId', 'metaAccessToken', 'metaTestEventCode'] as const).map((key) => (
        <div key={key}>
          <label className={adminLabelClass}>{key}</label>
          <input
            type={key === 'metaAccessToken' ? 'password' : 'text'}
            disabled={!data.enableMetaCapi}
            className={`${adminInputClass} mt-1.5 disabled:opacity-50`}
            value={data[key]}
            onChange={(e) => setData({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}
      {(['customHeadScript', 'customBodyScript'] as const).map((key) => (
        <div key={key}>
          <label className={adminLabelClass}>{key}</label>
          <textarea
            rows={5}
            className={`${adminInputClass} mt-1.5 font-mono text-[12px]`}
            value={data[key]}
            onChange={(e) => setData({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function LoaderRow() {
  return (
    <div className="flex items-center gap-2 py-10 text-[#5c6b7a]">
      <Loader2 className="h-5 w-5 animate-spin" />
      Yükleniyor…
    </div>
  );
}

export function AdminV2SiteSettingsPage() {
  const { tokenPresent } = useAdminToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabId =
    TABS.find((t) => t.id === tabParam)?.id ?? 'genel';

  const setTab = (id: TabId) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Site ayarları</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[#5c6b7a]">
          Genel site, ödeme, e-posta, analytics takip kodları ve iş raporları. Veriler eski{' '}
          <code className="rounded bg-white px-1 text-[13px]">website-backend</code> API’sinden gelir.
        </p>
      </div>

      {!tokenPresent && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Ayarları kaydetmek ve raporları görmek için alttan admin token girin.
        </p>
      )}

      <div className="flex flex-wrap gap-1 rounded-xl border border-[#dbe4ea] bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-[#0f5c56] text-white shadow-sm'
                : 'text-[#5c6b7a] hover:bg-[#f0f5f4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#dbe4ea] bg-white p-6 shadow-sm sm:p-8">
        {activeTab === 'genel' && <GeneralTab />}
        {activeTab === 'odeme' && <PaymentTab />}
        {activeTab === 'smtp' && <SmtpTab />}
        {activeTab === 'takip' && <TrackingTab />}
        {activeTab === 'raporlar' && <AdminBusinessAnalyticsPanel />}
      </div>
    </div>
  );
}
