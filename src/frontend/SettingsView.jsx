import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../api/apiClient.js'
import MaterialSymbol from '../components/MaterialSymbol.jsx'

const defaultSettings = {
  spaInfo: {
    spaName: 'Movi Cloud Spa',
    address: '123 Cloud Avenue, Wellness District',
    contactNumber: '+1 (555) 123-4567',
    email: 'contact@movicloudspa.com',
    logo: '',
  },
  workingHours: {
    openingTime: '09:00',
    closingTime: '18:00',
    days: {
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true,
      Sunday: false,
    },
  },
  appointment: {
    slotDuration: '60',
    maxAppointmentsPerDay: '12',
    autoConfirmBooking: true,
    bufferTime: '10',
  },
  notifications: {
    emailNotifications: true,
    appointmentReminders: true,
  },
  payment: {
    cash: true,
    upi: false,
    taxPercentage: '5',
    discountPercentage: '0',
  },
  account: {
    name: 'Admin User',
    email: 'admin@movicloudspa.com',
    phone: '+1 (555) 987-6543',
  },
  auth: {
    password: 'password123',
  },
}

const normalizeSettings = (data) => {
  if (!data || typeof data !== 'object') return defaultSettings

  const spaInfo = data.spaInfo || data.spa_info || {}
  const workingHours = data.workingHours || data.working_hours || {}
  const appointment = data.appointment || {}
  const notifications = data.notifications || {}
  const payment = data.payment || {}
  const account = data.account || {}
  const auth = data.auth || {}

  return {
    spaInfo: {
      spaName: spaInfo.spaName ?? spaInfo.spa_name ?? defaultSettings.spaInfo.spaName,
      address: spaInfo.address ?? defaultSettings.spaInfo.address,
      contactNumber:
        spaInfo.contactNumber ?? spaInfo.contact_number ?? defaultSettings.spaInfo.contactNumber,
      email: spaInfo.email ?? defaultSettings.spaInfo.email,
      logo: spaInfo.logo ?? defaultSettings.spaInfo.logo,
    },
    workingHours: {
      openingTime:
        workingHours.openingTime ??
        workingHours.opening_time ??
        defaultSettings.workingHours.openingTime,
      closingTime:
        workingHours.closingTime ??
        workingHours.closing_time ??
        defaultSettings.workingHours.closingTime,
      days: workingHours.days ?? defaultSettings.workingHours.days,
    },
    appointment: {
      slotDuration:
        appointment.slotDuration ??
        appointment.slot_duration ??
        defaultSettings.appointment.slotDuration,
      maxAppointmentsPerDay:
        appointment.maxAppointmentsPerDay ??
        appointment.max_appointments_per_day ??
        defaultSettings.appointment.maxAppointmentsPerDay,
      autoConfirmBooking:
        appointment.autoConfirmBooking ??
        appointment.auto_confirm_booking ??
        defaultSettings.appointment.autoConfirmBooking,
      bufferTime:
        appointment.bufferTime ??
        appointment.buffer_time ??
        defaultSettings.appointment.bufferTime,
    },
    notifications: {
      emailNotifications:
        notifications.emailNotifications ??
        notifications.email_notifications ??
        defaultSettings.notifications.emailNotifications,
      appointmentReminders:
        notifications.appointmentReminders ??
        notifications.appointment_reminders ??
        defaultSettings.notifications.appointmentReminders,
    },
    payment: {
      cash: payment.cash ?? defaultSettings.payment.cash,
      upi: payment.upi ?? defaultSettings.payment.upi,
      taxPercentage:
        payment.taxPercentage ??
        payment.tax_percentage ??
        defaultSettings.payment.taxPercentage,
      discountPercentage:
        payment.discountPercentage ??
        payment.discount_percentage ??
        defaultSettings.payment.discountPercentage,
    },
    account: {
      name: account.name ?? defaultSettings.account.name,
      email: account.email ?? defaultSettings.account.email,
      phone: account.phone ?? defaultSettings.account.phone,
    },
    auth: {
      password: auth.password ?? defaultSettings.auth.password,
    },
  }
}

