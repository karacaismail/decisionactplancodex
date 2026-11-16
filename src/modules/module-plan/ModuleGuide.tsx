import { useState } from 'react'
import { Button } from 'antd'
import Prompts from '@ant-design/x/es/prompts'
import { ArrowRight } from '@phosphor-icons/react'
import { catalog, type ModuleId } from './catalog'

const questions = [
  {
    key: 'gecis',
    label: 'Geçiş kararını kim kaydeder?',
    answer:
      'Erişim yetkiyi doğrular. Plan güncel kanıtı verir. Karar, 17. adımdaki izni kaydeder. Rapor aynı karara ait devir belgesini saklar.',
  },
  {
    key: 'kanit',
    label: 'Kanıtı kim saklar?',
    answer:
      'Plan kanıtı ve kaynak sürümünü saklar. Karar bu sürüme başvurur. Eski rapor karar günündeki dayanağı gösterir.',
  },
  {
    key: 'makbuz',
    label: 'Kesintide kayıt ne olur?',
    answer:
      'Mobil uygulama taslağı SQLite içinde tutacak. Bağlantı dönünce Eşitleme makbuzu kontrol edecek. Kanıtı Plan bir kez yazacak.',
  },
]

export default function ModuleGuide({
  reveal,
}: {
  reveal: (id: ModuleId) => void
}) {
  const [selected, setSelected] = useState('')
  const q = questions.find((item) => item.key === selected)
  const owner = q && catalog.ownerOf(q.key)
  return (
    <div className="module-guide">
      <div>
        <h3>Tek uygulama, ayrı iş alanları</h3>
        <p>
          Modüler monolit tek ürün olarak yayımlanır. DDD, modül sınırlarını
          işin anlamına göre çizer. Her kaydı sahibi değiştirir.
        </p>
        <p>
          Nesne yönelimli tasarım (OOP), bir nesnenin kendi kurallarını
          korumasını sağlar. Örneğin katalog her özelliği tek modüle bağlar.
        </p>
        <p>
          Ön yüzde MVVM kullanılır. Görünüm modeli, aramayı ve seçimi yönetir.
          Ant Design bileşenleri sonucu gösterir.
        </p>
        <p>
          Sunucu planında MVC denetleyicisi isteği iş akışına iletir. İş akışı
          modüllerin açık işlemlerini çağırır.
        </p>
      </div>
      <div className="module-guide-questions">
        <h3>Örnek iş akışları</h3>
        <p>
          Bir soru seçin. Ant Design X, ürün planında yazılı yanıtı gösterir.
        </p>
        <Prompts
          vertical
          items={questions.map(({ key, label }) => ({ key, label }))}
          onItemClick={({ data }) => setSelected(String(data.key))}
        />
        {q && owner && (
          <section
            role="region"
            aria-label="Rehber yanıtı"
            aria-live="polite"
            className="module-guide-answer"
          >
            <strong>{owner.title}</strong>
            <p>{q.answer}</p>
            <Button type="link" onClick={() => reveal(owner.id)}>
              {owner.title} modülünü göster <ArrowRight aria-hidden="true" />
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
