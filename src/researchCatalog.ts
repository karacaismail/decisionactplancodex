import type { Method, Field } from './preparationMethods.ts'

export type ResearchId =
  | 'barrier'
  | 'factor'
  | 'fit'
  | 'experiment'
  | 'dissent'
  | 'strength'
  | 'cross'
  | 'budget'
  | 'capacity'
  | 'dependency'
  | 'group'
  | 'marketplace'
  | 'service'
  | 'inherited'
  | 'alternative'
export const yesNo = ['Evet', 'Hayır']
export const crossQuestions = [
  'Hangi gücümüzle hangi fırsatı kullanabiliriz?',
  'Hangi eksiği giderirsek fırsatı kullanabiliriz?',
  'Hangi gücümüz hangi tehlikeyi azaltır?',
  'Hangi eksik bizi hangi tehlikeye açık bırakır?',
]
export const choices: Record<string, string[]> = {
  valuable: yesNo,
  rare: yesNo,
  costly: yesNo,
  organized: yesNo,
  edge: yesNo,
  relation: ['Destekliyor', 'Çelişiyor', 'Bilinmiyor'],
  priority: ['Seçimi değiştirebilir', 'İzlenecek'],
  response: ['Kabul edildi', 'Ayrı görüş sürüyor', 'İnceleme bekliyor'],
  measureType: ['Sayı', 'Oran', 'Tutar', 'Gözlenen olay'],
  scope: ['Bütün aday yollar', 'Seçili yollar'],
  budgetScope: ['02. adımdaki bütçe', 'Ayrı bütçe'],
  origin: crossQuestions,
}
const name = (label: string): Field => ['name', label]
const period: Field = ['period', 'Ölçüm dönemi']
const route: Field = ['route', 'İlgili aday yol', 'route']
const day: Field = ['due', 'Sonraki inceleme günü', 'date']
const owner: Field = ['owner', 'İncelemeden sorumlu kişi']
const proof: Field = ['proof', 'Tarihli dayanak', 'proof']
const pair: Field[] = [
  ['support', 'Destekleyen kanıt', 'support'],
  ['counter', 'Karşı bulgu', 'counter'],
]
const claim: Field = ['claim', 'İlgili iddia', 'claim']
const test: Field = ['test', 'Kayıtlı deneme', 'test']
const cause: Field = ['cause', 'İlgili neden çalışması', 'cause']
const unknown: Field = ['question', 'Hangi bilgi kararı değiştirir?']
const reopen: Field = ['reopen', 'Hangi bulguda yolu yeniden incelersiniz?']
export const researchMethods: Method[] = [
  {
    id: 'barrier',
    title: 'Asıl engeli incele',
    book: 'Sorunun nedenini bulma',
    steps: ['07', '17'],
    hint: 'Girişimin ilerlemesini durduran engeli yazın. Başka bir açıklamayla karşılaştırın.',
    fields: [
      name('Girişimin önündeki asıl engel'),
      ['why', 'Bu engeli neden önce ele alabilirsiniz?'],
      route,
      cause,
      claim,
      ['alternative', 'Başka hangi neden aynı sonucu açıklayabilir?'],
      ['observation', 'Hangi gözlem iki nedeni ayırır?'],
      ...pair,
      unknown,
    ],
  },
  {
    id: 'factor',
    title: 'Başarı neye bağlı?',
    book: 'Kritik başarı koşulları',
    steps: ['10', '15', '17'],
    hint: 'Önce müşteride beklediğiniz sonucu yazın. Sonra bu sonucu nasıl gözleyeceğinizi seçin.',
    fields: [
      name('Başarı için gereken koşul'),
      ['group', 'Koşulun müşteri grubu'],
      ['scope', 'Koşul hangi yolları etkiler?', 'choice'],
      ['routeIds', 'Etkilenen aday yollar', 'routes'],
      claim,
      ['outcome', 'Müşteride beklenen sonuç'],
      ['activity', 'Ekibin yapacağı iş'],
      ['metric', 'Neyi ölçeceksiniz?'],
      ['measureType', 'Ölçünün türü', 'choice'],
      period,
      ['unit', 'Ölçü birimi'],
      ['currency', 'Para birimi'],
      ['baseline', 'Başlangıç değeri', 'amount'],
      ['hits', 'Gerçekleşen olay sayısı', 'count'],
      ['total', 'Toplam geçerli gözlem', 'count'],
      ['event', 'Hangi olay sonucu gösterecek?'],
      ['threshold', 'Denemede aranacak sınır veya olay'],
      ['why', 'Bu sınırı neden seçtiniz?'],
      ['setter', 'Sınırı kim belirledi?'],
      ['thresholdDay', 'Sınırın belirlendiği gün', 'date'],
      ['started', 'Denemenin başladığı gün', 'date'],
      test,
      ...pair,
      ['interpretation', 'Karar sahibinin yorumu'],
      owner,
      day,
    ],
  },
  {
    id: 'fit',
    title: 'Bu yol neden çalışabilir?',
    book: 'Faaliyetlerin uyumu',
    steps: ['11'],
    hint: 'Yolun iki işini veya kaynağını karşılaştırın. Birinin diğerini nasıl etkilediğini yazın.',
    fields: [
      route,
      name('Birinci iş veya kaynak'),
      ['second', 'İkinci iş veya kaynak'],
      ['relation', 'İki iş arasındaki bağ', 'choice'],
      ['why', 'Bu bağın nedeni ve bedeli'],
      proof,
      reopen,
      ['edge', 'Uzun süreli üstünlük bekliyor musunuz?', 'choice'],
      ['benefit', 'Müşteri hangi yararı görür?'],
      ['bar', 'Rakibin aynı yararı sunmasını ne güçleştirir?'],
      ['independent', 'Bağımsız dayanak', 'proof'],
    ],
  },
  {
    id: 'alternative',
    title: 'Yeni bir aday yol üret',
    book: 'Mavi Okyanus',
    steps: ['11'],
    hint: 'İki yol benziyorsa yapılacak işi değiştirin. Adayı hazır olduğunuzda seçeneklere ekleyin.',
    fields: [
      ['remove', 'Hangi işi kaldırabilirsiniz?'],
      ['reduce', 'Hangi işi azaltabilirsiniz?'],
      ['raise', 'Neyi güçlendirebilirsiniz?'],
      ['create', 'Hangi işi ekleyebilirsiniz?'],
      name('Yeni adayın adı'),
      ['cost', 'Aday yolun bedeli'],
      ['basis', 'Aday yolun dayanağı'],
    ],
  },
  {
    id: 'experiment',
    title: 'Seçimi değiştirecek denemeyi bağla',
    book: 'Denemeden öğrenme',
    steps: ['15', '17'],
    hint: 'Bir deneme seçin. Tersi çıkarsa hangi yolu yeniden inceleyeceğinizi yazın.',
    fields: [
      name('Denemenin açık sorusu'),
      ['priority', 'Karara etkisi', 'choice'],
      route,
      ['barrier', 'İlgili asıl engel', 'barrier'],
      ['factor', 'İlgili başarı koşulu', 'factor'],
      test,
      ['metric', 'Denemenin ölçüsü'],
      ['observedAt', 'Sonucun gözlendiği gün', 'date'],
      ...pair,
      ['contrary', 'Tersi çıkarsa ne yapacaksınız?'],
      owner,
      day,
    ],
  },
  {
    id: 'dissent',
    title: 'Farklı görüşü kaydet',
    book: 'Bağımsız görüş',
    steps: ['17'],
    hint: 'Görüş ayrılığının hangi iddiaya veya bulguya dayandığını belirtin.',
    fields: [
      claim,
      ['barrier', 'İlgili asıl engel', 'barrier'],
      proof,
      name('Farklı açıklama'),
      ['reviewer', 'Bu görüşü kim verdi?'],
      ['response', 'Karar sahibinin yanıtı', 'choice'],
      ['revision', 'Hangi iddia nasıl değişti?'],
    ],
  },
  {
    id: 'strength',
    title: 'Güçlü yönleri sına',
    book: 'VRIO Analizi',
    steps: ['12', '16'],
    hint: 'Bir gücü dört soruyla inceleyin. Rakipte bulunmadığını düşünüyorsanız tarihli dayanağını seçin.',
    fields: [
      name('Gücün adı'),
      ['valuable', 'Bu güç müşteriye yarar sağlıyor mu?', 'choice'],
      ['rare', 'Bu güç rakiplerin çoğunda eksik mi?', 'choice'],
      ['costly', 'Rakiplerin bu gücü kopyalaması zor mu?', 'choice'],
      ['organized', 'Ekibiniz bu gücü kullanabiliyor mu?', 'choice'],
      ['ends', 'Bu üstünlük hangi koşulda biter?'],
      proof,
    ],
  },
  {
    id: 'cross',
    title: 'Durum özetinden aday yolu açıklayın',
    book: 'SWOT ve TOWS',
    steps: ['11', '17'],
    hint: 'Bir çapraz soru seçin. Cevabı ilgili aday yola bağlayın.',
    fields: [
      route,
      ['origin', 'Aday yol hangi sorudan çıktı?', 'choice'],
      name('Sorunun cevabı'),
      proof,
    ],
  },
  {
    id: 'budget',
    title: 'Serbest bütçeyi hesapla',
    book: 'Kaynak taahhütleri',
    steps: ['02', '16'],
    hint: 'Her kapsam ve dönem için tek hesap açın. Yalnız henüz ödenmemiş borçları toplayın.',
    fields: [
      ['budgetScope', 'Hangi bütçe kullanılacak?', 'choice'],
      name('Bütçenin kapsamı'),
      ['currency', 'Para birimi'],
      period,
      ['approved', 'Onaylı toplam bütçe', 'amount'],
      ['spent', 'Gerçekleşen toplam harcama', 'amount'],
      ['unpaid', 'Ödenmemiş bağlayıcı tutarların toplamı', 'amount'],
      ['obligations', 'Toplama hangi ödemeler giriyor?'],
      ['due', 'Ödeme vadesi', 'date'],
      ['owner', 'Onay sahibi'],
      proof,
    ],
  },
  {
    id: 'capacity',
    title: 'Kapasiteyi sınırlayan kaynağı bul',
    book: 'Kaynağın başka kullanımı',
    steps: ['12', '16'],
    hint: 'Talep artarsa hangi kaynağın önce yetersiz kalacağını inceleyin.',
    fields: [
      ['resource', 'Gerekli kaynaklardan seçin', 'resource'],
      name('İlk aksayacak iş'),
      ['quantity', 'Kaynağın sınırı', 'amount'],
      ['unit', 'Kaynak birimi'],
      period,
      ['alternative', 'Bu kaynağı başka nerede kullanabilirsiniz?'],
      route,
      proof,
    ],
  },
  {
    id: 'dependency',
    title: 'Yolların ortak engelini incele',
    book: 'Ortak bağımlılık',
    steps: ['11', '12', '17'],
    hint: 'Aynı izin, kişi veya kaynağa bağlı yolları birlikte seçin.',
    fields: [
      name('Ortak izin, kişi veya kaynak'),
      ['routeIds', 'Bu kaynağa bağlı yollar', 'routes'],
      ['consequence', 'Kaynak çekilirse ne olur?'],
      ['unaffected', 'Bağımsız olduğu incelenen yollar', 'routes'],
      ['independent', 'Bağımsızlığı gösteren kayıt', 'proof'],
      proof,
      owner,
      day,
    ],
  },
  {
    id: 'group',
    title: 'Ortak kaynağı ve yetkiyi incele',
    book: 'Birden fazla iş birimi',
    steps: ['03', '12'],
    hint: 'Grubun sağladığı kaynakla müşterinin gördüğü yararı ayrı yazın.',
    fields: [
      name('Ortak kaynağın adı'),
      ['authority', 'Kararı hangi birim verir?'],
      ['terms', 'Kullanım koşulu'],
      ['parent', 'Grubun bu işe katkısı'],
      ['customer', 'İşin müşteriye katkısı'],
      ['internal', 'Grup içinden gelen talep'],
      ['external', 'Bağımsız müşterilerin talebi'],
      ['commonTerms', 'İki alım için aynı iş, miktar ve dönem'],
      ['internalCost', 'Grup içinden alım bedeli ve para birimi'],
      ['outsideCost', 'Bağımsız alım bedeli ve para birimi'],
      ['outsideProof', 'Bağımsız teklifin kaynağı', 'proof'],
      proof,
    ],
  },
  {
    id: 'marketplace',
    title: 'Alıcı ve satıcı davranışını incele',
    book: 'İki taraflı pazar',
    steps: ['08', '15'],
    hint: 'Aynı dönemde geçerli talepleri ve zamanında gelen uygun teklifleri sayın.',
    fields: [
      name('İncelenen pazar veya kategori'),
      period,
      ['total', 'Geçerli alıcı talebi', 'count'],
      ['sellers', 'Yanıt veren satıcı', 'count'],
      ['hours', 'Uygun teklif için süre sınırı (saat)', 'amount'],
      ['elapsed', 'Gözlenen teklif süresi (saat)', 'amount'],
      ['hits', 'Süresinde uygun teklif alan talep', 'count'],
      ['matches', 'Eşleşme sayısı', 'count'],
      ['completed', 'Tamamlanan işlem', 'count'],
      ['repeat', 'Tekrar kullanım sayısı', 'count'],
      ['contribution', 'İşlem başına kalan tutar ve birimi'],
      ['buyerProof', 'Alıcı tarafının dayanağı', 'proof'],
      ['sellerProof', 'Satıcı tarafının dayanağı', 'proof'],
    ],
  },
  {
    id: 'service',
    title: 'Hizmetin faydasını incele',
    book: 'Ücretsiz hizmet',
    steps: ['14', '15', '16'],
    hint: 'Hizmete katılanlarla fayda görenleri ayrı sayın. Bütçe dayanağını seçin.',
    fields: [
      name('Hizmetten kim yararlanıyor?'),
      ['payer', 'Bütçeyi kim karşılıyor?'],
      period,
      ['joined', 'Katılan kişi', 'count'],
      ['served', 'Fayda gören kişi', 'count'],
      ['impact', 'Gözlenen fayda'],
      ['cost', 'Dönemin hizmet gideri', 'amount'],
      ['currency', 'Para birimi'],
      proof,
      ['fundProof', 'Finansman taahhüdünün dayanağı', 'proof'],
    ],
  },
  {
    id: 'inherited',
    title: 'Eski kararı bugünkü işle karşılaştır',
    book: 'Devralınan iş',
    steps: ['02', '12', '17'],
    hint: 'Önceki kararı ve bugünkü gözlemi ayrı kaynaklarla inceleyin.',
    fields: [
      name('Önceki karar'),
      ['obligation', 'Devralınan yükümlülük'],
      ['actual', 'Gerçekte kullanılan kaynak'],
      ['oldProof', 'Önceki kararın dayanağı', 'proof'],
      ['changed', 'Hangi koşul değişti?'],
      ['hypothesis', 'Bugün neyi yeniden sınamalısınız?'],
      proof,
    ],
  },
]
