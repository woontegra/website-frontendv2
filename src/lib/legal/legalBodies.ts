import { PUBLIC_COOKIE_INVENTORY } from '@/lib/cookieInventory';
import {
  legalContactCard,
  legalMeta,
  legalNote,
  legalSection,
  legalTableBox,
  legalTableHeadRow,
  legalTableRow,
} from '@/lib/legal/legalHtmlHelpers';
import {
  PANEL_STORAGE_INVENTORY,
  PANEL_TECHNICAL_SIGNALS,
} from '@/lib/legal/panelStorageInventory';
import type { LegalContactInfo } from './types';

type C = LegalContactInfo;

/** Yasal metinlerde “Son güncelleme” satırı */
export const LEGAL_LAST_UPDATED = '23 Mayıs 2026';

export const COOKIE_POLICY_PATH = '/cerez-politikasi';
export const COOKIE_POLICY_TITLE = 'Çerez ve Benzeri Teknolojiler Politikası';

function cookiePolicyMasterTableHtml(): string {
  const rows = PUBLIC_COOKIE_INVENTORY.map((item) =>
    legalTableRow([
      `<code>${item.name}</code>`,
      item.type,
      item.provider,
      item.legalCategory,
      item.purpose,
      item.retention,
      item.consentRequirement,
    ]),
  ).join('');
  return `<table class="legal-table legal-table--cookie">
<thead>${legalTableHeadRow(['Ad', 'Tür', 'Sağlayıcı', 'Kategori', 'Amaç', 'Saklama Süresi', 'Onay Durumu'])}</thead>
<tbody>${rows}</tbody>
</table>`;
}

function panelStorageTableHtml(): string {
  const rows = PANEL_STORAGE_INVENTORY.map((item) =>
    legalTableRow([
      `<code>${item.name}</code>`,
      item.type,
      item.provider,
      item.purpose,
      item.retention,
      item.category,
    ]),
  ).join('');
  return `<table class="legal-table legal-table--panel">
<thead>${legalTableHeadRow(['Ad / kayıt grubu', 'Tür', 'Sağlayıcı', 'Amaç', 'Saklama süresi', 'Zorunluluk / kategori'])}</thead>
<tbody>${rows}</tbody>
</table>`;
}

function panelTechnicalSignalsHtml(): string {
  const rows = PANEL_TECHNICAL_SIGNALS.map((item) =>
    legalTableRow([`<code>${item.signal}</code>`, item.description]),
  ).join('');
  return `<table class="legal-table legal-table--signals">
<thead>${legalTableHeadRow(['Teknik sinyal', 'Açıklama'])}</thead>
<tbody>${rows}</tbody>
</table>`;
}

const CONTACT_BLOCK = (c: C) => legalContactCard(`
<p><strong>Veri sorumlusu / hizmet sağlayıcı:</strong> ${c.companyName}</p>
<p><strong>Platform:</strong> ${c.platformName}</p>
<p><strong>E-posta:</strong> ${c.emailLabel}</p>
<p><strong>Telefon:</strong> ${c.phoneLabel}</p>
<p><strong>Adres:</strong> ${c.addressLabel}</p>
`);

const SELLER_BLOCK = (c: C) => `
<p><strong>Ünvan:</strong> ${c.companyName}</p>
<p><strong>Platform / marka:</strong> ${c.platformName}</p>
<p><strong>Adres:</strong> ${c.addressLabel}</p>
<p><strong>Telefon:</strong> ${c.phoneLabel}</p>
<p><strong>E-posta:</strong> ${c.emailLabel}</p>
`;

