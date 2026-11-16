# Proje kararları

- React, TypeScript ve Ant Design kullanın. Sürümleri kilit dosyasından doğrulayın.
- İlk kabul genişliği 320 CSS piksel olmalıdır. Menü paketlerini koşula göre yükleyin.
- Outfit yazı tipini kullanın. Gövde en az 16 piksel olmalıdır. Diğer okunabilir metinler en az 14 piksel olmalıdır.
- Renk ve hareket değerlerini ortak tasarım kaynağından alın. İki yönde aynı hareket eğrisini kullanın.
- Klavye odağını çevrelemeyen tek işaretle gösterin. Zorunlu renk modunda sistem çizgisini kullanın.
- Gerekli izinleri, zarar sınırını ve önceki kararları koruyun. Örnek veriyi gerçek plandan ayırın.
- Gerçek plan dosyalarını depoya eklemeyin. GitHub Pages üzerinde kişisel alanı yayımlayın. Kurum hizmetini yerel sunucuda tutun.
- Değişikliği önce ilgili başarısız testle gösterin. Sonra `npm test`, `npm run build` ve `npm run test:ui` komutlarını çalıştırın.

- Kişisel planları tarayıcıda, kurum kayıtlarını yerel SQLite dosyasında saklayın.
- Her kurum isteğinde oturumu, üyeliği ve alanı sunucuda doğrulayın.
- İncelemeyi açan üye kendi isteğini onaylayamaz. Onay yalnız gönderilen sürümü kapsar.
- Tarayıcı denemeleri ayrı bir veritabanı kullanmalıdır.

- Ortak tema renklerini `src/ui/identity.ts` dosyasından alın. Ant Design ve grafikler aynı renkleri kullanır.
- Telefonda form, kaynak panelinden önce gelir. Klavye sırası ekrandaki sırayı izler.
- Görsel kabul için `tests/browser/design.spec.ts` dosyasını kullanın.
- Pano önce açık kararı ve ana düğmeyi gösterir. Adım göstergesi tamamlanan form adımlarını sayar. Grafikte seçim özeti yeniler. “Karara git” seçili dosyayı açar.
- Geniş ekranda adım dizini, form ve kaynaklar ayrı sütunlarda yer alır. Telefonda form tek sütunda ilerler.

- Hazırlık 17. adımda biter. Geçiş kararı kaydedilince strateji yazımı açılır. Geçiş için müşteri davranışının tarihli kaynağını arayın.
- Geçiş denemeleri için `npm test` ve `npm run test:ui -- tests/browser/readiness.spec.ts` komutlarını kullanın.

- 11. adım aday yolları karşılaştırır. 17. adım strateje devir raporunu üretir.
- Geçiş kararı, temel belgeyi ve devir raporunu karar anındaki biçimiyle saklar.
- Yeni yol önerisi 18. adımda tutulur. Seçimden sonra eski raporu değiştirmeyin.
- Devir kurallarını `node --test tests/dossier.test.mjs` ile denetleyin.

- Hazırlık yöntemlerini ilgili adımda kullanıcının isteğiyle açın. Yöntemler geçiş için isteğe bağlıdır.
- Devir raporu yöntem sonuçlarını karar anında saklar. Aynı yol ve koşul tek hesap kullanır.
- Yöntemleri `node --test tests/preparation-methods.test.mjs` ile sınayın. Tarayıcıda `npm run test:ui -- tests/browser/preparation-methods.spec.ts` çalıştırın.

- 17. adımda 9 zorunlu ve 6 destekleyici ölçüt kullanılır. Tam geçiş için en az 4 destek gerekir.
- Geri dönüş bedeli yüksekse 12. adım dört güç sorusunun yanıtını ister. Nadirlik iddiasına tarihli dayanak bağlayın. Bu yerel kontrol geçiş ölçütlerine eklenmez.
- Hazırlıkta aday yolun kaynağını 11. adımda kaydedin. 18. adımın sonucu yalnız strateji çalışmasına girer.
- İş türüne özel kayıtları profil seçimine göre açın. Yöntem yardımını kullanıcı açtığında yükleyin.
- Araştırma kurallarını `node --test tests/research.test.mjs` ile sınayın. Telefon akışını `npm run test:ui -- tests/browser/research.spec.ts` ile sınayın.

- Başarı koşulunda karşı kanıtı da gösterin. İddia, müşteri grubu ve dönem eşleşmelidir.
- İhtiyaç adayını tarihli talep ve güncel seçeneklerle doğrulayın. Dayanaksız güçleri ayrı gösterin.
- Harcama izni tavan belirtir. Aynı ödemeye bağlanan tutarı bir kez düşürün.
- Devir raporunu yetki ve ilk soruyla açın. Önceliği karar sahibi seçer.
- Aktarım kurallarını `node --test tests/transfer.test.mjs` ile sınayın. Telefon akışlarını `npm run test:ui -- tests/browser/transfer.spec.ts` ile sınayın.

