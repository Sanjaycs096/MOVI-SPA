# MoviCloud Spa

Luxury spa management web app built with React, Vite, Tailwind CSS, and a FastAPI backend. The project focuses on a premium wellness aesthetic with dashboard, services, therapists, appointments, clients, staff, rooms, analytics, AI insights, offers, and settings views.

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4 (CSS-first configuration)
- FastAPI
- MongoDB

## Features

### Appointment Booking System

- **5-Step Booking Process**: Client Details -> Health Details -> Appointment Details -> Payment -> Terms & Conditions
- **18+ Spa Services**: Massage, Facial, Beauty, Body, Hair, and Wellness treatments
- **3 Therapists**: Sarah Jenkins, Julian Reed, Elena Moretti
- **Payment Integration**: Credit/Debit Card and UPI with QR code support
- **Form Validation**: Real-time step completion checking
- **Success Confirmation**: Transaction ID generation and personalized confirmation

### Pages

- **Dashboard**: Overview with next appointment and wellness insights
- **Services**: Browse and book spa treatments
- **Therapists**: View therapist profiles and specialties
- **Appointments**: Complete booking system with management
- **Clients**: Client profiles and history
- **Staff**: Team overview and onboarding modal
- **Rooms**: Room catalog with add-room modal
- **Analytics**: Revenue and booking insights
- **AI Insights**: Predictive wellness highlights and activity feed
- **Offers**: Special packages and promotions
- **Settings**: Business and notification settings

## Quick Start

### 1) Clone Repository

```bash
git clone https://github.com/Sanjaycs096/MOVICLOUD-SPA.git
cd MOVICLOUD-SPA
```

### 2) Install Dependencies

```bash
npm install
```

### 3) Run Development Server

```bash
npm run dev
```

### 4) Open Browser

Navigate to `http://localhost:5173` (or the URL shown in terminal)

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: build the app
- `npm run preview`: preview the build
- `npm run lint`: run ESLint

## Backend (FastAPI)

### 1) Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 2) Start the API (from repo root)

```bash
uvicorn backend.app.main:app --reload --port 8000
```

### 3) Env variables

- `MONGO_URI` (default: `mongodb://localhost:27017`)
- `MONGO_DB` (default: `movicloud`)
- `JWT_SECRET` (default: `change-me`)
- `ADMIN_EMAIL` (default: `admin@spa.com`)
- `ADMIN_PASSWORD` (default: `Admin123`)
- `CAPTCHA_TTL_SECONDS` (default: `300`)
- `CORS_ORIGINS` (default: `http://localhost:5173`)

### Auth flow

- `POST /auth/captcha` returns a base64 captcha image
- `POST /auth/login` expects `email`, `password`, `captcha_id`, `captcha_answer`

Set the frontend API base via `VITE_API_URL` if needed.

## Render Deployment

This repo includes a single Render configuration file at the root: [render.yaml](render.yaml).

### Execution Steps (Render)

1) Push this repo to GitHub.
2) In Render, create a new Blueprint and select this repo.
3) Render will create two services:
	- `movicloud-api` (FastAPI backend)
	- `movicloud-web` (Vite static site)
4) Set backend env vars for the API service:
	- `MONGO_URI`
	- `MONGO_DB`
	- `JWT_SECRET`
	- `ADMIN_EMAIL`
	- `ADMIN_PASSWORD`
	- `CAPTCHA_TTL_SECONDS`
	- `CORS_ORIGINS`
5) Set frontend env vars for the static site:
	- `VITE_API_URL` (set to the API service URL)
6) Deploy the Blueprint.

## Project Structure

- `src/App.jsx`: app shell and page router
- `src/pages/*`: page components (login, dashboard, services, etc.)
- `src/frontend/*`: complex feature views (appointments, clients, therapists)
- `backend/app`: FastAPI backend
- `src/index.css`: Tailwind base and theme tokens
- `src/App.css`: component and layout styles

## UI Notes

- Login page uses Tailwind utility classes
- Dashboard and other views use structured CSS in src/App.css
- Icons use Google Material Symbols
- Responsive design with mobile-friendly layouts

## Brand Tokens

- Primary: #1F4D3E
- Accent: #2F7D6D
- Soft Background: #F5F3EF
- Heading Text: #1A1A1A
- Muted Text: #6B7280
- Gold Accent: #C8A97E
- Fonts: Playfair Display (headings), Inter (body)

## Recent Updates

- Added FastAPI + MongoDB backend with captcha login
- Split pages into `src/pages` for better separation
- Updated login to use API captcha and auth
- Built Staff, Rooms, Analytics, and AI Insights pages
- Added onboarding, add-room, and profile popups
- Refined Clients page layout with membership filters
