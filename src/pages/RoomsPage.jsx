import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/apiClient.js'
import CalendarPopover from '../components/CalendarPopover.jsx'
import HistoryPopover from '../components/HistoryPopover.jsx'
import MaterialSymbol from '../components/MaterialSymbol.jsx'
import usePageHistory from '../hooks/usePageHistory.js'
import { filterByMonth } from '../utils/dateFilter.js'

const DEFAULT_ROOMS = [
  {
    id: 1,
    name: 'The Zen Suite',
    type: 'Oriental Therapy',
    status: 'Available',
    statusClass: 'available',
    meta: ['24C', 'Purified'],
    imageClass: 'zen',
    photo_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Garden Alcove',
    type: 'Aromatherapy',
    status: 'Occupied',
    statusClass: 'occupied',
    meta: ['15m left', 'Lavender Mist'],
    imageClass: 'garden',
    photo_url:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Azure Pool',
    type: 'Hydrotherapy',
    status: 'Available',
    statusClass: 'available',
    meta: ['38C', 'Ready'],
    imageClass: 'pool',
    photo_url:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'Salt Haven',
    type: 'Halotherapy',
    status: 'Cleaning',
    statusClass: 'cleaning',
    meta: ['45% Hum.', 'Silent'],
    imageClass: 'salt',
    photo_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    name: 'Lotus Duet',
    type: 'Couples Therapy',
    status: 'Occupied',
    statusClass: 'occupied',
    meta: ['2 Guests', '45m left'],
    imageClass: 'lotus',
    photo_url:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    name: 'Lumina Clinic',
    type: 'Facial Aesthetics',
    status: 'Available',
    statusClass: 'available',
    meta: ['UV Sterilized', 'Equipped'],
    imageClass: 'clinic',
    photo_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
  },
]

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80',
]

