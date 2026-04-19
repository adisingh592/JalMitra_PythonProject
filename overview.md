# Jal Mitra — Water Management System — Python Technical Overview

> **Purpose**: This document describes every Python technology, framework, library, and design pattern used in Jal Mitra. It is intended for teammates and professors who need a deep understanding of the backend architecture.

---

## 1. Project Summary

**Jal Mitra** (Hindi for "Water Friend") is a full-stack water management system that helps rural local bodies track daily water supply/consumption, detect leakages, manage consumer billing, and enable two-way communication between administrators and household members (consumers).

| Layer | Technology |
|-------|-----------|
| Backend (API server) | **Python 3.12 + FastAPI** |
| Database | **MySQL 8 via SQLAlchemy ORM** (fallback: SQLite) |
| ASGI Server | **Uvicorn** |
| Password Security | **Passlib + bcrypt** |
| Frontend | React + TypeScript (Vite) — _not covered here_ |

---

## 2. Project File Structure (Backend)

```
jlmiotra/
├── backend/
│   ├── main.py              ← Core application (models + API endpoints, ~1600 lines)
│   ├── seed_db.py           ← Database seeder (demo data for testing/presentation)
│   ├── requirements.txt     ← Python dependencies
│   ├── jalmitra.db          ← SQLite fallback database file
│   ├── sql/
│   │   ├── schema.sql       ← MySQL DDL for core tables
│   │   ├── water_tables.sql ← MySQL DDL for water monitoring tables
│   │   └── workbench_queries.sql ← Helper queries for MySQL Workbench
│   └── venv/                ← Python virtual environment
├── frontend/                ← React app (not covered in this doc)
├── start_jalmitra.bat       ← One-click launcher (seeds DB + starts backend + frontend)
└── overview.md              ← This file
```

---

## 3. Python Dependencies (`requirements.txt`)

```
fastapi>=0.109.2
uvicorn>=0.27.1
pydantic>=2.6.1
passlib[bcrypt]>=1.7.4
sqlalchemy>=2.0.0
pymysql>=1.1.0
cryptography>=42.0.0
httpx>=0.27.0
tzdata>=2024.1
```

### 3.1 Dependency Deep-Dive

| Package | Version | Role in Jal Mitra |
|---------|---------|-------------------|
| **FastAPI** | ≥ 0.109.2 | The web framework. Provides routing, dependency injection, request validation, automatic OpenAPI docs at `/docs`. |
| **Uvicorn** | ≥ 0.27.1 | ASGI server that runs FastAPI. Launched via `uvicorn main:app --reload --port 8005`. |
| **Pydantic** | ≥ 2.6.1 | Data validation library. Every request body is a Pydantic `BaseModel` with type hints and field constraints. FastAPI uses Pydantic internally for serialization/deserialization. |
| **Passlib[bcrypt]** | ≥ 1.7.4 | Password hashing library. We use `CryptContext(schemes=["bcrypt"])` to hash and verify passwords using the bcrypt algorithm (adaptive cost factor). |
| **SQLAlchemy** | ≥ 2.0.0 | The ORM (Object-Relational Mapper). Maps Python classes to MySQL/SQLite tables. Handles session management, query building, relationships, and schema migrations. |
| **PyMySQL** | ≥ 1.1.0 | Pure-Python MySQL client driver. SQLAlchemy uses it as the DBAPI connector via the URL scheme `mysql+pymysql://`. |
| **cryptography** | ≥ 42.0.0 | Required by PyMySQL for secure MySQL connections (SHA-256 authentication plugin). |
| **httpx** | ≥ 0.27.0 | Modern async HTTP client (available for internal API testing and health checks). |
| **tzdata** | ≥ 2024.1 | IANA timezone database for Python's `zoneinfo` module. Ensures `Asia/Kolkata` timezone works on all platforms. |

---

## 4. Python Standard Library Modules Used