export function gizlilikPolitikasiHtml(c: C): string {
  return `
<h2 class="legal-doc-title">GİZLİLİK POLİTİKASI</h2>
${legalMeta(LEGAL_LAST_UPDATED)}

<div class="legal-doc-intro">
<p>Bu Gizlilik Politikası, <strong>${c.platformName}</strong> internet sitesi, demo başvurusu, abonelik ve Bilirkişi Hesaplama Programı (panel) hizmetleri kapsamında kişisel verilerinizin nasıl işlendiğini açıklar. Politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ile uyumlu olacak şekilde hazırlanmıştır.</p>
</div>

${legalSection(`
<h2>1. Veri sorumlusu ve iletişim</h2>
${CONTACT_BLOCK(c)}
<p>Gizlilik ile ilgili taleplerinizi yukarıdaki iletişim kanalları üzerinden iletebilirsiniz. Ayrıntılı aydınlatma için <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>’ne bakınız.</p>
`, 'contact')}

${legalSection(`
<h2>2. Kapsam — kimler için geçerlidir?</h2>
<p>Veri işleme faaliyetleri, kullandığınız hizmete göre farklılaşır. Aşağıdaki gruplar birbirinden ayrı değerlendirilir:</p>
<ul>
  <li><strong>Public website ziyaretçisi:</strong> Tanıtım sitesini gezen, demo veya satın alma sayfalarına bakan, çerez banner’ı ile tercih veren kişiler. Bu kapsamda işlenen çerez ve benzeri teknolojiler yalnızca public site envanterindedir; program <code>localStorage</code> kayıtları bu gruba dahil değildir.</li>
  <li><strong>Demo başvurusu yapan kişi:</strong> Demo formu ile iletişim ve meslek bilgisi paylaşan, demo lisansı oluşturulan kişiler.</li>
  <li><strong>Program / panel kullanıcısı:</strong> Bilirkişi Hesaplama Programına giriş yapan, hesaplama ve rapor işlemlerini yürüten abone veya lisanslı kullanıcılar. Oturum ve lisans verileri çoğunlukla sunucu ve <code>localStorage</code> üzerinden yürütülür; klasik HTTP oturum çerezi kullanılmaz.</li>
  <li><strong>Admin / yönetim paneli kullanıcısı:</strong> Web sitesi içerik yönetimi (CMS) veya dahili yönetim arayüzüne erişen yetkili kullanıcılar.</li>
  <li><strong>Ödeme / lisans sürecindeki kullanıcı:</strong> Satın alma, PayTR ödeme ekranı ve lisans aktivasyonu sırasında işlem yapan kişiler.</li>
</ul>
`)}

${legalSection(`
<h2>3. Hangi veriler işlenir?</h2>
<p>Hizmetin niteliğine göre kimlik, iletişim, hesap, lisans, hesaplama içeriği, log, destek ve — public sitede onay vermeniz halinde — pazarlama ölçüm verileri işlenebilir. Ayrıntılı kategori listesi <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>’nde yer alır.</p>
`)}

${legalSection(`
<h2>4. İşleme amaçları</h2>
<ul class="legal-list--compact">
  <li>Web sitesinin güvenli ve düzgün çalıştırılması</li>
  <li>Demo ve abonelik süreçlerinin yürütülmesi</li>
  <li>Ödeme, faturalandırma ve lisans aktivasyonu (PayTR)</li>
  <li>Program hesaplama, dava ve rapor işlevlerinin sunulması</li>
  <li>Müşteri desteği, canlı destek ve ticket yönetimi</li>
  <li>Hesap güvenliği, oturum doğrulama ve kötüye kullanımın önlenmesi</li>
  <li>Hizmet kalitesi, teknik loglama ve yasal yükümlülükler</li>
  <li>Public sitede analitik onayı sonrası sayfa görüntüleme istatistikleri</li>
  <li>Public sitede pazarlama onayı sonrası reklam ve dönüşüm ölçümü</li>
</ul>
`)}

${legalSection(`
<h2>5. Hukuki sebepler</h2>
<p>Kişisel verileriniz; sözleşmenin kurulması ve ifası, hukuki yükümlülük, meşru menfaat (güvenlik, hizmet geliştirme) ve gerektiğinde açık rızanız kapsamında işlenir.</p>
`)}

${legalSection(`
<h2>6. Üçüncü taraflar ve teknik hizmetler</h2>
<p>Verileriniz yalnızca hizmetin gerektirdiği ölçüde paylaşılabilir:</p>
<ul>
  <li><strong>PayTR:</strong> Online ödeme işlemlerinin güvenli yürütülmesi; ödeme sırasında PayTR çerezleri kullanılabilir.</li>
  <li><strong>Gmail API / e-posta gönderimi:</strong> Bilgilendirme, demo, abonelik ve destek e-postalarının iletilmesi.</li>
  <li><strong>Google Fonts:</strong> Public sitede yazı tiplerinin tutarlı gösterilmesi (teknik/görsel hizmet).</li>
  <li><strong>Cloudinary:</strong> Görsellerin ve medya dosyalarının CDN üzerinden sunulması.</li>
  <li><strong>Meta Pixel:</strong> Yalnızca <strong>public website</strong> ziyaretçileri için ve <strong>pazarlama çerezlerine onay</strong> verilmesi halinde; program/panel oturumunda Meta Pixel çalıştırılmaz.</li>
</ul>
${legalNote(`<p><strong>Kullanılmayan veya farklı yapılandırılan hizmetler:</strong> Public tanıtım sitesinde Google Analytics (GA) veya Google Tag Manager (GTM) <strong>kullanılmamaktadır</strong>. Google reCAPTCHA <strong>bulunmamaktadır</strong>. Canlı destek / sohbet, üçüncü taraf bir widget yerine <strong>kendi sistemimiz</strong> üzerinden (sunucu taraflı chat ve ticket altyapısı) sunulur.</p>`)}
`)}

${legalSection(`
<h2>7. Saklama süresi</h2>
<p>Veriler, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuattaki zamanaşımı süreleri dikkate alınarak saklanır. Public site çerez tercihi (<code>cookieConsent</code>) 12 ay saklanır; ayrıntılar <a href="${COOKIE_POLICY_PATH}">${COOKIE_POLICY_TITLE}</a> metnindedir.</p>
`)}

${legalSection(`
<h2>8. Güvenlik</h2>
<p>Erişim kontrolü, şifreli iletişim (SSL/TLS), JWT tabanlı kimlik doğrulama, cihaz ve tenant kontrolleri ile loglama gibi teknik ve idari tedbirler uygulanır. Program tarafında oturum tokenları ve cihaz bilgilerinin güvenliği, kullanıcının cihazı ve hesap kullanım alışkanlıkları ile doğrudan ilişkilidir.</p>
`)}

${legalSection(`
<h2>9. Haklarınız</h2>
<p>KVKK madde 11 kapsamındaki haklarınız saklıdır. Başvurularınızı ${c.emailLabel} üzerinden iletebilirsiniz.</p>
`)}

${legalSection(`
<h2>10. Çerezler ve tarayıcı depolama</h2>
<p>Public website çerezleri ve program <code>localStorage</code> kayıtları birbirinden ayrıdır. Ayrıntılı envanter ve tercih yönetimi <a href="${COOKIE_POLICY_PATH}">${COOKIE_POLICY_TITLE}</a> metninde açıklanmıştır. Public site tercihlerinizi yalnızca çerez banner’ı veya “Çerez ayarları” ile yönetirsiniz; bu panel program oturum kayıtlarını kapsamaz.</p>
`)}
`;
}