export default function RoomsPage({ onToggleNotifications, onCloseNotifications }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [rooms, setRooms] = useState(DEFAULT_ROOMS)
  const [statusMessage, setStatusMessage] = useState('')
  const [filterDate, setFilterDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'Massage',
    status: 'Available',
    notes: '',
  })

  useEffect(() => {
    apiGet('/api/rooms')
      .then((data) => setRooms(data || DEFAULT_ROOMS))
      .catch(() => setRooms(DEFAULT_ROOMS))
  }, [])

  const visibleRooms = filterByMonth(
    rooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase())),
    filterDate,
    (room) => room.updated_at
  )

  const totalRooms = rooms.length
  const activeRooms = rooms.filter((room) => {
    const status = (room.status || '').toLowerCase()
    return status.includes('available') || status.includes('occup')
  }).length

  const roomsHistory = usePageHistory('rooms', isHistoryOpen)
  const filteredHistory = filterByMonth(roomsHistory, filterDate, (item) => item.date)

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

  const resolveStatusClass = (status) => {
    if (!status) return 'available'
    const normalized = status.toLowerCase()
    if (normalized.includes('occup')) return 'occupied'
    if (normalized.includes('clean')) return 'cleaning'
    return 'available'
  }

  const resolveImageClass = (room, index) => {
    if (room.imageClass) return room.imageClass
    return ['zen', 'garden', 'pool', 'salt', 'lotus', 'clinic'][index % 6]
  }

  const resolveRoomImage = (room, index) =>
    room.photo_url || ROOM_IMAGES[index % ROOM_IMAGES.length]

  const handleAddRoom = async () => {
    setStatusMessage('')
    try {
      const payload = {
        name: newRoom.name,
        type: newRoom.type,
        status: newRoom.status,
        meta: newRoom.notes ? [newRoom.notes] : [],
        updated_at: new Date().toISOString().slice(0, 10),
        photo_url: ROOM_IMAGES[rooms.length % ROOM_IMAGES.length],
      }
      const saved = await apiPost('/api/rooms', payload)
      setRooms([...rooms, saved])
      setNewRoom({ name: '', type: 'Massage', status: 'Available', notes: '' })
      setIsAddOpen(false)
      setStatusMessage('Room added successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to add room.')
    }
  }

  return (
    <div className="view-body rooms-view">
      <header className="rooms-topbar">
        <div className="rooms-topbar-left">
          <h2>Rooms</h2>
          <span className="rooms-location">
            <MaterialSymbol name="location_on" className="text-[14px]" />
            Main Sanctuary Wing
          </span>
        </div>
        <div className="rooms-topbar-right action-popover-anchor">
          <div className="rooms-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search facilities..."
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
              title="Rooms History"
              items={filteredHistory}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </div>
      </header>

      {statusMessage && <p className="rooms-status">{statusMessage}</p>}

      <section className="rooms-hero">
        <div>
          <h3>Space & Serenity</h3>
          <p>
            Manage your treatment sanctuaries. Each room is designed for specific modalities,
            from hydrotherapy to deep tissue massage.
          </p>
        </div>
        <div className="rooms-stats">
          <div className="stat-card">
            <span>Total Rooms</span>
            <strong>{String(totalRooms).padStart(2, '0')}</strong>
          </div>
          <div className="stat-card dark">
            <span>Active Now</span>
            <strong>{String(activeRooms).padStart(2, '0')}</strong>
          </div>
        </div>
      </section>

      <section className="rooms-grid">
        {visibleRooms.map((room, index) => (
          <article className="room-card" key={room.id}>
            <div
              className={`room-media ${resolveImageClass(room, index)}`}
              style={{ backgroundImage: `url(${resolveRoomImage(room, index)})` }}
              aria-hidden="true"
            ></div>
            <div className="room-body">
              <div>
                <h4>{room.name}</h4>
                <p>{room.type}</p>
              </div>
              <span className={`room-status ${resolveStatusClass(room.status)}`}>{room.status}</span>
            </div>
            {room.meta && (
              <div className="room-meta">
                {room.meta.map((item) => (
                  <span className="meta-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <button
        type="button"
        className="rooms-fab"
        aria-label="Add room"
        onClick={() => setIsAddOpen(true)}
      >
        <MaterialSymbol name="add" className="text-[22px]" />
      </button>

      {isAddOpen && (
        <div className="rooms-modal-overlay">
          <div className="rooms-modal">
            <div className="rooms-modal-header">
              <div>
                <h3>Add New Room</h3>
                <p>Configure a new treatment or wellness space.</p>
              </div>
              <button
                type="button"
                className="rooms-modal-close"
                aria-label="Close"
                onClick={() => setIsAddOpen(false)}
              >
                ✕
              </button>
            </div>
            <form
              className="rooms-modal-body"
              onSubmit={(event) => {
                event.preventDefault()
                handleAddRoom()
              }}
            >
              <label>
                Room Name
                <input
                  type="text"
                  placeholder="e.g., Lotus Suite"
                  value={newRoom.name}
                  onChange={(event) => setNewRoom({ ...newRoom, name: event.target.value })}
                  required
                />
              </label>
              <div className="rooms-modal-row">
                <label>
                  Type
                  <select
                    value={newRoom.type}
                    onChange={(event) => setNewRoom({ ...newRoom, type: event.target.value })}
                  >
                    <option>Massage</option>
                    <option>Hydrotherapy</option>
                    <option>Facial</option>
                    <option>Couples</option>
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={newRoom.status}
                    onChange={(event) => setNewRoom({ ...newRoom, status: event.target.value })}
                  >
                    <option>Available</option>
                    <option>Occupied</option>
                    <option>Cleaning</option>
                  </select>
                </label>
              </div>
              <label>
                Notes
                <textarea
                  rows={4}
                  placeholder="Mention specific equipment or maintenance schedules..."
                  value={newRoom.notes}
                  onChange={(event) => setNewRoom({ ...newRoom, notes: event.target.value })}
                />
              </label>
              {statusMessage && <p className="rooms-status">{statusMessage}</p>}
              <div className="rooms-modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