| Module | Usage |
|--------|-------|
| `os` | Reading environment variables (`JALMITRA_DATABASE_URL`) |
| `secrets` | Constant-time string comparison for legacy plaintext passwords (`secrets.compare_digest`) |
| `json` | Serializing/deserializing tariff rule settings stored as JSON in `app_settings` table |
| `datetime` | `date`, `datetime`, `timedelta`, `timezone` — timestamps, bill due dates, IST calculations |
| `zoneinfo` | `ZoneInfo("Asia/Kolkata")` for IST-aware date computations (with `tzdata` fallback) |
| `__future__` | `annotations` import for PEP 604 union syntax (`str | None`) in older Python versions |

---

## 5. Framework: FastAPI (In Detail)

### 5.1 What is FastAPI?
FastAPI is a modern, high-performance Python web framework for building APIs. It is built on top of **Starlette** (ASGI framework) and **Pydantic** (data validation).

**Key features we use:**
- **Type hints** → automatic request parsing and validation
- **Dependency Injection** → `Depends()` for DB sessions and auth checks
- **Automatic API docs** → Swagger UI at `http://127.0.0.1:8005/docs`
- **HTTP exception handling** → `HTTPException` with status codes
- **CORS middleware** → cross-origin requests from the React frontend

### 5.2 App Initialization (`main.py`, line 40)
```python
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Jal Mitra Backend")
```
- `FastAPI()` creates the ASGI application instance.
- `title` appears in the auto-generated OpenAPI documentation.

### 5.3 CORS Middleware (`main.py`, lines 960–971)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- **Why?** The React frontend runs on port `5173`, the backend on port `8005`. Browsers block cross-origin requests by default. This middleware adds the `Access-Control-Allow-Origin` header.

### 5.4 Dependency Injection Pattern
FastAPI's `Depends()` is used extensively for two purposes:

**a) Database Session Injection:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/admin/members")
def list_members(db: Session = Depends(get_db)):
    ...
```
- `get_db()` is a **generator-based dependency**. The `yield` keyword makes it a context manager — the session is automatically closed after the request completes, even if an error occurs.

**b) Authentication Guards:**
```python
def require_admin(authorization: str | None = Header(None, alias="Authorization")):
    token = _extract_token_value(authorization)
    if not token or not token.startswith("mock-jwt-admin-"):
        raise HTTPException(status_code=401, detail="Admin access required")
    return token

@app.get("/api/admin/members")
def list_members(token: str = Depends(require_admin)):
    ...
```
- `Header()` extracts the `Authorization` HTTP header.
- `require_admin` and `require_member` act as guards — if the token is invalid, a `401 Unauthorized` error is raised before the endpoint body runs.

### 5.5 Pydantic Request Models
Every POST/PATCH request body is validated via a Pydantic `BaseModel`:

```python
from pydantic import BaseModel, Field

class LoginData(BaseModel):
    username: str
    password: str
    role: str = Field(..., description="Must be 'admin' or 'member'")

class BillGenerateData(BaseModel):
    period: str | None = None
    usage_liters: int = Field(..., ge=0)       # ge=0 means >= 0
    rate_per_liter: int | None = Field(default=None, ge=0)
    due_date: str | None = None
    notes: str | None = None
```
- `Field(..., ge=0)` → `...` means required, `ge=0` means value must be ≥ 0.
- `str | None = None` → optional field, defaults to `None`.
- FastAPI automatically returns `422 Unprocessable Entity` if validation fails.

---

## 6. ORM: SQLAlchemy (In Detail)

### 6.1 What is SQLAlchemy?
SQLAlchemy is the most widely used Python ORM. It lets you define database tables as Python classes and query them using Python objects instead of raw SQL.

### 6.2 Engine & Session Setup (`main.py`, lines 50–75)
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

PREFERRED_DATABASE_URL = "mysql+pymysql://root:password@localhost:3306/jalmiktra"

engine = build_engine(PREFERRED_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

| Concept | Explanation |
|---------|-------------|
| **Engine** | The connection pool to the database. Created once, shared by all requests. |
| **SessionLocal** | A factory that creates new database sessions per request. |
| **declarative_base()** | Returns a base class that all ORM models inherit from. |
| **Connection URL** | `mysql+pymysql://` tells SQLAlchemy to use the PyMySQL driver for MySQL. |

