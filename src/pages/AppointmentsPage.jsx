import AppointmentsView from '../frontend/AppointmentsPage.jsx'

export default function AppointmentsPage({
  clients,
  setClients,
  onToggleNotifications,
  onCloseNotifications,
}) {
  return (
    <AppointmentsView
      clients={clients}
      setClients={setClients}
      onToggleNotifications={onToggleNotifications}
      onCloseNotifications={onCloseNotifications}
    />
  )
}
