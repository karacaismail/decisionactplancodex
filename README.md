# Karar Atlası

Karar Atlası, bir iş fikrini veya devralınan işi değerlendirmenize yardım eder. Her kararda gözlemi, dayanağı ve sıradaki işi yazabilirsiniz. Örnek atölye planı ekranları tanıtır. Kendi işiniz için “Yeni plan” düğmesini kullanın.

## Yerelde açın

Node.js 24 ve npm gereklidir. Proje klasöründe şu komutları sırayla çalıştırın.

```sh
npm ci
npm run build
npm run preview -- --port 4177 --strictPort
```

Tarayıcıda [Karar Atlası’nı açın](http://127.0.0.1:4177/). Geliştirme sırasında `npm run dev` komutunu kullanabilirsiniz.

## Planı kullanın

1. Planınıza ad verin. İşi ve hizmetin ücret durumunu seçin.
2. Açılan adımlara yanıt verin. Gözlemin kaynağını “Kanıt defteri” bölümüne yazın.
3. “Kararı kaydet” bölümünde öneriyi inceleyin. Karar sahibini ve gerekçeyi yazın.
4. “Raporlar” bölümünde yönetici raporunu veya girişimci aksiyon planını açın.
5. “İki raporu sabitle” düğmesi o sürümün iki belgesini saklar.
6. Raporu Markdown olarak indirin veya yazdırın. Tüm planı “Dosya işlemleri” menüsünden JSON olarak indirin.

Tarayıcı her planı kendi yerel veritabanında saklar. Adres, port veya tarayıcı profili değişirse farklı bir kayıt alanı açılır. JSON dosyasını içe aktardığınızda yeni bir kopya oluşur. Başka bir sekme daha yeni kayıt oluşturmuşsa uygulama farkı bildirir. Yerel kopyanızı indirdikten sonra kayıtlı sürümü açabilirsiniz.

## Kapsam

Sekiz karar altında 35 adım vardır. İşinize uygun adımlar açılır. Kanıtlar, kaynak sınırları ve karar sahipleri aynı plana bağlanır. Karar Kitabı’nda 128 yöntem bulunur. “Göstergeler” bölümünde grafikler ve sayısal karşılıkları birlikte sunulur.

Kurucu ve onaylayan kişi adları planın içindeki kayıtlardır. Kullanıcı girişi ve kurumlar arası veri paylaşımı ayrı bir sunucu uygulaması gerektirir. Bu sürüm verileri yerel tarayıcıda işler.

[Claude ve Codex önerilerinden oluşturulan ortak plan](docs/ORTAK-PLAN.md)

## Arayüz ve denetim

React ve Ant Design form ve gezinme bileşenlerini sağlar. Phosphor simgeleri ve Outfit yazı tipi yerel paketlerden gelir. Apache ECharts yalnız gösterge ekranında yüklenir. İlk görünüm 320 piksel genişliğindeki telefon düzenidir. Geniş gezinme, görünüm alanı yeterli olduğunda yüklenir.

```sh
npm test
npm run build
npm run test:ui
```

Tarayıcı denemeleri kurulu Google Chrome’u ve Playwright WebKit’i kullanır. WebKit eksikse `npx playwright install webkit` komutunu çalıştırın. Denemeler ayrı bir tarayıcı profili açar.