export function cerezPolitikasiHtml(c: C): string {
  return `
<h2 class="legal-doc-title">${COOKIE_POLICY_TITLE.toUpperCase()}</h2>
${legalMeta(LEGAL_LAST_UPDATED)}

<div class="legal-doc-intro">
<p>Bu politika, <strong>${c.platformName}</strong> kapsamında kullanılan çerezler, benzeri teknolojiler ve (program kullanıcıları için) tarayıcı depolama kayıtları hakkında bilgilendirme sağlar. Metin iki ana bölüme ayrılmıştır: <strong>(Bölüm 1)</strong> yalnızca public tanıtım web sitesi ziyaretçileri; <strong>(Bölüm 2)</strong> Bilirkişi Hesaplama Programı / panel kullanıcıları.</p>
</div>

${legalNote(`<p><strong>Önemli ayrım:</strong> Sitedeki çerez banner’ı ve “Çerez ayarları” paneli <strong>yalnızca public website çerez tercihlerini</strong> yönetir. Program oturumu, lisans ve panel <code>localStorage</code> kayıtları bu banner kapsamında değildir; bunlar program kullanım sözleşmesi ve <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> ile açıklanır.</p>`)}

${legalSection(`
<span class="legal-section__badge">Bölüm 1</span>
<h2 class="legal-section__title">BÖLÜM 1 — Web sitesi ziyaretçileri için kullanılan çerez ve benzeri teknolojiler</h2>

<p>Public tanıtım sitesinde (<code>${c.platformName}</code> marketing sitesi) aşağıdaki envanter geçerlidir. Program/panel <code>localStorage</code> anahtarları bu bölüme <strong>dahil değildir</strong>.</p>

<h3>1.1. Envanter tablosu</h3>
${legalTableBox('', cookiePolicyMasterTableHtml(), 'public')}

<h3>1.2. Onay ve saklama kuralları</h3>
<ul>
  <li><strong><code>cookieConsent</code>:</strong> Çerez tercihleriniz tarayıcı <code>localStorage</code> alanında <strong>12 ay</strong> saklanır; süre sonunda yeniden onay istenebilir.</li>
  <li><strong><code>page_views</code>:</strong> Sunucu taraflı sayfa görüntüleme kaydıdır; tarayıcı çerezi değildir. Kayıt <strong>yalnızca analitik onayı</strong> sonrası <code>/api/tracking/pageview</code> ile gönderilir.</li>
  <li><strong>Meta Pixel / <code>fbevents.js</code> / <code>_fbp</code> / <code>_fbc</code>:</strong> <strong>Yalnızca pazarlama (reklam) onayı</strong> sonrası yüklenir ve çalışır. Onay geri alındığında Pixel devre dışı bırakılır ve mümkün olduğu ölçüde Meta çerezleri temizlenir.</li>
  <li><strong>PayTR çerezleri:</strong> <strong>Yalnızca ödeme sürecinde</strong> (ödeme sayfası veya iframe) kullanılabilir; işlem tamamlandıktan sonra tarayıcıda kalması PayTR politikasına tabidir.</li>
  <li><strong>Google Fonts ve Cloudinary:</strong> Teknik ve görsel içerik sunumu için kullanılan üçüncü taraf hizmetlerdir; zorunlu/teknik hizmet kapsamında değerlendirilir.</li>
  <li><strong><code>bh_site_branding_v1</code>:</strong> Site marka/görünüm tercihinin hatırlanması için zorunlu teknik kayıt.</li>
</ul>

<h3>1.3. Zorunlu, analitik ve pazarlama</h3>
<p>Zorunlu kayıtlar kapatılamaz. Analitik ve pazarlama teknolojileri yalnızca ilgili kategorilere açık onay vermeniz halinde devreye girer. Google Analytics (GA) ve Google Tag Manager (GTM) public sitede kullanılmamaktadır.</p>

<h3>1.4. Tercih yönetimi (public site)</h3>
<p><strong>Tercihleri Yönet</strong> bağlantısı veya site altındaki çerez banner’ı üzerinden kategorileri görüntüleyebilir ve değiştirebilirsiniz. Bu panel program oturumunu veya panel <code>localStorage</code> kayıtlarını etkilemez.</p>
`, 'public')}

${legalSection(`
<span class="legal-section__badge">Bölüm 2</span>
<h2 class="legal-section__title">BÖLÜM 2 — Bilirkişi Hesaplama Programı / panel kullanıcıları için tarayıcı depolama ve teknik kayıtlar</h2>

<p>Program ve panel tarafında oturum ve lisans işlemleri aşağıdaki ilkelere göre yürütülür:</p>
<ul>
  <li>Klasik HTTP çerezi ile oturum yönetimi <strong>kullanılmamaktadır</strong>.</li>
  <li><code>document.cookie</code> üzerinden çerez yazımı <strong>yoktur</strong>.</li>
  <li><code>Set-Cookie</code> / HttpOnly kimlik doğrulama çerezi <strong>yoktur</strong>.</li>
  <li><code>sessionStorage</code> <strong>kullanılmamaktadır</strong>.</li>
  <li>Oturum, lisans ve arayüz tercihleri <strong>localStorage</strong>, <strong>Authorization</strong> başlığı ve <strong>cihaz tanımlayıcıları</strong> ile yürütülür.</li>
  <li>Bu kayıtlar çerez banner’ı üzerinden değil; <a href="/kullanim-sartlari">Kullanım Şartları</a>, <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> ve işbu politikanın bu bölümü kapsamında açıklanır.</li>
</ul>

<h3>2.1. Panel / program localStorage envanteri</h3>
${legalTableBox('', panelStorageTableHtml(), 'panel')}

<h3>2.2. Teknik oturum ve güvenlik sinyalleri (çerez değildir)</h3>
<p>Aşağıdaki öğeler HTTP çerezi olarak değil; API istekleri ve sunucu iletişimi kapsamında teknik oturum ve güvenlik sinyali olarak kullanılır:</p>
${legalTableBox('', panelTechnicalSignalsHtml(), 'signals')}
`, 'panel')}

${legalSection(`
<h2>Politika değişiklikleri</h2>
<p>Bu politika, mevzuat veya teknik altyapı değişikliklerinde güncellenebilir. Güncel metin yayımlandığı tarihten itibaren geçerlidir.</p>
`)}

${legalSection(`
<h2>İletişim</h2>
${CONTACT_BLOCK(c)}
`, 'contact')}
`;
}

