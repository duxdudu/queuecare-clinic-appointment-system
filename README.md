# QueueCare — Clinic Queue Management

A full-stack clinic appointment and queue management system. Patients book appointments and track their queue position. Staff manage the daily queue and mark patients as served.

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB Atlas

---

## Prerequisites

Make sure the following are installed before you begin:

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | any | `git --version` |

**Browser** (for the frontend UI):
- Chrome 110+ / Edge 110+ / Firefox 110+ / Safari 16+
- JavaScript must be enabled

**MongoDB Atlas:**
- A MongoDB Atlas cluster is required. The project ships with a pre-configured connection string in `backend/.env` for development. No local MongoDB installation is needed.

---

## Project Structure

```
queuecare/
├── backend/                  # Express REST API (port 5000)
│   ├── src/
│   │   ├── lib/              # JWT helpers
│   │   ├── middleware/       # Auth middleware
│   │   ├── models/           # User, Appointment (Mongoose)
│   │   ├── routes/           # auth, appointments, queue
│   │   └── server.js         # Entry point
│   ├── .env                  # Backend environment variables
│   └── package.json
├── frontend/                 # React SPA (port 5173)
│   ├── src/
│   │   ├── components/       # Layout, AppointmentCard
│   │   ├── lib/              # api.js, AuthContext
│   │   └── pages/            # Login, Register, Dashboard, etc.
│   ├── vite.config.js        # Dev server + /api proxy to port 5000
│   ├── playwright.config.js  # UI test config
│   └── package.json
├── tests/
│   ├── api/                  # Postman collection + environment files
│   └── ui/                   # Playwright test specs
├── TESTING.md                # Full test report with open bugs
└── package.json              # Monorepo root
```

---

## Environment Variables

### Backend — `backend/.env`

This file is pre-configured for local development. Do not commit changes with real secrets.

| Variable | Description | Default (dev) |
|----------|-------------|---------------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Port the API listens on | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | pre-configured |
| `JWT_SECRET` | Secret key for signing JWT tokens | `queuecare_secret_2026` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend — `frontend/.env`

| Variable | Description | Default (dev) |
|----------|-------------|---------------|
| `VITE_API_URL` | Base URL for API calls | *(empty — uses Vite proxy)* |

> The frontend uses Vite's dev proxy (`/api → http://localhost:5000`) so `VITE_API_URL` is intentionally empty in development. All `/api/*` requests are forwarded automatically.

---

## Installing Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install
```

Or from the monorepo root:

```bash
npm run install:all
```

---

## Starting the Application

Open **two terminals** and run each command in its own terminal:

```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd backend
npm run dev
```

```bash
# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

You should see the QueueCare login page. The backend logs `✅ MongoDB connected` and `🚀 Server running on port 5000` when it starts successfully.

---

## Default Test Credentials

These accounts are used by both the API tests (Newman) and UI tests (Playwright). Create them by registering through the app at `http://localhost:5173/register`, or let the Newman "Setup" folder create them automatically on first run.

| Email | Password | Role |
|-------|----------|------|
| patient@test.com | Password123 | patient |
| patient2@test.com | Password123 | patient |
| staff@test.com | Password123 | staff |

---

## Running API Tests

The API test suite uses **Newman** (Postman CLI runner) with 33 requests and 66 assertions covering auth, appointments CRUD, edge cases, and the queue endpoint.

### Install Newman

```bash
npm install -g newman
```

### Run the full suite

```bash
newman run tests/api/QueueCare.postman_collection.json \
  --environment tests/api/QueueCare.postman_environment.json
```

### Expected output

```
┌─────────────────────────┬────────────────────┬───────────────────┐
│                         │           executed │            failed │
├─────────────────────────┼────────────────────┼───────────────────┤
│              iterations │                  1 │                 0 │
│                requests │                 33 │                 0 │
│              assertions │                 66 │                 ? │
└─────────────────────────┴────────────────────┴───────────────────┘
```

> ⚠️ Some assertions are currently failing due to known open bugs. See [TESTING.md](./TESTING.md) for the full report.

---

## Running UI Tests

The UI test suite uses **Playwright** with 16 end-to-end tests covering login, appointment creation, cancellation, role-based dashboard views, and appointment detail.

### Install Playwright browsers (first time only)

```bash
cd frontend
npx playwright install chromium
```

### Run the full suite

```bash
cd frontend
npx playwright test --config=playwright.config.js
```

### Run in headed mode (watch the browser)

```bash
cd frontend
npx playwright test --config=playwright.config.js --headed
```

### Run a single test file

```bash
cd frontend
npx playwright test --config=playwright.config.js appointments.spec.js
```

### View the HTML report after a run

```bash
cd frontend
npx playwright show-report
```

### Expected output

```
Running 16 tests using 1 worker
  13 passed
   3 failed
```

> ⚠️ 3 tests are currently failing due to known open bugs. See [TESTING.md](./TESTING.md) for the full report.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, sets JWT cookie |
| POST | `/api/auth/logout` | — | Clear auth cookie |
| GET | `/api/appointments` | ✅ | List appointments (role-filtered) |
| POST | `/api/appointments` | ✅ | Create appointment |
| GET | `/api/appointments/:id` | ✅ | Get single appointment |
| PUT | `/api/appointments/:id` | ✅ patient | Update pending appointment |
| DELETE | `/api/appointments/:id` | ✅ patient | Cancel appointment |
| PATCH | `/api/appointments/:id/serve` | ✅ staff | Mark appointment as served |
| GET | `/api/queue/today?date=YYYY-MM-DD` | ✅ | Today's queue |

Authentication uses **HTTP-only cookies**. The login endpoint also returns the token in the response body for API client use (Postman/Newman).