**Fallback mechanism**: If MySQL is unavailable, the system automatically falls back to SQLite:
```python
try:
    engine = build_engine(PREFERRED_DATABASE_URL)
except Exception:
    engine = build_engine("sqlite:///./jalmitra.db")
```

### 6.3 ORM Models (Database Tables as Python Classes)

The project defines **9 ORM models**. Each class maps to a MySQL table:

| Model Class | Table Name | Purpose |
|-------------|-----------|---------|
| `Village` | `villages` | Service areas / localities |
| `Admin` | `admins` | Administrator accounts (username, bcrypt password, profile) |
| `Member` | `members` | Consumer/household accounts (meter ID, connection type, etc.) |
| `City` | `cities` | Cities for water operations monitoring |
| `WaterDailyEntry` | `water_daily_entries` | Daily water supply/consumption per city |
| `Bill` | `bills` | Monthly water bills per member |
| `Complaint` | `complaints` | Member-submitted complaints |
| `Notification` | `notifications` | Admin-to-member alerts |
| `AppSetting` | `app_settings` | Key-value config (tariff rules) |

**Example — `Member` model:**
```python
class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    mobile = Column(String(15), nullable=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="members")
```

**Key SQLAlchemy concepts shown:**
- `Column(Type, ...)` → defines a database column with its type and constraints.
- `ForeignKey("villages.id")` → creates a foreign key relationship to the `villages` table.
- `relationship()` → ORM-level relationship. `member.village` returns the associated `Village` object. `back_populates` makes it bidirectional.
- `UniqueConstraint` → e.g., `Bill` has `UniqueConstraint("member_id", "period")` preventing duplicate bills.
- `index=True` → creates a database index for faster lookups.

### 6.4 Querying with SQLAlchemy

**Simple query:**
```python
admin = db.query(Admin).filter(Admin.username == "admin").first()
```

**Query with OR conditions (login supports username, email, or mobile):**
```python
from sqlalchemy import or_

admin = db.query(Admin).filter(
    or_(
        Admin.username == ident,
        Admin.email == ident,
        Admin.mobile == ident,
    )
).first()
```

**JOIN query:**
```python
q = db.query(Member).outerjoin(Village)
q = q.filter(Member.is_active == True)
q = q.order_by(Member.full_name, Member.id)
members = q.all()
```

**Insert:**
```python
row = Admin(username="admin", password=hashed, full_name="Demo")
db.add(row)
db.commit()
db.refresh(row)  # reload from DB to get auto-generated ID
```

**Update:**
```python
bill.paid = True
bill.paid_date = datetime.utcnow()
db.commit()
```

### 6.5 Schema Migrations (`run_migrations()`, lines 253–382)
Since we don't use Alembic (a full migration tool), we wrote a custom `run_migrations()` function that uses SQLAlchemy's `inspect()` to check which columns already exist and safely adds missing ones:

```python
from sqlalchemy import inspect

insp = inspect(engine)
existing_cols = {c["name"] for c in insp.get_columns("admins")}

if "designation" not in existing_cols:
    conn.execute(text("ALTER TABLE admins ADD COLUMN designation VARCHAR(100)"))
```
This ensures the app works with older database versions without breaking.

---

## 7. Password Security: Passlib + bcrypt

### 7.1 Why bcrypt?
bcrypt is an adaptive hashing algorithm specifically designed for passwords. It includes:
- A **salt** (random value mixed into the hash) — prevents rainbow table attacks
- A **cost factor** (default 12) — makes brute-force attacks computationally expensive
- A hash that looks like: `$2b$12$6amJfe4BS.1DBUr5wedd...`

### 7.2 Implementation
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hashing a password (registration / seeding):
hashed = pwd_context.hash("jalmitra123")
# Result: "$2b$12$randomsaltandhashedvalue..."