export function kvkkAydinlatmaHtml(c: C): string {
  return `
<h2 class="legal-doc-title">KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ HAKKINDA AYDINLATMA METNİ</h2>
${legalMeta(LEGAL_LAST_UPDATED)}

<div class="legal-doc-intro">
<p>İşbu Aydınlatma Metni, ${c.companyName} tarafından işletilen <strong>${c.platformName}</strong> internet sitesi ve hizmetleri kapsamında, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verilerinizin hangi amaçlarla işlendiği, kimlere aktarılabileceği, hangi yöntemlerle toplandığı, hukuki sebepleri ve KVKK kapsamındaki haklarınız hakkında sizleri bilgilendirmek amacıyla hazırlanmıştır.</p>
</div>

${legalSection(`
<h2>1. Veri Sorumlusu</h2>
<p>KVKK kapsamında kişisel verileriniz bakımından veri sorumlusu:</p>
<ul>
  <li><strong>Unvan:</strong> ${c.companyName}</li>
  <li><strong>Adres:</strong> ${c.addressLabel}</li>
  <li><strong>E-posta:</strong> ${c.emailLabel}</li>
  <li><strong>Telefon:</strong> ${c.phoneLabel}</li>
  <li><strong>MERSİS / Vergi No:</strong> Bilgi eklenecek</li>
</ul>
`, 'contact')}

${legalSection(`
<h2>2. İşlenen Kişisel Veri Kategorileri</h2>
<p>Web sitemizi ziyaret etmeniz, demo başvurusu yapmanız, program/panel kullanmanız, ödeme işlemi yapmanız veya bizimle iletişime geçmeniz halinde aşağıdaki veri kategorileri işlenebilir:</p>
<ul>
  <li><strong>Kimlik ve iletişim bilgileri:</strong> Ad, soyad, e-posta, telefon, adres (varsa), firma/kurum adı.</li>
  <li><strong>Hesap, üyelik, tenant ve rol bilgileri:</strong> Kullanıcı kimliği, tenant (kiracı) kimliği, rol (ör. yönetici, kullanıcı), hesap durumu, abonelik planı.</li>
  <li><strong>Oturum ve kimlik doğrulama bilgileri:</strong> JWT erişim/yenileme token kayıtları (sunucu tarafı), oturum zamanı, <code>login_logs</code>, <code>lastLoginAt</code>, <code>loginCount</code>, şifre sıfırlama talepleri (<code>password_resets</code>).</li>
  <li><strong>Lisans ve cihaz bilgileri:</strong> Profesyonel lisans anahtarı, lisans bitiş tarihi, aktivasyon durumu, <code>professional_licenses.last_login_ip</code>, <code>professional_licenses.activated_devices</code>, cihaz tanımlayıcıları (<code>professional_device_id</code>, <code>deviceUUID</code>).</li>
  <li><strong>Demo başvuru ve demo lisans bilgileri:</strong> Demo formu içeriği, demo süresi, demo erişim kayıtları.</li>
  <li><strong>Abonelik ve ödeme bilgileri:</strong> Sipariş, plan türü, ödeme durumu, PayTR işlem referansları; kart verileri tarafımızca saklanmaz.</li>
  <li><strong>Hesaplama, dava, rapor, not ve etiket içerikleri:</strong> Kullanıcının programa girdiği hesaplama parametreleri ve sonuçları, kayıtlı davalar (<code>savedcase</code>, <code>CaseRecord</code>), raporlar (<code>Report</code>), rapor aktivite logları (<code>ReportActivityLog</code>), hesaplama logları (calculation logs), hesaplama notları (<code>CalculationNote</code>) ve etiketler (<code>CalculationTag</code>).</li>
  <li><strong>Kullanım ve teknik log bilgileri:</strong> Genel sistem logları (<code>logs</code>), admin işlem kayıtları (<code>admin_activity_logs</code>), hata ve güvenlik olayları.</li>
  <li><strong>IP adresi ve user-agent:</strong> Erişim, güvenlik ve istatistik amaçlı teknik kayıtlar.</li>
  <li><strong>Destek, chat, ticket ve e-posta kayıtları:</strong> Canlı destek sohbetleri (<code>chat_conversations</code>, <code>chat_messages</code>), destek talepleri (<code>tickets</code>, <code>ticket_replies</code>), gönderilen e-postalar (<code>email_logs</code>), abonelikten çıkma kayıtları (<code>email_unsubscribes</code>).</li>
  <li><strong>Baro / kampanya e-posta takip kayıtları:</strong> <code>baro_email_tracking</code> ve ilişkili <code>events</code> (açılma, tıklama vb. teknik olaylar).</li>
  <li><strong>Çerez tercihleri:</strong> Public sitede <code>cookieConsent</code> ile saklanan zorunlu/analitik/pazarlama tercihleri (12 ay).</li>
  <li><strong>Açık rıza varsa pazarlama ve reklam ölçüm verileri:</strong> Meta Pixel olayları, <code>_fbp</code> / <code>_fbc</code> ve dönüşüm ölçüm verileri (yalnızca public site ve pazarlama onayı sonrası).</li>
</ul>
<p>Public website’de sayfa görüntüleme kaydı (<code>page_views</code>) yalnızca analitik onayı sonrası oluşturulur. Program tarafında oturum verileri çerez banner’ı ile değil, sözleşme ve bu aydınlatma metni kapsamında işlenir.</p>
`)}

${legalSection(`
<h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
<p>Kişisel verileriniz aşağıdaki amaçlarla işlenebilir:</p>
<ul class="legal-list--compact">
  <li>Web sitesinin güvenli ve düzgün şekilde çalıştırılması,</li>
  <li>üyelik, demo ve abonelik süreçlerinin yürütülmesi,</li>
  <li>satın alma, ödeme, faturalandırma ve teslim süreçlerinin yönetilmesi,</li>
  <li>kullanıcı taleplerinin cevaplanması ve destek hizmetlerinin sunulması,</li>
  <li>hizmet kalitesinin artırılması ve teknik sorunların giderilmesi,</li>
  <li>site trafiğinin ve kullanım performansının ölçülmesi,</li>
  <li>hukuki yükümlülüklerin yerine getirilmesi,</li>
  <li>bilgi güvenliği süreçlerinin yürütülmesi,</li>
  <li>açık rıza verilmesi halinde pazarlama, reklam, yeniden hedefleme ve dönüşüm ölçümü yapılması.</li>
</ul>
`)}

${legalSection(`
<h2>4. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</h2>
<p>Kişisel verileriniz; web sitesi formları, üyelik ve demo başvuru ekranları, ödeme sayfaları, public sitede çerez tercihleri (<code>cookieConsent</code>), programda <code>localStorage</code> kayıtları (HTTP çerezi ve <code>sessionStorage</code> kullanılmadan), API istek başlıkları, sunucu logları, e-posta yazışmaları ve destek talepleri aracılığıyla elektronik ortamda toplanır.</p>
<p>Kişisel verileriniz KVKK’nın 5. maddesinde yer alan aşağıdaki hukuki sebeplere dayanılarak işlenebilir:</p>
<ul class="legal-list--compact">
  <li>Bir sözleşmenin kurulması veya ifası için gerekli olması,</li>
  <li>veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi,</li>
  <li>bir hakkın tesisi, kullanılması veya korunması için zorunlu olması,</li>
  <li>ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati,</li>
  <li>açık rıza gerektiren hallerde açık rızanız.</li>
</ul>
<p>Pazarlama ve reklam amaçlı çerezler, yalnızca ilgili kategoriye açık rıza vermeniz halinde çalıştırılır. Çerez uygulamaları bakımından Kurumun çerez rehberinde, çerezler yoluyla kişisel veri işlenmesi ayrıca ele alınmaktadır.</p>
`)}

${legalSection(`
<h2>5. Kişisel Verilerin Aktarılabileceği Kişiler</h2>
<p>Kişisel verileriniz, işleme amaçlarıyla sınırlı olmak üzere aşağıdaki kişi ve kuruluşlarla paylaşılabilir:</p>
<ul class="legal-list--compact">
  <li>Yetkili kamu kurum ve kuruluşları,</li>
  <li>mali müşavirlik, muhasebe ve hukuk hizmeti alınan kişiler,</li>
  <li>ödeme hizmeti sağlayıcıları,</li>
  <li>barındırma, sunucu, yazılım, e-posta ve teknik altyapı hizmeti sağlayıcıları,</li>
  <li>analitik, reklam ve pazarlama hizmeti sağlayıcıları, yalnızca gerekli onayların verilmesi halinde,</li>
  <li>hizmetlerin yürütülmesi için destek alınan iş ortakları ve tedarikçiler.</li>
</ul>
`)}

${legalSection(`
<h2>6. Yurt Dışına Veri Aktarımı</h2>
<p>Web sitemizde kullanılan bazı teknik hizmetler, CDN, font, reklam ve analiz servisleri yurt dışında bulunan sunucular üzerinden hizmet verebilir. Bu kapsamda Google Fonts, Cloudinary ve Meta Pixel gibi üçüncü taraf servisler aracılığıyla sınırlı teknik veriler yurt dışına aktarılabilir.</p>
<p>Pazarlama amaçlı üçüncü taraf servisler, yalnızca ilgili çerez kategorisine onay vermeniz halinde aktif hale gelir. Zorunlu teknik hizmetler ise sitenin güvenli ve düzgün çalışması için gerekli olduğu ölçüde kullanılabilir.</p>
`)}

${legalSection(`
<h2>7. Kişisel Verilerin Saklama Süresi</h2>
<p>Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri kadar muhafaza edilir. Sürenin sona ermesi veya işleme amacının ortadan kalkması halinde kişisel verileriniz silinir, yok edilir veya anonim hale getirilir.</p>
<p>Çerez ve benzeri teknolojilere ilişkin saklama süreleri <a href="${COOKIE_POLICY_PATH}">${COOKIE_POLICY_TITLE}</a> metninde ayrıca belirtilmiştir.</p>
`)}

${legalSection(`
<h2>8. KVKK Kapsamındaki Haklarınız</h2>
<p>KVKK’nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
<ul class="legal-list--compact">
  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
  <li>işlenmişse buna ilişkin bilgi talep etme,</li>
  <li>işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
  <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
  <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
  <li>KVKK’da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
  <li>düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
  <li>otomatik sistemler aracılığıyla aleyhinize sonuç doğmasına itiraz etme,</li>
  <li>kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.</li>
</ul>
<p>Başvurularınızı <strong>${c.emailLabel}</strong> üzerinden veya şirket adresimize yazılı olarak iletebilirsiniz.</p>
`)}
`;
}

