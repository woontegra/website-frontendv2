import type { LegalContactInfo } from './types';

type C = LegalContactInfo;

const CONTACT_BLOCK = (c: C) => `
<p><strong>Veri sorumlusu / hizmet sağlayıcı:</strong> ${c.companyName}</p>
<p><strong>Platform:</strong> ${c.platformName}</p>
<p><strong>E-posta:</strong> ${c.emailLabel}</p>
<p><strong>Telefon:</strong> ${c.phoneLabel}</p>
<p><strong>Adres:</strong> ${c.addressLabel}</p>
`;

const SELLER_BLOCK = (c: C) => `
<p><strong>Ünvan:</strong> ${c.companyName}</p>
<p><strong>Platform / marka:</strong> ${c.platformName}</p>
<p><strong>Adres:</strong> ${c.addressLabel}</p>
<p><strong>Telefon:</strong> ${c.phoneLabel}</p>
<p><strong>E-posta:</strong> ${c.emailLabel}</p>
`;

export function gizlilikPolitikasiHtml(c: C): string {
  return `
<p>Bu Gizlilik Politikası, <strong>${c.platformName}</strong> internet sitesi ve abonelik tabanlı yazılım hizmetini (${c.companyName} tarafından sunulan işçilik alacakları hesaplama SaaS platformu) kullanırken kişisel verilerinizin nasıl işlendiğini açıklar. Politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuat ile uyumlu olacak şekilde hazırlanmıştır.</p>

<h2>1. Veri sorumlusu ve iletişim</h2>
${CONTACT_BLOCK(c)}
<p>Gizlilik ile ilgili taleplerinizi yukarıdaki iletişim kanalları üzerinden iletebilirsiniz.</p>

<h2>2. Hangi veriler işlenir?</h2>
<p>Hizmetin niteliğine göre aşağıdaki veri kategorileri işlenebilir:</p>
<ul>
  <li><strong>Kimlik ve iletişim:</strong> Ad, soyad, e-posta, telefon.</li>
  <li><strong>Kurumsal bilgi:</strong> Hukuk bürosu / kurum adı; kullanıcı tarafından girilen baro veya kurum bilgisi (varsa).</li>
  <li><strong>Demo talebi:</strong> Demo formunda paylaştığınız iletişim ve meslek bilgileri, talep notları.</li>
  <li><strong>Abonelik ve ödeme:</strong> Satın alınan plan (aylık/yıllık), işlem tarihi, ödeme durumu; ödeme kuruluşu referans bilgileri (kart numarası platformumuzda saklanmaz).</li>
  <li><strong>Hesap ve lisans:</strong> Kullanıcı hesabı, abonelik süresi, lisans/erişim kayıtları.</li>
  <li><strong>Kullanım ve işlem:</strong> Platformda yaptığınız hesaplama işlemlerine ilişkin teknik kayıtlar, oturum bilgileri, hata ve güvenlik logları.</li>
  <li><strong>Teknik veriler:</strong> IP adresi, cihaz ve tarayıcı bilgisi, çerez tanımlayıcıları (Çerez Politikası’na bakınız).</li>
  <li><strong>İletişim:</strong> Destek talepleri, e-posta yazışmaları.</li>
</ul>

<h2>3. İşleme amaçları</h2>
<ul>
  <li>Yazılım aboneliği ve dijital erişimin sağlanması, sözleşmenin kurulması ve ifası</li>
  <li>7 günlük demo erişiminin oluşturulması ve yönetimi</li>
  <li>Ödeme süreçlerinin yürütülmesi (PayTR ödeme altyapısı)</li>
  <li>Müşteri desteği, bilgilendirme ve talep yanıtlama</li>
  <li>Hesap güvenliği, dolandırıcılık ve kötüye kullanımın önlenmesi</li>
  <li>Hizmet kalitesinin ölçülmesi, teknik iyileştirme ve yasal yükümlülüklerin yerine getirilmesi</li>
  <li>Açık rıza veya mevzuata uygun izin bulunması hâlinde kampanya ve duyuru iletişimi</li>
</ul>

<h2>4. Hukuki sebepler</h2>
<p>Kişisel verileriniz; sözleşmenin kurulması ve ifası, hukuki yükümlülük, meşru menfaat (güvenlik, hizmet geliştirme) ve gerektiğinde açık rızanız kapsamında işlenir.</p>

<h2>5. Aktarım</h2>
<p>Verileriniz yalnızca hizmetin gerektirdiği ölçüde ve gerekli güvenlik önlemleriyle paylaşılabilir:</p>
<ul>
  <li><strong>Ödeme kuruluşu:</strong> PayTR (online ödeme işlemleri)</li>
  <li><strong>E-posta / bildirim:</strong> SMTP veya e-posta hizmet sağlayıcıları</li>
  <li><strong>Barındırma ve altyapı:</strong> Sunucu, veritabanı ve CDN sağlayıcıları</li>
  <li><strong>Analitik ve pazarlama (izinli):</strong> Örneğin Meta Pixel — yalnızca pazarlama çerezlerine onay vermeniz hâlinde</li>
  <li><strong>Yetkili kurumlar:</strong> Kanuni zorunluluk hâlinde resmi merciler</li>
</ul>

<h2>6. Saklama süresi</h2>
<p>Veriler, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuattaki zamanaşımı süreleri dikkate alınarak saklanır. Süre sonunda silinir, yok edilir veya anonim hâle getirilir.</p>

<h2>7. Güvenlik</h2>
<p>Kişisel verilerinizin gizliliği ve bütünlüğü için erişim kontrolü, şifreli iletişim (SSL/TLS), yetkilendirme ve loglama gibi teknik ve idari tedbirler uygulanır.</p>

<h2>8. Haklarınız</h2>
<p>KVKK madde 11 kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, aktarılan üçüncü kişileri bilme, otomatik işleme sonuçlarına itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı ${c.emailLabel} üzerinden iletebilirsiniz.</p>

<h2>9. Çerezler</h2>
<p>Çerez kullanımı <a href="/cerez-politikasi">Çerez Politikası</a> metninde ayrıntılı olarak açıklanmıştır. Tercihlerinizi site altındaki çerez banner’ı veya “Çerez ayarları” bağlantısı ile yönetebilirsiniz.</p>
`;
}

