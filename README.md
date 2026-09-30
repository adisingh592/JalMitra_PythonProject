# Jal Mitra

Jal Mitra is a web app for running a village or city water supply scheme. Administrators record daily water supply and consumption, track leakage, manage members and their bills, and handle maintenance complaints. Members log in to see their usage and bills, pay online through Razorpay, raise complaints and read notices.

## Features

**Admin panel**
- Dashboard with supply, consumption and leakage figures
- Daily water data entry per city, with monitoring, leakage and report charts
- Member management and bill generation using configurable tariff slabs
- Payment history and summary
- Complaint handling: assign workers, post progress updates, resolve
- Targeted alerts to individual members and system-wide announcements
- Staff directory and worker registry

**Member panel**
- Account overview, water usage and bill history (with PDF export)
- Online bill payment via Razorpay
- Complaint submission with a progress timeline
- Notifications, announcements and profile

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Radix UI / MUI, Recharts |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, passlib (bcrypt) |
| Database | MySQL 8 (falls back to SQLite if MySQL is unreachable) |
| Payments | Razorpay |

## Project structure

```
jlmiotra/
├── backend/
│   ├── main.py             # FastAPI app: models, API routes, demo seed data
│   ├── .env.example        # Template for backend environment variables
│   └── sql/
│       ├── schema.sql          # Core tables: villages, admins, members, bills, settings
│       ├── water_tables.sql    # Cities and daily water entries
│       └── workbench_queries.sql  # Handy queries for MySQL Workbench
├── frontend/
│   ├── src/app/            # Pages (admin/, member/), components, API client
│   ├── public/             # Static images
│   ├── package.json
│   └── vite.config.ts      # Dev server; proxies /api to the backend
├── requirements.txt        # Python dependencies
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and [pnpm](https://pnpm.io/installation)
- MySQL 8+ (optional; without it the backend uses a local SQLite file)
- A Razorpay test account (only needed for online payments)

## Setup

### 1. Database

Create the MySQL database and load the schema:

```sql
CREATE DATABASE IF NOT EXISTS jalmiktra;
USE jalmiktra;
SOURCE backend/sql/schema.sql;
SOURCE backend/sql/water_tables.sql;
```

The backend also creates any missing tables on startup, so this step mainly matters if you want to inspect the schema in MySQL Workbench first.

### 2. Backend

```bash
# From the project root
python -m venv backend/venv
backend\venv\Scripts\activate        # Windows
# source backend/venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and fill in your values (see [Configuration](#configuration)).

Load demo data (optional) and start the server:

```bash
cd backend
python main.py                                        # seeds demo admin, members, bills
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API docs are then available at http://127.0.0.1:8000/docs.

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

The app opens at http://127.0.0.1:5173/login. During development Vite forwards every `/api/*` request to the backend on port 8000, so the backend must be running.

To build for production:

```bash
pnpm run build        # output in frontend/dist/
```

If the frontend is hosted separately from the backend, set `VITE_API_URL` to the backend's base URL when building.

## Configuration

The backend reads `backend/.env` on startup.

| Variable | Required | Description |
|---|---|---|
| `JALMITRA_DATABASE_URL` | Yes, for MySQL | SQLAlchemy URL, e.g. `mysql+pymysql://user:password@localhost:3306/jalmiktra`. Encode special characters in the password (`@` → `%40`). |
| `RAZORPAY_KEY_ID` | For payments | Razorpay key ID (use a `rzp_test_...` key in development) |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay key secret |
| `RAZORPAY_CURRENCY` | No | Payment currency, default `INR` |

Never commit `backend/.env`; it is already listed in `.gitignore`.

If the database in `JALMITRA_DATABASE_URL` can't be reached, the backend prints a warning and uses `backend/jalmitra.db` (SQLite) instead.

## Logging in

The login page has separate **Admin** and **Member** roles. After you run `python main.py`, demo accounts exist for both; their usernames and passwords are defined in `seed_demo_data()` in `backend/main.py`. You can also create accounts with `POST /api/register/admin` and `POST /api/register/member`.

## API overview

All endpoints are under `/api`. The full, interactive list is at `/docs` while the backend is running.

| Area | Examples |
|---|---|
| Auth | `POST /api/login`, `POST /api/register/member` |
| Water data | `GET/POST /api/water/entries`, `GET /api/analytics/dashboard`, `GET /api/analytics/leakage` |
| Admin | `/api/admin/members`, `/api/admin/complaints`, `/api/admin/workers`, `/api/admin/payments/summary`, `/api/admin/settings/billing-tariff` |
| Member | `/api/member/overview`, `/api/member/bills`, `/api/member/complaints`, `/api/member/notifications` |
| Payments | `POST /api/member/payments/razorpay/order`, `POST /api/member/payments/razorpay/verify` |
| Shared | `GET /api/announcements`, `GET /api/health` |

Admin and member routes require the token returned by `/api/login`.