export function kullanimSartlariHtml(c: C): string {
  return `
<h2 class="legal-doc-title">KULLANIM ŞARTLARI</h2>
${legalMeta(LEGAL_LAST_UPDATED)}

<div class="legal-doc-intro">
<p>İşbu Kullanım Şartları, <strong>${c.platformName}</strong> platformuna (${c.companyName} tarafından sunulan hizmet) erişim ve kullanım koşullarını düzenler. Siteyi veya yazılımı kullanarak bu şartları kabul etmiş sayılırsınız.</p>
</div>

${legalSection(`
<h2>1. Hizmetin kapsamı</h2>
<p>${c.platformName}; avukatlar, hukuk büroları, bilirkişiler ve ilgili profesyoneller için işçilik alacakları ve benzeri iş hukuku hesaplamalarını destekleyen, abonelik tabanlı bir SaaS yazılımdır. 40’tan fazla hesaplama modülü, raporlama ve güncel mevzuat desteği sunulabilir. Hizmet kapsamı zaman içinde güncellenebilir.</p>
`)}

${legalSection(`
<h2>2. Demo kullanımı</h2>
<p>Talep üzerine 7 günlük demo erişimi sağlanabilir. Demo süresi ve kapsamı platform tarafından belirlenir; kötüye kullanım hâlinde demo sonlandırılabilir.</p>
`)}

${legalSection(`
<h2>3. Abonelik</h2>
<p>Ücretli kullanım aylık veya yıllık abonelik planları üzerinden yapılır. Güncel fiyatlar satın alma ve fiyatlandırma sayfalarında gösterilir. Abonelik süresi boyunca güncellemelerden yararlanma, planda belirtilen koşullara tabidir.</p>
`)}

${legalSection(`
<h2>4. Hesap güvenliği, oturum ve lisans</h2>
<ul>
  <li>Kullanıcı hesabı <strong>kişiseldir</strong>; hesap bilgileri ve giriş bilgileri (e-posta, şifre, tek kullanımlık kodlar) <strong>üçüncü kişilerle paylaşılmamalıdır</strong>.</li>
  <li>Oturum <strong>token</strong>ları ve cihaz tanımlayıcılarının güvenliği, kullandığınız cihazın işletim sistemi, tarayıcı ve fiziksel erişim kontrolü ile doğrudan ilişkilidir.</li>
  <li><strong>Lisans</strong> ve <strong>cihaz kotası</strong> kötüye kullanılmamalı; lisans anahtarı veya cihaz kimliği başkalarına devredilmemelidir.</li>
  <li><strong>Yetkisiz erişim</strong>, hesap paylaşımı, lisans ihlali ve otomatik veri çekme yasaktır.</li>
  <li>Şüpheli erişimleri derhal ${c.emailLabel} üzerinden bildirmelisiniz.</li>
  <li>Kişisel veri ve çerez/benzeri teknoloji uygulamaları için <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> ve <a href="${COOKIE_POLICY_PATH}">${COOKIE_POLICY_TITLE}</a> geçerlidir.</li>
</ul>
`)}

${legalSection(`
<h2>5. Kullanıcı yükümlülükleri</h2>
<ul>
  <li>Doğru ve güncel bilgi vermek</li>
  <li>Platformu yalnızca yasal ve mesleki amaçlarla kullanmak</li>
  <li>Tersine mühendislik, otomatik veri çekme veya hizmeti aksatacak müdahalelerden kaçınmak</li>
  <li>Üçüncü kişilerin haklarına ve gizliliğine saygı göstermek</li>
</ul>
`)}

${legalSection(`
<h2>6. Hesaplama sonuçlarının niteliği</h2>
${legalNote(`<p><strong>Önemli:</strong> Platform çıktıları bilgilendirme ve hesaplama desteği amaçlıdır. Sonuçlar, kullanıcının girdiği verilere ve seçilen parametrelere bağlıdır. Nihai hukuki değerlendirme, strateji ve dosyaya özgü yorum <strong>kullanıcıya aittir</strong>. Sistem, mahkeme veya bilirkişiye sunulacak resmî, gerekçeli bilirkişi raporu üretmez; profesyonel sorumluluk kullanıcıda kalır.</p>`)}
`)}

${legalSection(`
<h2>7. Yasaklı kullanım</h2>
<p>Yetkisiz erişim, zararlı yazılım yayma, hizmeti aşırı yükleyecek otomasyon ve yürürlükteki mevzuata aykırı kullanım yasaktır.</p>
`)}

${legalSection(`
<h2>8. Fikri mülkiyet</h2>
<p>Yazılım, arayüz, marka ve içerik ${c.companyName}’e aittir; izinsiz kopyalama ve dağıtım yasaktır.</p>
`)}

${legalSection(`
<h2>9. Hizmet değişiklikleri ve askıya alma</h2>
<p>Bakım, güvenlik veya mevzuat gereği hizmet geçici olarak durdurulabilir. Şart ihlali, ödeme temerrüdü veya kötüye kullanımda hesap askıya alınabilir veya sonlandırılabilir.</p>
`)}

${legalSection(`
<h2>10. Sorumluluk sınırı</h2>
<p>Hizmet “olduğu gibi” sunulur. Mevzuat değişikliklerine uyum için makul çaba gösterilir; ancak dolaylı zararlar, veri kaybı veya üçüncü taraf kesintilerinden doğan zararlarda, kanunun izin verdiği ölçüde sorumluluk sınırlıdır.</p>
`)}

${legalSection(`
<h2>11. Uyuşmazlık</h2>
<p>Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Tüketici işlemlerinde tüketicinin yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
`)}

${legalSection(`
<h2>12. İletişim</h2>
${CONTACT_BLOCK(c)}
`, 'contact')}
`;
}

