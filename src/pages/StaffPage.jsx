import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/apiClient.js'
import CalendarPopover from '../components/CalendarPopover.jsx'
import HistoryPopover from '../components/HistoryPopover.jsx'
import MaterialSymbol from '../components/MaterialSymbol.jsx'
import usePageHistory from '../hooks/usePageHistory.js'
import { filterByMonth } from '../utils/dateFilter.js'

const DEFAULT_STAFF = [
  {
    id: 1,
    name: 'Elena Rodriguez',
    role: 'Head Esthetician',
    tag: 'Senior',
    status: 'Active Today',
    statusClass: 'active',
    photo_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=400&h=400&q=80',
  },
  {
    id: 2,
    name: 'Marcus Thorne',
    role: 'Sports Massage Specialist',
    tag: 'Lead',
    status: 'In Treatment',
    statusClass: 'treatment',
    photo_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=400&h=400&q=80',
  },
  {
    id: 3,
    name: 'Sasha Chen',
    role: 'Guest Relations Manager',
    tag: 'Front Desk',
    status: 'Shift Started',
    statusClass: 'shift',
    photo_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=400&h=400&q=80',
  },
  {
    id: 4,
    name: 'Julian Vane',
    role: 'Aromatherapy Specialist',
    tag: 'Therapist',
    status: 'Off Duty',
    statusClass: 'off',
    photo_url:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=400&h=400&q=80',
  },
]

const STAFF_PHOTOS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=400&h=400&q=80',
]

