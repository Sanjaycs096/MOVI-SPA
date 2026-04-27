import ClientsView from '../frontend/clients.jsx'

export default function ClientsPage({
  clients,
  setClients,
  onToggleNotifications,
  onCloseNotifications,
}) {
  return (
    <ClientsView
      clients={clients}
      setClients={setClients}
      onToggleNotifications={onToggleNotifications}
      onCloseNotifications={onCloseNotifications}
    />
  )
}
