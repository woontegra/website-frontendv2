/** Bilirkişi Hesap programı / panel — tarayıcı localStorage envanteri (yasal metin; public site değil). */

export type PanelStorageRow = {
  name: string;
  type: string;
  provider: string;
  purpose: string;
  retention: string;
  category: string;
};

export const PANEL_STORAGE_INVENTORY: PanelStorageRow[] = [
  {
    name: 'access_token / refresh_token / token_expiry',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'JWT oturum ve yenileme token bilgilerinin tarayıcıda tutulması; API isteklerinde kimlik doğrulama',
    retention: 'Oturum süresi / token yenileme politikasına göre',
    category: 'Zorunlu — oturum',
  },
  {
    name: 'current_user / v3_session / tenant_id / user_id / user_role / email',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Oturum açmış kullanıcı, kiracı (tenant), rol ve iletişim bilgisinin arayüzde kullanılması',
    retention: 'Oturum süresi',
    category: 'Zorunlu — oturum',
  },
  {
    name: 'licenseValid / professionalLicenseKey / professionalLicenseExpiry / licenseExpiry',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Abonelik ve profesyonel lisans durumunun istemci tarafında gösterilmesi',
    retention: 'Lisans/abonelik süresi boyunca; sunucu kayıtları ayrıca tutulur',
    category: 'Zorunlu — lisans',
  },
  {
    name: 'professional_device_id / deviceUUID',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Cihaz tanımlama, lisans aktivasyonu ve cihaz kotası kontrolü',
    retention: 'Lisans süresi veya kullanıcı cihazı değiştirene kadar',
    category: 'Zorunlu — güvenlik',
  },
  {
    name: 'remember_email / last_login_date',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Giriş kolaylığı (e-posta hatırlama) ve son giriş bilgisi',
    retention: 'Kullanıcı temizleyene veya çıkış yapana kadar',
    category: 'İşlevsel',
  },
  {
    name: 'theme / sidebarCollapsed / chatWidgetMinimized',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Arayüz tercihleri (tema, kenar çubuğu, sohbet penceresi durumu)',
    retention: 'Kalıcı (kullanıcı silene kadar)',
    category: 'İşlevsel',
  },
  {
    name: 'starter_welcome_seen_{email} / starter_welcome_hide_{email}',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Başlangıç / hoş geldiniz ekranının gösterilip gösterilmeyeceğinin hatırlanması',
    retention: 'Kalıcı veya kullanıcı tercihine göre',
    category: 'İşlevsel',
  },
  {
    name: 'avatar_base64_{userId}',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Profil görselinin geçici önbelleğe alınması (performans)',
    retention: 'Oturum veya kullanıcı önbelleği temizlenene kadar',
    category: 'İşlevsel',
  },
  {
    name: 'aktuerya:manual-wage-template:v3',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Manuel ücret şablonu tercihlerinin saklanması',
    retention: 'Kullanıcı silene kadar',
    category: 'İşlevsel / teknik',
  },
  {
    name: 'STANDART_FM_DEBUG',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'Geliştirme veya destek amaçlı hata ayıklama bayrağı (yalnızca etkinleştirildiğinde)',
    retention: 'Kullanıcı veya sürüm politikasına göre',
    category: 'Teknik (isteğe bağlı)',
  },
  {
    name: 'storage_key_migration_v1:{tenantId}',
    type: 'localStorage',
    provider: 'Bilirkişi Hesap programı',
    purpose: 'İstemci tarafı depolama anahtarı migrasyonunun bir kez yapıldığının işaretlenmesi',
    retention: 'Migrasyon tamamlanana kadar',
    category: 'Zorunlu — teknik',
  },
];

export const PANEL_TECHNICAL_SIGNALS = [
  {
    signal: 'Authorization: Bearer',
    description: 'API isteklerinde JWT erişim tokenının iletilmesi',
  },
  {
    signal: 'X-Tenant-Id',
    description: 'Çok kiracılı yapıda doğru tenant bağlamının seçilmesi',
  },
  {
    signal: 'X-Device-Id / X-Device-UUID',
    description: 'Cihaz tanımlayıcısının sunucuya iletilmesi; lisans ve güvenlik kontrolleri',
  },
  {
    signal: 'X-Client-Session',
    description: 'İstemci oturum korelasyonu ve güvenlik izleme',
  },
  {
    signal: 'POST /api/heartbeat (yaklaşık 30 sn)',
    description: 'Aktif oturum ve bağlantı durumunun periyodik olarak sunucuya bildirilmesi (çerez değildir)',
  },
  {
    signal: 'Token refresh akışı',
    description: 'Süresi dolmak üzere olan erişim tokenının yenileme token ile güncellenmesi',
  },
] as const;