export default function StaffPage({ onToggleNotifications, onCloseNotifications }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [staffMembers, setStaffMembers] = useState(DEFAULT_STAFF)
  const [statusMessage, setStatusMessage] = useState('')
  const [filterDate, setFilterDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    placement: 'Therapy',
    email: '',
    phone: '',
    permissions_level: 'Level 2: Standard Staff',
  })

  useEffect(() => {
    apiGet('/api/staff')
      .then((data) => setStaffMembers(data || DEFAULT_STAFF))
      .catch(() => setStaffMembers(DEFAULT_STAFF))
  }, [])

  const visibleStaff = filterByMonth(
    staffMembers.filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate,
    (member) => member.last_active_date || member.created_at
  )

  const staffHistory = usePageHistory('staff', isHistoryOpen)
  const filteredHistory = filterByMonth(staffHistory, filterDate, (item) => item.date)

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

  const handleSaveStaff = async () => {
    setStatusMessage('')
    if (editingStaffId) {
      setStaffMembers((prev) =>
        prev.map((member) =>
          member.id === editingStaffId
            ? {
                ...member,
                name: newStaff.name,
                role: newStaff.role,
                placement: newStaff.placement,
                permissions_level: newStaff.permissions_level,
                last_active_date: new Date().toISOString().slice(0, 10),
              }
            : member
        )
      )
      setEditingStaffId(null)
      setIsOnboardOpen(false)
      setNewStaff({
        name: '',
        role: '',
        placement: 'Therapy',
        email: '',
        phone: '',
        permissions_level: 'Level 2: Standard Staff',
      })
      setStatusMessage('Staff profile updated successfully.')
      return
    }
    try {
      const payload = {
        name: newStaff.name,
        role: newStaff.role,
        tag: 'New',
        status: 'Onboarding',
        placement: newStaff.placement,
        permissions_level: newStaff.permissions_level,
        created_at: new Date().toISOString().slice(0, 10),
        last_active_date: new Date().toISOString().slice(0, 10),
        photo_url: STAFF_PHOTOS[staffMembers.length % STAFF_PHOTOS.length],
      }
      const saved = await apiPost('/api/staff', payload)
      setStaffMembers([...staffMembers, saved])
      setIsOnboardOpen(false)
      setNewStaff({
        name: '',
        role: '',
        placement: 'Therapy',
        email: '',
        phone: '',
        permissions_level: 'Level 2: Standard Staff',
      })
      setStatusMessage('Staff member onboarded successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to onboard staff.')
    }
  }

  const resolveStatusClass = (member) => {
    if (member.statusClass) return member.statusClass
    const status = (member.status || '').toLowerCase()
    if (status.includes('treat')) return 'treatment'
    if (status.includes('shift')) return 'shift'
    if (status.includes('off')) return 'off'
    return 'active'
  }

  const handleEditStaff = () => {
    if (!selectedStaff) return
    setNewStaff({
      name: selectedStaff.name || '',
      role: selectedStaff.role || '',
      placement: selectedStaff.placement || 'Therapy',
      email: selectedStaff.email || '',
      phone: selectedStaff.phone || '',
      permissions_level: selectedStaff.permissions_level || 'Level 2: Standard Staff',
    })
    setEditingStaffId(selectedStaff.id)
    setIsProfileOpen(false)
    setIsOnboardOpen(true)
  }

  const handleDeleteStaff = () => {
    if (!selectedStaff) return
    if (!window.confirm(`Delete ${selectedStaff.name}? This cannot be undone.`)) return
    setStaffMembers((prev) => prev.filter((member) => member.id !== selectedStaff.id))
    setIsProfileOpen(false)
    setSelectedStaff(null)
    setStatusMessage('Staff member removed.')
  }

  const resolvePhoto = (member, index) =>
    member.photo_url || STAFF_PHOTOS[index % STAFF_PHOTOS.length]

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

  return (
    <div className="view-body staff-view">
      <header className="staff-topbar">
        <h2 className="staff-title">Staff</h2>
        <div className="staff-topbar-right action-popover-anchor">
          <div className="staff-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="staff-icon-row">
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
                title="Staff History"
                items={filteredHistory}
                onClose={() => setIsHistoryOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      {statusMessage && <p className="staff-status-message">{statusMessage}</p>}

      <section className="staff-hero">
        <div>
          <p className="staff-eyebrow">Our Dedicated Team</p>
          <h3 className="staff-headline">Nurturing excellence through expert care.</h3>
          <p className="staff-description">
            Meet the professionals behind Movi Cloud Spa. Manage roles, track shift availability,
            and optimize your sanctuary’s service delivery.
          </p>
        </div>
        <button
          type="button"
          className="primary-button staff-cta"
          onClick={() => setIsOnboardOpen(true)}
        >
          <MaterialSymbol name="person_add" className="text-[18px]" />
          Onboard New Staff
        </button>
      </section>

      <section className="staff-grid">
        {visibleStaff.map((member, index) => (
          <article className="staff-card" key={member.id}>
            <div className="staff-card-top">
              <div
                className="staff-photo"
                style={{ backgroundImage: `url(${resolvePhoto(member, index)})` }}
                aria-hidden="true"
              ></div>
              <span className="staff-tag">{member.tag}</span>
            </div>
            <div className="staff-info">
              <h4>{member.name}</h4>
              <p>{member.role}</p>
            </div>
            <div className={`staff-status ${resolveStatusClass(member)}`}>
              <span className="status-dot"></span>
              {member.status}
            </div>
            <button
              type="button"
              className="staff-button"
              onClick={() => {
                setSelectedStaff(member)
                setIsProfileOpen(true)
              }}
            >
              View Profile
            </button>
          </article>
        ))}
      </section>

      {isProfileOpen && selectedStaff && (
        <div className="staff-modal-overlay">
          <div className="staff-modal staff-profile-modal">
            <button
              type="button"
              className="staff-modal-close"
              aria-label="Close"
              onClick={() => {
                setIsProfileOpen(false)
                setSelectedStaff(null)
              }}
            >
              ✕
            </button>
            <div className="staff-modal-content staff-profile-content">
              <aside className="staff-profile-left">
                <div
                  className="staff-profile-photo"
                  style={{
                    backgroundImage: `url(${resolvePhoto(
                      selectedStaff,
                      Math.max(
                        0,
                        staffMembers.findIndex((member) => member.id === selectedStaff.id)
                      )
                    )})`,
                  }}
                ></div>
                <div>
                  <p className="staff-profile-eyebrow">Staff Profile</p>
                  <h3>{selectedStaff.name}</h3>
                  <p className="staff-profile-role">{selectedStaff.role}</p>
                  <div className={`staff-status ${resolveStatusClass(selectedStaff)}`}>
                    <span className="status-dot"></span>
                    {selectedStaff.status}
                  </div>
                </div>
              </aside>
              <section className="staff-profile-details">
                <div className="staff-profile-actions">
                  <button type="button" className="ghost-button" onClick={handleEditStaff}>
                    <MaterialSymbol name="edit" className="text-[16px]" />
                    Edit
                  </button>
                  <button type="button" className="ghost-button danger" onClick={handleDeleteStaff}>
                    <MaterialSymbol name="delete" className="text-[16px]" />
                    Delete
                  </button>
                </div>
                <div className="profile-row">
                  <span>Tag</span>
                  <strong>{selectedStaff.tag || '—'}</strong>
                </div>
                <div className="profile-row">
                  <span>Placement</span>
                  <strong>{selectedStaff.placement || '—'}</strong>
                </div>
                <div className="profile-row">
                  <span>Permissions</span>
                  <strong>{selectedStaff.permissions_level || '—'}</strong>
                </div>
                <div className="profile-row">
                  <span>Last Active</span>
                  <strong>{formatDate(selectedStaff.last_active_date)}</strong>
                </div>
                <div className="profile-row">
                  <span>Created</span>
                  <strong>{formatDate(selectedStaff.created_at)}</strong>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {isOnboardOpen && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <button
              type="button"
              className="staff-modal-close"
              aria-label="Close"
              onClick={() => setIsOnboardOpen(false)}
            >
              ✕
            </button>
            <div className="staff-modal-content">
              <aside className="staff-modal-left">
                <p className="staff-modal-breadcrumb">Staff / Onboard New Staff</p>
                <h3>Expansion of the Sanctuary</h3>
                <p>
                  Adding new talent to our wellness ecosystem ensures the harmony and premium
                  service our guests expect. Please complete the professional dossier for the new
                  staff member.
                </p>
                <div className="staff-modal-checklist">
                  <div className="staff-check-card">
                    <span className="check-icon">
                      <MaterialSymbol name="verified_user" className="text-[18px]" />
                    </span>
                    <div>
                      <h5>Identity Check</h5>
                      <span>Verify legal documentation before finalizing onboard.</span>
                    </div>
                  </div>
                  <div className="staff-check-card">
                    <span className="check-icon">
                      <MaterialSymbol name="lock" className="text-[18px]" />
                    </span>
                    <div>
                      <h5>Secure Access</h5>
                      <span>Permission levels dictate digital vault access.</span>
                    </div>
                  </div>
                </div>
                <div className="staff-philosophy">
                  <div className="staff-philosophy-card">
                    <p className="philosophy-tag">Our Philosophy</p>
                    <p className="philosophy-quote">“Peace is the foundation of all we build.”</p>
                    <p className="philosophy-brand">Movi Cloud Spa Culture</p>
                  </div>
                </div>
              </aside>
              <section className="staff-modal-form">
                <form
                  className="staff-form-card"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleSaveStaff()
                  }}
                >
                  <h4>Professional Identity</h4>
                  <div className="staff-form-row">
                    <label>
                      Legal Full Name
                      <input
                        type="text"
                        placeholder="e.g. Julian Thorne"
                        value={newStaff.name}
                        onChange={(event) => setNewStaff({ ...newStaff, name: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Professional Role
                      <input
                        type="text"
                        placeholder="e.g. Senior Esthetician"
                        value={newStaff.role}
                        onChange={(event) => setNewStaff({ ...newStaff, role: event.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <h4>Sanctuary Placement</h4>
                  <div className="staff-placement">
                    <button
                      type="button"
                      className={newStaff.placement === 'Front Desk' ? 'placement-card is-active' : 'placement-card'}
                      onClick={() => setNewStaff({ ...newStaff, placement: 'Front Desk' })}
                    >
                      <MaterialSymbol name="support_agent" className="text-[18px]" />
                      Front Desk
                    </button>
                    <button
                      type="button"
                      className={newStaff.placement === 'Therapy' ? 'placement-card is-active' : 'placement-card'}
                      onClick={() => setNewStaff({ ...newStaff, placement: 'Therapy' })}
                    >
                      <MaterialSymbol name="spa" className="text-[18px]" />
                      Therapy
                    </button>
                    <button
                      type="button"
                      className={newStaff.placement === 'Cleaning' ? 'placement-card is-active' : 'placement-card'}
                      onClick={() => setNewStaff({ ...newStaff, placement: 'Cleaning' })}
                    >
                      <MaterialSymbol name="cleaning_services" className="text-[18px]" />
                      Cleaning
                    </button>
                  </div>

                  <div className="staff-form-row">
                    <label>
                      Email Address
                      <input
                        type="email"
                        placeholder="julian@sanctuary.com"
                        value={newStaff.email}
                        onChange={(event) => setNewStaff({ ...newStaff, email: event.target.value })}
                      />
                    </label>
                    <label>
                      Contact Phone
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={newStaff.phone}
                        onChange={(event) => setNewStaff({ ...newStaff, phone: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="staff-permissions">
                    <div className="permissions-head">
                      <span>Permissions Level</span>
                      <span className="permission-pill">{newStaff.permissions_level}</span>
                    </div>
                    <div className="permissions-bar">
                      <span></span>
                    </div>
                    <div className="permissions-labels">
                      <span>Trainee</span>
                      <span>Staff</span>
                      <span>Manager</span>
                      <span>Executive</span>
                    </div>
                  </div>

                  <div className="staff-form-footer">
                    {statusMessage && <p className="staff-status-message">{statusMessage}</p>}
                    <p>
                      By initiating onboarding, you agree to generate a digital credential and
                      welcome sequence for the new member.
                    </p>
                    <button type="submit" className="primary-button">
                      Onboard Staff
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