export function onBilgilendirmeHtml(c: C): string {
  return `
<p>İşbu Ön Bilgilendirme Formu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, <strong>${c.platformName}</strong> abonelik hizmetinin satın alınmasından önce tüketicinin bilgilendirilmesi amacıyla hazırlanmıştır.</p>

<h2>1. Satıcı / hizmet sağlayıcı bilgileri</h2>
${SELLER_BLOCK(c)}

<h2>2. Hizmetin temel nitelikleri</h2>
<p><strong>Hizmet adı:</strong> ${c.platformName} — İşçilik alacakları ve iş hukuku hesaplama yazılımı (SaaS)</p>
<p><strong>Nitelik:</strong> İnternet üzerinden erişilen dijital yazılım aboneliği; avukatlar, hukuk büroları ve bilirkişiler için hesaplama modülleri, raporlama ve güncel mevzuat desteği.</p>
<p><strong>Abonelik türleri:</strong> Aylık ve yıllık planlar (satın alma ekranında seçilir).</p>
<p><strong>Demo:</strong> Talep hâlinde 7 günlük demo erişimi ayrıca sunulabilir.</p>

<h2>3. Toplam fiyat ve vergiler</h2>
<p>Seçilen plana ait güncel fiyat, vergi ve varsa indirim/kampanya tutarları <strong>satın alma sayfasında</strong> ayrıntılı olarak gösterilir. Ödeme öncesi toplam bedel ekranda onayınıza sunulur. Tüm fiyatlar KDV dahil olarak sunulur (aksi belirtilmedikçe).</p>

<h2>4. Ödeme yöntemi</h2>
<p>Ödeme, PayTR güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile online olarak alınır. Kart bilgileriniz ${c.companyName} sunucularında saklanmaz.</p>

<h2>5. Dijital teslimat / ifa</h2>
<p>Hizmet dijital niteliktedir. Ödemenin onaylanmasının ardından kullanıcı hesabınız ve/veya lisans erişiminiz etkinleştirilir; erişim bilgileri kayıtlı e-posta adresinize iletilebilir. Fiziksel teslimat yapılmaz.</p>

<h2>6. Cayma hakkı</h2>
<p>6502 sayılı Kanun’un 15. maddesi (ğ) bendi uyarınca, elektronik ortamda anında ifa edilen dijital içerik ve hizmetlerde, tüketicinin onayı ile ifaya başlanması hâlinde cayma hakkı kullanılamayabilir. Ödeme öncesi bu husus hakkında bilgilendirilir ve onayınız alınır. Hizmet ifası başlamadan önce mevzuatın öngördüğü çerçevede cayma hakkınız saklıdır.</p>

<h2>7. Şikâyet ve iletişim</h2>
<p>Şikâyet ve talepleriniz için ${c.emailLabel} ve ${c.phoneLabel} üzerinden başvurabilirsiniz. Tüketici uyuşmazlıklarında Tüketici Hakem Heyetleri ve Tüketici Mahkemelerine başvuru hakkınız saklıdır.</p>

<h2>8. Sözleşmenin kurulması</h2>
<p>Satın alma sayfasında ön bilgilendirme ve mesafeli satış sözleşmesini okuyup onaylamanız, ardından ödemeyi tamamlamanız ile mesafeli satış sözleşmesi kurulmuş olur.</p>

<h2>9. Kampanya ve indirimler</h2>
<p>Geçerli kampanya veya indirim kodları yalnızca satın alma ekranında gösterilen koşullarda uygulanır.</p>

<p><em>Ödeme öncesi bu metni okuduğunuzu ve kabul ettiğinizi satın alma ekranındaki onay kutuları ile beyan etmiş olursunuz.</em></p>
`;
}

