import { crossQuestions } from '../researchCatalog.ts'
export type Value = string | number | string[] | Record<string, string>[]
export type Answers = Record<string, Value>
export interface Field {
  key: string
  label: string
  kind: 'text' | 'long' | 'number' | 'date' | 'pick' | 'list'
  choices?: string[]
  columns?: string[]
  unit?: string
  branch?: 'paid' | 'free'
  optional?: boolean
  listChoices?: Record<string, string[]>
  min?: number
}
export interface Step {
  id: string
  stage: number
  title: string
  help: string
  fields: Field[]
}
const text = (key: string, label: string): Field => ({
  key,
  label,
  kind: 'text',
})
const long = (key: string, label: string): Field => ({
  key,
  label,
  kind: 'long',
})
const number = (key: string, label: string, unit?: string): Field => ({
  key,
  label,
  unit,
  kind: 'number',
  min: 0,
})
const date = (key: string, label: string): Field => ({
  key,
  label,
  kind: 'date',
})
const pick = (key: string, label: string, choices: string[]): Field => ({
  key,
  label,
  kind: 'pick',
  choices,
})
const list = (key: string, label: string, columns: string[]): Field => ({
  key,
  label,
  kind: 'list',
  columns,
})
const states = ['Bilinmiyor', 'Karşılandı', 'Karşılanmadı']
export const stages = [
  {
    name: 'Araştırma yetkisi',
    question: 'Bu işi araştırmaya değer mi?',
    summary: 'Amaç, kaynak ve karar sınırları',
  },
  {
    name: 'Gerçek sorun',
    question: 'Kim hangi sorunu yaşıyor?',
    summary: 'Son olay, görüşmeler ve kayıp',
  },
  {
    name: 'Erişim ve seçenekler',
    question: 'Bu kişilere nasıl ulaşabiliriz?',
    summary: 'Pazar, seçenekler ve kapasite',
  },
  {
    name: 'Talep ve taahhüt',
    question: 'Teklif için kim neyi üstleniyor?',
    summary: 'Teklif, yetki ve gerçek davranış',
  },
  {
    name: 'Strateji ve kaynak',
    question: 'Hangi işe kaynak ayıracağız?',
    summary: 'Nakit, risk ve 90 günlük yol',
  },
  {
    name: 'İlk teslim ve fayda',
    question: 'İlk teslim işe yarıyor mu?',
    summary: 'Gerçek teslim ve doğrudan fayda',
  },
  {
    name: 'Süreklilik',
    question: 'Tekrar teslimde sonuç korunuyor mu?',
    summary: 'Tekrar, maliyet ve kalite',
  },
  {
    name: 'İşin geleceği',
    question: 'Hangi yönde devam edeceğiz?',
    summary: 'Büyüme, sürdürme, devir veya kapanış',
  },
]
const make = (
  id: string,
  stage: number,
  title: string,
  help: string,
  fields: Field[],
): Step => ({ id, stage, title, help, fields })
export const steps: Step[] = [
  make(
    '00',
    0,
    'İşin tanımı',
    'Örneğin bir atölye, küçük işletmelere mobilya üretiyor.',
    [
      pick('buyer', 'Kim kullanacak?', [
        'Tüketici',
        'İşletme',
        'Kamu veya büyük kurum',
        'İki taraflı pazar',
      ]),
      pick('product', 'Ne sunuyorsunuz?', [
        'Dijital ürün',
        'Fiziksel ürün',
        'Hizmet',
        'Donanım',
      ]),
      pick('permit', 'İzin gerekiyor mu?', [
        'Gerekmiyor',
        'Gerekiyor',
        'Bilinmiyor',
      ]),
      pick('team', 'İşi kim yürütecek?', ['Tek kurucu', 'Ekip']),
      pick('funding', 'Kaynak nereden gelecek?', [
        'Kendi kaynağımız',
        'Dış kaynak',
      ]),
      pick('site', 'İş yeri gerekiyor mu?', ['Hayır', 'Evet']),
      pick('market', 'Pazar nasıl?', ['Mevcut pazar', 'Yeni pazar']),
      pick('start', 'Nereden başlıyorsunuz?', ['Yeni iş', 'Devralınan iş']),
      pick('mode', 'İşin ödeme biçimi', ['Ücretli satış', 'Ücretsiz hizmet']),
      {
        ...pick(
          'groupLink',
          'Birden fazla iş birimi ortak kaynak kullanıyor mu?',
          ['Evet', 'Hayır'],
        ),
        optional: true,
      },
      long('description', 'İşi kendi sözlerinizle anlatın'),
      text('fundingTerms', 'Dış kaynağın yazılı koşulu'),
    ],
  ),
  make('01', 0, 'Amaç ve gelecek', 'Başarıyı hangi sonuçla anlayacaksınız?', [
    long('goal', 'Beklenen sonuç'),
    text('owner', 'Karar sahibi'),
  ]),
  make(
    '02',
    0,
    'Kaynak sınırı',
    'Araştırmaya ayırabileceğiniz en yüksek kaynağı yazın.',
    [
      number('budget', 'Harcama sınırı', 'TL'),
      date('end', 'Bitiş tarihi'),
      number('attempts', 'Karar başına deneme hakkı', 'adet'),
      long('stop', 'Hangi koşulda duracaksınız?'),
      pick('danger', 'Ciddi zarar tehlikesi', ['Yok', 'Var']),
      pick('stopHit', 'Durma koşulu gerçekleşti mi?', ['Hayır', 'Evet']),
      pick('clearance', 'Sıradaki işin yetkisi', [
        'Yetki var',
        'Yetki bekleniyor',
      ]),
      {
        ...pick('contract', 'Henüz ödenmemiş bağlayıcı bir sözleşme var mı?', [
          'Evet',
          'Hayır',
        ]),
        optional: true,
      },
      number('spent', 'Bugüne kadarki harcama', 'TL'),
    ],
  ),
  make('03', 0, 'Karar hakları', 'Öneren ve onaylayan kişiyi ayırın.', [
    list('roles', 'Görev dağılımı', ['Kişi', 'Görev', 'Yetki']),
    text('objection', 'İtirazı kim inceleyecek?'),
  ]),
  make(
    '04',
    0,
    'Dış koşullar',
    'Bir izin veya pazar değişimi hangi işi etkiliyor?',
    [
      {
        ...list('external', 'Koşullar', ['Koşul', 'İşaret', 'Sorumlu']),
        listChoices: { Yön: ['Fırsat', 'Tehdit'] },
      },
      date('review', 'Kontrol tarihi'),
    ],
  ),
  make('05', 1, 'Son gerçek olay', 'En son ne oldu? Kişi ne kaybetti?', [
    long('event', 'Son olay'),
    text('group', 'Etkilenen grup'),
    text('workaround', 'Bugünkü çözüm'),
  ]),
  make(
    '06',
    1,
    'Müşteri görüşmeleri',
    'Bir kişiyi aynı toplamda yalnız bir kez sayın.',
    [
      list('interviews', 'Görüşme defteri', [
        'Kişi veya kod',
        'Olay',
        'Gözlenen davranış',
      ]),
    ],
  ),
  make(
    '07',
    1,
    'Sorunun büyüklüğü',
    'Tekrar, çaba ve kayıp için ayrı kanıt arayın.',
    [
      pick('repeat', 'Tekrar', states),
      pick('effort', 'Bugünkü çaba', states),
      pick('loss', 'Ölçülen kayıp', states),
      text('threshold', 'Önceden yazılan kayıp eşiği'),
      text('source', 'Kanıtın kaynağı'),
    ],
  ),
  make('08', 1, 'İlk müşteri grubu', 'Önce hangi gruba ulaşacaksınız?', [
    text('target', 'İlk grup'),
    text('access', 'Ulaşma yolu'),
    text('other', 'Diğer tarafın grubu ve erişim yolu'),
  ]),
  make(
    '09',
    2,
    'Pazar ve rakipler',
    'Aynı dönemde ulaşılabilecek talep ile kapasiteyi karşılaştırın.',
    [
      {
        ...text('marketGap', 'Hangi müşteri ihtiyacı karşılanmıyor?'),
        optional: true,
      },
      ...[
        text('gapGroup', 'İhtiyaç hangi müşteri grubuna ait?'),
        text('gapPeriod', 'İhtiyacı hangi dönemde incelediniz?'),
        text('gapBehavior', 'Talebi hangi müşteri davranışı gösteriyor?'),
        text('gapProof', 'Bu davranışın tarihli kanıtı'),
        pick('gapMatch', 'Kanıt hangi müşteriyi ve dönemi kapsıyor?', [
          'Aynı müşteri ve dönem',
          'Farklı veya belirsiz',
        ]),
        text('gapAlternative', 'Bugün bu ihtiyacı kim karşılıyor?'),
        pick('gapCoverage', 'Bugünkü seçenek ihtiyacı karşılıyor mu?', [
          'Karşılanmıyor',
          'Kısmen karşılanıyor',
          'Tam karşılanıyor',
          'Bilinmiyor',
        ]),
        {
          key: 'gapChecked',
          label: 'Seçenekleri incelediğiniz gün',
          kind: 'date' as const,
        },
      ].map((f) => ({ ...f, optional: true })),
      number('demand', 'Ulaşılabilir talep', 'adet'),
      number('capacity', 'Teslim kapasitesi', 'adet'),
      list('rivals', 'Bugünkü seçenekler', ['Seçenek', 'Bedel', 'Dayanak']),
    ],
  ),
  make(
    '10',
    2,
    'Varsayım haritası',
    'Yanlış çıkarsa kararı değiştirecek tahmini seçin.',
    [
      long('claim', 'Varsayım'),
      pick('impact', 'Etki', ['1', '2', '3', '4', '5']),
      pick('strength', 'Kanıt gücü', ['1', '2', '3', '4', '5']),
      text('refute', 'Hangi bulgu fikrinizi değiştirir?'),
    ],
  ),
  make(
    '11',
    2,
    'Çözüm seçenekleri',
    'Bugünkü yöntemle uygulanabilir seçenekleri karşılaştırın.',
    [
      pick('risk', 'Geri dönüş maliyeti', ['Düşük', 'Yüksek']),
      text('current', 'Bugünkü yöntem'),
      list('options', 'Seçenekler', ['Çözüm', 'Bedel', 'Dayanak']),
      text('review', 'Yüksek maliyette bağımsız görüş'),
      pick('exception', 'Tek seçeneği yetkili kişi onayladı mı?', [
        'Hayır',
        'Evet',
      ]),
    ],
  ),
  make('12', 2, 'Yapılabilirlik', 'Hangi beceri, araç veya ortak gerekiyor?', [
    list('resources', 'Gerekli kaynaklar', ['Kaynak', 'Sahip', 'Kanıt']),
    pick('ready', 'Kapasite doğrulandı mı?', states),
  ]),
  make(
    '13',
    3,
    'Değer önerisi',
    'Müşterinin elde edeceği sonucu tek cümlede yazın.',
    [long('offer', 'Teklif'), text('terms', 'Teslim koşulu')],
  ),
  make(
    '14',
    3,
    'Ödeme veya bütçe yetkisi',
    'Ücretli teklifte ödeme hazırlığını, ücretsiz hizmette bütçeyi doğrulayın.',
    [
      { ...pick('billing', 'Fatura düzeni', states), branch: 'paid' },
      { ...pick('budgetAuthority', 'Bütçe onayı', states), branch: 'free' },
      pick('authorization', 'Uygulama yetkisi', states),
      text('source', 'Yetkinin dayanağı'),
    ],
  ),
  make(
    '15',
    3,
    'Talep denemesi',
    'Teklif, taahhüt ve gerçek ödeme ayrı sayılır.',
    [
      number('offered', 'Ulaşılan kişi', 'kişi'),
      number('committed', 'Taahhüt veren', 'kişi'),
      number('threshold', 'Yazılı alt sınır', 'kişi'),
      number('otherCount', 'Diğer taraftaki taahhüt', 'kişi'),
      number('matches', 'Tamamlanan eşleşme', 'adet'),
      text('basis', 'Eşiğin dayanağı'),
      text('signal', 'Sayılan davranış'),
      { ...number('paid', 'Ödeme yapan kişi', 'kişi'), branch: 'paid' },
      { ...number('attended', 'Hizmete katılan kişi', 'kişi'), branch: 'free' },
    ],
  ),
  make(
    '16',
    4,
    'Para ve iş planı',
    'İlk ödeme gününde kasanın yetip yetmediğini görün.',
    [
      {
        ...text('fragile', 'Hangi sayı değişirse hesap bozulur?'),
        optional: true,
      },
      number('balance', 'Ödeme günü kasadaki para', 'TL'),
      number('due', 'O gün ödenecek tutar', 'TL'),
      { ...number('price', 'Siparişin net geliri', 'TL'), branch: 'paid' },
      { ...number('cost', 'Siparişin değişken gideri', 'TL'), branch: 'paid' },
      { ...number('fixed', 'Dönemin sabit gideri', 'TL'), branch: 'paid' },
      { ...number('fund', 'Hizmet bütçesi', 'TL'), branch: 'free' },
      { ...number('serviceCost', 'Hizmet gideri', 'TL'), branch: 'free' },
    ],
  ),
  make(
    '17',
    4,
    'Risk ve önlem',
    'Risk ortaya çıkarsa ilk işareti kim görecek?',
    [
      list('risks', 'Risk defteri', [
        'Risk',
        'Erken işaret',
        'Önlem',
        'Sorumlu',
      ]),
    ],
  ),
  make('18', 4, 'Seçilen strateji', 'Neden bu yolu seçtiğinizi yazın.', [
    long('choice', 'Seçilen yol'),
    ...crossQuestions.map((q, i) => ({
      ...long('cross' + (i + 1), q),
      optional: true,
    })),
    {
      ...pick(
        'chosenOrigin',
        'Önerilen yol hangi sorudan çıktı?',
        crossQuestions,
      ),
      optional: true,
    },
    list('newComparison', 'Yeni yolun karşılaştırması', [
      'Müşteri',
      'Erişim yolu',
      'Tercih nedeni',
      'Bedel ve süre',
      'Vazgeçilecek iş',
      'Dayanak',
    ]),
    long('rationale', 'Bu yolu neden öneriyorsunuz?'),
    long('excluded', 'Vazgeçilen seçenek'),
    long('reconsider', 'Hangi bulgu seçimi değiştirir?'),
  ]),
  make(
    '19',
    4,
    '90 günlük yol',
    'Hedefe ulaşmak için sorumlu ve teslim belirleyin.',
    [
      text('choiceBasis', 'İncelenen strateji'),
      list('goals', 'İş sırası', [
        'Görev',
        'Sorumlu',
        'Hedef tarih',
        'Kabul ölçüsü',
      ]),
    ],
  ),
  make(
    '20',
    4,
    'Karar dosyası',
    'Deneme bütçesini açmak için dayanakları bir araya getirin.',
    [
      text('authority', 'Yetkili kişi'),
      long('basis', 'Kararın dayanağı'),
      pick('ready', 'Kaynak ve risk sınırı', states),
    ],
  ),
  make(
    '21',
    5,
    'İlk teslimin kapsamı',
    'Küçük fakat baştan sona tamamlanan bir iş seçin.',
    [long('scope', 'İlk teslim'), text('accept', 'Kabul koşulu')],
  ),
  make(
    '22',
    5,
    'Ölçüm düzeni',
    'Üç işletme ölçüsü ile ayrı fayda ve zarar sınırını yazın.',
    [
      list('metrics', 'İşletme ölçüleri', [
        'Ölçü',
        'Birim',
        'Başlangıç',
        'Eşik',
      ]),
      text('benefit', 'Fayda eşiği'),
      text('harm', 'Zarar sınırı'),
    ],
  ),
  make('23', 5, 'Sınırlı ilk teslim', 'Yardımla biten işleri ayrı sayın.', [
    number('total', 'Başlayan', 'kişi'),
    number('completed', 'Yardımsız bitiren', 'kişi'),
    long('problem', 'Teslim gözlemi'),
  ]),
  make('24', 5, 'Erişim yolları', 'Aynı dönemdeki sonuçları karşılaştırın.', [
    list('channels', 'Kanal denemeleri', [
      'Kanal',
      'Gider',
      'Ulaşılan',
      'Tamamlanan',
    ]),
  ]),
  make(
    '25',
    5,
    'Teslim kararı',
    'Önceden yazılan ölçüleri gerçek sonuçla karşılaştırın.',
    [
      pick('operating', 'Üç işletme ölçüsü', states),
      pick('benefit', 'Doğrudan fayda', states),
      text('evidence', 'Teslim kanıtı'),
    ],
  ),
  make('26', 6, 'Öğrenme döngüsü', 'Beklenti ile sonucu yan yana yazın.', [
    long('expected', 'Beklenti'),
    long('observed', 'Gözlem'),
    long('next', 'Sonraki değişiklik'),
  ]),
  make('27', 6, 'Sorun ve çözüm uyumu', 'Eski yönteme göre ne değişti?', [
    long('baseline', 'Eski sonuç'),
    long('result', 'Yeni sonuç'),
    text('source', 'Karşılaştırma kaynağı'),
  ]),
  make(
    '28',
    6,
    'Tekrarlanan fayda',
    'Aynı grupları eşit kullanım süresinde karşılaştırın.',
    [
      list('periods', 'Gözlem dönemleri', [
        'Dönem',
        'Grup',
        'Tamamlanan',
        'Toplam',
      ]),
      pick('mature', 'Gözlem süresi tamam mı?', states),
      text('otherPeriod', 'Diğer tarafın dönem sonucu'),
    ],
  ),
  make(
    '29',
    6,
    'Birim gider ve fiyat',
    'Gider ve yeni müşteri sayısı aynı döneme ait olmalı.',
    [
      text('period', 'Hesap dönemi'),
      { ...number('spend', 'Kazanma gideri', 'TL'), branch: 'paid' },
      { ...number('newCustomers', 'Yeni müşteri', 'kişi'), branch: 'paid' },
      { ...number('contribution', 'Kişi başına katkı', 'TL'), branch: 'paid' },
      {
        ...number('serviceSpend', 'Hizmete ayrılan kaynak', 'TL'),
        branch: 'free',
      },
      { ...number('served', 'Hizmet alan kişi', 'kişi'), branch: 'free' },
      pick('sustainable', 'Kaynak dengesi', states),
      pick('growth', 'Büyüme denemesi gerekiyor mu?', ['Hayır', 'Evet']),
      pick('contract', 'Yeni sözleşme gerekiyor mu?', ['Hayır', 'Evet']),
      pick('defect', 'Kusur veya gecikme var mı?', ['Hayır', 'Evet']),
    ],
  ),
  make(
    '30',
    6,
    'Büyüme kanalları',
    'Küçük denemelerde farklı yolları karşılaştırın.',
    [list('tests', 'Büyüme denemeleri', ['Yol', 'Bütçe', 'Sonuç'])],
  ),
  make(
    '31',
    6,
    'İzin ve sözleşmeler',
    'Erken gerekli olan belgeyi ilgili işin önüne alın.',
    [list('documents', 'Gerekli belgeler', ['Belge', 'Yetkili', 'Geçerlilik'])],
  ),
  make('32', 6, 'Kalite ve düzeltme', 'Kaybın nerede doğduğunu inceleyin.', [
    list('defects', 'Kusur defteri', ['Kusur', 'Neden', 'Düzeltme', 'Sorumlu']),
  ]),
  make(
    '33',
    7,
    'İşin yönü',
    'Yeni yatırım ile mevcut ölçekte sürdürmeyi karşılaştırın.',
    [
      pick('direction', 'İşin geleceği', [
        'Büyüt',
        'Sürdür',
        'Devret',
        'Kapat',
      ]),
      long('reason', 'Seçimin nedeni'),
      text('reopen', 'Yeniden bakılacak olay'),
    ],
  ),
  make('34', 7, 'Devir ve kapanış', 'Açık taahhütleri tek tek teslim edin.', [
    list('obligations', 'Açık işler', ['Söz', 'Sorumlu', 'Teslim alan']),
    pick('accepted', 'Yazılı kabul', states),
  ]),
]
