import { offerBasis } from './proofReview.ts'
import { createPlan, now, today } from './domain.ts'
export function demonstration() {
  const p = createPlan('Atölye kapasite yatırımı')
  p.id = 'ornek-atolye'
  p.example = true
  const end = new Date()
  end.setDate(end.getDate() + 90)
  p.answers = {
    '00': {
      buyer: 'İşletme',
      product: 'Fiziksel ürün',
      permit: 'Gerekmiyor',
      team: 'Ekip',
      funding: 'Kendi kaynağımız',
      market: 'Mevcut pazar',
      start: 'Yeni iş',
      mode: 'Ücretli satış',
      site: 'Evet',
      description:
        'Atölye, mobilya işletmelerine küçük seri ahşap parça üretiyor.',
    },
    '01': { goal: 'Teslim süresini kısaltmak.', owner: 'Atölye yöneticisi' },
    '02': {
      budget: 120000,
      spent: 18000,
      end: end.toISOString().slice(0, 10),
      attempts: 3,
      stop: 'Güvenli teslim sağlanamazsa durdur.',
      danger: 'Yok',
      stopHit: 'Hayır',
      clearance: 'Yetki var',
    },
    '03': {
      roles: [
        { Kişi: 'Atölye yöneticisi', Görev: 'Kaynağı onaylar', Yetki: 'Bütçe' },
      ],
      objection: 'Üretim sorumlusu',
    },
    '05': {
      event: 'Alıcı sevkiyat için iki gün bekledi.',
      group: 'Mobilya işletmeleri',
      workaround: 'Parçaları dışarıdan alıyorlar.',
    },
    '06': {
      interviews: [
        {
          'Kişi veya kod': 'İşletme A',
          Olay: 'Sevkiyat gecikti.',
          'Gözlenen davranış': 'Ek taşıma aldı.',
        },
      ],
    },
    '07': {
      repeat: 'Karşılandı',
      effort: 'Karşılandı',
      loss: 'Karşılandı',
      threshold: 'Haftada iki saat',
      source: 'Atölye gözlem defteri',
    },
    '08': { target: 'Yerel üreticiler', access: 'Atölye ziyaretleri' },
    '09': {
      demand: 70,
      capacity: 60,
      rivals: [
        { Seçenek: 'Dış üretim', Bedel: 'Ek taşıma', Dayanak: 'Teklif' },
      ],
    },
    '10': {
      claim: 'Alıcı kısa teslim için sipariş verir.',
      impact: '4',
      strength: '3',
      refute: 'Ön sipariş gelmemesi',
    },
    '11': {
      risk: 'Düşük',
      current: 'Dış üretim',
      options: [
        { Çözüm: 'Ortak tezgâh', Bedel: 'Günlük kira', Dayanak: 'Teklif' },
      ],
    },
    '12': {
      resources: [{ Kaynak: 'Tezgâh', Sahip: 'Usta', Kanıt: 'Kira teklifi' }],
      ready: 'Karşılandı',
    },
    '13': {
      offer: 'Parçayı üç günde teslim ediyoruz.',
      terms: 'Atölyede teslim',
    },
    '14': {
      billing: 'Karşılandı',
      authorization: 'Karşılandı',
      source: 'Örnek yetki kaydı',
    },
    '15': {
      offered: 12,
      committed: 5,
      paid: 5,
      threshold: 5,
      basis: 'Önceden belirlenen sipariş sınırı',
      signal: 'Yazılı ön sipariş',
    },
    '16': { balance: 72000, due: 48000, price: 4000, cost: 2500, fixed: 30000 },
  }
  const reasons = [
    'Araştırma bütçesi ayrıldı.',
    'Gecikme ve ek gider doğrulandı.',
    'Ortak tezgâh için kapasite bulundu.',
    'Beş işletme yazılı ön sipariş verdi.',
  ]
  p.history = reasons.map((reason, stage) => ({
    id: crypto.randomUUID(),
    stage,
    reason,
    at: now(),
    owner: 'Atölye yöneticisi',
    stale: false,
    outcome: 'İlerleyin',
  }))
  p.foundation = {
    version: 1,
    inputs: {
      expectedSignal: 'Yazılı taahhüt',
      trialStart: today(),
      trialPeriod: 'İş günü',
      trialPlace: 'Atölye',
    },
    decisions: [],
  }
  p.evidence = [
    ['05', 'Geciken sevkiyat', 'Atölye gözlem defteri'],
    ['12', 'Tezgâh kapasitesi', 'Günlük kira teklifi'],
    ['15', 'Beş ön sipariş', 'Örnek sipariş listesi'],
  ].map(([step, title, source]) => ({
    id: crypto.randomUUID(),
    step,
    ...(step === '15'
      ? {
          kind: 'Yazılı taahhüt' as const,
          criteria: ['Z6' as const],
          side: 'Müşteri' as const,
          participants: ['A', 'B', 'C', 'D', 'E'],
          stance: 'Destek' as const,
          observed: today(),
          customerGroup: 'Yerel üreticiler',
          period: 'İş günü',
          place: 'Atölye',
          review: {
            owner: 'Atölye yöneticisi',
            rule: 'Teklif koşulları değişirse yeniden kontrol et.',
            checked: today(),
            observation: today(),
            offer: offerBasis(p),
          },
        }
      : {}),
    title,
    source,
    at: now(),
  }))
  return p
}