export function cerezPolitikasiHtml(c: C): string {
  return `
<p>Bu Çerez Politikası, <strong>${c.platformName}</strong> web sitesinde (${c.companyName}) kullanılan çerezler ve benzeri teknolojiler hakkında bilgi verir.</p>

<h2>1. Çerez nedir?</h2>
<p>Çerezler, ziyaret ettiğiniz site tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Benzer teknolojiler (localStorage, oturum depolama) tercihlerinizi hatırlamak için de kullanılabilir.</p>

<h2>2. Çerez kategorileri</h2>
<h3>2.1. Zorunlu çerezler</h3>
<p>Sitenin güvenli çalışması, oturum yönetimi ve temel işlevler için gereklidir. Bu çerezler devre dışı bırakılamaz.</p>

<h3>2.2. Fonksiyonel / tercih çerezleri</h3>
<p>Çerez onay tercihleriniz (<code>cookieConsent</code> — localStorage), dil veya arayüz tercihleri gibi kullanıcı seçimlerini hatırlar. Yalnızca izin vermeniz hâlinde veya zorunlu kapsamda kullanılır.</p>

<h3>2.3. Analitik çerezler</h3>
<p>Ziyaret sayısı, sayfa görüntüleme ve kullanım istatistikleri için kullanılabilir. <strong>Yalnızca analitik kategorisine onay vermeniz hâlinde</strong> etkinleştirilir.</p>

<h3>2.4. Pazarlama çerezleri</h3>
<p>Reklam performansı ölçümü için kullanılır. <strong>Meta (Facebook) Pixel</strong> bu kategoriye girer. Pixel script’i ve ilgili çerezler (<code>_fbp</code>, <code>_fbc</code> vb.) <strong>pazarlama çerezlerini kabul etmediğiniz sürece yüklenmez ve çalışmaz</strong>. Onay vermediğinizde reklam ölçümü yapılmaz.</p>

<h2>3. Kullandığımız örnek çerezler</h2>
<ul>
  <li><code>cookieConsent</code> — Çerez tercihleriniz (localStorage, zorunlu/tercih)</li>
  <li>Oturum ve güvenlik çerezleri — Site işlevselliği (zorunlu)</li>
  <li><code>_fbp</code>, <code>_fbc</code> — Meta Pixel (pazarlama, yalnızca onaylı)</li>
</ul>

<h2>4. Tercihlerinizi yönetme</h2>
<p>İlk ziyaretinizde çerez banner’ı görüntülenir:</p>
<ul>
  <li><strong>Tümünü kabul et</strong> — Tüm kategoriler (analitik ve pazarlama dahil)</li>
  <li><strong>Zorunlu çerezlerle devam et</strong> — Yalnızca zorunlu çerezler; Pixel yüklenmez</li>
  <li><strong>Tercihleri yönet</strong> — Kategori bazlı seçim</li>
</ul>
<p>Sonradan tercih değiştirmek için sayfa altındaki <strong>Çerez ayarları</strong> bağlantısını veya footer’daki aynı bağlantıyı kullanabilirsiniz.</p>

<h2>5. Üçüncü taraf çerezleri</h2>
<p>PayTR ödeme sayfası, Meta/Facebook ve barındırma sağlayıcıları kendi çerezlerini kullanabilir. Bu sağlayıcıların politikaları kendi sitelerinde yayımlanır.</p>

<h2>6. İletişim</h2>
${CONTACT_BLOCK(c)}
`;
}

