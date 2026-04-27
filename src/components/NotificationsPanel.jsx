export default function NotificationsPanel({ items, onClose }) {
  return (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel-header">
        <div>
          <h4>Notifications</h4>
          <p>{items.length} new updates</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close notifications">
          ✕
        </button>
      </div>
      <div className="notification-panel-list">
        {items.length === 0 ? (
          <p className="notification-panel-empty">You are all caught up.</p>
        ) : (
          items.map((item) => (
            <div className="notification-panel-item" key={item.id}>
              <div>
                <p>{item.title}</p>
                <span>{item.message}</span>
              </div>
              <span className="notification-panel-time">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
