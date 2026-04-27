import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api/apiClient.js'
import MaterialSymbol from '../components/MaterialSymbol.jsx'

const DEFAULT_METRICS = [
    {
      label: 'Total Clients',
      value: '1,284',
      delta: '+12% vs LY',
      icon: 'groups',
    },
    {
      label: 'Today Appointments',
      value: '42',
      delta: 'Active Today',
      icon: 'event_available',
    },
    {
      label: 'Active Therapists',
      value: '18 / 24',
      delta: 'On-shift',
      icon: 'medical_services',
    },
    {
      label: 'Room Usage',
      value: '85%',
      delta: '',
      icon: 'meeting_room',
    },
]

const DEFAULT_TRENDS = [32, 48, 44, 62, 38, 82, 54, 40, 52, 66]

const DEFAULT_REVENUE = {
  services: 24850,
  retail: 8240,
  total: 33090,
}

const METRIC_ICON_BY_LABEL = {
  'Total Clients': 'groups',
  'Today Appointments': 'event_available',
  'Active Therapists': 'medical_services',
  'Room Usage': 'meeting_room',
}

const normalizeMetrics = (metrics) =>
  (metrics || []).map((metric) => ({
    ...metric,
    icon: metric.icon || METRIC_ICON_BY_LABEL[metric.label] || 'insights',
  }))

export default function DashboardPage({ filterDate }) {
  const [dashboardData, setDashboardData] = useState({
    metrics: DEFAULT_METRICS,
    appointment_trends: DEFAULT_TRENDS,
    revenue: DEFAULT_REVENUE,
    periods: [],
  })
  const [trendView, setTrendView] = useState('month')

  useEffect(() => {
    apiGet('/api/dashboard')
      .then((data) => {
        if (!data) return
        setDashboardData({
          metrics: normalizeMetrics(data.metrics || DEFAULT_METRICS),
          appointment_trends: data.appointment_trends || DEFAULT_TRENDS,
          revenue: data.revenue || DEFAULT_REVENUE,
          periods: (data.periods || []).map((period) => ({
            ...period,
            metrics: normalizeMetrics(period.metrics || DEFAULT_METRICS),
          })),
        })
      })
      .catch(() => {
        setDashboardData({
          metrics: normalizeMetrics(DEFAULT_METRICS),
          appointment_trends: DEFAULT_TRENDS,
          revenue: DEFAULT_REVENUE,
          periods: [],
        })
      })
  }, [])

  const selectedPeriod = useMemo(() => {
    if (!filterDate || !dashboardData.periods?.length) return null
    const selectedTime = new Date(filterDate).getTime()
    if (Number.isNaN(selectedTime)) return null
    return dashboardData.periods.find((period) => {
      const start = new Date(period.period_start).getTime()
      const end = new Date(period.period_end).getTime()
      if (Number.isNaN(start) || Number.isNaN(end)) return false
      return selectedTime >= start && selectedTime <= end
    })
  }, [dashboardData.periods, filterDate])

  const metricCards = selectedPeriod?.metrics || dashboardData.metrics || DEFAULT_METRICS
  const appointmentTrends =
    selectedPeriod?.appointment_trends || dashboardData.appointment_trends || DEFAULT_TRENDS
  const revenue = selectedPeriod?.revenue || dashboardData.revenue || DEFAULT_REVENUE

  const quarterTrends = useMemo(() => {
    if (!appointmentTrends.length) return []
    if (appointmentTrends.length < 3) return appointmentTrends
    const length = appointmentTrends.length
    const cut1 = Math.ceil(length / 3)
    const cut2 = Math.ceil((length * 2) / 3)
    const buckets = [
      appointmentTrends.slice(0, cut1),
      appointmentTrends.slice(cut1, cut2),
      appointmentTrends.slice(cut2),
    ]
    return buckets.map((bucket) => {
      const total = bucket.reduce((sum, value) => sum + value, 0)
      return bucket.length ? Math.round(total / bucket.length) : 0
    })
  }, [appointmentTrends])

  const isQuarterView = trendView === 'quarter'
  const trendBars = isQuarterView ? quarterTrends : appointmentTrends
  const trendLabels = isQuarterView ? ['Month 1', 'Month 2', 'Month 3'] : ['WK 1', 'WK 2', 'WK 3', 'WK 4']
  const highlightIndex = trendBars.reduce(
    (bestIndex, value, index) => (value > trendBars[bestIndex] ? index : bestIndex),
    0
  )

  return (
    <div className="view-body dashboard-view">
      <section className="dashboard-metrics">
        {metricCards.map((card) => (
          <article className="metric-card" key={card.label}>
            <div className="metric-card-top">
              <span className="metric-icon-pill">
                <MaterialSymbol name={card.icon} className="text-[18px]" />
              </span>
              {card.delta && <span className="metric-delta">{card.delta}</span>}
            </div>
            <div className="metric-card-body">
              <p className="metric-value">{card.value}</p>
              <p className="metric-label">{card.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <div className="panel-card panel-chart">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <MaterialSymbol name="timeline" className="text-[18px]" />
                <h3>Appointment Trends</h3>
              </div>
              <p className="muted">
                {isQuarterView
                  ? 'Session volume over the last 90 days'
                  : 'Session volume over the last 30 days'}
              </p>
            </div>
            <div className="panel-tabs">
              <button
                type="button"
                className={`panel-tab${trendView === 'month' ? ' is-active' : ''}`}
                onClick={() => setTrendView('month')}
              >
                <MaterialSymbol name="calendar_month" className="text-[14px]" />
                Month
              </button>
              <button
                type="button"
                className={`panel-tab${trendView === 'quarter' ? ' is-active' : ''}`}
                onClick={() => setTrendView('quarter')}
              >
                <MaterialSymbol name="date_range" className="text-[14px]" />
                Quarter
              </button>
            </div>
          </div>
          <div
            className="chart-bars"
            style={{ gridTemplateColumns: `repeat(${trendBars.length}, minmax(0, 1fr))` }}
          >
            {trendBars.map((height, index) => (
              <span
                key={`bar-${index}`}
                className={`chart-bar${index === highlightIndex ? ' is-highlight' : ''}`}
                style={{ height: `${height}%` }}
              ></span>
            ))}
          </div>
          <div className="chart-labels">
            {trendLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <aside className="panel-card panel-revenue">
          <div>
            <div className="panel-title">
              <MaterialSymbol name="payments" className="text-[18px]" />
              <h3>Monthly Revenue</h3>
            </div>
            <p className="muted">Service vs. Product Performance</p>
          </div>
          <div className="revenue-block">
            <div className="revenue-row">
              <span>Services</span>
              <strong>${`$${Number(revenue.services).toLocaleString()}`}</strong>
            </div>
            <div className="revenue-bar">
              <span style={{ width: '78%' }}></span>
            </div>
          </div>
          <div className="revenue-block">
            <div className="revenue-row">
              <span>Retail</span>
              <strong>${`$${Number(revenue.retail).toLocaleString()}`}</strong>
            </div>
            <div className="revenue-bar light">
              <span style={{ width: '36%' }}></span>
            </div>
          </div>
          <div className="revenue-total">
            <span>Total</span>
            <strong>${`$${Number(revenue.total).toLocaleString()}`}</strong>
          </div>
          <div className="revenue-watermark"></div>
        </aside>
      </section>
    </div>
  )
}
