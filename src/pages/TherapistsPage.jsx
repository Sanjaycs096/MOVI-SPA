import TherapistManagement from '../frontend/TherapistManagement.jsx'

export default function TherapistsPage({ onToggleNotifications, onCloseNotifications }) {
  return (
    <TherapistManagement
      onToggleNotifications={onToggleNotifications}
      onCloseNotifications={onCloseNotifications}
    />
  )
}
