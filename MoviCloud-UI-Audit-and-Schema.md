# MoviCloud SPA UI Audit and MongoDB Schema

## Files reviewed
- [src/App.css](src/App.css)
- [src/index.css](src/index.css)
- [src/App.jsx](src/App.jsx)
- [src/main.jsx](src/main.jsx)
- [src/components/MaterialSymbol.jsx](src/components/MaterialSymbol.jsx)
- [src/pages/DashboardPage.jsx](src/pages/DashboardPage.jsx)
- [src/pages/ClientsPage.jsx](src/pages/ClientsPage.jsx)
- [src/pages/StaffPage.jsx](src/pages/StaffPage.jsx)
- [src/pages/RoomsPage.jsx](src/pages/RoomsPage.jsx)
- [src/pages/AnalyticsPage.jsx](src/pages/AnalyticsPage.jsx)
- [src/pages/InsightsPage.jsx](src/pages/InsightsPage.jsx)
- [src/pages/TherapistsPage.jsx](src/pages/TherapistsPage.jsx)
- [src/pages/AppointmentsPage.jsx](src/pages/AppointmentsPage.jsx)
- [src/pages/ServicesPage.jsx](src/pages/ServicesPage.jsx)
- [src/pages/OffersPage.jsx](src/pages/OffersPage.jsx)
- [src/pages/SettingsPage.jsx](src/pages/SettingsPage.jsx)
- [src/pages/LoginPage.jsx](src/pages/LoginPage.jsx)
- [src/frontend/clients.jsx](src/frontend/clients.jsx)
- [src/frontend/SettingsView.jsx](src/frontend/SettingsView.jsx)
- [src/frontend/TherapistManagement.jsx](src/frontend/TherapistManagement.jsx)
- [src/frontend/AppointmentsPage.jsx](src/frontend/AppointmentsPage.jsx)
- [backend/app/models.py](backend/app/models.py)
- [backend/app/db.py](backend/app/db.py)
- [backend/app/security.py](backend/app/security.py)
- [backend/app/config.py](backend/app/config.py)
- [backend/app/main.py](backend/app/main.py)
- [backend/app/routes/auth.py](backend/app/routes/auth.py)

## Design tokens
### Fonts
- Body: Inter
- Headings: Playfair Display
- Icons: Material Symbols Rounded
- Base body size: 15px; line-height: 1.6; letter-spacing: 0.3

### Font sizes (observed range)
- Micro labels: 9px, 10px, 11px
- Body and inputs: 12px, 13px, 14px, 15px
- Section headings: 16px, 18px, 20px, 22px
- Hero headings: 24px, 26px, 28px, 30px, 32px
- Large display: clamp(36px, 3vw, 44px)

### Letter spacing (observed range)
- 0.2 to 1.4 for labels and caps
- 3 to 6 for security and captcha text

### Color palette (condensed)
Brand and primary
- #1f4d3e, #2f7d6d, #12362c, #16362d
- #c8a97e, #f2d4a5, #f2d2a8, #d5b987

Neutrals and backgrounds
- #f8f5f0, #f8f4ee, #f7f4ee, #f5f3ef, #f1ece3, #efe9df
- #eee6db, #eee5d9, #e4ded6, #e0d8cd, #dcd4c8

Text and muted
- #1f1a16, #2f2a24, #3d3a36, #6f665c, #7f766a, #8a8073, #9a9186, #a39a8f, #a49b90

Status and semantic
- Success: #2f7d6d, #36c28a, #dcefe6
- Warning: #f5d9a1, #f3d29b, #f0b429
- Error: #b05b49, #a45a4a, #f4d6cc

Overlays and translucency
- rgba(15, 20, 18, 0.45)
- rgba(255, 255, 255, 0.08) and rgba(255, 255, 255, 0.12)

### Common radii and shadows
- Radii: 10, 12, 14, 18, 20, 22, 24, 26, 28
- Shadows: 0 12px 22px rgba(0,0,0,0.06); 0 30px 60px rgba(31,77,62,0.18)

## Popup sizes and behavior
- Profile modal: 1050px x 90vh, scrollable
- Client registration modal: 1050px x 90vh, internal scroll grid
- Staff onboarding modal: 1050px x 90vh
- Therapist add modal: 1050px x 90vh
- Appointment add modal: 1050px x 90vh, internal scroll grid
- Rooms add modal: 420px width, auto height