# Verifying a password (login):
is_valid = pwd_context.verify("jalmitra123", stored_hash)
# Returns True or False
```

### 7.3 Legacy Password Upgrade
The login endpoint auto-upgrades old plaintext passwords to bcrypt:
```python
if admin.password and not admin.password.startswith("$2"):
    admin.password = pwd_context.hash(data.password)
    db.commit()
```

### 7.4 `verify_password()` — Hybrid Checker
```python
def verify_password(plain: str, stored: str | None) -> bool:
    if not stored:
        return False
    if stored.startswith("$2"):             # bcrypt hash
        return pwd_context.verify(plain, stored)
    return secrets.compare_digest(plain, stored)  # legacy plaintext
```
- `secrets.compare_digest()` is a **constant-time comparison** that prevents timing attacks.

---

## 8. ASGI Server: Uvicorn

Uvicorn is a lightning-fast ASGI (Asynchronous Server Gateway Interface) server. It runs the FastAPI application.

**Launch command:**
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8005
```

| Flag | Meaning |
|------|---------|
| `main:app` | Import the `app` object from `main.py` |
| `--reload` | Auto-restart on code changes (development mode) |
| `--host 127.0.0.1` | Listen on localhost only |
| `--port 8005` | HTTP port number |

---

## 9. Complete REST API Reference

### 9.1 Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message + link to docs |
| `GET` | `/api/health` | Health check — tests DB connectivity |
| `GET` | `/api/villages` | List all villages |
| `POST` | `/api/login` | Authenticate admin or member |
| `POST` | `/api/register/admin` | Register new admin account |
| `POST` | `/api/register/member` | Register new member account |

### 9.2 Admin-Protected Endpoints (`require_admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/members` | List all members with latest bill |
| `GET` | `/api/admin/members/{id}` | Full member profile + all bills |
| `PATCH` | `/api/admin/members/{id}` | Edit member details |
| `PATCH` | `/api/admin/bills/{id}` | Edit/mark bill paid |
| `POST` | `/api/admin/members/{id}/generate-bill` | Generate monthly bill |
| `GET` | `/api/admin/settings/billing-tariff` | Get tariff rules |
| `PUT` | `/api/admin/settings/billing-tariff` | Update tariff rules |
| `GET` | `/api/admin/complaints` | View all member complaints |
| `PATCH` | `/api/admin/complaints/{id}` | Update complaint status |
| `POST` | `/api/admin/alerts` | Send notification to a member |

### 9.3 Member-Protected Endpoints (`require_member`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/member/profile` | Get own profile + bills |
| `GET` | `/api/member/bills` | Get own bills list |
| `GET` | `/api/member/overview` | Dashboard summary (unpaid count, etc.) |
| `POST` | `/api/member/complaints` | Submit a complaint |
| `GET` | `/api/member/complaints` | View own complaints |
| `GET` | `/api/member/notifications` | View notifications from admin |
| `PATCH` | `/api/member/notifications/{id}/read` | Mark notification as read |

### 9.4 Water Operations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/water/entry-meta` | IST clock + recording date |
| `GET` | `/api/cities` | List cities |
| `POST` | `/api/cities` | Create city |
| `POST` | `/api/water/entries` | Submit daily water data |
| `GET` | `/api/water/entries` | Query water entries (with filters) |
| `GET` | `/api/analytics/dashboard` | 7-day aggregated dashboard data |
| `GET` | `/api/analytics/leakage` | Per-city leakage analysis |
| `POST` | `/api/water/reset` | Clear all water entries |

---

## 10. Database Design (ER Diagram)

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│ villages │──1:N──│ members  │──1:N──│  bills   │
└──────────┘       └──────────┘       └──────────┘
                        │
                   ┌────┼────┐
                   │         │
              ┌────┴───┐ ┌───┴──────────┐
              │complaints│ │notifications │
              └─────────┘ └──────────────┘

┌──────────┐       ┌───────────────────┐
│  cities  │──1:N──│ water_daily_entries│
└──────────┘       └───────────────────┘

