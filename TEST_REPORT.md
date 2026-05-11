# QueueCare — Test Report

**Date:** 2026-05-11
**Status:** ⚠️ BUGS OPEN — not yet fixed
**Backend:** Express + Mongoose → `http://localhost:5000`
**Frontend:** React + Vite → `http://localhost:5173`

---

## How to Run Tests

### Prerequisites

Both servers must be running:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Test users required in the database:

| Email | Password | Role |
|-------|----------|------|
| patient@test.com | Password123 | patient |
| patient2@test.com | Password123 | patient |
| staff@test.com | Password123 | staff |

### API Tests (Newman)

```bash
npm install -g newman
newman run tests/api/QueueCare.postman_collection.json \
  --environment tests/api/QueueCare.postman_environment.json
```

### UI Tests (Playwright)

```bash
cd frontend
npx playwright test --config=playwright.config.js
```

---

## Results Overview

| Suite | Total | Passed | Failed |
|-------|-------|--------|--------|
| API — Newman | 66 assertions | 59 | **7** |
| UI — Playwright | 16 tests | 13 | **3** |

---

## API Test Results (Newman)

### Setup

| Test | Result |
|------|--------|
| Register patient: 201 or 409 | ✅ PASS |
| Register staff: 201 or 409 | ✅ PASS |
| Register second patient: 201 or 409 | ✅ PASS |
| Login patient: 200 | ✅ PASS |
| Response has user object | ✅ PASS |
| Role is patient | ✅ PASS |
| No password in response | ✅ PASS |
| Login staff: 200 | ✅ PASS |
| Role is staff | ✅ PASS |
| Login second patient: 200 | ✅ PASS |

### Auth — Negative

| Test | Result |
|------|--------|
| Wrong password: 401 | ✅ PASS |
| Generic error — does not hint which field failed | ✅ PASS |
| Non-existent email: 401 | ✅ PASS |
| Same generic error as wrong password | ✅ PASS |
| Missing password field: 400 | ✅ PASS |
| Response has error property | ✅ PASS |
| No/empty token: 401 | ✅ PASS |
| Error is Unauthorized | ✅ PASS |
| Invalid token: 401 | ✅ PASS |
| Error is Unauthorized | ✅ PASS |

### Appointments — Happy Path

| Test | Result | Error |
|------|--------|-------|
| **Create appointment: 201** | ❌ FAIL | Got `409` — today's date rejected as past (BUG-B2) |
| **All appointments belong to this patient** | ❌ FAIL | Got another patient's ID — role check inverted (BUG-B1) |
| **Staff sees all appointments (non-empty)** | ❌ FAIL | Got empty array — staff filtered to own records only (BUG-B1) |
| Get by ID: 200 | ✅ PASS | — |
| _id matches appointmentId | ✅ PASS | — |
| appointment has queueNumber | ✅ PASS | — |
| Update appointment: 200 | ✅ PASS | — |
| reason is updated | ✅ PASS | — |
| doctor is updated | ✅ PASS | — |
| Mark as served: 200 | ✅ PASS | — |
| message includes served | ✅ PASS | — |

### Appointments — Negative

| Test | Result |
|------|--------|
| Missing reason: 400 | ✅ PASS |
| Missing doctor: 400 | ✅ PASS |
| Missing date: 400 | ✅ PASS |
| Cross-patient access: 403 | ✅ PASS |
| Error is Forbidden | ✅ PASS |
| Patient mark served: 403 | ✅ PASS |
| Error is Forbidden | ✅ PASS |
| Non-existent ID: 404 | ✅ PASS |
| Response has error | ✅ PASS |

### Appointments — Edge Cases

| Test | Result | Error |
|------|--------|-------|
| Past date: 400 | ✅ PASS | — |
| message mentions past | ✅ PASS | — |
| Duplicate same day: 409 | ✅ PASS | — |
| message mentions same day | ✅ PASS | — |
| Invalid date format: 400 | ✅ PASS | — |
| message mentions Invalid date | ✅ PASS | — |
| **Update to past date: message mentions past** | ❌ FAIL | Response has no `message` key — side effect of BUG-B2 |
| Cancel: 200 | ✅ PASS | — |
| message confirms cancellation | ✅ PASS | — |
| Cancel already cancelled: 409 | ✅ PASS | — |
| message mentions already cancelled | ✅ PASS | — |
| **Serve already served: message mentions already** | ❌ FAIL | Got "cannot serve a cancelled appointment" — BUG-B3 allowed the served appointment to be cancelled first |
| **Rebook after cancel: 201** | ❌ FAIL | Got `409` — today's date rejected as past (BUG-B2) |
| **status is pending** | ❌ FAIL | Cascades from above |

