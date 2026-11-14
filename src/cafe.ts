import { demonstration } from './demo.ts'
import { createPlan, today, now, type Plan, type Evidence } from './domain.ts'
import { foundation, type Criterion } from './readiness.ts'

export function cafeExample(): Plan {
  const p = createPlan('Ayşe’nin mahalle kafesi')
  p.example = true
  const base = demonstration()
  p.answers = {
    '00': {
      ...base.answers['00'],
      buyer: 'Tüketici',
      product: 'Hizmet',
      team: 'Tek kurucu',
      description: 'Mahallede sabah kahvesi.',
    },
    '01': { owner: 'Ayşe', goal: 'Sabah işe gidenlere zaman kazandırmak.' },
    '02': {
      ...base.answers['02'],
      stop: 'Sabah satışları gideri karşılamazsa dur.',
    },
    '05': {
      group: 'Sabah işe gidenler',
      event: 'Sabah açık bir yer bulamayan yolcular uzun süre bekledi.',
      workaround: 'Evde kahve hazırlıyorlar.',
    },
    '06': {
      interviews: [
        {
          'Kişi veya kod': 'K1',
          Olay: 'Durakta bekleme',
          'Gözlenen davranış': 'Daha uzak bir dükkâna gitti.',
        },
      ],
    },
    '07': {
      ...base.answers['07'],
      source: 'Sabah görüşme defteri',
      threshold: '10 dakika',
    },
    '08': {
      target: 'Duraktan geçen yolcular',
      access: 'Durakta yüz yüze teklif',
    },
    '09': {
      demand: 45,
      capacity: 60,
      rivals: [
        { Seçenek: 'Market kahvesi', Bedel: '65 TL', Dayanak: 'Raf fiyatı' },
      ],
    },
    '10': {
      claim: 'Öğlen de sipariş gelir.',
      impact: '3',
      strength: '1',
      refute: 'Öğlen denemesinde talep gelmemesi',
    },
    '11': {
      current: 'Evde hazırlama',
      risk: 'Düşük',
      options: [
        {
          Çözüm: 'Sabah kahve arabası',
          Bedel: 'Günlük kira',
          Dayanak: 'Kiralama teklifi',
        },
      ],
    },
    '12': {
      resources: [
        { Kaynak: 'Kahve arabası', Sahip: 'Kiralayan', Kanıt: 'Yazılı teklif' },
      ],
      ready: 'Karşılandı',
    },
    '13': { offer: 'Sabah durakta sıcak kahve', terms: 'Duraktan alım' },
    '14': {
      billing: 'Karşılandı',
      authorization: 'Karşılandı',
      source: 'Deneme alanının yazılı izni',
    },
    '15': {
      offered: 14,
      committed: 7,
      paid: 0,
      threshold: 5,
      basis: 'Denemeden önce beş yazılı sipariş',
      signal: 'Yedi ayrı yazılı ön sipariş',
    },
    '16': { balance: 18000, due: 15000, price: 80, cost: 30, fixed: 2000 },
    '17': {
      risks: [
        {
          Risk: 'Alan izni sona erer',
          'Erken işaret': 'Yazılı bildirim',
          Önlem: 'Satışı durdur',
          Sorumlu: 'Ayşe',
        },
      ],
    },
  }
  p.foundation = {
    ...foundation(p),
    inputs: {
      lossMeasure: 'Ortalama 12 dakika',
      period: 'Gün',
      capacityPeriod: 'Gün',
      costPeriod: 'Gün',
      expectedSignal: 'Yazılı taahhüt',
      people: '100',
      reach: '90',
      conversion: '50',
      frequency: '1',
      target: '40',
      price: '80',
      offered: '14',
      accepted: '7',
      rejected: '4',
      silent: '3',
      advantage: 'Market erken açılıyor.',
      weakness: 'Taze kahve sunmuyor.',
      channelPeriod: 'Bir sabah',
      reached: '14',
      responded: '11',
      riskStop: 'Alan izni biterse satış durur.',
      assumption: 'Denenmedi',
    },
  }
  const proof = (
    step: string,
    ids: Criterion[],
    title: string,
    kind: Evidence['kind'] = 'Gözlem',
  ): Evidence => ({
    step,
    id: crypto.randomUUID(),
    criteria: ids,
    ...(ids.includes('Z6')
      ? {
          side: 'Müşteri' as const,
          participants: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'],
        }
      : {}),
    title,
    source: 'Örnek kayıt: ' + title,
    kind,
    observed: today(),
    at: now(),
    stance: 'Destek',
  })
  p.evidence = [
    proof('02', ['Z1'], 'Ayşe’nin bütçe ve süre kararı'),
    proof('07', ['Z2'], 'Sabah görüşme çizelgesi'),
    proof('08', ['Z3', 'D3'], 'Durakta erişim denemesi'),
    proof('09', ['Z4', 'D2'], 'Bir günlük sayım ve market fiyatı'),
    proof('11', ['Z5'], 'Kahve arabası kira teklifi'),
    proof(
      '15',
      ['Z6', 'D1'],
      '80 TL fiyatla yedi yazılı ön sipariş',
      'Yazılı taahhüt',
    ),
    proof('16', ['Z7'], 'Kira ve malzeme hesabı'),
    proof('17', ['Z8'], 'Alan riski incelemesi'),
    proof('14', ['Z9'], 'Deneme alanı izni'),
  ]
  return p
}
