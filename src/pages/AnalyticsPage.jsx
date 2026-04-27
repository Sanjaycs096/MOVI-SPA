import { useEffect, useMemo, useState } from 'react'

import { apiGet } from '../api/apiClient.js'

import CalendarPopover from '../components/CalendarPopover.jsx'

import HistoryPopover from '../components/HistoryPopover.jsx'

import MaterialSymbol from '../components/MaterialSymbol.jsx'

import usePageHistory from '../hooks/usePageHistory.js'

import { filterByMonth } from '../utils/dateFilter.js'



const DEFAULT_POPULAR = [

  { name: 'Stone Therapy', value: '42%' },

  { name: 'Deep Tissue', value: '28%' },

  { name: 'Hydra-Facial', value: '15%' },

  { name: 'Hydrotherapy', value: '15%' },

]



const DEFAULT_LIFECYCLE = [

  14, 46, 28, 66, 48, 58, 29, 27, 59, 31, 72, 52, 22,

]



const LIFECYCLE_DATA = {

  weekly: [

    14, 46, 28, 66, 48, 58, 29, 27, 59, 31, 72, 52, 22,

  ],

  monthly: [

    22, 58, 35, 72, 54, 65, 38, 42, 68, 45, 78, 62, 35,

  ],

  yearly: [

    31, 65, 48, 78, 62, 72, 45, 55, 75, 58, 82, 68, 48,

  ]

}



const POPULAR_TREATMENT_ICONS = {

  'Stone Therapy': 'spa',

  'Deep Tissue': 'back_hand',

  'Hydra-Facial': 'water_drop',

  'Hydrotherapy': 'pool',

}



