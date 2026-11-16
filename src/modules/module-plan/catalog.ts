// The plan describes ownership of the target product. It contains no tenant records.
export type ModuleId =
  'plan' | 'karar' | 'rapor' | 'erisim' | 'denetim' | 'esitleme'
export type Scope = 'tumu' | 'temel' | 'kosullu'
export const groups = [
  'Strateji çalışması',
  'Kurum yönetimi',
  'Cihaz ve veri',
] as const
type Group = (typeof groups)[number]
type FeatureState = 'Ön yüzde var' | 'Planlandı' | 'Koşullu ek'
interface Feature {
  id: string
  title: string
  detail: string
  state: FeatureState
}
export interface ModulePlan {
  id: ModuleId
  title: string
  group: Group
  purpose: string
  records: readonly string[]
  features: readonly Feature[]
  contracts: readonly { other: ModuleId; use: string }[]
}
const existing = (id: string, title: string, detail: string): Feature => ({
  id,
  title,
  detail,
  state: 'Ön yüzde var',
})
const planned = (id: string, title: string, detail: string): Feature => ({
  id,
  title,
  detail,
  state: 'Planlandı',
})
const optional = (id: string, title: string, detail: string): Feature => ({
  id,
  title,
  detail,
  state: 'Koşullu ek',
})

