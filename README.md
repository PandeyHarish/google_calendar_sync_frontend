# Google Calendar Sync Frontend (Vue 3 + FullCalendar)

This project is a Vue 3 application that demonstrates advanced calendar management and Google Calendar synchronization using [FullCalendar](https://fullcalendar.io/) and [Vite](https://vitejs.dev/).

**Repository:** [https://github.com/PandeyHarish/google_calendar_sync_frontend](https://github.com/PandeyHarish/google_calendar_sync_frontend)

---

## Features

- 📅 Full-featured calendar UI with [FullCalendar](https://fullcalendar.io/)
- 🔄 Sync events with Google Calendar (OAuth 2.0)
- 📝 Create, update, and delete events (CRUD)
- 👥 Manage attendees, recurrence, visibility, and more
- 🟢 Responsive, modern UI with Vue 3 Composition API
- ⚡ Fast development with Vite

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/PandeyHarish/google_calendar_sync_frontend.git
cd google_calendar_sync_frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

---

## Build Commands

```bash
npm run build   # Builds the app for production (output in dist/)
npm run preview # Preview the production build locally
```

---

## Project Structure

- `src/` — Main Vue 3 application source code
  - `components/` — Reusable Vue components (including EventModal)
  - `pages/` — Main page views
  - `services/` — API and Google integration logic
  - `stores/` — Pinia stores for state management

---

## Google Calendar Sync

- Click "Connect to Google Calendar" to authenticate with your Google account.
- Once connected, you can sync, create, update, and delete events on both your local and Google calendars.
- The app handles attendees, recurrence, and other advanced event fields.

---

## Backend

This frontend expects a compatible backend API for authentication and event CRUD.  
See the [backend repo](https://github.com/PandeyHarish/google_calendar_sync_backend) for details.

---

## License