## Page data mapping
Dashboard
- Metrics: total clients, appointments today, active therapists, room usage
- Trends: appointment volume, revenue split (services vs retail)

Clients
- Client profile, membership tier, contact, appointment history, payment history
- Registration fields and contact method

Staff
- Staff identity, role, placement, permission level, onboarding status

Therapists
- Practitioner profile, specialty, availability, booking priority

Rooms
- Room profile, room type, status, capacity, maintenance notes

Appointments
- Calendar events, client selection, therapist selection, service, time slot, room, status
- Notification triggers for confirmed bookings

Services and offers
- Service catalog, durations, pricing, categories
- Promotional packages, rewards, discount pricing

Analytics and AI insights
- Revenue, retention, average ticket, popular treatments, lifecycle heatmaps
- Insight feed items, recommendations, priority actions

Settings
- Spa information, working hours, appointment rules, notifications, payments, account settings

Authentication
- Users, login, captcha, access tokens

## MongoDB schema (covering all pages)
Note: Current backend only creates users and captchas. The schema below extends coverage for all UI pages.

Collections and key fields

users
- _id, email, password_hash, role, status, created_at, updated_at, last_login
- profile: { name, phone }
- permissions: { level, scopes }
Indexes: email unique

captchas
- _id, answer_hash, created_at
Indexes: created_at TTL

spa_settings
- spa_info: { spa_name, address, contact_number, email, logo_url }
- working_hours: { opening_time, closing_time, days: { Monday...Sunday } }
- appointment_rules: { slot_duration_min, max_per_day, buffer_min, auto_confirm }
- notifications: { email_notifications, appointment_reminders }
- payment: { methods: { cash, upi }, tax_percent, discount_percent }
- updated_at

clients
- _id, full_name, email, phone, address, age, status
- contact_method: email or sms
- membership_tier_id
- preferences: { notes, tags }
- created_at, updated_at
Indexes: email unique, phone unique, full_name

membership_tiers
- _id, name, benefits, price_multiplier, status

staff
- _id, full_name, role_title, department, placement, status
- contact: { email, phone }
- permissions: { level, label }
- onboarding: { status, checklist } 
- is_therapist
- therapist_profile: { specialty, bio, booking_priority, availability_status, image_url }
- created_at, updated_at
Indexes: role_title, department, status

rooms
- _id, name, type, status, capacity
- environment: { temperature_c, humidity_pct }
- notes, image_url
Indexes: status, type

services
- _id, name, description, category, duration_min, price
- tags, status
Indexes: category, status

appointments
- _id, client_id, therapist_id, room_id, service_id
- status: scheduled | confirmed | completed | canceled
- start_at, end_at, duration_min
- notes, created_by, created_at, updated_at
- notification_state: { sms_sent, email_sent }
Indexes: start_at, therapist_id + start_at, room_id + start_at

payments
- _id, appointment_id, client_id
- amount, tax_amount, discount_amount, method, status
- line_items: [{ service_id, name, qty, price }]
- paid_at, created_at
Indexes: appointment_id, client_id, paid_at

offers
- _id, title, description, price, original_price, status
- starts_at, ends_at, tags

loyalty_accounts
- _id, client_id, points_balance, tier, updated_at
Indexes: client_id unique

analytics_snapshots
- _id, period_start, period_end
- revenue: { services, retail, total }
- retention_rate, avg_ticket, active_memberships
- popular_treatments: [{ service_id, percent }]
- lifecycle_heatmap: [int]
- created_at

ai_insights
- _id, title, summary, priority, status
- metrics: { accuracy, uplift, impact }
- actions: [{ label, action_type, payload }]
- created_at

notifications
- _id, channel, recipient, template, status, payload, sent_at
Indexes: channel, sent_at

audit_logs
- _id, actor_id, action, entity, entity_id, before, after, created_at

Suggested relationship rules
- appointments references clients, staff (therapist), rooms, services
- staff holds therapist profile for therapist-specific pages
- payments reference appointments and clients
- analytics_snapshots and ai_insights can be generated by scheduled jobs
