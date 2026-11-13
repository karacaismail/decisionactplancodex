# Karar Atlası için ortak uygulama planı

## Hangi kararlar birleşti?

| Konu | Claude önerisi | Codex önerisi | Uygulama kararı |
|---|---|---|---|
| Giriş | Yeni fikir, devir ve zarar yolları | Plan listesi, özet ve kaldığı yerden devam | Kullanıcı panodan plan açar. Yeni, devralınan ve örnek plan ayrıdır. Tehlike incelemede önceliklidir. |
| Bileşen | Alan, adım, panel, yöntem ve rapor aileleri | Her adım için koşul, veri ve sonuç | Ant Design denetimleri 35 adımı besler. Yöntem yardımı ve defter, açık adıma bağlıdır. |
| Telefon | Dar ekranda tek sütun | 320 pikselden başlayarak koşullu kaynak yükleme | Telefon ilk kabul alanıdır. Geniş gezinme yalnız yeterli genişlik ve kısa kenarda yüklenir. Yön değişince yanıtlar korunur. |
| Veri | İlk kullanımda cihazda JSON, sonraki aşamada ekip hizmeti | Sürüm, kaydetme durumu, çakışma ve yetki | Bu yerel uygulamada kayıt tarayıcıda tutulur. Kişi ve görüş alanları iş kaydıdır. Sunucu kimlik doğrulaması ayrı bir teslim gerektirir. |
| Kanıt | Günlük, görüşme ve deneme kartları | Tekrar, çaba ve kayıp için ayrı kayıt | Ödeme, kullanım ve gerçek fayda ayrı izlenir. Bilinmeyen sonuç sıfıra dönüşmez. |
| Karar | Sekiz aşama ve altı sonuç | İzin, zarar, kaynak ve ikinci görüş önceliği | Ciddi zarar işi durdurur. Yetki eksiği işi bekletir. Koşullu iznin kapsamı ve bitişi yazılır. |
| Rapor | Yönetici raporu ve girişimci aksiyon planı | Aynı veri sürümü, ayrı okur ve ayrı eylem | İki metin aynı plan kaydından türetilir. JSON, Markdown ve yerel yazdırma sunulur. |
| Görünüm | Açık ve koyu tema, Outfit, Phosphor, grafikler | Kırık beyaz yüzeyler, turuncu eylemler, kanıtın yanında gerçek veri | Başlıklarda Outfit, grafikte ECharts kullanılır. Sayfa düzeyi ve bileşen düzeyi aynı renk ve hareket değerlerini kullanır. |

## Kullanıcı yolu

1. Kullanıcı panoda bir plan seçer veya kendi planını açar.
2. İşini günlük sözcüklerle tarif eder. Ücret, izin, ekip ve teslim biçimi ilgili alanları açar.
3. Her karar önce kısa bir soru, sonra örnek ve doldurulabilir kayıt sunar.
4. Kullanıcı ölçüyü, dayanağını ve gerçek sonucu ayrı yazar. Önceki adımlara geri dönebilir.
5. Karar kaydıyla birlikte sorumlu, gerekçe ve sonraki iş yazılır.
6. Yönetici sonucu ve dayanağını okur. Girişimci üstleneceği işi, tarihi ve kabul şartını görür.

## Sekiz karar

| Karar | Adımlar | İncelenen konu |
|---|---|---|
| 1 | 00 ile 04 | Profil, amaç, yetki, kaynak ve dış koşul |
| 2 | 05 ile 08 | Son olay, görüşmeler, tekrar, çaba ve kayıp |
| 3 | 09 ile 12 | Erişim, varsayım, seçenek ve yapılabilirlik |
| 4 | 13 ile 15 | Teklif, ödeme veya bütçe yetkisi ve taahhüt |
| 5 | 16 ile 20 | Nakit, risk, seçilen yol ve 90 günlük çalışma |
| 6 | 21 ile 25 | İlk teslim, ölçüm, erişim ve doğrudan fayda |
| 7 | 26 ile 32 | Tekrar, katkı, fiyat ve kalite |
| 8 | 33 ile 34 | Büyütme, sürdürme, devir veya kapanış |

Ucuz ve geri alınabilir işte mevcut yöntemle bir alternatif karşılaştırılır. Ağır yatırımda üç çözüm aranır. Ücretli denemeden önce ödeme hazırlığı incelenir. Ücretsiz hizmette bütçe ve uygulama yetkisi ayrı tutulur. Dördüncü karar yatırımı onaylamaz. Harcama yetkisi beşinci kararda değerlendirilir.

## Kabul koşulları

- 320 piksel genişlikte sayfada yatay taşma olmamalıdır. Metin 14 pikselin altına düşmemelidir.
- Dokunma, fare ve klavye girişleri ayrı çalışmalıdır. Klavye odağı çevrelemeyen bir işaretle görünmelidir.
- Grafik, yöntem ve rapor kaynakları ilgili görünüm istendiğinde yüklenmelidir. Ağ denetimi gerçek üretim dosyalarını kontrol etmelidir.
- Kayıt başarısızsa kullanıcı açık hata görmelidir. Aynı kayıtta iki sekmenin düzenlemesi sessizce birbirini ezmemelidir.
- Bir karar sonucu, ilgili kanıt ve kalan kaynakla birlikte okunmalıdır. Örnek veri görünür biçimde ayrılmalıdır.
- Uygulama yalnız yerel ağ döngüsüne bağlanır. GitHub kaynak kodu ve planı barındırır.
