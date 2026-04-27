export default function HistoryPopover({ title, items, onClose }) {
  return (
    <div className="popover history-popover" role="dialog" aria-label="Recent history">
      <div className="popover-header">
        <div>
          <h4>{title}</h4>
          <p>Recent work history</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close history">
          ✕
        </button>
      </div>
      <div className="history-list">
        {items.length === 0 ? (
          <p className="history-empty">No recent history found.</p>
        ) : (
          items.map((item) => (
            <div className="history-item" key={item.id || item.title}>
              <div>
                <p>{item.title}</p>
                <span>{item.message}</span>
              </div>
              <span className="history-time">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
