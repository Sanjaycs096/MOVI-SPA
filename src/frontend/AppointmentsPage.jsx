import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../api/apiClient.js'
import CalendarPopover from '../components/CalendarPopover.jsx'
import HistoryPopover from '../components/HistoryPopover.jsx'
import MaterialSymbol from '../components/MaterialSymbol.jsx'
import usePageHistory from '../hooks/usePageHistory.js'
import { filterByMonth } from '../utils/dateFilter.js'

const DEFAULT_CALENDAR_DAYS = [
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1, events: ['9:00 AM'] },
  { day: 2 },
  { day: 3, events: ['1:30 PM', '4:00 PM'] },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7, events: ['10:00 AM'] },
  { day: 8 },
  { day: 9 },
  { day: 10, events: ['10:30 AM'] },
  { day: 11 },
  { day: 12 },
]

const DEFAULT_UPCOMING = [
  {
    name: 'Elena Gilbert',
    service: 'Deep Tissue Massage',
    status: 'Active',
    time: '10:00 - 11:30 AM',
    therapist: 'Dr. Julianne S.',
  },
  {
    name: 'Marcus Vane',
    service: 'Facial Cleansing',
    status: 'Upcoming',
    time: '01:45 - 02:45 PM',
    therapist: 'Therapist Ryan',
  },
  {
    name: 'Sarah Koenig',
    service: 'Full Body Detox',
    status: 'Upcoming',
    time: '04:00 - 05:30 PM',
    therapist: 'Dr. Elena M.',
  },
]

const DEFAULT_OCCUPANCY = [
  { name: 'Zen Suite', value: 68 },
  { name: 'Lotus Room', value: 42 },
  { name: 'Ocean Mist Hall', value: 78 },
]

const DEFAULT_AVAILABILITY = [
  { name: 'Dr. Julianne', status: 'Available' },
  { name: 'Ryan H.', status: 'In Session' },
  { name: 'Marcus L.', status: 'Available' },
  { name: 'Elena M.', status: 'Off Duty' },
]

const toDateKey = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const parseTimeLabel = (value) => {
  if (!value) return 'Appointment'
  const parts = String(value).split('-')
  return parts[0]?.trim() || value
}

const formatEventLabel = (item) => {
  if (!item) return 'Appointment'
  const time = parseTimeLabel(item.time)
  if (!item.name) return time
  // Include time with appointment in calendar
  const timeStr = item.time || ''
  return `${timeStr} - ${item.name}`
}

const buildCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = 0; i < firstDay; i += 1) {
    const day = prevMonthDays - firstDay + i + 1
    cells.push({ day, muted: true, date: new Date(year, month - 1, day) })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, muted: false, date: new Date(year, month, day) })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    const fill = 7 - remainder
    for (let day = 1; day <= fill; day += 1) {
      cells.push({ day, muted: true, date: new Date(year, month + 1, day) })
    }
  }

  return cells
}

const formatDisplayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const resolveLegacyCalendarDate = (item, year, month) => {
  if (!item || typeof item.day !== 'number') return null
  if (!item.muted) return new Date(year, month, item.day)
  if (item.day > 20) return new Date(year, month - 1, item.day)
  return new Date(year, month + 1, item.day)
}