### Queue

| Test | Result |
|------|--------|
| Get today queue: 200 | ✅ PASS |
| queue is an array | ✅ PASS |
| queue sorted by queueNumber ascending | ✅ PASS |

---

## UI Test Results (Playwright)

| # | Test | Result | Error |
|---|------|--------|-------|
| 1 | Login Flow › valid credentials → redirect to dashboard | ✅ PASS | — |
| 2 | Login Flow › wrong password → error visible, stays on login | ✅ PASS | — |
| 3 | Login Flow › non-existent email → error visible, stays on login | ✅ PASS | — |
| 4 | Login Flow › empty form → stays on login | ✅ PASS | — |
| 5 | **Create Appointment › valid submission → success + redirect** | ❌ FAIL | `[data-testid="appt-success"]` never appeared — backend returned 400 because doctor was sent as empty string (BUG-F3) |
| 6 | **Create Appointment › new appointment appears with queue number** | ❌ FAIL | `waitForURL(/\/dashboard/)` timed out — appointment creation failed due to BUG-F3 |
| 7 | Create Appointment › missing date → error shown | ✅ PASS | — |
| 8 | Create Appointment › missing reason → error shown | ✅ PASS | — |
| 9 | Create Appointment › missing doctor → error shown | ✅ PASS | — |
| 10 | Create Appointment › past date → error shown | ✅ PASS | — |
| 11 | **Cancel Appointment › status changes to cancelled** | ❌ FAIL | Setup step (create appointment) failed due to BUG-F3; test never reached the cancel assertion |
| 12 | Cancel Appointment › cancel button disabled on cancelled | ✅ PASS | — |
| 13 | Dashboard › patient sees "My Appointments" + create button | ✅ PASS | — |
| 14 | Dashboard › staff sees "All Appointments" | ✅ PASS | — |
| 15 | Dashboard › unauthenticated → redirect to login | ✅ PASS | — |
| 16 | Appointment Detail › View navigates to detail with queue # | ✅ PASS | — |

---

## Open Bugs

### Backend

---

#### BUG-B1 — Role check inverted in `GET /api/appointments`

- **File:** `backend/src/routes/appointments.js` line 12
- **Status:** 🔴 Open
- **Severity:** Critical

**Description:**
The role condition uses `role === 'patient'` to return all records and `role !== 'patient'` to filter by userId. This is backwards. Patients receive every appointment in the database (including other patients'), while staff only see their own.

**Code (broken):**
```js
const query = req.user.role === 'patient'
  ? {}                          // ← patients get everything
  : { userId: req.user._id }   // ← staff get only their own
```

**Expected fix:**
```js
const query = req.user.role === 'staff'
  ? {}
  : { userId: req.user._id }
```

**Failing assertions:**
- `All appointments belong to this patient` — patient receives records owned by other users
- `Staff sees all appointments (non-empty)` — staff gets an empty array

---

#### BUG-B2 — Off-by-one in past date validation (`<=` instead of `<`)

- **File:** `backend/src/routes/appointments.js` line 52
- **Status:** 🔴 Open
- **Severity:** High

**Description:**
The comparison `parsedDate <= today` treats today's date as "in the past" and rejects it with 400. Same-day appointments cannot be booked even though the system is designed to support them (the queue view shows today's appointments).

**Code (broken):**
```js
if (parsedDate <= today) {   // ← rejects today
  return res.status(400).json({ message: 'Appointment date cannot be in the past' })
}
```

**Expected fix:**
```js
if (parsedDate < today) {    // ← only rejects strictly past dates
```

**Failing assertions:**
- `Create appointment: 201` — got 409 when the test used today's date
- `Update to past date: message mentions past` — side effect: the update route uses `<` (correct) so the response key is `message`, but the create route returns early before reaching that path
- `Rebook after cancel: 201` — same root cause, today's date rejected