export function kvkkAydinlatmaHtml(c: C): string {
  return `
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla <strong>${c.companyName}</strong> olarak; <strong>${c.platformName}</strong> platformu kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metnidir.</p>

<h2>1. Veri sorumlusu</h2>
${CONTACT_BLOCK(c)}

<h2>2. İşlenen kişisel veri kategorileri</h2>
<ul>
  <li>Kimlik ve iletişim (ad, soyad, e-posta, telefon)</li>
  <li>Mesleki/kurumsal bilgi (hukuk bürosu, kullanıcı tarafından girilen baro/kurum bilgisi)</li>
  <li>Demo talep verileri</li>
  <li>Müşteri işlem ve abonelik bilgileri</li>
  <li>Ödeme işlem bilgileri (kart verisi ${c.companyName} tarafından saklanmaz)</li>
  <li>İşlem güvenliği (IP, log, oturum)</li>
  <li>Pazarlama ve iletişim tercihleri (açık rıza hâlinde)</li>
</ul>

<h2>3. İşleme amaçları</h2>
<ul>
  <li>SaaS abonelik hizmetinin sunulması ve dijital erişim/lisans aktivasyonu</li>
  <li>Demo hesabı oluşturma (7 gün)</li>
  <li>Ödeme ve faturalama süreçleri</li>
  <li>Destek, iletişim ve şikâyet yönetimi</li>
  <li>Bilgi güvenliği ve hukuki yükümlülükler</li>
  <li>Açık rızaya dayalı pazarlama/duyuru faaliyetleri</li>
</ul>

<h2>4. Hukuki sebepler</h2>
<p>KVKK md. 5/2 (c) sözleşmenin kurulması ve ifası; (ç) hukuki yükümlülük; (f) meşru menfaat; (a) açık rıza (pazarlama çerezleri, ticari elektronik ileti vb.).</p>

<h2>5. Kişisel verilerin aktarılması</h2>
<p>Ödeme kuruluşu (PayTR), e-posta/altyapı sağlayıcıları, barındırma hizmeti verenler ve kanunen yetkili kamu kurumlarına, KVKK md. 8–9 çerçevesinde aktarım yapılabilir.</p>

<h2>6. Toplama yöntemi</h2>
<p>Veriler; web sitesi formları, satın alma ekranı, demo talep formu, çerezler, otomatik log kayıtları ve destek kanalları aracılığıyla elektronik ortamda toplanır.</p>

<h2>7. Haklarınız (KVKK md. 11)</h2>
<p>İşlenip işlenmediğini öğrenme, bilgi talep etme, amacını öğrenme, aktarılan üçüncü kişileri bilme, eksik/yanlış verilerin düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, otomatik sistemlerle analiz sonuçlarına itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>

<h2>8. Başvuru yöntemi</h2>
<p>Taleplerinizi ${c.emailLabel} adresine yazılı olarak iletebilirsiniz. Başvurularınız en geç 30 gün içinde sonuçlandırılır.</p>

<h2>9. Açık rıza gerektiren haller</h2>
<p>Pazarlama çerezleri (Meta Pixel), analitik çerezler ve ticari elektronik ileti gönderimi açık rızanıza veya mevzuattaki diğer şartlara tabidir. Çerez tercihlerinizi site üzerinden güncelleyebilirsiniz.</p>
`;
}

