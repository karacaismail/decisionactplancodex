type Task = { name: string; work: string; steps: string[] }
interface Phase {
  id: number
  title: string
  question: string
  handoff: string
  missing: string
  tasks: Task[]
}
export const phases: Phase[] = [
  {
    id: 1,
    title: 'Strateji öncesi planlama',
    question: 'Karar sahibinin strateje devredebileceği bir soru var mı?',
    handoff: '17. adımda verilen izin ve strateje devir raporu.',
    missing: 'Kanıtın hangi işi ve hangi yetkiyi desteklediği bilinmez.',
    tasks: [
      {
        name: 'Dayanakları ve izni inceleme',
        work: 'Karar sahibi kanıtı, kaynak sınırını ve izin verdiği soruyu kaydeder.',
        steps: ['17'],
      },
    ],
  },
  {
    id: 2,
    title: 'Stratejiyi kurma ve seçme',
    question: 'Hangi yolu, neye dayanarak seçeceğiz?',
    handoff:
      'Seçilen yol, seçim gerekçesi, vazgeçilen iş ve kararı yeniden açacak bulgu.',
    missing: 'Ekip, aynı kaynak için yarışan işler arasında seçim yapamaz.',
    tasks: [
      {
        name: 'Karar sorusunu kesinleştirme',
        work: 'Stratej güçlüğü, kimin etkilendiğini ve beklenen sonucu belirler. Devir raporundaki sorudan başlar.',
        steps: ['18'],
      },
      {
        name: 'Aday yolları karşılaştırma',
        work: 'Stratej seçeneklerin hangi koşullarda işe yarayacağını karşılaştırır. Tek yol kaldıysa diğerlerinin elenme nedenini kaydeder.',
        steps: ['18'],
      },
      {
        name: 'Yolu ve vazgeçilen işi seçme',
        work: 'Karar sahibi yolu, gerekçeyi ve birlikte yapılacak işleri belirler. Seçimi değiştirecek bulguyu yazar.',
        steps: ['18'],
      },
    ],
  },
  {
    id: 3,
    title: 'Stratejik eylem planını hazırlama',
    question: 'Kim, hangi işi, hangi kaynakla yapacak?',
    handoff: 'İş sırası, kaynak yetkisi, teslim koşulu ve sonuç ölçüsü.',
    missing:
      'Seçimi uygulayacak kişi işi, kaynağı veya kabul koşulunu bilemez.',
    tasks: [
      {
        name: 'İşleri ve sorumluları belirleme',
        work: 'Ekip her teslimin sorumlusunu ve zamanını yazar. Tarih bilinmiyorsa işi başlatacak olayı belirtir.',
        steps: ['19', '21'],
      },
      {
        name: 'Kaynağı ve yetkiyi kesinleştirme',
        work: 'Karar sahibi para, zaman ve insan gücü sınırını belirler. Kaynağı kimin kullanacağını kaydeder.',
        steps: ['20'],
      },
      {
        name: 'Başarı ölçüsünü belirleme',
        work: 'Ekip beklenen faydayı, ölçüm kaynağını ve kontrol zamanını yazar. Başlangıç bilinmiyorsa ilk ölçümü planlar.',
        steps: ['22'],
      },
    ],
  },
  {
    id: 4,
    title: 'Uygulama ve gözlem',
    question: 'Gerçekte hangi iş yapıldı ve kime nasıl bir fayda sağladı?',
    handoff: 'Gerçek teslim, kullanılan kaynak ve dönemi belli sonuç kaydı.',
    missing: 'Planlanan teslim ile yaşanan sonucu ayıracak bir kayıt kalmaz.',
    tasks: [
      {
        name: 'İşi yürütme ve teslimi kaydetme',
        work: 'Sorumlu kişi teslimi veya engeli, kullandığı kaynağı ve dayanağını kaydeder.',
        steps: ['23'],
      },
      {
        name: 'Gerçek sonucu gözleme',
        work: 'Ekip etkilenen grubu, dönemi ve beklenmeyen etkileri yazar. Sonuç gecikirse yeni gözlem zamanını belirler.',
        steps: ['25'],
      },
    ],
  },
  {
    id: 5,
    title: 'Sonucu değerlendirme ve yeniden karar verme',
    question: 'Sonuç, işi veya seçtiğimiz yolu değiştirmemizi gerektiriyor mu?',
    handoff: 'Dayanağı, sorumlusu ve sonraki kontrolü belli bir karar.',
    missing: 'Değişen koşullar eski seçimi geçersiz kılsa bile iş sürebilir.',
    tasks: [
      {
        name: 'Beklenenle gerçekleşeni karşılaştırma',
        work: 'Stratej ve uygulayıcı farkı inceler. Teslim hatasını, dış koşulu ve yanlış varsayımı ayrı değerlendirir.',
        steps: ['26'],
      },
      {
        name: 'Sonraki kararı verme',
        work: 'Karar sahibi işi sürdürür, düzeltir, seçimi yeniden açar veya durdurur. Kanıt eksikse sonraki gözlemi belirler.',
        steps: ['33'],
      },
    ],
  },
]
export function phaseOf(id: string) {
  if (id <= '17') return phases[0]
  if (id === '18') return phases[1]
  if (id <= '22') return phases[2]
  if (id <= '25') return phases[3]
  if ((id >= '28' && id <= '32') || id === '34') return phases[3]
  return phases[4]
}
export const reviewDestinations = {
  Sürdür: '23',
  'Planı düzelt': '19',
  'Yolu yeniden seç': '18',
  'Hazırlığa dön': '17',
  'Kanıt bekle': '25',
  Durdur: '34',
  Tamamla: '34',
} as const
export type ReviewAction = keyof typeof reviewDestinations
export interface CycleReview {
  action: ReviewAction
  expected: string
  observed: string
  source: string
  reason: string
  owner: string
  assignee: string
  next: string
  missing: string
}
export interface SavedReview extends CycleReview {
  id: string
  at: string
  choice: string
  imported?: boolean
  grant: string
}
export function validReviewInput(v: unknown): v is CycleReview {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  if (
    typeof r.action !== 'string' ||
    !Object.hasOwn(reviewDestinations, r.action)
  )
    return false
  if (
    ![
      'expected',
      'observed',
      'source',
      'reason',
      'owner',
      'assignee',
      'next',
      'missing',
    ].every((k) => typeof r[k] === 'string')
  )
    return false
  const data = v as CycleReview
  if (![data.reason, data.owner, data.source].every((x) => x.trim()))
    return false
  if (data.action === 'Durdur') return true
  if (![data.assignee, data.next].every((x) => x.trim())) return false
  if (data.action === 'Hazırlığa dön') return true
  if (data.action === 'Kanıt bekle')
    return !!data.missing.trim() && !!data.expected.trim()
  return !!data.expected.trim() && !!data.observed.trim()
}