---

#### BUG-B3 — Served appointments can be cancelled

- **File:** `backend/src/routes/appointments.js` line 138
- **Status:** 🔴 Open
- **Severity:** Medium

**Description:**
The `DELETE /:id` handler checks for `status === 'cancelled'` but has no guard for `status === 'served'`. A served appointment can be cancelled, corrupting the appointment history. This also causes the "Serve Already Served" test to fail because the appointment ends up cancelled (not served) before the second serve attempt.

**Code (broken):**
```js
if (appointment.status === 'cancelled') {
  return res.status(409).json({ message: 'Appointment is already cancelled' })
}
// ← missing: no check for status === 'served'
appointment.status = 'cancelled'
```

**Expected fix:**
```js
if (appointment.status === 'cancelled') {
  return res.status(409).json({ message: 'Appointment is already cancelled' })
}
if (appointment.status === 'served') {
  return res.status(409).json({ message: 'Cannot cancel a served appointment' })
}
```

**Failing assertion:**
- `Serve already served: message mentions already` — got `"cannot serve a cancelled appointment"` because the appointment was cancelled between the serve and the re-serve attempt

---

### Frontend

---

#### BUG-F1 — Login error not cleared on new submission

- **File:** `frontend/src/pages/Login.jsx` line 17
- **Status:** 🟡 Open
- **Severity:** Low

**Description:**
`setError('')` is not called at the start of `handleSubmit`. If a user submits with wrong credentials (error appears), then corrects them and submits again, the previous error message stays visible while the new request is in flight. If the second attempt succeeds, the error briefly flashes before the redirect.

**Code (broken):**
```js
const handleSubmit = async (e) => {
  e.preventDefault()
  // setError('') is missing here

  try { ... }
```

**Expected fix:**
```js
const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')   // ← clear stale error before each attempt
  try { ... }
```

**Detected by:** Not caught by the current automated test suite. Requires a manual test: submit wrong credentials → see error → correct credentials → submit again → error should disappear immediately.

---

#### BUG-F2 — Cancel updates local state to `'served'` instead of `'cancelled'`

- **File:** `frontend/src/pages/Dashboard.jsx` line 34
- **Status:** 🟡 Open
- **Severity:** Medium

**Description:**
After a successful cancel API call, the optimistic UI update maps the appointment to `status: 'served'` instead of `status: 'cancelled'`. The card immediately shows a green "served" badge after the user cancels, which is the opposite of what happened. The correct status only appears after a page refresh.

**Code (broken):**
```js
setAppointments(prev =>
  prev.map(a => a._id === id ? { ...a, status: 'served' } : a)  // ← wrong status
)
```

**Expected fix:**
```js
setAppointments(prev =>
  prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a)
)
```

**Detected by:** Not caught by the current automated test suite. The Playwright cancel test (test #11) failed earlier in its setup step due to BUG-F3 and never reached the status assertion. Requires a manual test or a dedicated cancel-status test.

---

#### BUG-F3 — Doctor field always sent as empty string

- **File:** `frontend/src/pages/NewAppointment.jsx` line 22
- **Status:** 🔴 Open
- **Severity:** Critical

**Description:**
The request body hardcodes `doctor: ''` instead of using the `doctor` state variable. No matter what the user types in the Doctor field, an empty string is sent to the backend. The backend validates that `doctor` is non-empty and returns `400 "Date, reason, and doctor are required"`, so appointment creation always fails.

**Code (broken):**
```js
body: JSON.stringify({ date, reason, doctor: '' })  // ← hardcoded empty string
```

**Expected fix:**
```js
body: JSON.stringify({ date, reason, doctor })  // ← use state variable
```

**Failing Playwright tests:**
- Test #5 `valid submission → success message shown` — `appt-success` element never appeared; `appt-error` shown instead
- Test #6 `new appointment appears on dashboard with queue number` — `waitForURL(/\/dashboard/)` timed out because the form never submitted successfully
- Test #11 `cancel a pending appointment → status changes to cancelled` — the `createFreshAppointment` helper failed at the success banner check, so the cancel flow was never reached
