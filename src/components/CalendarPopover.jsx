import { useMemo } from 'react'
import MaterialSymbol from './MaterialSymbol.jsx'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const startIndex = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startIndex; i += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }
  return cells
}

export default function CalendarPopover({
  selectedDate,
  month,
  year,
  onPrev,
  onNext,
  onSelectDate,
  onClear,
  onClose,
}) {
  const cells = useMemo(() => buildCalendar(year, month), [year, month])
  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="popover calendar-popover" role="dialog" aria-label="Calendar">
      <div className="popover-header">
        <div>
          <h4>{monthLabel}</h4>
          <p>Select a date to filter</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close calendar">
          ✕
        </button>
      </div>
      <div className="calendar-nav-row">
        <button type="button" onClick={onPrev} aria-label="Previous month">
          <MaterialSymbol name="chevron_left" className="text-[16px]" />
        </button>
        <button type="button" onClick={onNext} aria-label="Next month">
          <MaterialSymbol name="chevron_right" className="text-[16px]" />
        </button>
        <button type="button" className="calendar-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="calendar-day empty" />
          }
          const isSelected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year
          return (
            <button
              type="button"
              key={`day-${day}`}
              className={`calendar-day${isSelected ? ' is-selected' : ''}`}
              onClick={() => onSelectDate(new Date(year, month, day))}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
