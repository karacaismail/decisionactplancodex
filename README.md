# Karar Atlası

Karar Atlası, bir iş fikrini veya devralınan işi değerlendirmenize yardım eder. Her kararda gözlemi, dayanağı ve sıradaki işi yazabilirsiniz. Örnek atölye planı ekranları tanıtır. Kendi işiniz için “Yeni plan” düğmesini kullanın.

[Karar Atlası’nı GitHub Pages üzerinde açın](https://karacaismail.github.io/decisionactplancodex/).

Canlı sürüm kişisel planınızı tarayıcınızda saklar. Kurum alanını yerel sunucuda kullanabilirsiniz.
Yerel planınızın JSON kopyasını indirin. Bu dosyayı canlı sürüme yükleyin.

## Yerelde açın

Node.js 24 ve npm gereklidir. Proje klasöründe şu komutları sırayla çalıştırın.

```sh
npm ci
npm run build
npm start
```

Tarayıcıda [Karar Atlası’nı açın](http://127.0.0.1:4177/). Geliştirme sırasında `npm run dev` komutunu kullanabilirsiniz.

## Planı kullanın

1. Planınıza ad verin. İşi ve hizmetin ücret durumunu seçin.
2. Açılan adımlara yanıt verin. Gözlemin kaynağını “Kanıt defteri” bölümüne yazın.
3. Müşterinin attığı somut adımı kaynağıyla kaydedin. “Bağlı ölçütler” alanında “Müşteri davranışı” seçin.
4. Riskleri yazdıktan sonra 17. adımda “Geçişi incele” düğmesini seçin.
5. Karar sahibi öneriyi ve dayanakları inceler. Gerekçeyi yazıp geçiş kararını kaydeder.
6. Koşullu kararda karar sahibi izin verdiği konuyu seçer. “Yol seçimi ve gerekçesi” seçilirse ekip yolu ve gerekçesini kaydeder. Ardından karar sahibi eylem planı için ayrı izin verebilir.
7. “Raporlar” bölümünden “Strateje devir raporu” sekmesini açın. İlk soruyu ve kanıt bekleyen kararları inceleyin. Raporu indirin veya yazdırın.

Talep kaydında müşteri grubunu, yeri ve dönemi belirtin. Fiyat değişirse yeni teklif için ayrı kaynak ekleyin. Beklenmeyen olayları “Kanıt defteri” bölümünde “Bunu beklemiyorduk” düğmesiyle kaydedin. Ciddi zarar işareti varsa açık gözlem geçişi durdurur.

Ödeme genel bir geçiş şartı değildir. Örneğin yazılı ön sipariş müşteri davranışını gösterebilir.
Karşı kanıt gelirse karar sahibi dayanağı yeniden inceler. Önceki belge geçmişte saklanır.
“Kafe örneğini aç” düğmesiyle koşullu geçişi deneyebilirsiniz.

Kişisel alanda tarayıcı planları kendi veritabanında saklar. Adres, port veya tarayıcı profili değişirse farklı bir kayıt alanı açılır. JSON dosyasını içe aktardığınızda yeni bir kopya oluşur. Başka bir sekme daha yeni kayıt oluşturmuşsa uygulama farkı bildirir. Yerel kopyanızı indirdikten sonra kayıtlı sürümü açabilirsiniz.

## Kapsam

Sekiz karar altında 35 adım vardır. İşinize uygun adımlar açılır. Kanıtlar, kaynak sınırları ve karar sahipleri aynı plana bağlanır. Karar Kitabı’nda 128 yöntem bulunur. “Göstergeler” bölümünde grafikler ve sayısal karşılıkları birlikte sunulur.

## Strateji yönetimi

“Strateji yönetimi” ekranı beş ana aşamayı gösterir.

1. Karar sahibi, 17. adımda strateje hangi soruyu devrettiğini kaydeder.
2. Stratej yolları karşılaştırır. Karar sahibi gerekçesini ve vazgeçtiği işi kaydeder.
3. Ekip işleri, sorumluları, zamanı, kaynakları ve başarı ölçüsünü belirler.
4. Uygulayıcı teslimi ve kullanılan kaynağı yazar. Ekip gerçekleşen faydayı gözler.
5. Karar sahibi beklentiyi gözlemle karşılaştırır. Gerekirse işi veya seçilen yolu değiştirir.

Koşullu geçiş yalnız izin verilen soruyu açar. Sonuç henüz bilinmiyorsa ekip sonraki gözlemi planlar. İş biterse ekip açık sözleri 34. adımda kapatır. Kurum alanında karar sahibi etkin üyelerden seçilir. Yönetici raporu ve girişimci aksiyon planı sonuç kararını gösterir.

[Ana aşamaları açın](https://karacaismail.github.io/decisionactplancodex/#asamalar)

## Kurumda çalışma

1. “Kurum alanı” menüsünden “Kurum aç” seçeneğini açın.
2. Kurumun adını, kullanıcı adınızı ve parolanızı yazın.
3. Sonraki giriş için ekrandaki kurum kodunu saklayın.
4. Her üye için yetki seçip ayrı davet oluşturun.
5. Üye başka bir tarayıcı profilinde “Davetle katıl” seçeneğini kullanır.

Yönetici üye davet eder ve erişimi kaldırır. Düzenleyen kişi planı günceller. Okuyucu planları ve raporları görür. İnceleyen kişi gönderilen sürümü onaylar veya düzeltme ister. Bir kişi kendi inceleme isteğini onaylayamaz.

“Plan portföyü” iki planı karşılaştırır. “Görevler” ekranı kararları sorumlu kişiye bağlar. Görevi kapatırken kanıt yazılır. Önceki bir kararın görevi geçmişte kalır.

Kurum kayıtları bu Mac üzerinde SQLite veritabanında saklanır. Varsayılan dosya `~/Library/Application Support/Karar Atlasi/workspace.sqlite` konumundadır. `ATLAS_DATA_DIR` başka bir veri klasörü seçer. Sunucu yalnız bu bilgisayardan bağlantı kabul eder. Kişisel planı kuruma taşımak için JSON kopyasını içe aktarın.

### Sürüm incelemesi

1. Kurum planını seçin. Kaydın tamamlanmasını bekleyin.
2. “Kurum alanı” bölümünde seçili planı incelemeye gönderin.
3. Başka bir yetkili üye “Dosyayı aç” düğmesine basar.
4. Üye iki raporu okuyup gerekçesiyle sonucu kaydeder.

Bekleyen inceleme sırasında plan değişirse eski istek kapanır. Yeni sürüm ayrı incelemeye gönderilir. Kurum günlüğü kişiyi, işlemi ve ilgili sürümü gösterir. İş planındaki ilerleme kararı ayrıca alınır.

## Claude sürümünden alınan fikirler

Üç giriş yolu, görev takibi ve görünür kaynak sınırları uygulandı. Devir yolunda açık sözler ve kaynaklar incelenir. Kanıt türü seçimi görüş, ödeme ve gerçekleşen kullanımı ayırır. Ücretsiz hizmetlerde doğrudan kullanım da kanıt olarak kaydedilir.

[İncelenen Claude uygulaması](https://karacaismail.github.io/decisionactplanclaude/)

[Claude ve Codex önerilerinden oluşturulan ortak plan](docs/ORTAK-PLAN.md)

## Arayüz ve denetim

React ve Ant Design form ve gezinme bileşenlerini sağlar. Phosphor simgeleri ve Outfit yazı tipi yerel paketlerden gelir. Apache ECharts yalnız gösterge ekranında yüklenir. İlk görünüm 320 piksel genişliğindeki telefon düzenidir. Geniş gezinme, görünüm alanı yeterli olduğunda yüklenir.

```sh
npm test
npm run build
npm run test:ui
```

Tarayıcı denemeleri kurulu Google Chrome’u ve Playwright WebKit’i kullanır. WebKit eksikse `npx playwright install webkit` komutunu çalıştırın. Denemeler ayrı tarayıcı profilleri ve geçici bir kurum veritabanı kullanır. Test sunucusu 4187 numaralı portu kullanır.