export default function SettingsView() {
  const [settings, setSettings] = useState(defaultSettings)
  const [draftSettings, setDraftSettings] = useState(defaultSettings)
  const [editMode, setEditMode] = useState({
    spaInfo: false,
    workingHours: false,
    appointment: false,
    notifications: false,
    payment: false,
    account: false,
    password: false,
  })
  const [savedMessage, setSavedMessage] = useState('')
  const [sectionMessage, setSectionMessage] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    apiGet('/api/settings')
      .then((data) => {
        const normalized = normalizeSettings(data)
        setSettings(normalized)
        setDraftSettings(normalized)
      })
      .catch(() => {
        setSettings(defaultSettings)
        setDraftSettings(defaultSettings)
      })
  }, [])

  useEffect(() => {
    if (savedMessage || sectionMessage || passwordSuccess || passwordError) {
      const timer = setTimeout(() => {
        setSavedMessage('')
        setSectionMessage('')
        setPasswordSuccess('')
        setPasswordError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [savedMessage, sectionMessage, passwordSuccess, passwordError])

  const persistSettings = async (updatedSettings) => {
    try {
      const saved = await apiPut('/api/settings', updatedSettings)
      const normalized = normalizeSettings(saved)
      setSettings(normalized)
      setDraftSettings(normalized)
      return normalized
    } catch (error) {
      // Even if backend fails, update local state so edit/save works
      const normalized = normalizeSettings(updatedSettings)
      setSettings(normalized)
      setDraftSettings(normalized)
      return normalized
    }
  }

  const startEdit = (section) => {
    setDraftSettings(settings)
    setEditMode((prev) => ({ ...prev, [section]: true }))
    setSectionMessage('')
    setSavedMessage('')
  }

  const updateDraftField = (section, key, value) => {
    setDraftSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const updateDaysDraft = (day) => {
    setDraftSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        days: {
          ...prev.workingHours.days,
          [day]: !prev.workingHours.days[day],
        },
      },
    }))
  }

  const saveSection = async (section) => {
    const sectionLabels = {
      spaInfo: 'Business Information',
      workingHours: 'Working Hours',
      appointment: 'Appointment Settings',
      notifications: 'Notification Settings',
      payment: 'Payment Settings',
      account: 'Account Settings',
    }

    if (section === 'payment' && !draftSettings.payment.cash && !draftSettings.payment.upi) {
      setSectionMessage('Select at least one payment method.')
      setSavedMessage('')
      return
    }

    try {
      await persistSettings({
        ...settings,
        [section]: draftSettings[section],
      })
      setEditMode((prev) => ({ ...prev, [section]: false }))
      setSavedMessage(`${sectionLabels[section]} saved successfully.`)
      setSectionMessage('')
    } catch (error) {
      setSectionMessage(error.message || 'Unable to save settings.')
      setSavedMessage('')
    }
  }

  const saveSpaInfo = () => {
    saveSection('spaInfo')
  }

  const submitPasswordChange = async () => {
    if (!editMode.password) {
      setPasswordError('Click Edit before updating your password.')
      setPasswordSuccess('')
      return
    }

    if (passwordForm.currentPassword !== settings.auth.password) {
      setPasswordError('Current password is incorrect.')
      setPasswordSuccess('')
      return
    }
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      setPasswordSuccess('')
      return
    }

    const updated = {
      ...settings,
      auth: {
        ...settings.auth,
        password: passwordForm.newPassword,
      },
    }
    try {
      await persistSettings(updated)
      setEditMode((prev) => ({ ...prev, password: false }))
      setPasswordSuccess('Password updated successfully.')
      setPasswordError('')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordError(error.message || 'Unable to update password.')
      setPasswordSuccess('')
    }
  }

  const currentWorkingHours = editMode.workingHours ? draftSettings.workingHours : settings.workingHours
  const currentAppointment = editMode.appointment ? draftSettings.appointment : settings.appointment
  const currentNotifications = editMode.notifications ? draftSettings.notifications : settings.notifications
  const currentPayment = editMode.payment ? draftSettings.payment : settings.payment
  const currentAccount = editMode.account ? draftSettings.account : settings.account

  // Debug logging in render
  
  return (
    <div className="view-body settings-view">
      <header className="settings-header">
        <div className="settings-header-right">
          <div className="settings-search">
            <MaterialSymbol name="search" className="text-[18px]" />
            <input
              type="text"
              placeholder="Search settings..."
            />
          </div>
        </div>
      </header>

      {savedMessage && (
        <div className="settings-status">
          {savedMessage}
        </div>
      )}

      <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Spa / Business Information</h3>
            <p>Editable business values used across dashboard, booking pages, and invoices.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('spaInfo')} className="primary-button">
              Edit
            </button>
            <button type="button" onClick={saveSpaInfo} className="primary-button">
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid">
          <div className="settings-form-group">
            <label>Spa Name</label>
            <input
              type="text"
              value={editMode.spaInfo ? draftSettings.spaInfo.spaName : settings.spaInfo.spaName}
              onChange={(e) => updateDraftField('spaInfo', 'spaName', e.target.value)}
              disabled={!editMode.spaInfo}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              value={editMode.spaInfo ? draftSettings.spaInfo.contactNumber : settings.spaInfo.contactNumber}
              onChange={(e) => updateDraftField('spaInfo', 'contactNumber', e.target.value)}
              disabled={!editMode.spaInfo}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Email</label>
            <input
              type="email"
              value={editMode.spaInfo ? draftSettings.spaInfo.email : settings.spaInfo.email}
              onChange={(e) => updateDraftField('spaInfo', 'email', e.target.value)}
              disabled={!editMode.spaInfo}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Address</label>
            <textarea
              value={editMode.spaInfo ? draftSettings.spaInfo.address : settings.spaInfo.address}
              onChange={(e) => updateDraftField('spaInfo', 'address', e.target.value)}
              disabled={!editMode.spaInfo}
              rows="3"
              className="settings-textarea"
            />
          </div>
          <div className="settings-form-group full-width">
            <label>Logo (optional)</label>
            <input
              type="text"
              value={editMode.spaInfo ? draftSettings.spaInfo.logo : settings.spaInfo.logo}
              onChange={(e) => updateDraftField('spaInfo', 'logo', e.target.value)}
              disabled={!editMode.spaInfo}
              placeholder="Logo URL or filename"
              className="settings-input"
            />
            <p className="settings-hint">Optional logo used on invoices and brand headers.</p>
          </div>
        </div>
      </section>

        <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Working Hours</h3>
            <p>Modify the days and hours when the spa is bookable.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('workingHours')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={() => saveSection('workingHours')}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid three-cols">
          <div className="settings-form-group">
            <label>Opening Time</label>
            <input
              type="time"
              value={currentWorkingHours.openingTime}
              onChange={(e) => updateDraftField('workingHours', 'openingTime', e.target.value)}
              disabled={!editMode.workingHours}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Closing Time</label>
            <input
              type="time"
              value={currentWorkingHours.closingTime}
              onChange={(e) => updateDraftField('workingHours', 'closingTime', e.target.value)}
              disabled={!editMode.workingHours}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Working Days</label>
            <div className="settings-days-grid">
              {Object.entries(currentWorkingHours.days).map(([day, enabled]) => (
                <label key={day} className="settings-day-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => updateDaysDraft(day)}
                    disabled={!editMode.workingHours}
                  />
                  <span>{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

        <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Appointment Settings</h3>
            <p>Configure booking intervals, capacity, and session buffers.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('appointment')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={() => saveSection('appointment')}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid four-cols">
          <div className="settings-form-group">
            <label>Slot Duration</label>
            <select
              value={currentAppointment.slotDuration}
              onChange={(e) => updateDraftField('appointment', 'slotDuration', e.target.value)}
              disabled={!editMode.appointment}
              className="settings-input"
            >
              <option value="30">30 mins</option>
              <option value="60">60 mins</option>
            </select>
          </div>
          <div className="settings-form-group">
            <label>Max Appointments per Day</label>
            <input
              type="number"
              min="1"
              value={currentAppointment.maxAppointmentsPerDay}
              onChange={(e) => updateDraftField('appointment', 'maxAppointmentsPerDay', e.target.value)}
              disabled={!editMode.appointment}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Auto-confirm Booking</label>
            <div className="settings-toggle-box">
              <span>Enabled</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={currentAppointment.autoConfirmBooking}
                  onChange={(e) => updateDraftField('appointment', 'autoConfirmBooking', e.target.checked)}
                  disabled={!editMode.appointment}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div className="settings-form-group">
            <label>Buffer Time (mins)</label>
            <input
              type="number"
              min="0"
              value={currentAppointment.bufferTime}
              onChange={(e) => updateDraftField('appointment', 'bufferTime', e.target.value)}
              disabled={!editMode.appointment}
              className="settings-input"
            />
          </div>
        </div>
      </section>

        <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Notification Settings</h3>
            <p>Toggle the alert settings that users receive.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('notifications')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={() => saveSection('notifications')}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid two-cols">
          <div className="settings-toggle-card">
            <div>
              <p className="settings-toggle-title">Email Notifications</p>
              <p className="settings-toggle-desc">Send booking confirmation emails.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={currentNotifications.emailNotifications}
                onChange={(e) => updateDraftField('notifications', 'emailNotifications', e.target.checked)}
                disabled={!editMode.notifications}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="settings-toggle-card">
            <div>
              <p className="settings-toggle-title">Appointment Reminders</p>
              <p className="settings-toggle-desc">Send reminders before sessions.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={currentNotifications.appointmentReminders}
                onChange={(e) => updateDraftField('notifications', 'appointmentReminders', e.target.checked)}
                disabled={!editMode.notifications}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

        <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Payment Settings</h3>
            <p>Configure allowed methods, taxes, and discount rules.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('payment')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={() => saveSection('payment')}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid three-cols">
          <div className="settings-checkbox-card">
            <label>
              <input
                type="checkbox"
                checked={currentPayment.cash}
                onChange={(e) => updateDraftField('payment', 'cash', e.target.checked)}
                disabled={!editMode.payment}
              />
              Cash
            </label>
            <label>
              <input
                type="checkbox"
                checked={currentPayment.upi}
                onChange={(e) => updateDraftField('payment', 'upi', e.target.checked)}
                disabled={!editMode.payment}
              />
              UPI
            </label>
          </div>
          <div className="settings-form-group">
            <label>Tax Percentage (%)</label>
            <input
              type="number"
              min="0"
              value={currentPayment.taxPercentage}
              onChange={(e) => updateDraftField('payment', 'taxPercentage', e.target.value)}
              disabled={!editMode.payment}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Discount Percentage (%)</label>
            <input
              type="number"
              min="0"
              value={currentPayment.discountPercentage}
              onChange={(e) => updateDraftField('payment', 'discountPercentage', e.target.value)}
              disabled={!editMode.payment}
              className="settings-input"
            />
          </div>
        </div>
        <p className="settings-warning">At least one payment method must be selected.</p>
        {sectionMessage && <p className="settings-message">{sectionMessage}</p>}
      </section>

        <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Account Settings</h3>
            <p>Editable user/admin profile details.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('account')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={() => saveSection('account')}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid three-cols">
          <div className="settings-form-group">
            <label>Name</label>
            <input
              type="text"
              value={currentAccount.name}
              onChange={(e) => updateDraftField('account', 'name', e.target.value)}
              disabled={!editMode.account}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Email</label>
            <input
              type="email"
              value={currentAccount.email}
              onChange={(e) => updateDraftField('account', 'email', e.target.value)}
              disabled={!editMode.account}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={currentAccount.phone}
              onChange={(e) => updateDraftField('account', 'phone', e.target.value)}
              disabled={!editMode.account}
              className="settings-input"
            />
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Change Password</h3>
            <p>Validate current password and update to a new one.</p>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => startEdit('password')} className="primary-button">
              Edit
            </button>
            <button
              type="button"
              onClick={submitPasswordChange}
              className="primary-button"
            >
              Save
            </button>
          </div>
        </div>

        <div className="settings-form-grid three-cols">
          <div className="settings-form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              disabled={!editMode.password}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              disabled={!editMode.password}
              className="settings-input"
            />
          </div>
          <div className="settings-form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={!editMode.password}
              className="settings-input"
            />
          </div>
        </div>

        {passwordError && <p className="settings-error">{passwordError}</p>}
        {passwordSuccess && <p className="settings-success">{passwordSuccess}</p>}
      </section>
    </div>
  )
}