export function mesafeliSatisHtml(c: C): string {
  return `
<p>İşbu Mesafeli Satış Sözleşmesi, aşağıda bilgileri yer alan satıcı ile, internet sitesi üzerinden dijital hizmet satın alan alıcı arasında, 6502 sayılı Kanun ve ilgili yönetmelik hükümleri uyarınca elektronik ortamda kurulmuştur.</p>

<h2>1. Taraflar</h2>
<p><strong>SATICI (Hizmet sağlayıcı):</strong></p>
${SELLER_BLOCK(c)}
<p><strong>ALICI:</strong> Satın alma ve kayıt sırasında bilgilerini giren, ödemeyi gerçekleştiren gerçek veya tüzel kişi.</p>

<h2>2. Konu</h2>
<p>Sözleşmenin konusu, ALICI’nın ${c.platformName} yazılımına yönelik aylık veya yıllık abonelik satın alması ve dijital erişim/lisans hakkının sağlanmasıdır.</p>

<h2>3. Hizmetin niteliği</h2>
<p>İşçilik alacakları hesaplama modüllerine erişim sağlayan SaaS hizmeti; içerik ve modüller güncellenebilir. Hesaplama çıktıları bilgilendirme amaçlıdır; nihai hukuki değerlendirme ALICI’ya aittir.</p>

<h2>4. Bedel ve ödeme</h2>
<p>Abonelik bedeli satın alma anında ekranda gösterilen tutardır (KDV dahil). Ödeme PayTR altyapısı ile tahsil edilir. Ödeme onayı sonrası ifa başlar.</p>

<h2>5. İfa / teslimat</h2>
<p>Dijital hizmet olduğundan teslimat, ödeme onayının ardından kullanıcı hesabı ve lisans aktivasyonu ile anında gerçekleşir. Erişim bilgileri ALICI’nın bildirdiği e-posta adresine iletilebilir.</p>

<h2>6. Kullanıcı hesabı ve lisans</h2>
<p>ALICI, hesap bilgilerinin gizliliğinden sorumludur. Abonelik süresi boyunca planda tanımlı kullanım hakları geçerlidir; süre bitiminde erişim sona erer (yenileme hariç).</p>

<h2>7. Cayma hakkı</h2>
<p>Dijital içerik ve anında ifa edilen hizmetlerde, ALICI’nın ön onayı ile ifaya başlanması hâlinde mevzuattaki cayma hakkı istisnaları uygulanabilir. Ön bilgilendirme formunda bu durum açıklanmıştır.</p>

<h2>8. Tarafların hak ve yükümlülükleri</h2>
<p><strong>Satıcı:</strong> Hizmeti sözleşmeye uygun sunmak, teknik destek sağlamak ve kişisel verileri mevzuata uygun işlemek.</p>
<p><strong>Alıcı:</strong> Doğru bilgi vermek, bedeli ödemek, platformu kötüye kullanmamak ve kullanım şartlarına uymak.</p>

<h2>9. Sorumluluk sınırı</h2>
<p>Satıcı, kanunun izin verdiği ölçüde dolaylı zararlardan sorumlu değildir. Hesaplama sonuçlarının dosyaya özel doğruluğu ALICI’nın veri girişine ve profesyonel kontrolüne bağlıdır.</p>

<h2>10. Uyuşmazlık çözümü</h2>
<p>Türkiye Cumhuriyeti hukuku uygulanır. ALICI’nın tüketici sıfatı varsa yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>

<h2>11. Yürürlük</h2>
<p>ALICI’nın elektronik onayı ve ödemenin tamamlanması ile yürürlüğe girer.</p>

<h2>12. İletişim</h2>
${CONTACT_BLOCK(c)}
`;
}