const modules: readonly ModulePlan[] = [
  {
    id: 'plan',
    title: 'Plan',
    group: 'Strateji çalışması',
    purpose: 'Ekibin öğrendiklerini, hedeflerini ve yaptığı işleri saklar.',
    records: [
      'Plan',
      'Adım Kaydı',
      'Kanıt',
      'Kanıt Sürümü',
      'Kanıt Bağı',
      'Görev',
      'Hedef',
      'Gözlem',
    ],
    features: [
      existing(
        'dosya',
        'Plan dosyaları ve adımlar',
        'Ekip dosyayı açar, iş profiline uygun soruları yanıtlar.',
      ),
      existing(
        'kanit',
        'Kanıt defteri',
        'Ekip gözlemi, kaynağını ve desteklediği iddiayı birlikte kaydeder.',
      ),
      existing(
        'yontem',
        'Karar Kitabı ve yöntem sonuçları',
        'Altı yöntem beş fazda açılır. Sonuç ilgili adımda saklanır.',
      ),
      existing(
        'hedefler',
        'Hedefler, görevler ve gözlemler',
        'Ekip hedefi işe, işi sorumluya ve teslim kaydına bağlar.',
      ),
      planned(
        'takvim',
        'Şirketin inceleme takvimi',
        'Şirket genel yönünü ve rekabet stratejisini hangi aralıklarla inceleyeceğini ayrı seçer.',
      ),
    ],
    contracts: [
      {
        other: 'karar',
        use: 'Karar için aday yolları ve kullanılan kanıtın sürümünü sağlar.',
      },
      {
        other: 'rapor',
        use: 'Belgeler için hedefleri, gerçekleşen işleri ve dayanakları sağlar.',
      },
    ],
  },
  {
    id: 'karar',
    title: 'Karar',
    group: 'Strateji çalışması',
    purpose: 'Karar sahibinin seçimini, gerekçesini ve verdiği izni saklar.',
    records: [
      'Kapı Kararı',
      'Geçiş Kararı',
      'Stratejik Seçim',
      'Kaynak İzni',
      'Kaynak Hareketi',
      'Sonuç Kararı',
      'Sınır Değişikliği',
      'Karar Dayanağı',
    ],
    features: [
      existing(
        'gecis',
        'Geçiş kararı',
        'Karar sahibi 17. adımda dayanakları inceler. Planlamaya geçiş kapsamını kaydeder.',
      ),
      existing(
        'secim',
        'Stratejik seçim',
        'Karar sahibi 18. adımda yolu, vazgeçtiği seçeneği ve gerekçesini kaydeder.',
      ),
      existing(
        'kaynak',
        'Kaynak izni ve sınırlar',
        'Karar sahibi kaynağın kullanım amacını, sınırını ve süresini belirler.',
      ),
      existing(
        'sonuc',
        'Sonuç kararı',
        'Karar sahibi beklentiyle gözlemi karşılaştırır. Sürdürme, değiştirme veya durdurma kararını verir.',
      ),
      optional(
        'muhasebe',
        'Muhasebe bağlantısı',
        'Kurum ödemeyi muhasebedeki kaydıyla doğrulamak isterse bu bağlantı eklenir.',
      ),
    ],
    contracts: [
      {
        other: 'erisim',
        use: 'İş akışı kararı veren kişinin yetkisini doğrulatır.',
      },
      {
        other: 'plan',
        use: 'İş akışı değerlendirilen kanıtın sürümünü getirir.',
      },
      {
        other: 'rapor',
        use: 'Geçiş kararı ve dayanakları, karar gününün raporuna girer.',
      },
    ],
  },
  {
    id: 'rapor',
    title: 'Rapor',
    group: 'Strateji çalışması',
    purpose: 'Kararlardan belge üretir. Teslim edilen sürümü korur.',
    records: ['Rapor Sürümü', 'Sürüm İncelemesi'],
    features: [
      existing(
        'devir',
        'Strateje devir ve temel belgesi',
        'Stratej 17. adımın kararını, dayanaklarını ve açık sorularını devralır.',
      ),
      existing(
        'yonetici',
        'Yönetici raporu ve girişimci aksiyon planı',
        'Yönetici sonuçları görür. Girişimci sonraki işleri ve sorumluları izler.',
      ),
      existing(
        'inceleme',
        'Sürüm incelemesi',
        'İnceleyen kişi sabit rapor sürümünü ve o sürüme verilen yanıtı görür.',
      ),
      existing(
        'ozet',
        'Portföy özeti ve göstergeler',
        'Yönetici birden çok dosyanın kararlarını, açık işlerini ve ölçülerini birlikte okur.',
      ),
      optional(
        'buyuk-rapor',
        'Büyük raporların hazırlanması',
        'Belge hazırlanırken ekran bekliyorsa rapor ayrı bir iş olarak hazırlanır.',
      ),
      optional(
        'bildirim',
        'Dış bildirim',
        'Kurum dış kanaldan inceleme bildirimi isterse rapor teslimi için bildirim eklenir.',
      ),
    ],
    contracts: [
      {
        other: 'plan',
        use: 'Görevler, ölçüler ve saha bulguları yalnız okunur.',
      },
      {
        other: 'karar',
        use: 'Belge, kullanılan karar ve kaynak sürümüne bağlanır.',
      },
    ],
  },
  {
    id: 'erisim',
    title: 'Erişim',
    group: 'Kurum yönetimi',
    purpose:
      'Kimin hangi kurumda ve hangi dosyada işlem yapabileceğini belirler.',
    records: ['Plan Üyeliği', 'Cihaz'],
    features: [
      existing(
        'uyelik',
        'Üyelik, davet ve dosya rolleri',
        'Kurum yöneticisi üyeyi davet eder. Planın karar sahibini atar.',
      ),
      planned(
        'kurum',
        'Kurum ayrımı',
        'Her şirket kendi Frappe sitesi ve veritabanıyla çalışır.',
      ),
      planned(
        'cihaz',
        'Cihaz yetkisi',
        'Kurum, cihazın erişimini iptal edebilir. Yeni gönderimde yetki yeniden denetlenir.',
      ),
    ],
    contracts: [
      {
        other: 'karar',
        use: 'Kararı kimin verebileceği dosyadaki görevden okunur.',
      },
      {
        other: 'esitleme',
        use: 'Her gönderimde kurum, dosya, kullanıcı ve cihaz yetkisi birlikte denetlenir.',
      },
    ],
  },
  {
    id: 'denetim',
    title: 'Denetim',
    group: 'Kurum yönetimi',
    purpose: 'Bir işlemi kimin, ne zaman ve hangi sonuçla yaptığını gösterir.',
    records: ['Denetim Olayı'],
    features: [
      existing(
        'gecmis',
        'Kurum işlem geçmişi',
        'Yetkili kişi kurum alanında önceki işlemleri inceler.',
      ),
      planned(
        'iz',
        'Kayıt sürümünün işlem izi',
        'Her kesinleşen işlem kullanılan sürüm ve sonuçla eşleşir.',
      ),
    ],
    contracts: [
      {
        other: 'karar',
        use: 'Karar kaydedilince iş akışı işlemi ve sürümü bildirir.',
      },
      {
        other: 'erisim',
        use: 'Geçmişi okuyan kişinin kurum ve dosya yetkisi denetlenir.',
      },
    ],
  },
  {
    id: 'esitleme',
    title: 'Eşitleme',
    group: 'Cihaz ve veri',
    purpose:
      'Kesintide bekleyen işi korur. Bağlantı dönünce kaydı bir kez iletir.',
    records: [
      'İşlem Makbuzu',
      'Akış Başlığı',
      'Değişiklik Satırı',
      'Yükleme Oturumu',
    ],
    features: [
      planned(
        'mobil-kayit',
        'Mobilde kesinti kaydı',
        'Capacitor uygulaması telefonda SQLite kullanır. Tarayıcıdaki PWA bekleyen işleri IndexedDB içinde tutar.',
      ),
      planned(
        'makbuz',
        'Tekrar gönderim ve makbuz',
        'Sunucu aynı işlemi tekrar alınca ilk makbuzu döndürür.',
      ),
      planned(
        'degisiklik',
        'Değişiklik sırası ve eksik ekler',
        'Cihaz son aldığı sıradan devam eder. Yarım kalan dosyanın eksik parçalarını gönderir.',
      ),
      optional(
        'ek-depo',
        'Büyük ek deposu',
        'Kanıt dosyaları cihazın sınırını aşarsa ek bir dosya deposu kullanılır.',
      ),
      optional(
        'saklama',
        'Kuruma özel saklama ayarı',
        'Çevrimdışı süre veya saklama koşulları değişirse kuruma ayrı ayar açılır.',
      ),
    ],
    contracts: [
      {
        other: 'erisim',
        use: 'Gönderim sırasında güncel üyelik ve cihaz yetkisi aranır.',
      },
      {
        other: 'plan',
        use: 'Eşitleme kanıtı taşır. Kanıtı yalnız Plan modülü yazar.',
      },
    ],
  },
]

function fold(s: string) {
  return s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replaceAll('ı', 'i')
}

export class ModuleCatalog {
  readonly modules: readonly ModulePlan[]
  private owners = new Map<string, ModulePlan>()
  constructor(entries: readonly ModulePlan[]) {
    this.modules = entries
    for (const entry of entries)
      for (const feature of entry.features) {
        if (this.owners.has(feature.id))
          throw Error('Özelliğin iki sahibi var: ' + feature.id)
        this.owners.set(feature.id, entry)
      }
  }
  ownerOf(feature: string) {
    return this.owners.get(feature)
  }
  search(query: string, scope: Scope) {
    const needle = fold(query.trim())
    return this.modules.flatMap((m) => {
      const moduleMatches = [m.title, m.group, m.purpose, ...m.records].some(
        (s) => fold(s).includes(needle),
      )
      const features = m.features.filter(
        (f) =>
          (scope === 'tumu' ||
            (scope === 'kosullu') === (f.state === 'Koşullu ek')) &&
          (moduleMatches || fold(f.title + ' ' + f.detail).includes(needle)),
      )
      return features.length ? [{ ...m, features }] : []
    })
  }
}
export const catalog = new ModuleCatalog(modules)
