# SaaS panelinde modül planı

“Yönetim” menüsünden “Modül planı” ekranını açın. Telefonda aynı sayfa ana menüdedir. Ekranı boş çalışma alanında da açabilirsiniz. Katalog bütün kurumlar için ortak ürün planını gösterir.

## Hangi iş kime ait?

| Kategori | Modül | Modülün sorumluluğu | Planlanan kayıt türü |
|---|---|---|---|
| Strateji çalışması | Plan | Ekip aday yolları, kanıtları, yöntem sonuçlarını, hedefleri ve gözlemleri kaydeder. | 8 |
| Strateji çalışması | Karar | Karar sahibi geçişi, seçimi, kaynak iznini ve sonuç kararını kaydeder. | 8 |
| Strateji çalışması | Rapor | Stratej devir belgesini alır. Yönetici ve girişimci kendi raporlarını inceler. | 2 |
| Kurum yönetimi | Erişim | Kurum yöneticisi üyeliği, dosya görevini ve cihaz yetkisini yönetir. | 2 |
| Kurum yönetimi | Denetim | Yetkili kişi işlemi, zamanı ve işlemi yapanı izler. | 1 |
| Cihaz ve veri | Eşitleme | Cihaz kesintide kaydı korur. Sunucu aynı gönderimi bir kez işler. | 4 |

Kayıt türü, Frappe uygulamasında saklanması planlanan belge biçimidir. Altı modül için toplam 25 tür öngörülür. Her türün adı panelde kendi modülünün altında yer alır. Beş iş fazı, girişimcinin izlediği sırayı gösterir. Bir faz birkaç modülü kullanabilir.

“Ön yüzde var” etiketi bugünkü ekranda karşılığı olan özelliği gösterir. “Planlandı” etiketi geliştirme kapsamını gösterir. “Koşullu ek” etiketi kurumun ihtiyacına bağlı işi gösterir. Örneğin muhasebede ödeme doğrulaması Karar modülündedir. Eklerin cihaz sınırını aşması Eşitleme modülünü ilgilendirir.

## Bir karar modüller arasında nasıl ilerler?

1. Erişim, karar sahibinin dosyadaki yetkisini doğrular.
2. Plan, 17. adımın cevaplarını ve kanıt sürümlerini sağlar.
3. Karar, verilen geçiş iznini ve dayanaklarını kaydeder.
4. Rapor, o günün temel belgesini ve devir raporunu saklar.
5. Denetim, işlemi yapan kişiyi ve sonucu kaydeder.

Bunlar hedef mimarinin sorumluluklarıdır. İş akışı her modülün açık işlemini kullanır. Bir modül başka modülün kayıtlarına doğrudan yazamaz. Eşitleme, telefondan bekleyen işlemi yeniden iletir. Asıl kaydı yine ilgili iş modülü yazar.

## Ön yüz nasıl düzenlendi?

- **Modüler monolit.** Ürün tek uygulama olarak yayımlanır. İş alanları ayrı gelişir.
- **DDD.** Ekip modülleri işin diline göre ayırır. Örneğin kanıtın sahibi Plan, geçiş izninin sahibi Karar olur.
- **OOP.** Modül kataloğu bir nesnedir. Her özelliğin tek sahibi olması kuralını korur.
- **MVVM.** Görünüm modeli aramayı, kapsamı, kategoriyi ve açık modülü yönetir. Arayüz bu sonucu gösterir.
- **MVC.** Hedef sunucudaki denetleyici isteği alır. İş akışı yetkiyi denetletir ve işi sahibine yönlendirir.
- **Ant Design.** Arama, kategori seçimi ve kapsam düğmeleri ortak arayüz bileşenleridir.
- **Ant Design X.** Mimari rehber hazır sorular sunar. Yanıtlar ürün planından gelir. Seçilen yanıt ilgili modülü açar. [Prompts bileşeni](https://x.ant.design/components/prompts/)

Katalog kişisel plan, kanıt veya kullanıcı kaydı okumaz. Rehber bir model servisine istek göndermez. Bir kurumun abonelik hakları veya kurulu modülleri ayrıca doğrulanmalıdır. Paneldeki ürün kapsamı bu bilgileri vermez.

## Uygulamayı nasıl sınarız?

1. Modül planını bir girişim dosyası açmadan görüntüleyin.
2. Özelliği veya kayıt türünü arayarak sahibini bulun.
3. Bir kategori seçin ve koşullu ekleri süzün.
4. Rehberden geçiş kararını seçip Karar modülünü açın.
5. Klavyeyle ayrıntıları açın ve kapatın.

Kataloğun kaynağı `src/modules/module-plan/catalog.ts` dosyasıdır. Yeni özellikler kendi modülünde tanımlanır. Sahiplik testi `node --test tests/module-plan.test.mjs` komutuyla çalışır. Tarayıcı denemesinden önce `npm run build` komutunu çalıştırın. Ardından `npm run test:ui -- tests/browser/module-plan.spec.ts` komutunu kullanın.