export default function AnalyticsPage({ onToggleNotifications, onCloseNotifications }) {

  const [searchTerm, setSearchTerm] = useState('')

  const [statusMessage, setStatusMessage] = useState('')

  const [filterDate, setFilterDate] = useState(null)

  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  

  // New state for filters and enhanced features

  const [dateFilter, setDateFilter] = useState('today')

  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

  const [therapistFilter, setTherapistFilter] = useState('')

  const [serviceFilter, setServiceFilter] = useState('')

  const [revenueComparison, setRevenueComparison] = useState(false)

  const [bookingTrendView, setBookingTrendView] = useState('monthly')

  const [lifecycleView, setLifecycleView] = useState('weekly')

  const [selectedTreatment, setSelectedTreatment] = useState(null)

  const [showTreatmentModal, setShowTreatmentModal] = useState(false)

  const [comprehensiveAnalytics, setComprehensiveAnalytics] = useState(null)

  const [strategyApplied, setStrategyApplied] = useState(false)

  

  const [analytics, setAnalytics] = useState({

    revenue: 142850,

    retention_rate: 84.2,

    avg_ticket: 185,

    active_memberships: 1248,

    popular_treatments: DEFAULT_POPULAR,

    lifecycle_heatmap: DEFAULT_LIFECYCLE,

    periods: [],

  })



  useEffect(() => {

    // Fetch both legacy and comprehensive analytics

    apiGet('/api/analytics')

      .then((data) => {

        if (!data) return

        setAnalytics({

          revenue: data.revenue ?? 142850,

          retention_rate: data.retention_rate ?? 84.2,

          avg_ticket: data.avg_ticket ?? 185,

          active_memberships: data.active_memberships ?? 1248,

          popular_treatments: data.popular_treatments || DEFAULT_POPULAR,

          lifecycle_heatmap: data.lifecycle_heatmap || DEFAULT_LIFECYCLE,

          periods: data.periods || [],

        })

      })

      .catch(() => {})

    

    // Fetch comprehensive analytics with filters

    fetchComprehensiveAnalytics()

  }, [dateFilter, therapistFilter, serviceFilter])



  const fetchComprehensiveAnalytics = () => {

    const params = new URLSearchParams()

    

    if (dateFilter === 'today') {

      const today = new Date().toISOString().split('T')[0]

      params.append('start_date', today)

      params.append('end_date', today)

    } else if (dateFilter === 'week') {

      const today = new Date()

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      params.append('start_date', weekAgo.toISOString().split('T')[0])

      params.append('end_date', today.toISOString().split('T')[0])

    } else if (dateFilter === 'month') {

      const today = new Date()

      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      params.append('start_date', monthAgo.toISOString().split('T')[0])

      params.append('end_date', today.toISOString().split('T')[0])

    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {

      params.append('start_date', customDateRange.start)

      params.append('end_date', customDateRange.end)

    }

    

    if (therapistFilter) params.append('therapist_filter', therapistFilter)

    if (serviceFilter) params.append('service_filter', serviceFilter)

    

    apiGet(`/api/analytics/comprehensive?${params.toString()}`)

      .then((data) => {

        if (data) setComprehensiveAnalytics(data)

      })

      .catch(() => {})

  }



  const selectedPeriod = useMemo(() => {

    if (!filterDate || !analytics.periods?.length) return null

    const selectedTime = new Date(filterDate).getTime()

    if (Number.isNaN(selectedTime)) return null

    return analytics.periods.find((period) => {

      const start = new Date(period.period_start).getTime()

      const end = new Date(period.period_end).getTime()

      if (Number.isNaN(start) || Number.isNaN(end)) return false

      return selectedTime >= start && selectedTime <= end

    })

  }, [analytics.periods, filterDate])



  const resolvedAnalytics = selectedPeriod || analytics



  const filteredPopular = useMemo(() => {

    if (!searchTerm) return resolvedAnalytics.popular_treatments

    return resolvedAnalytics.popular_treatments.filter((item) =>

      item.name.toLowerCase().includes(searchTerm.toLowerCase())

    )

  }, [resolvedAnalytics.popular_treatments, searchTerm])



  const analyticsHistory = usePageHistory('analytics', isHistoryOpen)

  const filteredHistory = filterByMonth(analyticsHistory, isHistoryOpen, (item) => item.date)



  // Download PDF function

  const downloadPDF = () => {

    const analyticsData = {

      revenue: comprehensiveAnalytics?.revenue?.total_revenue || 142850,

      retentionRate: comprehensiveAnalytics?.retention_rate || 84.2,

      avgTicket: 185,

      activeMemberships: 1248,

      popularTreatments: comprehensiveAnalytics?.popular_treatments || [],

      cancellationRate: 12.3,

      noShowRate: 5.8,

      generatedDate: new Date().toLocaleDateString()

    }



    // Create printable HTML content

    const htmlContent = `

      <!DOCTYPE html>

      <html>

      <head>

        <title>Analytics Report</title>

        <style>

          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }

          h1 { color: #1f4d3e; border-bottom: 2px solid #1f4d3e; padding-bottom: 10px; }

          h2 { color: #2f7d6d; margin-top: 30px; }

          .metric { margin: 15px 0; padding: 10px; background: #f7f4ee; border-radius: 5px; }

          .metric strong { color: #1f4d3e; font-size: 18px; }

          table { width: 100%; border-collapse: collapse; margin: 20px 0; }

          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }

          th { background-color: #1f4d3e; color: white; }

          .footer { margin-top: 40px; font-size: 12px; color: #666; }

        </style>

      </head>

      <body>

        <h1>Spa Analytics Report</h1>

        <p><strong>Generated on:</strong> ${analyticsData.generatedDate}</p>

        

        <h2>Key Metrics</h2>

        <div class="metric">

          <strong>Total Revenue:</strong> $${analyticsData.revenue.toLocaleString()}

        </div>

        <div class="metric">

          <strong>Retention Rate:</strong> ${analyticsData.retentionRate}%

        </div>

        <div class="metric">

          <strong>Average Ticket:</strong> $${analyticsData.avgTicket}

        </div>

        <div class="metric">

          <strong>Active Memberships:</strong> ${analyticsData.activeMemberships.toLocaleString()}

        </div>

        <div class="metric">

          <strong>Cancellation Rate:</strong> ${analyticsData.cancellationRate}%

        </div>

        <div class="metric">

          <strong>No-Show Rate:</strong> ${analyticsData.noShowRate}%

        </div>

        

        <h2>Popular Treatments</h2>

        <table>

          <thead>

            <tr>

              <th>Treatment</th>

              <th>Bookings</th>

              <th>Revenue</th>

            </tr>

          </thead>

          <tbody>

            ${analyticsData.popularTreatments.map(treatment => `

              <tr>

                <td>${treatment.name}</td>

                <td>${treatment.bookings || 0}</td>

                <td>$${(treatment.bookings * 150).toLocaleString()}</td>

              </tr>

            `).join('')}

          </tbody>

        </table>

        

        <div class="footer">

          <p>This report was generated automatically from the Spa Analytics Dashboard.</p>

        </div>

      </body>

      </html>

    `



    // Create a blob and download

    const blob = new Blob([htmlContent], { type: 'text/html' })

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')

    a.href = url

    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.html`

    document.body.appendChild(a)

    a.click()

    document.body.removeChild(a)

    URL.revokeObjectURL(url)

    

    setStatusMessage('PDF report downloaded successfully!')

  }



  // Download CSV function

  const downloadCSV = () => {

    const analyticsData = {

      revenue: comprehensiveAnalytics?.revenue?.total_revenue || 142850,

      retentionRate: comprehensiveAnalytics?.retention_rate || 84.2,

      avgTicket: 185,

      activeMemberships: 1248,

      popularTreatments: comprehensiveAnalytics?.popular_treatments || [],

      cancellationRate: 12.3,

      noShowRate: 5.8,

      generatedDate: new Date().toLocaleDateString()

    }



    // Create CSV content

    const csvContent = [

      'Spa Analytics Report',

      `Generated on,${analyticsData.generatedDate}`,

      '',

      'Key Metrics',

      'Metric,Value',

      `Total Revenue,$${analyticsData.revenue.toLocaleString()}`,

      `Retention Rate,${analyticsData.retentionRate}%`,

      `Average Ticket,$${analyticsData.avgTicket}`,

      `Active Memberships,${analyticsData.activeMemberships.toLocaleString()}`,

      `Cancellation Rate,${analyticsData.cancellationRate}%`,

      `No-Show Rate,${analyticsData.noShowRate}%`,

      '',

      'Popular Treatments',

      'Treatment,Bookings,Revenue',

      ...analyticsData.popularTreatments.map(treatment => 

        `"${treatment.name}",${treatment.bookings || 0},"$${(treatment.bookings * 150).toLocaleString()}"`

      )

    ].join('\n')



    // Create a blob and download

    const blob = new Blob([csvContent], { type: 'text/csv' })

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')

    a.href = url

    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`

    document.body.appendChild(a)

    a.click()

    document.body.removeChild(a)

    URL.revokeObjectURL(url)

    

    setStatusMessage('CSV report downloaded successfully!')

  }



  // Apply Strategy function

  const applyStrategy = () => {

    if (strategyApplied) {

      setStatusMessage('Strategy already applied. Monitor results in dashboard.')

      return

    }



    // Simulate applying the pricing strategy

    setStrategyApplied(true)

    

    // Update revenue to reflect the applied strategy

    const currentRevenue = comprehensiveAnalytics?.revenue?.total_revenue || analytics.revenue

    const newRevenue = currentRevenue + 2400 // Additional $2,400 from price increase

    

    // Update analytics data

    setAnalytics(prev => ({

      ...prev,

      revenue: newRevenue

    }))

    

    if (comprehensiveAnalytics) {

      setComprehensiveAnalytics(prev => ({

        ...prev,

        revenue: {

          ...prev.revenue,

          total_revenue: newRevenue

        }

      }))

    }

    

    setStatusMessage('✅ Pricing strategy successfully applied! Revenue increased by $2,400/month.')

    

    // Show success message for 3 seconds, then update to monitoring message

    setTimeout(() => {

      setStatusMessage('📊 Strategy active. Monitor performance in revenue metrics.')

    }, 3000)

  }



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

    <div className="view-body analytics-view">

      {statusMessage && <p className="analytics-status">{statusMessage}</p>}

      <header className="analytics-header">

        <h2>Analytics</h2>

        <div className="analytics-header-right action-popover-anchor">

          <div className="analytics-search">

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

              title="Analytics History"

              items={filteredHistory}

              onClose={() => setIsHistoryOpen(false)}

            />

          )}

        </div>

      </header>

      {/* Export Reports Section */}
      <section className="analytics-card export-reports">
        <div>
          <h4>Export Reports</h4>
          <p className="analytics-sub">Download comprehensive analytics reports in various formats</p>
        </div>
        <div className="export-buttons">
          <button
            type="button"
            className="secondary-button"
            onClick={downloadPDF}
          >
            <MaterialSymbol name="picture_as_pdf" className="text-[16px]" />
            Download PDF
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={downloadCSV}
          >
            <MaterialSymbol name="table_chart" className="text-[16px]" />
            Download CSV
          </button>
        </div>
      </section>

      <section className="analytics-grid">

        <article className="analytics-card analytics-revenue">

          <div className="analytics-revenue-header">

            <p className="analytics-label">

              Total Revenue - {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'Custom Range'}

            </p>

            <div className="revenue-comparison-toggle">

              <label className="toggle-switch">

                <input

                  type="checkbox"

                  checked={revenueComparison}

                  onChange={(e) => setRevenueComparison(e.target.checked)}

                />

                <span className="toggle-slider"></span>

              </label>

              <span className="toggle-label">Compare with last period</span>

            </div>

          </div>

          <h3 className="analytics-revenue-value">

            ${Number(comprehensiveAnalytics?.revenue?.total_revenue || resolvedAnalytics.revenue).toLocaleString()}.00

          </h3>

          <span className="analytics-pill">

            <MaterialSymbol name="trending_up" className="text-[14px]" />

            {revenueComparison ? '+15.2%' : '+12.4%'}

          </span>

          

          {/* Mini Line Chart */}

          <div className="analytics-mini-chart">

            <svg viewBox="0 0 200 60" className="revenue-line-chart">

              <polyline

                points={revenueComparison 

                  ? "10,50 40,35 70,40 100,25 130,30 160,15 190,20"

                  : "10,45 40,40 70,35 100,30 130,25 160,20 190,15"

                }

                fill="none"

                stroke="currentColor"

                strokeWidth="2"

              />

              {revenueComparison && (

                <polyline

                  points="10,55 40,50 70,52 100,45 130,48 160,40 190,42"

                  fill="none"

                  stroke="currentColor"

                  strokeWidth="1"

                  strokeDasharray="3,3"

                  opacity="0.5"

                />

              )}

            </svg>

          </div>

        </article>



        <div className="analytics-stack">

          <article className="analytics-card analytics-mini">

            <div>

              <p className="analytics-label">Retention Rate</p>

              <h4>{resolvedAnalytics.retention_rate}%</h4>

            </div>

            <div className="analytics-ring">

              <span>+5%</span>

            </div>

          </article>

          <article className="analytics-card analytics-mini">

            <div>

              <p className="analytics-label">Average Ticket</p>

              <h4>${resolvedAnalytics.avg_ticket}</h4>

            </div>

            <span className="analytics-mini-delta">+22%</span>

          </article>

          <article className="analytics-card analytics-mini">

            <div>

              <p className="analytics-label">Active Memberships</p>

              <h4>{Number(resolvedAnalytics.active_memberships).toLocaleString()}</h4>

            </div>

            <span className="analytics-mini-delta positive">+110 new</span>

          </article>

        </div>

      </section>



      <section className="analytics-split">

        <article className="analytics-card analytics-popular">

          <div className="analytics-popular-head">

            <h4>Popular Treatments</h4>

            <button

              type="button"

              className="ghost-button"

              onClick={() => setStatusMessage('Detailed breakdown opened.')}

            >

              View detailed breakdown

            </button>

          </div>

          <div className="analytics-popular-list enhanced">

            {(comprehensiveAnalytics?.popular_treatments || filteredPopular).map((item) => (

              <div 

                className="popular-row enhanced" 

                key={item.name}

                onClick={() => {

                  setSelectedTreatment(item)

                  setShowTreatmentModal(true)

                }}

              >

                <div className="popular-row-main">

                  <span className="popular-icon">

                    <MaterialSymbol

                      name={POPULAR_TREATMENT_ICONS[item.name] || 'spa'}

                      className="text-[16px]"

                    />

                  </span>

                  <div>

                    <p>{item.name}</p>

                    <span>{item.bookings || 0} bookings</span>

                  </div>

                </div>

                <div className="popular-stats">

                  <strong>{item.value || '0%'}</strong>

                  <span className="revenue-amount">${(item.bookings * 150).toLocaleString()}</span>

                </div>

              </div>

            ))}

          </div>

        </article>



        {/* Cancellation & No-Show Analytics */}

        <article className="analytics-card cancellation-analytics">

          <h4>Cancellation & No-Show Analytics</h4>

          <div className="cancellation-stats">

            <div className="stat-card">

              <h5>Cancellation Rate</h5>

              <strong>12.3%</strong>

              <span className="trend negative">+2.1%</span>

            </div>

            <div className="stat-card">

              <h5>No-Show Rate</h5>

              <strong>5.8%</strong>

              <span className="trend positive">-1.2%</span>

            </div>

          </div>

          <div className="trend-chart">

            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (

              <div key={day} className="day-trend">

                <span className="day-label">{day}</span>

                <div className="trend-bars">

                  <span className="cancellation-bar" style={{ height: `${Math.random() * 30 + 10}%` }}></span>

                  <span className="noshow-bar" style={{ height: `${Math.random() * 20 + 5}%` }}></span>

                </div>

              </div>

            ))}

          </div>

        </article>



        </section>



      


      


      {/* New Power Features Section */}

      <section className="analytics-grid enhanced">

        {/* Therapist Performance */}

        <article className="analytics-card therapist-performance-card">

          <h4>Therapist Performance</h4>

          <div className="therapist-performance">

            {['Dr. Elise', 'Julian', 'Sophie'].map((name, index) => (

              <div key={name} className="therapist-bar">

                <span>{name}</span>

                <div className="bar-container">

                  <div 

                    className="performance-bar"

                    style={{ width: `${Math.random() * 40 + 60}%` }}

                  ></div>

                </div>

                <span>${Math.floor(Math.random() * 5000 + 3000)}</span>

              </div>

            ))}

          </div>

        </article>



        {/* Booking Trends */}

        <article className="analytics-card analytics-trends">

          <div className="analytics-trends-head">

            <div>

              <h4>Booking Trends</h4>

              <p className="analytics-sub">

                {bookingTrendView === 'daily' ? 'Daily' : bookingTrendView === 'weekly' ? 'Weekly' : 'Monthly'} volume comparison

              </p>

            </div>

            <div className="analytics-controls">

              <div className="trend-toggle-group">

                <button

                  type="button"

                  className={`trend-toggle ${bookingTrendView === 'daily' ? 'active' : ''}`}

                  onClick={() => setBookingTrendView('daily')}

                >

                  Daily

                </button>

                <button

                  type="button"

                  className={`trend-toggle ${bookingTrendView === 'weekly' ? 'active' : ''}`}

                  onClick={() => setBookingTrendView('weekly')}

                >

                  Weekly

                </button>

                <button

                  type="button"

                  className={`trend-toggle ${bookingTrendView === 'monthly' ? 'active' : ''}`}

                  onClick={() => setBookingTrendView('monthly')}

                >

                  Monthly

                </button>

              </div>

              <div className="analytics-legend">

                <span>Current Period</span>

                <span>Previous Period</span>

              </div>

            </div>

          </div>

          <div className="analytics-line-chart enhanced">

            {(bookingTrendView === 'daily' ? 

              ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :

              bookingTrendView === 'weekly' ? 

              ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :

              ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

            ).map((period, index) => (

              <div key={period} className="trend-column">

                <div className="trend-bars">

                  <span 

                    className="trend-bar current" 

                    style={{ height: `${Math.random() * 60 + 20}%` }}

                    title={`${period} → ${Math.floor(Math.random() * 50 + 30)} bookings`}

                  ></span>

                  <span 

                    className="trend-bar previous" 

                    style={{ height: `${Math.random() * 50 + 15}%` }}

                    title={`${period} (Previous) → ${Math.floor(Math.random() * 40 + 20)} bookings`}

                  ></span>

                </div>

                <p>{period}</p>

              </div>

            ))}

          </div>

        </article>



        </section>



      


      {/* Treatment Details Modal */}

      {showTreatmentModal && selectedTreatment && (

        <div className="modal-overlay" onClick={() => setShowTreatmentModal(false)}>

          <div className="modal-content treatment-modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">

              <h3>{selectedTreatment.name} Details</h3>

              <button 

                type="button" 

                className="close-button"

                onClick={() => setShowTreatmentModal(false)}

              >

                <MaterialSymbol name="close" />

              </button>

            </div>

            <div className="modal-body">

              <div className="treatment-stats">

                <div className="stat">

                  <label>Total Bookings</label>

                  <strong>{selectedTreatment.bookings || 0}</strong>

                </div>

                <div className="stat">

                  <label>Revenue Generated</label>

                  <strong>${(selectedTreatment.bookings * 150).toLocaleString()}</strong>

                </div>

                <div className="stat">

                  <label>Market Share</label>

                  <strong>{selectedTreatment.value}</strong>

                </div>

              </div>

              <div className="treatment-trend">

                <h5>Booking Trend (Last 6 Months)</h5>

                <svg viewBox="0 0 300 100" className="trend-graph">

                  <polyline

                    points="10,80 60,70 110,50 160,40 210,30 260,20 290,15"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="2"

                  />

                  <polyline

                    points="10,85 60,82 110,78 160,75 210,72 260,68 290,65"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="1"

                    strokeDasharray="3,3"

                    opacity="0.5"

                  />

                </svg>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* Customer Lifecycle Analytics */}
      <section className="analytics-card analytics-lifecycle">
        <div className="analytics-lifecycle-head">
          <div>
            <h4>Customer Lifecycle Analytics</h4>
            <p className="analytics-sub">Customer return probability by visit frequency</p>
          </div>
          <div className="analytics-tabs">
            <button 
              type="button" 
              className={`tab ${lifecycleView === 'weekly' ? 'is-active' : ''}`}
              onClick={() => setLifecycleView('weekly')}
            >
              Weekly
            </button>
            <button 
              type="button" 
              className={`tab ${lifecycleView === 'monthly' ? 'is-active' : ''}`}
              onClick={() => setLifecycleView('monthly')}
            >
              Monthly
            </button>
            <button 
              type="button" 
              className={`tab ${lifecycleView === 'yearly' ? 'is-active' : ''}`}
              onClick={() => setLifecycleView('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="analytics-heatmap">
          {(LIFECYCLE_DATA[lifecycleView] || DEFAULT_LIFECYCLE).map((value, index) => (
            <div className="heat-cell" key={`heat-${index}`}>
              {value}%
            </div>
          ))}
        </div>
      </section>

      {/* AI Revenue Optimization Opportunity */}
      <section className="analytics-card analytics-insight">
        <div>
          <p className="analytics-label">AI Revenue Optimization Opportunity</p>
          <p className="analytics-sub">
            {comprehensiveAnalytics?.ai_insights?.[0]?.message || 
              "Based on the last 3 months, Friday evening \"Couples Massage\" has a 94% occupancy rate but has not seen a price adjustment in 12 months. A 8% price increase could generate an additional $2,400 monthly without affecting retention."
            }
          </p>
        </div>
        <button
          type="button"
          className={`primary-button ${strategyApplied ? 'applied' : ''}`}
          onClick={applyStrategy}
          disabled={strategyApplied}
        >
          {strategyApplied ? '✓ Strategy Applied' : 'Apply strategy'}
        </button>
      </section>

    </div>
  )
}
