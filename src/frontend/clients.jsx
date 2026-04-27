import { useMemo, useState } from 'react'
import { apiPost } from '../api/apiClient.js'
import CalendarPopover from '../components/CalendarPopover.jsx'
import HistoryPopover from '../components/HistoryPopover.jsx'
import MaterialSymbol from '../components/MaterialSymbol.jsx'
import usePageHistory from '../hooks/usePageHistory.js'
import { filterByMonth } from '../utils/dateFilter.js'

export default function ClientsView({
  clients,
  setClients,
  onToggleNotifications,
  onCloseNotifications,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [filterDate, setFilterDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [editClient, setEditClient] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    preferences: '',
    status: 'Active',
  })
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    preferences: '',
    status: 'Active',
  })


  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const clientsWithMeta = clients.map((client) => {
    const latestVisit = client.appointmentHistory?.[0]
    const visitDate = client.last_visit_date || latestVisit?.date || client.created_at
    const lastVisitDate = formatDate(visitDate)
    const lastVisitService = latestVisit?.service || client.preferences || '—'
    return {
      ...client,
      lastVisitDate,
      lastVisitService,
      visitDate,
    }
  })

  const filteredClients = clientsWithMeta.filter((client) => {
    const matchesSearch =
      searchTerm === '' ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const normalizedStatus = (client.status || '').toLowerCase()
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter
    const ageValue = Number.parseInt(client.age, 10)
    const minAgeValue = minAge ? Number.parseInt(minAge, 10) : null
    const maxAgeValue = maxAge ? Number.parseInt(maxAge, 10) : null
    const hasValidAge = !Number.isNaN(ageValue)
    const withinMin = minAgeValue === null || (hasValidAge && ageValue >= minAgeValue)
    const withinMax = maxAgeValue === null || (hasValidAge && ageValue <= maxAgeValue)
    const matchesAge = withinMin && withinMax
    return matchesSearch && matchesStatus && matchesAge
  })

  const dateFilteredClients = useMemo(
    () => filterByMonth(filteredClients, filterDate, (client) => client.visitDate),
    [filteredClients, filterDate]
  )

  const clientsHistory = usePageHistory('clients', isHistoryOpen)
  const filteredHistory = filterByMonth(clientsHistory, filterDate, (item) => item.date)

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

  const handleViewClient = (client) => {
    setSelectedClient(client)
    setIsViewModalOpen(true)
  }

  const handleAddClient = () => {
    setIsAddModalOpen(true)
  }

  const handleEditClient = (client) => {
    setEditClient(client)
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      age: client.age || '',
      preferences: client.preferences || '',
      status: client.status || 'Active',
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editClient) return
    const updated = {
      ...editClient,
      ...editForm,
    }
    setClients(clients.map((client) => (client.id === editClient.id ? updated : client)))
    setIsEditModalOpen(false)
    setEditClient(null)
    setStatusMessage('Client updated successfully.')
  }

  const handleDeleteClient = (client) => {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return
    setClients(clients.filter((item) => item.id !== client.id))
    setStatusMessage('Client removed.')
  }

  const handleSaveNewClient = async () => {
    setStatusMessage('')
    try {
      const payload = {
        ...newClient,
        appointment_history: [],
        payment_history: [],
        created_at: new Date().toISOString().slice(0, 10),
      }
      const saved = await apiPost('/api/clients', payload)
      const normalized = {
        ...saved,
        appointmentHistory: saved.appointmentHistory || saved.appointment_history || [],
        paymentHistory: saved.paymentHistory || saved.payment_history || [],
      }
      setClients([...clients, normalized])
      setNewClient({ name: '', email: '', phone: '', address: '', age: '', preferences: '', status: 'Active' })
      setIsAddModalOpen(false)
      setStatusMessage('Client added successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to add client.')
    }
  }

  return (
    <div className="view-body clients-view">
      <header className="clients-header">
        <div className="clients-header-left">
          <h2 className="clients-title">Clients</h2>
        </div>
        <div className="clients-header-right action-popover-anchor">
          <div className="clients-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search client directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="clients-icon-row">
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
                title="Clients History"
                items={filteredHistory}
                onClose={() => setIsHistoryOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      <section className="clients-toolbar">
        <div className="clients-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
          >
            <MaterialSymbol name="tune" className="text-[16px]" />
            More Filters
          </button>
          <button type="button" className="primary-button" onClick={handleAddClient}>
            <MaterialSymbol name="person_add" className="text-[18px]" />
            New Client
          </button>
        </div>
      </section>

      {isFilterPanelOpen && (
        <section className="clients-filters-panel">
          <div className="filter-field">
            <label htmlFor="client-status-filter">Status</label>
            <select
              id="client-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="client-age-min">Min age</label>
            <input
              id="client-age-min"
              type="number"
              min="0"
              value={minAge}
              onChange={(event) => setMinAge(event.target.value)}
              placeholder="e.g. 21"
            />
          </div>
          <div className="filter-field">
            <label htmlFor="client-age-max">Max age</label>
            <input
              id="client-age-max"
              type="number"
              min="0"
              value={maxAge}
              onChange={(event) => setMaxAge(event.target.value)}
              placeholder="e.g. 55"
            />
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setStatusFilter('all')
                setMinAge('')
                setMaxAge('')
              }}
            >
              Clear
            </button>
          </div>
        </section>
      )}

      <section className="clients-card">
        {statusMessage && <p className="clients-status">{statusMessage}</p>}
        <div className="clients-table">
          <div className="clients-table-head">
            <span>Client Name</span>
            <span>Contact Info</span>
            <span>Last Visit</span>
            <span>Actions</span>
          </div>
          <div className="clients-table-body">
            {dateFilteredClients.length === 0 ? (
              <div className="clients-empty-row">
                <span colSpan="4">No clients found.</span>
              </div>
            ) : (
              dateFilteredClients.map((client) => (
                <div className="clients-table-row" key={client.id}>
                  <div className="clients-table-cell client-name-cell">
                    <div className="client-avatar">
                      {client.name.charAt(0)}
                    </div>
                    <div className="client-name-info">
                      <p className="client-name">{client.name}</p>
                      <p className="client-id">ID: MS-{String(client.id).padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className="clients-table-cell contact-info-cell">
                    <div className="contact-info">
                      <p className="contact-item">
                        <MaterialSymbol name="phone" className="text-[14px]" />
                        {client.phone}
                      </p>
                      <p className="contact-item">
                        <MaterialSymbol name="email" className="text-[14px]" />
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <div className="clients-table-cell last-visit-cell">
                    <div className="last-visit-info">
                      <p className="visit-date">{client.lastVisitDate}</p>
                      <p className="visit-service">{client.lastVisitService}</p>
                    </div>
                  </div>
                  <div className="clients-table-cell actions-cell">
                    <div className="client-actions">
                      <span className={`client-status ${(client.status || '').toLowerCase()}`}>
                        {client.status || 'Active'}
                      </span>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="action-btn view-btn"
                          aria-label={`View ${client.name}`}
                          onClick={() => handleViewClient(client)}
                          title="View client"
                        >
                          <MaterialSymbol name="visibility" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          aria-label={`Edit ${client.name}`}
                          onClick={() => handleEditClient(client)}
                          title="Edit client"
                        >
                          <MaterialSymbol name="edit" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          aria-label={`Delete ${client.name}`}
                          onClick={() => handleDeleteClient(client)}
                          title="Delete client"
                        >
                          <MaterialSymbol name="delete" className="text-[16px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="clients-footer">
          <p>
            Showing 1 to {Math.min(dateFilteredClients.length, 10)} of {dateFilteredClients.length}{' '}
            clients
          </p>
          <div className="pagination">
            <button type="button" className="page-arrow" aria-label="Previous">
              <MaterialSymbol name="chevron_left" className="text-[18px]" />
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                className={`page-number${page === 1 ? ' is-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button type="button" className="page-arrow" aria-label="Next">
              <MaterialSymbol name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </section>

      {/* View Client Modal */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-4xl h-[calc(100vh-100px)] overflow-hidden rounded-[28px] bg-white shadow-[0_28px_60px_rgba(31,77,62,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[13px] uppercase tracking-[1.3px] text-muted">Client Profile</p>
                <h3 className="text-[26px] font-semibold">{selectedClient.name}</h3>
              </div>
              <button
                type="button"
                className="text-muted transition hover:text-ink"
                onClick={() => setIsViewModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Personal Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedClient.name}</p>
                    <p><strong>Email:</strong> {selectedClient.email}</p>
                    <p><strong>Phone:</strong> {selectedClient.phone}</p>
                    <p><strong>Address:</strong> {selectedClient.address}</p>
                    <p><strong>Age:</strong> {selectedClient.age}</p>
                    <p><strong>Preferences:</strong> {selectedClient.preferences}</p>
                    <p><strong>Status:</strong> {selectedClient.status}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Appointment History</h4>
                  <div className="space-y-2">
                    {selectedClient.appointmentHistory.map((appt, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm"><strong>Date:</strong> {appt.date}</p>
                        <p className="text-sm"><strong>Service:</strong> {appt.service}</p>
                        <p className="text-sm"><strong>Status:</strong> {appt.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Payment History</h4>
                <div className="space-y-2">
                  {selectedClient.paymentHistory.map((pay, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm"><strong>Date:</strong> {pay.date}</p>
                      <p className="text-sm"><strong>Amount:</strong> ₹{pay.amount}</p>
                      <p className="text-sm"><strong>Status:</strong> {pay.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && editClient && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
          <div className="client-modal">
            <header className="client-modal-header">
              <div>
                <p className="client-modal-breadcrumb">Clients / Edit</p>
                <h3 className="client-modal-title">Edit Client</h3>
                <p className="client-modal-subtitle">Update guest details and preferences.</p>
              </div>
              <button
                type="button"
                className="client-modal-close"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="client-modal-card">
              <div className="client-modal-divider"></div>
              <form
                className="client-modal-grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSaveEdit()
                }}
              >
                <section className="client-modal-section">
                  <h4>Personal Details</h4>
                  <label>
                    Full Name
                    <input
                      value={editForm.name}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Phone Number
                    <input
                      value={editForm.phone}
                      onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={editForm.address}
                      onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
                    />
                  </label>
                </section>

                <section className="client-modal-section">
                  <h4>Preferences</h4>
                  <label>
                    Age
                    <input
                      type="number"
                      min="0"
                      value={editForm.age}
                      onChange={(event) => setEditForm({ ...editForm, age: event.target.value })}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={editForm.status}
                      onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="client-modal-textarea">
                    Appointment Notes & Preferences
                    <textarea
                      rows={4}
                      value={editForm.preferences}
                      onChange={(event) =>
                        setEditForm({ ...editForm, preferences: event.target.value })
                      }
                    />
                  </label>
                </section>
                <div className="client-modal-actions">
                  <button type="button" className="ghost-button" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
          <div className="client-modal">
            <header className="client-modal-header">
              <div>
                <p className="client-modal-breadcrumb">Clients / Registration</p>
                <h3 className="client-modal-title">New Client Registration</h3>
                <p className="client-modal-subtitle">
                  Create a personalized profile for a new guest in the Sanctuary ecosystem.
                </p>
              </div>
              <button
                type="button"
                className="client-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="client-modal-card">
              <div className="client-modal-divider"></div>
              <form
                className="client-modal-grid"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveNewClient()
                }}
              >
                <section className="client-modal-section">
                  <h4>Personal Details</h4>
                  <label>
                    Full Name
                    <input
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Phone Number
                    <input
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      required
                    />
                  </label>
                  <div className="client-modal-radio">
                    <p>Preferred Contact Method</p>
                    <label>
                      <input type="radio" name="contact" defaultChecked />
                      Email
                    </label>
                    <label>
                      <input type="radio" name="contact" />
                      SMS
                    </label>
                  </div>
                </section>

                <section className="client-modal-section">
                  <h4>Additional Information</h4>
                  <label className="client-modal-textarea">
                    Appointment Notes & Preferences
                    <textarea
                      rows={4}
                      value={newClient.preferences}
                      onChange={(e) => setNewClient({ ...newClient, preferences: e.target.value })}
                    />
                  </label>
                </section>
                <div className="client-modal-actions">
                  <button type="button" className="ghost-button" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Create Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
