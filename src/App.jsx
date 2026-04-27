import { useEffect, useState } from 'react'
import './App.css'
import MaterialSymbol from './components/MaterialSymbol.jsx'
import CalendarPopover from './components/CalendarPopover.jsx'
import HistoryPopover from './components/HistoryPopover.jsx'
import NotificationsPanel from './components/NotificationsPanel.jsx'
import { apiGet } from './api/apiClient.js'
import usePageHistory from './hooks/usePageHistory.js'
import { filterByMonth } from './utils/dateFilter.js'
import DashboardPage from './pages/DashboardPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import TherapistsPage from './pages/TherapistsPage.jsx'
import ClientsPage from './pages/ClientsPage.jsx'
import StaffPage from './pages/StaffPage.jsx'
import RoomsPage from './pages/RoomsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'
import AppointmentsPage from './pages/AppointmentsPage.jsx'
import OffersPage from './pages/OffersPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import LoginPage from './pages/LoginPage.jsx'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'clients', label: 'Clients', icon: 'groups' },
      { id: 'therapists', label: 'Therapist', icon: 'medical_services' },
      { id: 'staff', label: 'Staff', icon: 'badge' },
      { id: 'rooms', label: 'Rooms', icon: 'meeting_room' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { id: 'appointments', label: 'Appointment', icon: 'event' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
      { id: 'insights', label: 'AI Insights', icon: 'auto_awesome' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

const VIEW_META = {
  dashboard: {
    title: 'Good Morning, Elena',
    subtitle: 'Your sanctuary is ready for you today.',
  },
  services: {
    title: 'Serene Rituals',
    subtitle: 'Experience our curated collection of restorative therapies.',
  },
  therapists: {
    title: '',
    subtitle: '',
  },
  appointments: {
    title: '',
    subtitle: '',
  },
  clients: {
    title: '',
    subtitle: '',
  },
  staff: {
    title: '',
    subtitle: '',
  },
  rooms: {
    title: '',
    subtitle: '',
  },
  analytics: {
    title: '',
    subtitle: '',
  },
  insights: {
    title: '',
    subtitle: '',
  },
  offers: {
    title: 'Signature Packages',
    subtitle: 'Limited availability for seasonal rituals and retreats.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure spa business rules and notifications.',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage account preferences and notification channels.',
  },
}

function App() {
  const [view, setView] = useState('login')
  const [clients, setClients] = useState([])

  useEffect(() => {
    // Use exact same client data as appointment page list view
    const loadClientsFromStorage = () => {
      try {
        const stored = localStorage.getItem('appointmentsData')
        if (stored) {
          const parsedData = JSON.parse(stored)
          // Use the exact same upcoming_today data as appointment page
          const appointmentClients = parsedData.upcoming_today || []
          
          // If no clients in storage, use the exact same default data as appointment page
          if (appointmentClients.length === 0) {
            return [
              {
                id: 1,
                name: 'Elena Gilbert',
                email: 'elena.gilbert@email.com',
                phone: '+1 234-567-8901',
                address: '123 Spa Street, Wellness City',
                age: '28',
                preferences: 'Deep Tissue Massage',
                status: 'Active',
                created_at: '2024-01-15',
                last_visit_date: '2024-03-20',
                appointmentHistory: [
                  { date: '2024-03-20', service: 'Deep Tissue Massage', status: 'Completed' }
                ],
                paymentHistory: [
                  { date: '2024-03-20', amount: '150', status: 'Paid' }
                ]
              },
              {
                id: 2,
                name: 'Marcus Vane',
                email: 'marcus.vane@email.com',
                phone: '+1 234-567-8902',
                address: '456 Relax Avenue, Serenity Town',
                age: '35',
                preferences: 'Facial Cleansing',
                status: 'Upcoming',
                created_at: '2024-02-10',
                last_visit_date: '2024-03-18',
                appointmentHistory: [
                  { date: '2024-03-18', service: 'Facial Cleansing', status: 'Completed' }
                ],
                paymentHistory: [
                  { date: '2024-03-18', amount: '120', status: 'Paid' }
                ]
              },
              {
                id: 3,
                name: 'Sarah Koenig',
                email: 'sarah.koenig@email.com',
                phone: '+1 234-567-8903',
                address: '789 Wellness Boulevard, Peace City',
                age: '42',
                preferences: 'Full Body Detox',
                status: 'Upcoming',
                created_at: '2024-01-25',
                last_visit_date: '2024-03-22',
                appointmentHistory: [
                  { date: '2024-03-22', service: 'Full Body Detox', status: 'Completed' }
                ],
                paymentHistory: [
                  { date: '2024-03-22', amount: '180', status: 'Paid' }
                ]
              }
            ]
          }
          
          // Convert appointment data to client format
          return appointmentClients.map((appointment, index) => ({
            id: index + 1,
            name: appointment.name,
            email: `${appointment.name.toLowerCase().replace(' ', '.')}@email.com`,
            phone: `+1 234-567-890${index + 1}`,
            address: `${index + 1}23 Spa Street, Wellness City`,
            age: '28',
            preferences: appointment.service || 'General Wellness',
            status: appointment.status || 'Active',
            created_at: '2024-01-15',
            last_visit_date: appointment.date || new Date().toISOString().split('T')[0],
            appointmentHistory: [
              { date: appointment.date || new Date().toISOString().split('T')[0], service: appointment.service || 'Wellness Service', status: 'Completed' }
            ],
            paymentHistory: [
              { date: appointment.date || new Date().toISOString().split('T')[0], amount: '150', status: 'Paid' }
            ]
          }))
        }
      } catch (error) {
        console.error('Error loading clients from storage:', error)
      }
      
      // Fallback to exact same default clients as appointment page
      return [
        {
          id: 1,
          name: 'Elena Gilbert',
          email: 'elena.gilbert@email.com',
          phone: '+1 234-567-8901',
          address: '123 Spa Street, Wellness City',
          age: '28',
          preferences: 'Deep Tissue Massage',
          status: 'Active',
          created_at: '2024-01-15',
          last_visit_date: '2024-03-20',
          appointmentHistory: [
            { date: '2024-03-20', service: 'Deep Tissue Massage', status: 'Completed' }
          ],
          paymentHistory: [
            { date: '2024-03-20', amount: '150', status: 'Paid' }
          ]
        },
        {
          id: 2,
          name: 'Marcus Vane',
          email: 'marcus.vane@email.com',
          phone: '+1 234-567-8902',
          address: '456 Relax Avenue, Serenity Town',
          age: '35',
          preferences: 'Facial Cleansing',
          status: 'Upcoming',
          created_at: '2024-02-10',
          last_visit_date: '2024-03-18',
          appointmentHistory: [
            { date: '2024-03-18', service: 'Facial Cleansing', status: 'Completed' }
          ],
          paymentHistory: [
            { date: '2024-03-18', amount: '120', status: 'Paid' }
          ]
        },
        {
          id: 3,
          name: 'Sarah Koenig',
          email: 'sarah.koenig@email.com',
          phone: '+1 234-567-8903',
          address: '789 Wellness Boulevard, Peace City',
          age: '42',
          preferences: 'Full Body Detox',
          status: 'Upcoming',
          created_at: '2024-01-25',
          last_visit_date: '2024-03-22',
          appointmentHistory: [
            { date: '2024-03-22', service: 'Full Body Detox', status: 'Completed' }
          ],
          paymentHistory: [
            { date: '2024-03-22', amount: '180', status: 'Paid' }
          ]
        }
      ]
    }

    const clientsData = loadClientsFromStorage()
    setClients(clientsData)
  }, [])

  if (view === 'login') {
    return (
      <LoginPage
        onSignIn={() => {
          setView('dashboard')
        }}
      />
    )
  }

  return (
    <div className="app-frame">
      <AppShell view={view} onNav={setView} clients={clients} setClients={setClients} />
    </div>
  )
}

function AppShell({ view, onNav, clients, setClients }) {
  const meta = VIEW_META[view]
  const [collapsed, setCollapsed] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [dashboardFilterDate, setDashboardFilterDate] = useState(null)
  const [dashboardMonth, setDashboardMonth] = useState(() => new Date().getMonth())
  const [dashboardYear, setDashboardYear] = useState(() => new Date().getFullYear())
  const [isDashboardCalendarOpen, setIsDashboardCalendarOpen] = useState(false)
  const [isDashboardHistoryOpen, setIsDashboardHistoryOpen] = useState(false)
  const showTopbarText = Boolean(meta.title || meta.subtitle)
  const isDashboard = view === 'dashboard'
  const showTopbar = showTopbarText || isDashboard

  useEffect(() => {
    apiGet('/api/notifications')
      .then((data) => setNotifications(data || []))
      .catch(() => setNotifications([]))
  }, [])

  useEffect(() => {
    setIsNotificationsOpen(false)
  }, [view])

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev)
  }

  const closeNotifications = () => {
    setIsNotificationsOpen(false)
  }

  const filteredDashboardClients = dashboardSearch
    ? clients.filter((client) =>
        client.name.toLowerCase().includes(dashboardSearch.toLowerCase())
      )
    : []

  const dashboardHistory = usePageHistory('dashboard', isDashboardHistoryOpen)
  const filteredDashboardHistory = filterByMonth(
    dashboardHistory,
    dashboardFilterDate,
    (item) => item.date
  )

  const shiftDashboardMonth = (delta) => {
    const nextMonth = dashboardMonth + delta
    if (nextMonth < 0) {
      setDashboardMonth(11)
      setDashboardYear((prev) => prev - 1)
      return
    }
    if (nextMonth > 11) {
      setDashboardMonth(0)
      setDashboardYear((prev) => prev + 1)
      return
    }
    setDashboardMonth(nextMonth)
  }

  return (
    <div className={`app-shell view-${view}${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small icon-crest icon-crest--brand icon-crest--compact" aria-hidden="true">
            <MaterialSymbol name="spa" className="text-[18px]" filled />
          </div>
          <div className="brand-text">
            <p className="brand-name">Movi Cloud Spa</p>
            <p className="brand-tagline">Relax. Refresh. Renew.</p>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((prev) => !prev)}
          >
            <MaterialSymbol name="chevron_left" className="text-[18px]" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-section-title">{section.title}</p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item${view === item.id ? ' is-active' : ''}${
                    item.disabled ? ' is-disabled' : ''
                  }`}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      onNav(item.id)
                    }
                  }}
                >
                  <span className="nav-icon icon-crest icon-crest--muted icon-crest--compact">
                    <MaterialSymbol
                      name={item.icon}
                      className="text-[20px]"
                      filled={view === item.id}
                    />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <button
              type="button"
              className="user-pill-main"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Open profile"
            >
              <div className="avatar" aria-hidden="true"></div>
              <div>
                <p>Admin Name</p>
                <span>admin@movi.spa</span>
              </div>
            </button>
            <button
              type="button"
              className="logout-button"
              aria-label="Log out"
              onClick={() => {
                window.location.reload()
              }}
            >
              <MaterialSymbol name="logout" className="text-[16px]" />
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        {showTopbar && (
          <header className={`topbar${isDashboard ? ' dashboard-topbar' : ''}`}>
            {isDashboard ? (
              <>
                <div className="topbar-left">
                  <p className="topbar-title">Dashboard</p>
                  <span className="topbar-pill">Overview</span>
                </div>
                <div className="topbar-right action-popover-anchor">
                  <div className="topbar-search">
                    <MaterialSymbol name="search" className="text-[18px]" />
                    <input
                      type="text"
                      placeholder="Search appointments or clients..."
                      aria-label="Search"
                      value={dashboardSearch}
                      onChange={(event) => setDashboardSearch(event.target.value)}
                    />
                    {dashboardSearch && (
                      <div className="topbar-search-results">
                        {filteredDashboardClients.length === 0 ? (
                          <span>No matching clients</span>
                        ) : (
                          filteredDashboardClients.map((client) => (
                            <button
                              type="button"
                              key={client.id}
                              onClick={() => {
                                onNav('clients')
                                setDashboardSearch('')
                              }}
                            >
                              {client.name}
                              <small>{client.email}</small>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="icon-pill"
                    aria-label="Calendar"
                    onClick={() => {
                      closeNotifications()
                      setIsDashboardCalendarOpen((prev) => !prev)
                      setIsDashboardHistoryOpen(false)
                    }}
                  >
                    <MaterialSymbol name="calendar_month" className="text-[18px]" />
                  </button>
                  <button
                    type="button"
                    className="icon-pill"
                    aria-label="Clock"
                    onClick={() => {
                      closeNotifications()
                      setIsDashboardHistoryOpen((prev) => !prev)
                      setIsDashboardCalendarOpen(false)
                    }}
                  >
                    <MaterialSymbol name="schedule" className="text-[18px]" />
                  </button>
                  <button
                    type="button"
                    className="icon-pill"
                    aria-label="Alerts"
                    onClick={toggleNotifications}
                  >
                    <MaterialSymbol name="notifications" className="text-[18px]" />
                  </button>
                  {isDashboardCalendarOpen && (
                    <CalendarPopover
                      selectedDate={dashboardFilterDate}
                      month={dashboardMonth}
                      year={dashboardYear}
                      onPrev={() => shiftDashboardMonth(-1)}
                      onNext={() => shiftDashboardMonth(1)}
                      onSelectDate={(date) => {
                        setDashboardFilterDate(date)
                        setIsDashboardCalendarOpen(false)
                      }}
                      onClear={() => {
                        setDashboardFilterDate(null)
                        setIsDashboardCalendarOpen(false)
                      }}
                      onClose={() => setIsDashboardCalendarOpen(false)}
                    />
                  )}
                  {isDashboardHistoryOpen && (
                    <HistoryPopover
                      title="Dashboard History"
                      items={filteredDashboardHistory}
                      onClose={() => setIsDashboardHistoryOpen(false)}
                    />
                  )}
                </div>
              </>
            ) : (
              showTopbarText && (
                <div>
                  <p className="topbar-title">{meta.title}</p>
                  <p className="topbar-sub">{meta.subtitle}</p>
                </div>
              )
            )}
          </header>
        )}

        {isNotificationsOpen && (
          <NotificationsPanel
            items={notifications}
            onClose={() => setIsNotificationsOpen(false)}
          />
        )}

        {view === 'dashboard' && (
          <>
            <DashboardPage
              onToggleNotifications={toggleNotifications}
              filterDate={dashboardFilterDate}
            />
          </>
        )}
        {view === 'services' && (
          <ServicesPage onToggleNotifications={toggleNotifications} />
        )}
        {view === 'therapists' && (
          <TherapistsPage
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'staff' && (
          <StaffPage
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'rooms' && (
          <RoomsPage
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'analytics' && (
          <AnalyticsPage
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'insights' && (
          <InsightsPage
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'clients' && (
          <ClientsPage
            clients={clients}
            setClients={setClients}
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'appointments' && (
          <AppointmentsPage
            clients={clients}
            setClients={setClients}
            onToggleNotifications={toggleNotifications}
            onCloseNotifications={closeNotifications}
          />
        )}
        {view === 'offers' && (
          <OffersPage onToggleNotifications={toggleNotifications} />
        )}
        {view === 'settings' && (
          <SettingsPage onToggleNotifications={toggleNotifications} />
        )}
        {view === 'profile' && <ProfilePage />}
      </main>

      {isProfileOpen && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <div>
                <h3>Profile Information</h3>
                <p>Manage your profile identity and admin credentials.</p>
              </div>
              <button type="button" className="profile-save">Save Changes</button>
            </div>

            <section className="profile-card">
              <div className="profile-card-top">
                <div className="profile-avatar"></div>
                <div>
                  <p className="profile-name">Profile Photo</p>
                  <span className="profile-meta">PNG, JPG up to 10MB</span>
                  <div className="profile-actions">
                    <button type="button" className="link-button">Update</button>
                    <button type="button" className="link-button danger">Remove</button>
                  </div>
                </div>
              </div>
              <div className="profile-grid">
                <label>
                  Full Name
                  <input type="text" defaultValue="Julian Montgomery" />
                </label>
                <label>
                  Email Address
                  <input type="email" defaultValue="julian@movi.spa" />
                </label>
                <label>
                  Role
                  <input type="text" defaultValue="Lead Administrator" />
                </label>
                <label>
                  Time Zone
                  <select defaultValue="GMT +5:30 Eastern Time">
                    <option>GMT +5:30 Eastern Time</option>
                    <option>GMT +1:00 Central Europe</option>
                    <option>GMT -5:00 Eastern Time</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-section-head">
                <h4>Spa Operations</h4>
                <p>Customize the environment and booking rules for your sanctuary.</p>
              </div>
              <div className="profile-toggle-row">
                <div>
                  <h5>AI Treatment Recommendations</h5>
                  <span>Suggest rituals based on client history and profile.</span>
                </div>
                <button type="button" className="toggle is-on">
                  <span></span>
                </button>
              </div>
              <div className="profile-toggle-row">
                <div>
                  <h5>Automatic Waitlist</h5>
                  <span>Notify VIP tiers immediately when a slot opens up.</span>
                </div>
                <button type="button" className="toggle is-on">
                  <span></span>
                </button>
              </div>
              <div className="profile-toggle-row">
                <div>
                  <h5>Ambient Audio Integration</h5>
                  <span>Currently playing: Morning Spa (Acoustic Playlist)</span>
                </div>
                <button type="button" className="ghost-button">Configure</button>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-section-head">
                <h4>Notification Channels</h4>
                <p>How would you like to stay connected?</p>
              </div>
              <div className="notification-grid">
                <div className="notification-head">
                  <span>Notification Type</span>
                  <span>Push</span>
                  <span>Email</span>
                  <span>SMS</span>
                </div>
                {[
                  'New Bookings',
                  'Cancellations',
                  'Inventory Alerts',
                ].map((item) => (
                  <div className="notification-row" key={item}>
                    <span>{item}</span>
                    <input type="checkbox" defaultChecked />
                    <input type="checkbox" />
                    <input type="checkbox" />
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card danger-zone">
              <div>
                <h4>Danger Zone</h4>
                <p>Permanently delete your account and all spa data.</p>
              </div>
              <button type="button" className="ghost-button danger">Delete Account</button>
            </section>

            <button
              type="button"
              className="profile-modal-close"
              aria-label="Close"
              onClick={() => setIsProfileOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