- Talep kanıtını denemenin grubu, yeri, dönemi ve teklifiyle eşleştirin.
- Eski kanıtı defterde tutun. Geçişte güncel kaynak incelemesini arayın.
- Kritik varsayımı karara bağlayın. Yol seçiminden sonra iş sırasını açın.
- Ortak bağımlılıkları ve beklenmeyen gözlemleri strateje devir raporuna ekleyin.
- Bu kuralları `node --test tests/gaps.test.mjs` ile sınayın.
- Telefon akışlarını `npm run test:ui -- tests/browser/gaps.spec.ts` ile sınayın.

- Strateji yönetimi beş ana aşama kullanır. Sekiz karar dosyası bu aşamaları destekler.
- Koşullu geçişte 18. adım yalnız izin verilen soruyu kullanır.
- Seçim ve kaynak kararlarını ayrı kaydedin. Kopyada önceki izinleri kapatın.
- Gerçek sonucu gözlemden değerlendirmeye taşıyın. Sonuç gecikirse sonraki gözlemi kaydedin.
- Karar sahibi sonuç kararını değiştirmek isterse yeni kayıt ekler.
- Kapanışta açık sözleri kaydedin. Bu kayıt yeni harcama yetkisi vermez.
- Karar döngüsünü `node --test tests/lifecycle.test.mjs tests/team.test.mjs` komutuyla doğrulayın.
- Tarayıcıda `npm run test:ui -- tests/browser/lifecycle.spec.ts` çalıştırın.

## Yeni alanların etiketi

- Son sürümde değişen alanları form tanımındaki `releaseMark` ile işaretleyin.
- Listenin yalnız bir alanı değiştiyse o alanın anahtarını belirtin.
- “new” yazısı sabit kalır. Yalnız yeşil nokta hareket eder.
- Hareket durdurulduğunda veya cihazda azaltıldığında nokta sabit kalır.
- Yazdırılan raporda bu etiketler görünmez.
- `npm run test:ui -- tests/browser/new-fields.spec.ts` komutuyla işaretleri sınayın.

## Seçim ve hedef arasındaki bağ

- Yeni hedefi karar sahibinin kaydettiği seçime bağlayın.
- Seçim eskirse eski hedefi güncel hedef olarak göstermeyin.
- 17. adımdaki geçmiş rapora sonradan kurulan stratejiyi eklemeyin.
- Türkiye kamu idaresi alanlarını yalnız açık seçimle gösterin.
- 19. adımda ekip görüşünü kaynak onayından ayrı tutun.
- İş, ölçü ve risk bağlantılarını iki uygulama raporunda sınayın.
- `node --test tests/strategy-links.test.mjs` komutuyla veri kurallarını sınayın.
- `npm run test:ui -- tests/browser/strategy-links.spec.ts` komutuyla telefon akışını sınayın.

## Şirkete göre strateji inceleme takvimi

Her şirket kendi strateji inceleme takvimini belirler. Şirketin yetkilendirdiği kullanıcı iki süreyi ayrı seçer. İlki şirketin genel yönünü, ikincisi rekabet stratejisini inceleme aralığıdır. İki süre aynı da olabilir.

- Şirketin kendi sürelerini girmesine ve sonradan değiştirmesine izin verin. Örneğin beş yıl ve iki yıl seçilebilir. Seçenekleri örneklerle sınırlamayın.
- Sektör bilgisi öneriye dayanak olabilir. Öneriyi ancak şirket seçerse kaydedin. Şirket süre seçmediyse takvimi boş bırakın.
- Takvimi şirket düzeyinde saklayın. Sunucuda şirketi ve kullanıcının değişiklik yetkisini doğrulayın.
- Tarih geldiğinde inceleme zamanını gösterin. Karar sahibi stratejiyi koruyabilir, değiştirebilir veya bırakabilir. Önemli bir değişiklikte karar sahibi incelemeyi erkene alabilir.

**Geliştirme kabulü.** Aynı sektörden iki şirkete farklı süreler vererek sınayın. Bir şirketin takvimi değişince diğerininki korunmalı. Boş takvim, eşit süreler ve yetkisiz değişiklik isteği de sınanmalı. İnceleme tarihinin gelmesi kendiliğinden yeni strateji oluşturmamalı.


## Karar Kitabı çalışmalarını sınama

İlk altı yöntem 07, 18, 19, 22, 23 ve 26. adımlarda açılır. Kartı okumak planı değiştirmez. Hazırlık kararı 17. adımda verilir. Karar günündeki devir raporu saklanır. Yöntem sonucunu ilgili seçime bağlayın. Kaynağı eksik gözleme başka gözlemin dayanağını eklemeyin.

İzin ve rapor kurallarını `node --test tests/phase-methods.test.mjs` ile sınayın. Tarayıcı denemesini `npm run test:ui -- tests/browser/phase-methods.spec.ts` ile çalıştırın.

## SaaS modül planı

- Ürün kapsamını `src/modules/module-plan/catalog.ts` içinde tanımlayın. Her özellik tek modüle ait olmalıdır.
- Katalog ve mimari rehber kuruma ait veri okumaz. Rehber sorularını mevcut özellik kimliğine bağlayın.
- Kataloğu `node --test tests/module-plan.test.mjs` ile sınayın.
- Tarayıcı için önce `npm run build` çalıştırın. Ardından `npm run test:ui -- tests/browser/module-plan.spec.ts` çalıştırın.