┌──────────┐       ┌──────────────┐
│  admins  │       │ app_settings │
└──────────┘       └──────────────┘
```

---

## 11. Seed Script (`seed_db.py`)

The seed script creates demo data for testing and presentations. It:

1. Calls `Base.metadata.create_all()` to create any missing tables
2. Upserts 4 villages (A, B, C, D)
3. Upserts 1 demo admin and 3 demo members with **bcrypt-hashed passwords**
4. Creates sample bills (mix of paid and unpaid)

**Key Python pattern — Upsert:**
```python
def upsert_admin(db, username, password, **fields):
    row = db.query(Admin).filter(Admin.username == username).first()
    if row:
        row.password = pwd_context.hash(password)  # UPDATE
    else:
        db.add(Admin(username=username, ...))       # INSERT
```

---

## 12. Business Logic Highlights

### 12.1 Carry-Forward Algorithm (Water Analytics)
If no water data was submitted for a city on a given day, the system carries forward the previous day's values:
```python
def effective_series_for_city(db, city_id, start, end):
    # For each day in range:
    #   if data exists → use it
    #   else → reuse previous day's values (carried_forward=True)
```

### 12.2 Tiered Tariff Billing
Water bills use a slab-based pricing model stored in `app_settings`:
```python
DEFAULT_BILL_TARIFF_RULES = [
    (3000, 1),    # 0–3000 liters → ₹1/liter
    (5000, 2),    # 3001–5000 liters → ₹2/liter
    (10**9, 3),   # 5001+ liters → ₹3/liter
]
```

### 12.3 IST-Aware Date Logic
All dates use IST (Indian Standard Time) via `zoneinfo`:
```python
from zoneinfo import ZoneInfo
TZ = ZoneInfo("Asia/Kolkata")

def yesterdays_entry_date():
    return datetime.now(TZ).date() - timedelta(days=1)
```

---

## 13. How to Run the Project

### Prerequisites
- Python 3.11+
- MySQL 8+ (with MySQL Workbench)
- Node.js 18+ (for frontend)

### Steps
```bash
# 1. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate          # Windows

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Set database URL (or use default in code)
set JALMITRA_DATABASE_URL=mysql+pymysql://root:password@localhost:3306/jalmiktra

# 4. Seed demo data
python seed_db.py

# 5. Start the backend server
uvicorn main:app --reload --host 127.0.0.1 --port 8005

# 6. Open API docs
# Visit: http://127.0.0.1:8005/docs
```

Or simply double-click **`start_jalmitra.bat`** which does all of the above automatically.

---

## 14. Key Python Concepts Used (Quick Reference for Viva)

| Concept | Where Used |
|---------|-----------|
| **Decorators** | `@app.get()`, `@app.post()`, `@app.patch()` — route decorators |
| **Type Hints** | Every function signature uses Python 3.10+ type hints (`str | None`) |
| **Generator Functions** | `get_db()` uses `yield` for session lifecycle management |
| **Dependency Injection** | `Depends(get_db)`, `Depends(require_admin)` |
| **Context Managers** | `with engine.connect() as conn:` for migration statements |
| **List Comprehensions** | `[_member_list_public(m, db) for m in members]` |
| **Dictionary Unpacking** | `db.add(Village(**v))` — unpacks dict into keyword args |
| **f-strings** | `f"mock-jwt-admin-{admin.id}"` for token generation |
| **Exception Handling** | `try/except` blocks for DB fallback, migration safety |
| **Kwargs** | `**fields` in upsert functions for flexible field updates |
| **Enum-like Strings** | Status fields: `"pending"`, `"in-progress"`, `"resolved"` |
| **ORM Relationships** | `relationship()` + `back_populates` for bidirectional access |
| **Class Inheritance** | All models inherit from `Base` (declarative base) |

---

## 15. Summary

Jal Mitra is a production-grade water management system built entirely in **Python** using the modern **FastAPI + SQLAlchemy + Pydantic** stack. The backend provides **30+ RESTful API endpoints** that handle authentication (bcrypt), CRUD operations for 9 database tables, role-based access control, tiered billing logic, time-series analytics with carry-forward, and a real-time complaint/notification system — all powered by a single `main.py` file backed by a MySQL database.
