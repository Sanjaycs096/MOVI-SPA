import { useEffect, useState } from 'react'
import { apiGet } from '../api/apiClient.js'

const DEFAULT_OFFERS = {
  hero: {
    title: 'Signature Packages',
    tag: 'Ending in 48h',
    description: 'Exclusive rituals crafted for seasonal renewal.',
  },
  cards: [
    {
      title: 'Sage Ritual',
      description: 'Full-body exfoliation with wild harvested sage and sea minerals.',
      price: 110,
      original_price: 145,
    },
  ],
  rewards: {
    points: 300,
    to_next: 200,
  },
}

export default function OffersPage() {
  const [offers, setOffers] = useState(DEFAULT_OFFERS)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    apiGet('/api/offers')
      .then((data) => setOffers(data || DEFAULT_OFFERS))
      .catch(() => setOffers(DEFAULT_OFFERS))
  }, [])

  return (
    <div className="view-body">
      {statusMessage && <p className="offers-status">{statusMessage}</p>}
      <div className="offers-grid">
        <article className="offer-hero">
          <span className="tag">{offers.hero.tag}</span>
          <div>
            <h3>{offers.hero.title}</h3>
            <p className="muted">{offers.hero.description}</p>
          </div>
          <div className="offer-media"></div>
          <div className="offer-banner">
            <p>Special gift for you</p>
            <button
              type="button"
              className="pill"
              onClick={() => setStatusMessage('Reward applied to your account.')}
            >
              Claim benefit
            </button>
          </div>
        </article>

        <aside className="offer-side">
          <div className="rewards-card">
            <p className="muted">My rewards</p>
            <h4>{offers.rewards.points}</h4>
            <span>{offers.rewards.to_next} points until your next complimentary session.</span>
          </div>
          {(offers.cards || []).map((card) => (
            <div className="offer-card" key={card.title}>
              <div className="offer-thumb"></div>
              <div>
                <h5>{card.title}</h5>
                <p className="muted">{card.description}</p>
                {card.price && (
                  <div className="price-row">
                    <strong>${card.price}</strong>
                    {card.original_price && <span>${card.original_price}</span>}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="pill"
                onClick={() => setStatusMessage(`${card.title} offer opened.`)}
              >
                &gt;
              </button>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