export default function AppointmentsView({ onToggleNotifications, onCloseNotifications }) {
  const [viewMode, setViewMode] = useState('calendar')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [filterDate, setFilterDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  // Load appointments from localStorage on initial load
  const loadAppointmentsFromStorage = () => {
    try {
      const stored = localStorage.getItem('appointmentsData')
      if (stored) {
        const parsedData = JSON.parse(stored)
        return {
          calendar_days: DEFAULT_CALENDAR_DAYS,
          room_occupancy: DEFAULT_OCCUPANCY,
          therapist_availability: DEFAULT_AVAILABILITY,
          new_appointment: {
            time_slots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'],
            rooms: [
              { name: 'Eucalyptus Sanctuary', status: 'Free' },
              { name: 'Waterfall Room', status: 'In Use' },
            ],
            status_options: ['Confirmed', 'Pending'],
          },
          upcoming_today: parsedData.upcoming_today || DEFAULT_UPCOMING,
        }
      }
    } catch (error) {
      console.error('Error loading appointments from storage:', error)
    }
    return {
      calendar_days: DEFAULT_CALENDAR_DAYS,
      upcoming_today: DEFAULT_UPCOMING,
      room_occupancy: DEFAULT_OCCUPANCY,
      therapist_availability: DEFAULT_AVAILABILITY,
      new_appointment: {
        time_slots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'],
        rooms: [
          { name: 'Eucalyptus Sanctuary', status: 'Free' },
          { name: 'Waterfall Room', status: 'In Use' },
        ],
        status_options: ['Confirmed', 'Pending'],
      },
    }
  }

  const [appointmentsData, setAppointmentsData] = useState(loadAppointmentsFromStorage())

  // Save appointments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('appointmentsData', JSON.stringify({
        upcoming_today: appointmentsData.upcoming_today
      }))
    } catch (error) {
      console.error('Error saving appointments to storage:', error)
    }
  }, [appointmentsData.upcoming_today])
  const [statusMessage, setStatusMessage] = useState('')
  const [newAppointment, setNewAppointment] = useState({
    // Step 1: Personal Details
    clientName: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    preferences: '',
    // Step 2: Service Details
    serviceCategory: '',
    serviceType: '',
    duration: '30',
    price: '',
    // Step 3: Schedule Details
    appointmentDate: '',
    timeFrom: '',
    timeTo: '',
    // Step 4: Resources
    therapist: '',
    room: '',
    // Step 5: Payment
    paymentMethod: '',
    amount: '',
    upiId: '',
    transactionId: '',
    // Card Details
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
    // Step 6: Terms
    acceptTerms: false,
    // Status
    status: 'Confirmed',
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingAppointments, setPendingAppointments] = useState([])
  const [serviceCategories] = useState({
    Massage: ['Deep Tissue Massage', 'Swedish Massage', 'Hot Stone Massage', 'Sports Massage'],
    'Facial': ['Classic Facial', 'Anti-Aging Facial', 'Deep Cleansing Facial', 'Hydrating Facial'],
    'Body Treatment': ['Body Scrub', 'Body Wrap', 'Detox Treatment', 'Cellulite Treatment'],
    'Hair Care': ['Haircut & Styling', 'Hair Treatment', 'Scalp Massage', 'Color Service'],
    Beauty: ['Manicure', 'Pedicure', 'Makeup Service', 'Waxing'],
  })
  const [therapists] = useState([
    { name: 'Dr. Julianne S.', specialty: 'Holistic Massage' },
    { name: 'Therapist Ryan', specialty: 'Sports Therapy' },
    { name: 'Dr. Elena M.', specialty: 'Facial Specialist' },
    { name: 'Marcus L.', specialty: 'Body Treatment' },
  ])
  const [rooms] = useState([
    { name: 'Zen Suite', status: 'Available' },
    { name: 'Lotus Room', status: 'Available' },
    { name: 'Ocean Mist Hall', status: 'Occupied' },
  ])
  const [timeSlots] = useState([
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ])

  useEffect(() => {
    // Only fetch initial data if no appointments exist locally
    if (appointmentsData.upcoming_today.length === 0) {
      apiGet('/api/appointments')
        .then((data) => {
          if (!data) return
          setAppointmentsData((prev) => ({
            ...prev,
            ...data,
            new_appointment: data.new_appointment || prev.new_appointment,
          }))
        })
        .catch(() => {})
    }
  }, [])

  const filteredUpcoming = useMemo(() => {
    return appointmentsData.upcoming_today.filter((item) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(query) ||
        item.service.toLowerCase().includes(query) ||
        item.therapist.toLowerCase().includes(query)
      )
    })
  }, [appointmentsData.upcoming_today, searchQuery])

  const dateFilteredUpcoming = filterByMonth(
    filteredUpcoming,
    filterDate,
    (item) => item.date
  )

  const eventsByDate = useMemo(() => {
    const map = {}
    appointmentsData.upcoming_today.forEach((item) => {
      const key = toDateKey(item.date)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(formatEventLabel(item))
    })
    appointmentsData.calendar_days.forEach((item) => {
      const date = resolveLegacyCalendarDate(item, calendarYear, calendarMonth)
      const key = toDateKey(date)
      if (!key || !item.events?.length) return
      if (!map[key]) map[key] = []
      item.events.forEach((event) => map[key].push(event))
    })
    return map
  }, [appointmentsData.calendar_days, appointmentsData.upcoming_today, calendarMonth, calendarYear])

  const calendarCells = useMemo(() => {
    const cells = buildCalendarGrid(calendarYear, calendarMonth)
    return cells.map((cell) => {
      const key = toDateKey(cell.date)
      return {
        ...cell,
        key,
        events: key && eventsByDate[key] ? eventsByDate[key] : [],
      }
    })
  }, [calendarMonth, calendarYear, eventsByDate])

  const monthLabel = useMemo(
    () =>
      new Date(calendarYear, calendarMonth, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth, calendarYear]
  )

  const todayKey = toDateKey(new Date())
  const todayCount = todayKey ? (eventsByDate[todayKey] || []).length : 0

  const appointmentsHistory = usePageHistory('appointments', isHistoryOpen)
  const filteredHistory = filterByMonth(appointmentsHistory, filterDate, (item) => item.date)

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

  const handleAddAppointment = async () => {
    setStatusMessage('')
    
    // Create appointment data for list view
    const newAppointmentData = {
      name: newAppointment.clientName,
      service: newAppointment.serviceType,
      therapist: newAppointment.therapist,
      time: `${newAppointment.timeFrom} - ${newAppointment.timeTo}`,
      status: 'Confirmed',
      date: newAppointment.appointmentDate,
      room: newAppointment.room,
      duration: newAppointment.duration,
      price: newAppointment.price,
      email: newAppointment.email,
      phone: newAppointment.phone,
      paymentMethod: newAppointment.paymentMethod,
      transactionId: newAppointment.transactionId,
    }
    
    // Strictly add appointment to list view immediately and save to localStorage
    setAppointmentsData((prev) => {
      const updatedData = {
        ...prev,
        upcoming_today: [newAppointmentData, ...prev.upcoming_today],
      }
      // Save to localStorage immediately
      try {
        localStorage.setItem('appointmentsData', JSON.stringify({
          upcoming_today: updatedData.upcoming_today
        }))
      } catch (error) {
        console.error('Error saving appointment to localStorage:', error)
      }
      return updatedData
    })
    
    // Switch to list view to show the newly added appointment
    setViewMode('list')
    
    // Close modal and reset form
    setIsAddOpen(false)
    setCurrentStep(1)
    setShowPaymentSuccess(false)
    
    // Reset form
    setNewAppointment({
      clientName: '',
      email: '',
      phone: '',
      address: '',
      age: '',
      preferences: '',
      serviceCategory: '',
      serviceType: '',
      duration: '30',
      price: '',
      appointmentDate: '',
      timeFrom: '',
      timeTo: '',
      therapist: '',
      room: '',
      paymentMethod: '',
      amount: '',
      upiId: '',
      transactionId: '',
      acceptTerms: false,
    })
    
    setStatusMessage('Successfully confirmed! Appointment added to the list.')
    
    // Try to save to backend (non-blocking)
    try {
      const payload = {
        name: newAppointment.clientName,
        email: newAppointment.email,
        phone: newAppointment.phone,
        service: newAppointment.serviceType,
        therapist: newAppointment.therapist,
        room: newAppointment.room,
        date: newAppointment.appointmentDate,
        time: `${newAppointment.timeFrom} - ${newAppointment.timeTo}`,
        duration: newAppointment.duration,
        price: newAppointment.price,
        paymentMethod: newAppointment.paymentMethod,
        transactionId: newAppointment.transactionId,
      }
      await apiPost('/api/appointments', payload)
    } catch (error) {
      console.error('Backend save failed, but appointment is in list view:', error)
    }
  }

  const updateAppointmentField = (field, value) => {
    setNewAppointment((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateTransactionId = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }

  const handleServiceCategoryChange = (category) => {
    updateAppointmentField('serviceCategory', category)
    updateAppointmentField('serviceType', '')
    updateAppointmentField('duration', '')
    updateAppointmentField('price', '')
  }

  const handleServiceTypeChange = (serviceType) => {
    updateAppointmentField('serviceType', serviceType)
    // Duration will be user-entered, not auto-filled
  }

  const calculatePrice = (durationValue) => {
    const duration = parseInt(durationValue)
    let totalPrice = 0
    
    if (duration <= 30) {
      totalPrice = 800 // Base price for 30 min or less
    } else if (duration === 60) {
      totalPrice = 800 // 1 hour = 800
    } else {
      // For every additional 30 min beyond 60, add 200
      const extraBlocks = Math.ceil((duration - 60) / 30)
      totalPrice = 800 + (extraBlocks * 200)
    }
    
    updateAppointmentField('price', totalPrice.toString())
    updateAppointmentField('amount', totalPrice.toString())
  }

  const autofillOptions = {
    // Step 1: Recent clients
    recentClients: ['Elena Gilbert', 'Marcus Vane', 'Sarah Koenig'],
    // Step 2: Recent services
    recentServices: ['Body Wrap', 'Deep Tissue Massage', 'Classic Facial'],
    // Step 3: Quick date options
    quickDates: [
      { label: 'Today', value: new Date().toISOString().split('T')[0] },
      { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
      { label: 'Next Week', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] }
    ],
    // Step 4: Frequently used combinations
    frequentTherapistRoom: [
      { therapist: 'Dr. Julianne S.', room: 'Zen Suite' },
      { therapist: 'Therapist Ryan', room: 'Lotus Room' }
    ]
  }

  const handleDurationChange = (value) => {
    updateAppointmentField('duration', value)
    if (value && !isNaN(value) && parseInt(value) > 0) {
      calculatePrice(value)
    } else {
      updateAppointmentField('price', '')
      updateAppointmentField('amount', '')
    }
  }

  const handlePaymentMethodChange = (method) => {
    updateAppointmentField('paymentMethod', method)
    updateAppointmentField('transactionId', '')
    updateAppointmentField('upiId', '')
    updateAppointmentField('cardNumber', '')
    updateAppointmentField('cardHolderName', '')
    updateAppointmentField('expiryDate', '')
    updateAppointmentField('cvv', '')
  }

  const handleProceedPayment = () => {
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = () => {
    const transactionId = generateTransactionId()
    updateAppointmentField('transactionId', transactionId)
    updateAppointmentField('status', 'Confirmed')
    setShowPaymentModal(false)
    setShowPaymentSuccess(true)
  }

  const handleSubmitPending = () => {
    // Submit as pending appointment with all required fields for list view
    const pendingAppointment = {
      name: newAppointment.clientName,
      service: newAppointment.serviceType,
      therapist: newAppointment.therapist,
      room: newAppointment.room,
      time: `${newAppointment.timeFrom} - ${newAppointment.timeTo}`,
      status: 'Pending',
      date: newAppointment.appointmentDate,
      price: newAppointment.price,
      duration: newAppointment.duration,
      email: newAppointment.email,
      phone: newAppointment.phone,
      paymentMethod: newAppointment.paymentMethod || 'Pending',
      transactionId: newAppointment.transactionId || 'Pending',
    }
    
    setPendingAppointments((prev) => [...prev, pendingAppointment])
    
    // Add to upcoming list and save to localStorage
    setAppointmentsData((prev) => {
      const updatedData = {
        ...prev,
        upcoming_today: [pendingAppointment, ...prev.upcoming_today],
      }
      // Save to localStorage immediately
      try {
        localStorage.setItem('appointmentsData', JSON.stringify({
          upcoming_today: updatedData.upcoming_today
        }))
      } catch (error) {
        console.error('Error saving pending appointment to localStorage:', error)
      }
      return updatedData
    })
    
    setIsAddOpen(false)
    setCurrentStep(1)
    // Switch to list view to show the newly added pending appointment
    setViewMode('list')
    setNewAppointment({
      clientName: '',
      email: '',
      phone: '',
      address: '',
      age: '',
      preferences: '',
      serviceCategory: '',
      serviceType: '',
      duration: '30',
      price: '',
      appointmentDate: '',
      timeFrom: '',
      timeTo: '',
      therapist: '',
      room: '',
      paymentMethod: '',
      amount: '',
      upiId: '',
      transactionId: '',
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      cvv: '',
      acceptTerms: false,
      status: 'Pending',
    })
    setStatusMessage('Pending appointment created successfully.')
  }

  const handleDeleteAppointment = (index) => {
    if (window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      setAppointmentsData((prev) => {
        const updatedData = {
          ...prev,
          upcoming_today: prev.upcoming_today.filter((_, i) => i !== index),
        }
        // Update localStorage immediately
        try {
          localStorage.setItem('appointmentsData', JSON.stringify({
            upcoming_today: updatedData.upcoming_today
          }))
        } catch (error) {
          console.error('Error updating localStorage after delete:', error)
        }
        return updatedData
      })
      setStatusMessage('Appointment deleted successfully.')
    }
  }

  const handleClosePaymentSuccess = () => {
    setShowPaymentSuccess(false)
    nextStep()
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return newAppointment.clientName && newAppointment.email && newAppointment.phone
      case 2:
        return newAppointment.serviceCategory && newAppointment.serviceType
      case 3:
        return newAppointment.appointmentDate && newAppointment.timeFrom && newAppointment.timeTo
      case 4:
        return newAppointment.therapist && newAppointment.room
      case 5:
        if (!newAppointment.paymentMethod) return false
        if (newAppointment.paymentMethod === 'UPI' && !newAppointment.upiId) return false
        if (newAppointment.paymentMethod === 'Card' && (!newAppointment.cardNumber || !newAppointment.cardHolderName || !newAppointment.expiryDate || !newAppointment.cvv)) return false
        return true
      case 6:
        return newAppointment.acceptTerms
      case 7:
        return true
      default:
        return true
    }
  }

  return (
    <div className="view-body appointments-view">
      <header className="appointments-header">
        <h2>Appointments</h2>
        <div className="appointments-header-right action-popover-anchor">
          <div className="appointments-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search appointments or clients..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
              title="Appointments History"
              items={filteredHistory}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </div>
      </header>

      {statusMessage && <p className="appointments-status">{statusMessage}</p>}

      <section className="appointments-toolbar">
        <div>
  
          <p>Managing the rhythm of sanctuary</p>
        </div>
        <div className="appointments-actions">
          <div className="appointments-toggle">
            <button
              type="button"
              className={viewMode === 'calendar' ? 'is-active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'is-active' : ''}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          <button type="button" className="primary-button" onClick={() => setIsAddOpen(true)}>
            <MaterialSymbol name="add" className="text-[18px]" />
            New Appointment
          </button>
        </div>
      </section>

      {viewMode === 'calendar' ? (
        <>
          <section className="appointments-layout">
            <div className="calendar-card">
              <div className="calendar-head">
                <div>
                  <h4>{monthLabel}</h4>
                  <p>
                    You have {todayCount} appointment{todayCount === 1 ? '' : 's'} scheduled today
                  </p>
                </div>
                <div className="calendar-nav">
                  <button type="button" aria-label="Previous" onClick={() => shiftMonth(-1)}>
                    <MaterialSymbol name="chevron_left" className="text-[18px]" />
                  </button>
                  <button type="button" aria-label="Next" onClick={() => shiftMonth(1)}>
                    <MaterialSymbol name="chevron_right" className="text-[18px]" />
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <span className="calendar-label" key={label}>
                    {label}
                  </span>
                ))}
                {calendarCells.map((item) => (
                  <div
                    key={item.key || `day-${item.day}-${item.muted ? 'muted' : 'current'}`}
                    className={item.muted ? 'calendar-cell muted' : 'calendar-cell'}
                  >
                    <span className="calendar-day">{item.day}</span>
                    {item.events.map((event, index) => (
                      <span
                        key={`${item.key || item.day}-${event}-${index}`}
                        className={`calendar-event${index === 0 ? '' : ' alt'}`}
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <aside className="appointments-side">
              <div className="upcoming-card">
                <h4>Upcoming Today</h4>
                <div className="upcoming-list">
                  {dateFilteredUpcoming.map((item) => (
                    <div className="upcoming-item" key={item.name}>
                      <div className="upcoming-avatar">{item.name.charAt(0)}</div>
                      <div>
                        <p>{item.name}</p>
                        <span>{item.service}</span>
                        <div className="upcoming-meta">
                          <span>{item.therapist}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <span className={`upcoming-status ${item.status.toLowerCase()}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="occupancy-card">
                <h4>Room Occupancy</h4>
                {appointmentsData.room_occupancy.map((room) => (
                  <div className="occupancy-row" key={room.name}>
                    <div>
                      <p>{room.name}</p>
                      <div className="occupancy-bar">
                        <span style={{ width: `${room.value}%` }}></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="availability-card">
            <div className="availability-head">
              <h4>Therapist Availability</h4>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setStatusMessage('Staff availability list opened.')}
              >
                View all staff
              </button>
            </div>
            <div className="availability-list">
              {appointmentsData.therapist_availability.map((therapist) => (
                <div className="availability-item" key={therapist.name}>
                  <div className="availability-avatar">{therapist.name.charAt(0)}</div>
                  <div>
                    <p>{therapist.name}</p>
                    <span>{therapist.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="appointments-list-card">
          <div className="appointments-list-head">
            <div>
              <h4>All Appointments</h4>
              <p>{dateFilteredUpcoming.length} scheduled sessions</p>
            </div>
          </div>
          <div className="appointments-list">
            {console.log('Rendering appointments list, count:', dateFilteredUpcoming.length, 'items:', dateFilteredUpcoming)}
            {dateFilteredUpcoming.length === 0 ? (
              <p className="appointments-empty">No appointments found.</p>
            ) : (
              dateFilteredUpcoming.map((item, index) => {
                console.log('Rendering appointment item:', item, 'index:', index)
                return (
                <div className="appointment-row" key={`${item.name}-${item.time}-${index}`}>
                  <div className="appointment-row-main">
                    <div className="appointment-avatar">{item.name.charAt(0)}</div>
                    <div>
                      <p className="appointment-client">{item.name}</p>
                      <span className="appointment-service">{item.service}</span>
                    </div>
                  </div>
                  <div className="appointment-meta">
                    <span>
                      <MaterialSymbol name="calendar_month" className="text-[14px]" />
                      {formatDisplayDate(item.date)}
                    </span>
                    <span>
                      <MaterialSymbol name="schedule" className="text-[14px]" />
                      {item.time}
                    </span>
                    <span>
                      <MaterialSymbol name="medical_services" className="text-[14px]" />
                      {item.therapist}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <span className={`upcoming-status ${item.status?.toLowerCase() || 'confirmed'}`}>
                      {item.status || 'Confirmed'}
                    </span>
                    <button
                      type="button"
                      className="delete-appointment-btn"
                      onClick={() => handleDeleteAppointment(index)}
                      aria-label="Delete appointment"
                      title="Delete appointment"
                    >
                      <MaterialSymbol name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                )
              })
            )}
          </div>
        </section>
      )}

      {isAddOpen && (
        <div className="appointment-modal-overlay">
          <div className="appointment-modal multi-step-modal">
            <div className="appointment-modal-header">
              <div>
                <h3>New Appointment</h3>
                <p>Complete all steps to book your appointment</p>
              </div>
              <button
                type="button"
                className="appointment-modal-close"
                onClick={() => {
                  setIsAddOpen(false)
                  setCurrentStep(1)
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Progress Tracker */}
            <div className="step-tracker">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div
                  key={step}
                  className={`step-item ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                  onClick={() => {
                    if (step < currentStep) {
                      setCurrentStep(step)
                    }
                  }}
                >
                  <div className="step-circle">
                    {step < currentStep ? (
                      <MaterialSymbol name="check" className="text-[16px]" filled />
                    ) : (
                      step
                    )}
                  </div>
                  <span className="step-label">
                    {step === 1 && 'Personal'}
                    {step === 2 && 'Service'}
                    {step === 3 && 'Schedule'}
                    {step === 4 && 'Resources'}
                    {step === 5 && 'Payment'}
                    {step === 6 && 'Terms'}
                    {step === 7 && 'Confirm'}
                  </span>
                </div>
              ))}
            </div>

            <div className="appointment-modal-grid">
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <section className="appointment-panel">
                  <h4>Step 1: Personal Details</h4>
                  <p>Please provide your contact information</p>
                  <label>
                    Client Name *
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={newAppointment.clientName}
                      onChange={(e) => updateAppointmentField('clientName', e.target.value)}
                      className="form-input"
                      list="client-suggestions"
                    />
                    <datalist id="client-suggestions">
                      {autofillOptions.recentClients.map((name, idx) => (
                        <option key={idx} value={name} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Email *
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={newAppointment.email}
                      onChange={(e) => updateAppointmentField('email', e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Phone *
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={newAppointment.phone}
                      onChange={(e) => updateAppointmentField('phone', e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Address (Optional)
                    <input
                      type="text"
                      placeholder="Your complete address"
                      value={newAppointment.address}
                      onChange={(e) => updateAppointmentField('address', e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Age (Optional)
                    <input
                      type="number"
                      placeholder="Your age"
                      value={newAppointment.age}
                      onChange={(e) => updateAppointmentField('age', e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Preferences/Notes
                    <textarea
                      placeholder="Any specific requirements or notes..."
                      value={newAppointment.preferences}
                      onChange={(e) => updateAppointmentField('preferences', e.target.value)}
                      rows="3"
                      className="form-textarea"
                    />
                  </label>
                </section>
              )}

              {/* Step 2: Service Details */}
              {currentStep === 2 && (
                <section className="appointment-panel">
                  <h4>Step 2: Service Details</h4>
                  <p>Select your preferred service</p>
                  <label>
                    Service Category *
                    <select
                      value={newAppointment.serviceCategory}
                      onChange={(e) => handleServiceCategoryChange(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Category</option>
                      {Object.keys(serviceCategories).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Service Type *
                    <input
                      type="text"
                      placeholder="Type service name or select from dropdown"
                      value={newAppointment.serviceType}
                      onChange={(e) => handleServiceTypeChange(e.target.value)}
                      className="form-input"
                      list="service-suggestions"
                    />
                    <datalist id="service-suggestions">
                      {newAppointment.serviceCategory &&
                        serviceCategories[newAppointment.serviceCategory].map((service) => (
                          <option key={service} value={service} />
                        ))}
                      {autofillOptions.recentServices.map((service, idx) => (
                        <option key={idx} value={service} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Duration (minutes) *
                    <input
                      type="number"
                      placeholder="Enter duration in minutes (e.g., 30, 60, 90)"
                      value={newAppointment.duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      min="15"
                      max="240"
                    />
                    {newAppointment.duration && !isNaN(parseInt(newAppointment.duration)) && (
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Duration: {newAppointment.duration} minutes
                      </small>
                    )}
                  </label>
                  {newAppointment.price && (
                    <label>
                      Price Breakdown
                      <div style={{ background: '#f7f4ee', padding: '12px', borderRadius: '10px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Service Fee:</span>
                          <strong>₹300</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Therapist Fee:</span>
                          <strong>₹500</strong>
                        </div>
                        {parseInt(newAppointment.duration) > 60 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#2f7d6d' }}>
                            <span>Additional Time:</span>
                            <strong>+₹{parseInt(newAppointment.price) - 800}</strong>
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                          <span>Total Amount:</span>
                          <span style={{ color: '#1f4d3e' }}>₹{newAppointment.price}</span>
                        </div>
                      </div>
                    </label>
                  )}
                </section>
              )}

              {/* Step 3: Schedule Details */}
              {currentStep === 3 && (
                <section className="appointment-panel">
                  <h4>Step 3: Schedule Details</h4>
                  <p>Choose your preferred date and time</p>
                  <label>
                    Appointment Date *
                    <input
                      type="date"
                      value={newAppointment.appointmentDate}
                      onChange={(e) => updateAppointmentField('appointmentDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="form-input"
                    />
                  </label>
                  {/* Quick Date Options */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {autofillOptions.quickDates.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          className={`quick-date-btn ${newAppointment.appointmentDate === option.value ? 'active' : ''}`}
                          onClick={() => updateAppointmentField('appointmentDate', option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    Time Slot From *
                    <select
                      value={newAppointment.timeFrom}
                      onChange={(e) => updateAppointmentField('timeFrom', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Time Slot To *
                    <select
                      value={newAppointment.timeTo}
                      onChange={(e) => updateAppointmentField('timeTo', e.target.value)}
                      disabled={!newAppointment.timeFrom}
                      className="form-select"
                    >
                      <option value="">Select Time</option>
                      {timeSlots
                        .filter((slot) => {
                          if (!newAppointment.timeFrom) return true
                          const fromIndex = timeSlots.indexOf(newAppointment.timeFrom)
                          const slotIndex = timeSlots.indexOf(slot)
                          return slotIndex > fromIndex
                        })
                        .map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                    </select>
                  </label>
                </section>
              )}

              {/* Step 4: Resources (Therapist & Room) */}
              {currentStep === 4 && (
                <section className="appointment-panel">
                  <h4>Step 4: Resources</h4>
                  <p>Select your therapist and room</p>
                  {/* Frequent Combinations */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {autofillOptions.frequentTherapistRoom.map((combo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`freq-combo-btn ${newAppointment.therapist === combo.therapist && newAppointment.room === combo.room ? 'active' : ''}`}
                          onClick={() => {
                            updateAppointmentField('therapist', combo.therapist)
                            updateAppointmentField('room', combo.room)
                          }}
                        >
                          <span>{combo.therapist}</span>
                          <span className="arrow">→</span>
                          <span>{combo.room}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    Therapist *
                    <input
                      type="text"
                      placeholder="Search therapist..."
                      value={newAppointment.therapist}
                      onChange={(e) => updateAppointmentField('therapist', e.target.value)}
                      className="form-input"
                      list="therapist-suggestions"
                    />
                    <datalist id="therapist-suggestions">
                      {therapists.map((therapist) => (
                        <option key={therapist.name} value={therapist.name} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Room *
                    <input
                      type="text"
                      placeholder="Search room..."
                      value={newAppointment.room}
                      onChange={(e) => updateAppointmentField('room', e.target.value)}
                      className="form-input"
                      list="room-suggestions"
                    />
                    <datalist id="room-suggestions">
                      {rooms.map((room) => (
                        <option key={room.name} value={room.name} />
                      ))}
                    </datalist>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleSubmitPending}
                      style={{ flex: 1 }}
                    >
                      <MaterialSymbol name="schedule" className="text-[18px]" />
                      Submit as Pending
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={nextStep}
                      disabled={!validateStep()}
                      style={{ flex: 1 }}
                    >
                      Continue to Payment
                      <MaterialSymbol name="arrow_forward" className="text-[16px]" />
                    </button>
                  </div>
                </section>
              )}

              {/* Step 5: Payment */}
              {currentStep === 5 && (
                <section className="appointment-panel">
                  <h4>Step 5: Payment</h4>
                  <p>Complete your payment details</p>
                  
                  {/* Combined Container: Client Details + Payment Method */}
                  <div style={{ background: '#ffffff', border: '1px solid #eee6db', borderRadius: '14px', padding: '18px' }}>
                    {/* Client Details */}
                    <div style={{ background: '#f7f4ee', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: '#2f2a24' }}>Client Details</h5>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6f665c' }}><strong>Name:</strong> {newAppointment.clientName}</p>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6f665c' }}><strong>Service:</strong> {newAppointment.serviceType}</p>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6f665c' }}><strong>Duration:</strong> {newAppointment.duration || '30'} minutes</p>
                    </div>

                    {/* Amount Breakdown */}
                    <div style={{ background: '#f7f4ee', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: '#2f2a24' }}>Payment Breakdown</h5>
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Service Fee:</span>
                          <strong>₹300</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Therapist Fee:</span>
                          <strong>₹500</strong>
                        </div>
                        {parseInt(newAppointment.duration) > 60 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#2f7d6d' }}>
                            <span>Additional Time ({newAppointment.duration} min):</span>
                            <strong>+₹{parseInt(newAppointment.price) - 800}</strong>
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>
                          <span>Total Amount:</span>
                          <span style={{ color: '#1f4d3e' }}>₹{newAppointment.price}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <label style={{ marginBottom: '0' }}>
                      <span style={{ fontSize: '12px', color: '#2f2a24', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Select Payment Method</span>
                      <div className="payment-methods">
                        <button
                          type="button"
                          className={`payment-btn ${newAppointment.paymentMethod === 'Card' ? 'active' : ''}`}
                          onClick={() => handlePaymentMethodChange('Card')}
                        >
                          <MaterialSymbol name="credit_card" className="text-[18px]" />
                          Card
                        </button>
                        <button
                          type="button"
                          className={`payment-btn ${newAppointment.paymentMethod === 'UPI' ? 'active' : ''}`}
                          onClick={() => handlePaymentMethodChange('UPI')}
                        >
                          <MaterialSymbol name="phone_android" className="text-[18px]" />
                          UPI
                        </button>
                      </div>
                    </label>
                  </div>

                  {newAppointment.paymentMethod && (
                    <button
                      type="button"
                      className="primary-button full-width"
                      onClick={handleProceedPayment}
                      style={{ marginTop: '16px' }}
                    >
                      <MaterialSymbol name="payment" className="text-[18px]" />
                      Proceed to Pay ₹{newAppointment.price}
                    </button>
                  )}
                </section>
              )}
              {currentStep === 6 && (
                <section className="appointment-panel">
                  <h4>Step 6: Terms & Conditions</h4>
                  <p>Please review and accept our terms</p>
                  <div className="terms-content">
                    <div className="terms-box">
                      <h5>Cancellation Policy</h5>
                      <p>• Appointments can be cancelled up to 24 hours in advance</p>
                      <p>• Late cancellations may incur a fee</p>
                      <p>• No-shows will be charged the full amount</p>
                      <h5>Privacy Policy</h5>
                      <p>• Your personal information is secure</p>
                      <p>• We only use your data for booking purposes</p>
                      <h5>Terms of Service</h5>
                      <p>• By booking, you agree to our terms</p>
                      <p>• Therapist recommendations are subject to availability</p>
                    </div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newAppointment.acceptTerms}
                        onChange={(e) => updateAppointmentField('acceptTerms', e.target.checked)}
                      />
                      <span>I accept the Terms & Conditions</span>
                    </label>
                  </div>
                </section>
              )}

              {/* Step 7: Confirmation */}
              {currentStep === 7 && (
                <section className="appointment-panel">
                  <h4>Step 7: Confirmation</h4>
                  <p>Review all details before submitting</p>
                  <div className="review-section">
                    <div className="review-card">
                      <h5>Personal Details</h5>
                      <p><strong>Name:</strong> {newAppointment.clientName}</p>
                      <p><strong>Email:</strong> {newAppointment.email}</p>
                      <p><strong>Phone:</strong> {newAppointment.phone}</p>
                      {newAppointment.address && <p><strong>Address:</strong> {newAppointment.address}</p>}
                      {newAppointment.age && <p><strong>Age:</strong> {newAppointment.age}</p>}
                      {newAppointment.preferences && <p><strong>Notes:</strong> {newAppointment.preferences}</p>}
                    </div>
                    <div className="review-card">
                      <h5>Service Details</h5>
                      <p><strong>Category:</strong> {newAppointment.serviceCategory}</p>
                      <p><strong>Service:</strong> {newAppointment.serviceType}</p>
                      <p><strong>Duration:</strong> {newAppointment.duration || '30'} minutes</p>
                      <p><strong>Price:</strong> ₹{newAppointment.price}</p>
                    </div>
                    <div className="review-card">
                      <h5>Schedule</h5>
                      <p><strong>Date:</strong> {newAppointment.appointmentDate ? new Date(newAppointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</p>
                      <p><strong>Time:</strong> {newAppointment.timeFrom} - {newAppointment.timeTo}</p>
                    </div>
                    <div className="review-card">
                      <h5>Resources</h5>
                      <p><strong>Therapist:</strong> {newAppointment.therapist}</p>
                      <p><strong>Room:</strong> {newAppointment.room}</p>
                    </div>
                    <div className="review-card">
                      <h5>Payment</h5>
                      <p><strong>Method:</strong> {newAppointment.paymentMethod}</p>
                      <p><strong>Amount:</strong> ₹{newAppointment.amount}</p>
                      {newAppointment.upiId && <p><strong>UPI ID:</strong> {newAppointment.upiId}</p>}
                      <p><strong>Transaction ID:</strong> {newAppointment.transactionId}</p>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="modal-navigation">
              {currentStep === 5 ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={prevStep}
                >
                  <MaterialSymbol name="arrow_back" className="text-[16px]" />
                  Back
                </button>
              ) : currentStep === 6 ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={prevStep}
                >
                  <MaterialSymbol name="arrow_back" className="text-[16px]" />
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <MaterialSymbol name="arrow_back" className="text-[16px]" />
                  Previous
                </button>
              )}
              {currentStep === 7 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleAddAppointment}
                >
                  Submit Appointment
                  <MaterialSymbol name="check_circle" className="text-[18px]" filled />
                </button>
              ) : currentStep !== 5 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={nextStep}
                  disabled={!validateStep()}
                >
                  Next
                  <MaterialSymbol name="arrow_forward" className="text-[16px]" />
                </button>
              ) : null}
            </div>

            {/* Payment Method Details Popup - Separate Modal (Reduced Height) */}
            {showPaymentModal && (
              <div className="payment-details-overlay" onClick={() => setShowPaymentModal(false)}>
                <div className="payment-details-card payment-details-card-compact" onClick={(e) => e.stopPropagation()}>
                  <div className="payment-modal-header">
                    <h3>Payment Details</h3>
                    <button
                      type="button"
                      className="payment-modal-close"
                      onClick={() => setShowPaymentModal(false)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="payment-amount-display payment-amount-display-small">
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#80766b' }}>Amount to Pay</p>
                    <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1f4d3e' }}>₹{newAppointment.price}</p>
                  </div>

                  {newAppointment.paymentMethod === 'Card' && (
                    <div className="payment-form-section">
                      <h4>Card Details</h4>
                      <label>
                        Card Number
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={newAppointment.cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                            updateAppointmentField('cardNumber', value.slice(0, 19))
                          }}
                          maxLength="19"
                          className="form-input"
                        />
                      </label>
                      <label>
                        Card Holder Name
                        <input
                          type="text"
                          placeholder="Name on card"
                          value={newAppointment.cardHolderName}
                          onChange={(e) => updateAppointmentField('cardHolderName', e.target.value)}
                          className="form-input"
                        />
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <label>
                          Expiry Date
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newAppointment.expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '')
                              if (value.length > 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4)
                              }
                              updateAppointmentField('expiryDate', value.slice(0, 5))
                            }}
                            maxLength="5"
                            className="form-input"
                          />
                        </label>
                        <label>
                          CVV
                          <input
                            type="password"
                            placeholder="•••"
                            value={newAppointment.cvv}
                            onChange={(e) => updateAppointmentField('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength="3"
                            className="form-input"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {newAppointment.paymentMethod === 'UPI' && (
                    <div className="payment-form-section">
                      <h4>UPI Payment</h4>
                      <label>
                        UPI ID (e.g., name@bank)
                        <input
                          type="text"
                          placeholder="yourname@upi"
                          value={newAppointment.upiId}
                          onChange={(e) => updateAppointmentField('upiId', e.target.value)}
                          className="form-input"
                        />
                      </label>
                      <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <p style={{ fontSize: '11px', color: '#80766b', marginBottom: '8px' }}>Scan QR Code</p>
                        <img 
                          src="https://static.vecteezy.com/system/resources/previews/002/258/271/original/template-of-qr-code-ready-to-scan-with-smartphone-illustration-vector.jpg" 
                          alt="QR Code for Payment"
                          style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '10px',
                            border: '2px solid #eee6db',
                            padding: '6px'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="primary-button full-width"
                    onClick={handleConfirmPayment}
                    style={{ marginTop: '14px' }}
                  >
                    <MaterialSymbol name="check_circle" className="text-[16px]" filled />
                    Pay ₹{newAppointment.price}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Success Popup - Small with Client Details */}
            {showPaymentSuccess && (
              <div className="payment-success-overlay" onClick={handleClosePaymentSuccess}>
                <div className="payment-success-card" onClick={(e) => e.stopPropagation()}>
                  <div className="success-icon">
                    <MaterialSymbol name="check_circle" className="text-[32px]" filled />
                  </div>
                  <h3 style={{ fontSize: '16px', margin: '6px 0' }}>Successfully Paid!</h3>
                  <div style={{ width: '100%', padding: '12px', background: '#f7f4ee', borderRadius: '10px', marginTop: '8px' }}>
                    <p style={{ fontSize: '10px', color: '#80766b', margin: '0 0 4px' }}>Client</p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2f2a24', margin: '0 0 8px' }}>{newAppointment.clientName}</p>
                    <p style={{ fontSize: '10px', color: '#80766b', margin: '0 0 4px' }}>Total Amount</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f4d3e', margin: '0 0 8px' }}>₹{newAppointment.price}</p>
                    <p style={{ fontSize: '9px', color: '#80766b', margin: '0 0 2px' }}>Transaction ID</p>
                    <p style={{ fontSize: '10px', fontWeight: '600', color: '#2f2a24', fontFamily: 'monospace', wordBreak: 'break-all', margin: '0' }}>{newAppointment.transactionId}</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleClosePaymentSuccess}
                    style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {statusMessage && <p className="appointments-status">{statusMessage}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
