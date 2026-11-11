# 🍬 Sweety – Blood Glucose Tracker

A small web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and previous-month reports.

**Stack:** Node.js + Express 5 · PostgreSQL (`pg`) · React 18 (Vite) · JWT auth · bcrypt password hashing

## Features
- Sign up / log in (passwords hashed with bcrypt; each user sees only their own readings)
- Add, view, edit and delete readings (4 slots: Morning (fasting), After breakfast, After lunch, After dinner)
- Validation with clear messages in the UI (required, 40–600 whole number, one per slot per day, max 4 per day, no future dates)
- Reports: Daily (with each reading), Month-to-date, Previous month – highest, lowest, average (1 decimal), count, friendly empty state
- Line chart (Recharts) of the month's readings on the Month-to-date and Previous month reports, one line per time slot
- Login/register are rate-limited (30 requests per 15 minutes per IP) to slow down password guessing
- Bonus done: pagination on `GET /api/readings`, `docker-compose.yml` for PostgreSQL, line chart, React Testing Library tests

## Prerequisites
Node.js 20+ and either Docker **or** a local PostgreSQL 14+.

## Install & run
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# 2. Environment variables
cp .env.example .env        # then set JWT_SECRET to a long random string

# 3. Database (option A – Docker)
docker compose up -d
#    Database (option B – local Postgres): create a DB and user, then put the URL in DATABASE_URL
#    psql -U postgres -c "CREATE USER sweety WITH PASSWORD 'sweety';"
#    psql -U postgres -c "CREATE DATABASE sweety OWNER sweety;"

# 4. Create tables + demo data
cd server
npm run migrate
npm run seed                # demo login: demo@sweety.test / Demo@1234

# 5. Run the API (http://localhost:5000)
npm run dev

# 6. Run the client in a second terminal (http://localhost:5173)
cd client && npm run dev
```

## Tests
```bash
cd server && npm test     # 23 backend tests (Node's built-in test runner)
cd client && npm test     # 10 frontend tests (Vitest + React Testing Library)
```
- **Backend:** validation rules, registration validation, duplicate-slot message, report date ranges (incl. January and leap-year February), statistics maths and the rate limiter.
- **Frontend:** the reading form (add, edit, cancel, and the error messages returned by the server) and the chart data helper.

## API
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` |
| POST | `/api/auth/login` | `{email, password}` → `{token, user}` |
| GET | `/api/readings?date=&page=&limit=` | logged-in user's readings (paginated) |
| POST | `/api/readings` | `{date, slot, value}` |
| PUT | `/api/readings/:id` | same body |
| DELETE | `/api/readings/:id` | |
| GET | `/api/reports/daily \| month-to-date \| monthly?date=YYYY-MM-DD` | `{type, from, to, stats, readings}` |

Slots: `morning`, `after_breakfast`, `after_lunch`, `after_dinner`. Send `Authorization: Bearer <token>`. The auth routes answer `429` with a `Retry-After` header after too many attempts.

## Notes
**Assumptions**
- "Monthly" report = the whole calendar month before the selected date's month (selected 15 Oct → 1–30 Sep).
- "Today" for the future-date rule is the server's local date.
- Max-4 is checked before the duplicate-slot rule, so a full day always shows the "4 readings" message.
- Report dates in the future are rejected.
- Editing a reading can change its slot and value; the date stays the same.
- The chart shows one line per time slot, with the day of the month on the horizontal axis.
- The rate limiter keeps its counters in memory, which is fine for one server; a shared store such as Redis would be needed to run several instances.
- Passwords must be at least 8 characters. `bcryptjs` is used (same algorithm as `bcrypt`, no native build step).

**With more time**
- API integration tests (supertest + a test database)
- Redis caching of reports, refresh tokens / httpOnly cookies, a shared (Redis) rate-limit store
- Proper migrations tool (e.g. node-pg-migrate) and a Dockerfile for the app itself
