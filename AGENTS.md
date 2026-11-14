# Proje kararları

- React, TypeScript ve Ant Design kullanın. Sürümleri kilit dosyasından doğrulayın.
- İlk kabul genişliği 320 CSS piksel olmalıdır. Menü paketlerini koşula göre yükleyin.
- Outfit yazı tipini kullanın. Gövde en az 16 piksel olmalıdır. Diğer okunabilir metinler en az 14 piksel olmalıdır.
- Renk ve hareket değerlerini ortak tasarım kaynağından alın. İki yönde aynı hareket eğrisini kullanın.
- Klavye odağını çevrelemeyen tek işaretle gösterin. Zorunlu renk modunda sistem çizgisini kullanın.
- Gerekli izinleri, zarar sınırını ve önceki kararları koruyun. Örnek veriyi gerçek plandan ayırın.
- Gerçek plan dosyalarını depoya eklemeyin. GitHub Pages yayını kurmayın.
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
