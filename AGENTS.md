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

- Başarı koşulunda aynı iddia, müşteri grubu ve dönemin karşı kanıtını da gösterin.
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
