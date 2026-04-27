import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api/apiClient.js'
import MaterialSymbol from '../components/MaterialSymbol.jsx'

const DEFAULT_SERVICES = [
  {
    id: 1,
    title: 'Ocean Drift Massage',
    desc:
      'A rhythmic movement ritual using warm sea-shell infusions to melt deep muscle tension.',
    meta: '60 min - $185',
    badge: 'Signature',
    tone: 'gold',
    category: 'Aromatherapy',
  },
  {
    id: 2,
    title: 'Golden Hour Facial',
    desc:
      'A transformative treatment utilizing micro-currents and Vitamin C to restore youthful luminosity.',
    meta: '75 min - $220',
    badge: 'Bestseller',
    tone: 'pearl',
    category: 'Signature',
  },
  {
    id: 3,
    title: 'Himalayan Salt Scrub',
    desc: 'Exfoliating ritual with mineral-rich salts to soften and renew.',
    meta: '45 min - $140',
    badge: 'New',
    tone: 'rose',
    category: 'Detox',
  },
]

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Treatments')
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    apiGet('/api/services')
      .then((data) => {
        if (!data) return
        const mapped = data.map((service) => ({
          id: service.id,
          title: service.title,
          desc: service.desc,
          meta: `${service.duration} min - $${service.price}`,
          badge: service.badge,
          tone: 'gold',
          category: service.category || 'Signature',
        }))
        setServices(mapped.length ? mapped : DEFAULT_SERVICES)
      })
      .catch(() => {})
  }, [])

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'All Treatments') return services
    return services.filter((service) => service.category === selectedCategory)
  }, [services, selectedCategory])

  return (
    <div className="view-body services-view">
      {statusMessage && <p className="services-status">{statusMessage}</p>}
      <div className="chip-row service-filters">
        {['All Treatments', 'Aromatherapy', 'Signature', 'Detox', 'Rapid Glow'].map((label) => (
          <button
            key={label}
            className={`chip${selectedCategory === label ? ' active' : ''}`}
            type="button"
            onClick={() => setSelectedCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="service-grid-large">
        {filteredServices.map((card) => (
          <article key={card.title} className={`service-tile ${card.tone || 'gold'}`}>
            <div className="service-image">
              <span className="service-badge">{card.badge}</span>
            </div>
            <div className="service-info">
              <h4>{card.title}</h4>
              <p className="muted">{card.desc}</p>
              <div className="service-footer">
                <span>{card.meta}</span>
                <button
                  type="button"
                  className="service-add"
                  onClick={() => setStatusMessage(`${card.title} added to cart.`)}
                >
                  +
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="promo-row">
        <div className="promo-card">
          <span className="promo-icon icon-crest icon-crest--muted">
            <MaterialSymbol name="auto_awesome" className="text-[18px]" />
          </span>
          <div>
            <p className="promo-label">New Ritual</p>
            <h4>Celestial Sound Bath</h4>
            <p className="muted">Available June 1st</p>
          </div>
          <button type="button" className="pill">Learn More</button>
        </div>
      </div>
    </div>
  )
}
