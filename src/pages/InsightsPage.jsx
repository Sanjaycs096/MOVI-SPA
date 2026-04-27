import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api/apiClient.js'
import CalendarPopover from '../components/CalendarPopover.jsx'
import HistoryPopover from '../components/HistoryPopover.jsx'
import MaterialSymbol from '../components/MaterialSymbol.jsx'
import usePageHistory from '../hooks/usePageHistory.js'
import { filterByMonth } from '../utils/dateFilter.js'

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'AI Recommendations',
    description: 'Actionable insights tailored for each sanctuary zone.',
    value: '98.2% Accuracy',
  },
  {
    title: 'Guest Return Lift',
    description: 'Projected uplift from wellness sequencing.',
    value: '02 Months',
  },
]

const DEFAULT_FEED = [
  {
    id: 1,
    text: 'Sent a pricing forecast to the Executive team for Q2 wellness packages.',
    time: '2 min ago',
  },
  {
    id: 2,
    text: 'Identified late-cancellation risk in Saturday evening appointments.',
    time: '12 min ago',
  },
  {
    id: 3,
    text: 'Adjusted staffing prediction for the Rain Ritual campaign launch.',
    time: '45 min ago',
  },
]

export default function InsightsPage({ onToggleNotifications, onCloseNotifications }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [filterDate, setFilterDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [insights, setInsights] = useState({
    highlights: DEFAULT_HIGHLIGHTS,
    feed: DEFAULT_FEED,
  })

  useEffect(() => {
    apiGet('/api/insights')
      .then((data) => {
        setInsights({
          highlights: data?.highlights || DEFAULT_HIGHLIGHTS,
          feed: data?.feed || DEFAULT_FEED,
        })
      })
      .catch(() => {})
  }, [])

  const dateFilteredFeed = useMemo(
    () => filterByMonth(insights.feed, filterDate, (item) => item.date),
    [filterDate, insights.feed]
  )

  const filteredFeed = useMemo(() => {
    if (!searchTerm) return dateFilteredFeed
    return dateFilteredFeed.filter((item) =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [dateFilteredFeed, searchTerm])

  const insightsHistory = usePageHistory('insights', isHistoryOpen)
  const filteredHistory = filterByMonth(insightsHistory, filterDate, (item) => item.date)

  const shiftMonth = (delta) => {
    const nextMonth = calendarMonth + delta
    if (nextMonth < 0) {
      setCalendarMonth(11)
      setCalendarYear((prev) => prev - 1)
      return
    }
    if (nextMonth > 11) {
      setCalendarMonth(0)
      setCalendarYear((prev) => prev + 1)
      return
    }
    setCalendarMonth(nextMonth)
  }

  return (
    <div className="view-body insights-view">
      {statusMessage && <p className="insights-status">{statusMessage}</p>}
      <header className="insights-header">
        <h2>AI Insights</h2>
        <div className="insights-header-right action-popover-anchor">
          <div className="insights-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="icon-pill"
            aria-label="Calendar"
            onClick={() => {
              onCloseNotifications?.()
              setIsCalendarOpen((prev) => !prev)
              setIsHistoryOpen(false)
            }}
          >
            <MaterialSymbol name="calendar_month" className="text-[18px]" />
          </button>
          <button
            type="button"
            className="icon-pill"
            aria-label="Clock"
            onClick={() => {
              onCloseNotifications?.()
              setIsHistoryOpen((prev) => !prev)
              setIsCalendarOpen(false)
            }}
          >
            <MaterialSymbol name="schedule" className="text-[18px]" />
          </button>
          <button
            type="button"
            className="icon-pill"
            aria-label="Alerts"
            onClick={onToggleNotifications}
          >
            <MaterialSymbol name="notifications" className="text-[18px]" />
          </button>
          {isCalendarOpen && (
            <CalendarPopover
              selectedDate={filterDate}
              month={calendarMonth}
              year={calendarYear}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              onSelectDate={(date) => {
                setFilterDate(date)
                setIsCalendarOpen(false)
              }}
              onClear={() => {
                setFilterDate(null)
                setIsCalendarOpen(false)
              }}
              onClose={() => setIsCalendarOpen(false)}
            />
          )}
          {isHistoryOpen && (
            <HistoryPopover
              title="Insights History"
              items={filteredHistory}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </div>
      </header>

      <section className="insights-hero">
        <article className="insights-hero-card">
          <span className="insights-chip">Guest Experience Intelligence</span>
          <h3>Elevating guest experiences through predictive wellness.</h3>
          <p>
            Our AI surfaces behavior trends, occupancy shifts, and ritual affinity to craft
            personalized journeys and proactive staffing plans.
          </p>
          <div className="insights-highlight-row">
            {insights.highlights.map((item) => (
              <div key={item.title}>
                <p>{item.title}</p>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
        <aside className="insights-side-card">
          <div className="insights-side-top">
            <MaterialSymbol name="trending_up" className="text-[18px]" />
            <span>Priority</span>
          </div>
          <h4>Customer Retention</h4>
          <p>
            Retention confidence scored at 86% for the next 14 days with reduced churn risk.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setStatusMessage('Retention strategy opened.')}
          >
            Explore Strategy
          </button>
        </aside>
      </section>

      <section className="insights-grid">
        <article className="insights-card">
          <div className="insights-card-head">
            <h4>Peak Hours Insight</h4>
            <span>July</span>
          </div>
          <div className="insights-chart">
            {[30, 50, 72, 46, 36].map((height, index) => (
              <span
                key={`peak-${index}`}
                className={`insights-bar${index === 2 ? ' is-accent' : ''}`}
                style={{ height: `${height}%` }}
              ></span>
            ))}
          </div>
          <p className="insights-card-text">
            Peak appointments cluster between 6 PM - 8 PM, ideal for premium add-ons.
          </p>
        </article>

        <article className="insights-card">
          <h4>Top Influencers</h4>
          <div className="insights-list">
            {['Sasha Kim', 'Marcos Lee', 'Ava Holt'].map((name) => (
              <div className="insights-list-row" key={name}>
                <div className="insights-avatar"></div>
                <div>
                  <p>{name}</p>
                  <span>Wellness Advocate</span>
                </div>
                <strong>+8%</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="insights-card">
          <h4>Customer Trends</h4>
          <div className="insights-trend-list">
            {['Aromatherapy', 'Couples Massage', 'Facial Treatments'].map((item, index) => (
              <div className="insights-trend" key={item}>
                <span>{item}</span>
                <span>{[28, 22, 16][index]}%</span>
              </div>
            ))}
          </div>
          <div className="insights-callout">
            AI suggests bundling aromatherapy add-ons in evening slots.
          </div>
        </article>
      </section>

      <section className="insights-feed">
        <div className="insights-feed-head">
          <h4>Neural Activity Feed</h4>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setStatusMessage('Insight history loaded.')}
          >
            View history
          </button>
        </div>
        <div className="insights-feed-list">
          {filteredFeed.map((item) => (
            <div className="insights-feed-row" key={item.id}>
              <p>{item.text}</p>
              <span>{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      <button type="button" className="insights-fab" aria-label="New insight">
        <MaterialSymbol name="add" className="text-[20px]" />
      </button>
    </div>
  )
}