export function kullanimSartlariHtml(c: C): string {
  return `
<p>İşbu Kullanım Şartları, <strong>${c.platformName}</strong> platformuna (${c.companyName} tarafından sunulan hizmet) erişim ve kullanım koşullarını düzenler. Siteyi veya yazılımı kullanarak bu şartları kabul etmiş sayılırsınız.</p>

<h2>1. Hizmetin kapsamı</h2>
<p>${c.platformName}; avukatlar, hukuk büroları, bilirkişiler ve ilgili profesyoneller için işçilik alacakları ve benzeri iş hukuku hesaplamalarını destekleyen, abonelik tabanlı bir SaaS yazılımdır. 40’tan fazla hesaplama modülü, raporlama ve güncel mevzuat desteği sunulabilir. Hizmet kapsamı zaman içinde güncellenebilir.</p>

<h2>2. Demo kullanımı</h2>
<p>Talep üzerine 7 günlük demo erişimi sağlanabilir. Demo süresi ve kapsamı platform tarafından belirlenir; kötüye kullanım hâlinde demo sonlandırılabilir.</p>

<h2>3. Abonelik</h2>
<p>Ücretli kullanım aylık veya yıllık abonelik planları üzerinden yapılır. Güncel fiyatlar satın alma ve fiyatlandırma sayfalarında gösterilir. Abonelik süresi boyunca güncellemelerden yararlanma, planda belirtilen koşullara tabidir.</p>

<h2>4. Hesap güvenliği</h2>
<p>Hesap bilgilerinizin gizliliğinden ve yetkisiz kullanımdan korunmasından siz sorumlusunuz. Şüpheli erişimleri derhal ${c.emailLabel} üzerinden bildirmelisiniz.</p>

<h2>5. Kullanıcı yükümlülükleri</h2>
<ul>
  <li>Doğru ve güncel bilgi vermek</li>
  <li>Platformu yalnızca yasal ve mesleki amaçlarla kullanmak</li>
  <li>Tersine mühendislik, otomatik veri çekme veya hizmeti aksatacak müdahalelerden kaçınmak</li>
  <li>Üçüncü kişilerin haklarına ve gizliliğine saygı göstermek</li>
</ul>

<h2>6. Hesaplama sonuçlarının niteliği</h2>
<p><strong>Önemli:</strong> Platform çıktıları bilgilendirme ve hesaplama desteği amaçlıdır. Sonuçlar, kullanıcının girdiği verilere ve seçilen parametrelere bağlıdır. Nihai hukuki değerlendirme, strateji ve dosyaya özgü yorum <strong>kullanıcıya aittir</strong>. Sistem, mahkeme veya bilirkişiye sunulacak resmî, gerekçeli bilirkişi raporu üretmez; profesyonel sorumluluk kullanıcıda kalır.</p>

<h2>7. Yasaklı kullanım</h2>
<p>Yetkisiz erişim, zararlı yazılım yayma, hizmeti aşırı yükleyecek otomasyon ve yürürlükteki mevzuata aykırı kullanım yasaktır.</p>

<h2>8. Fikri mülkiyet</h2>
<p>Yazılım, arayüz, marka ve içerik ${c.companyName}’e aittir; izinsiz kopyalama ve dağıtım yasaktır.</p>

<h2>9. Hizmet değişiklikleri ve askıya alma</h2>
<p>Bakım, güvenlik veya mevzuat gereği hizmet geçici olarak durdurulabilir. Şart ihlali, ödeme temerrüdü veya kötüye kullanımda hesap askıya alınabilir veya sonlandırılabilir.</p>

<h2>10. Sorumluluk sınırı</h2>
<p>Hizmet “olduğu gibi” sunulur. Mevzuat değişikliklerine uyum için makul çaba gösterilir; ancak dolaylı zararlar, veri kaybı veya üçüncü taraf kesintilerinden doğan zararlarda, kanunun izin verdiği ölçüde sorumluluk sınırlıdır.</p>

<h2>11. Uyuşmazlık</h2>
<p>Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Tüketici işlemlerinde tüketicinin yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>

<h2>12. İletişim</h2>
${CONTACT_BLOCK(c)}
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
