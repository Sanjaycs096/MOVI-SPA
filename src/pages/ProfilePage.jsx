import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../api/apiClient.js'

const DEFAULT_PROFILE = {
  name: 'Admin Name',
  email: 'admin@movi.spa',
  phone: '+1 (555) 000-0000',
  role: 'Lead Administrator',
  timezone: 'GMT +5:30 Eastern Time',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [settingsSnapshot, setSettingsSnapshot] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    apiGet('/api/settings')
      .then((data) => {
        if (!data) return
        setSettingsSnapshot(data)
        setProfile((prev) => ({
          ...prev,
          name: data.account?.name || prev.name,
          email: data.account?.email || prev.email,
          phone: data.account?.phone || prev.phone,
        }))
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setStatusMessage('')
    if (!settingsSnapshot) {
      setStatusMessage('Settings not loaded yet.')
      return
    }

    try {
      const updated = {
        ...settingsSnapshot,
        account: {
          ...settingsSnapshot.account,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        },
      }
      await apiPut('/api/settings', updated)
      setStatusMessage('Profile updated successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update profile.')
    }
  }

  return (
    <div className="view-body profile-page">
      {statusMessage && <p className="profile-status">{statusMessage}</p>}
      <div className="profile-page-header">
        <div>
          <h2>Profile Information</h2>
          <p>Manage your profile identity and admin credentials.</p>
        </div>
        <button type="button" className="profile-save" onClick={handleSave}>
          Save Changes
        </button>
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
            <input
              type="text"
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            />
          </label>
          <label>
            Email Address
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </label>
          <label>
            Role
            <input
              type="text"
              value={profile.role}
              onChange={(event) => setProfile({ ...profile, role: event.target.value })}
            />
          </label>
          <label>
            Time Zone
            <select
              value={profile.timezone}
              onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}
            >
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
          {['New Bookings', 'Cancellations', 'Inventory Alerts'].map((item) => (
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
    </div>
  )
}
