from __future__ import annotations

import os
import secrets
import json
from datetime import date, datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo

    try:
        TZ = ZoneInfo("Asia/Kolkata")
    except Exception:
        TZ = timezone(timedelta(hours=5, minutes=30))
except Exception:
    TZ = timezone(timedelta(hours=5, minutes=30))

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sqlalchemy import (
    create_engine,
    delete,
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    or_,
    text,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from passlib.context import CryptContext

app = FastAPI(title="Jal Mitra Backend")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_BILL_TARIFF_RULES: list[tuple[int, int]] = [
    (3000, 1),
    (5000, 2),
    (10**9, 3),
]

# ----------------- DATABASE SETUP -----------------
DEFAULT_SQLITE_URL = "sqlite:///./jalmitra.db"
PREFERRED_DATABASE_URL = os.getenv(
    "JALMITRA_DATABASE_URL",
    "mysql+pymysql://root:Mayadinkp2806%40@localhost:3306/jalmiktra",
)


def build_engine(database_url: str):
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args)

ACTIVE_DATABASE_URL = PREFERRED_DATABASE_URL

try:
    engine = build_engine(PREFERRED_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    print(f"WARNING: Preferred DB unavailable ({PREFERRED_DATABASE_URL}). Falling back to SQLite. Error: {e}")
    engine = build_engine(DEFAULT_SQLITE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    ACTIVE_DATABASE_URL = DEFAULT_SQLITE_URL

SQLALCHEMY_DATABASE_URL = ACTIVE_DATABASE_URL


class Village(Base):
    """Villages / service areas — referenced by members (consumer portal)."""
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("Member", back_populates="village")


class Admin(Base):
    """Administrative accounts — full profile stored for ops / audit (visible in MySQL `admins`)."""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    mobile = Column(String(15), nullable=True)
    designation = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    employee_id = Column(String(50), nullable=True, index=True)
    office_address = Column(String(255), nullable=True)
    salary = Column(Integer, nullable=True)
    residential_address = Column(String(255), nullable=True)
    joining_date = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    profile_bio = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Member(Base):
    """Consumer accounts — household / meter details (visible in MySQL `members`)."""
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    full_name = Column(String(100), nullable=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    mobile = Column(String(15), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    alternate_mobile = Column(String(15), nullable=True)
    address = Column(String(255), nullable=True)
    meter_id = Column(String(50), nullable=True)
    consumer_number = Column(String(50), nullable=True, index=True)
    connection_type = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    village = relationship("Village", back_populates="members")
    city = relationship("City")


class City(Base):
    """Cities / service areas for water ops (admin-managed)."""
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    district = Column(String(120), nullable=True)
    state = Column(String(120), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    water_entries = relationship("WaterDailyEntry", back_populates="city")



class WaterDailyEntry(Base):
    """One row per city per calendar day (the day the water figures represent)."""
    __tablename__ = "water_daily_entries"
    __table_args__ = (
        UniqueConstraint("city_id", "entry_date", name="uq_water_city_entry_date"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    water_supplied_liters = Column(Integer, nullable=False)
    water_consumed_liters = Column(Integer, nullable=False)
    pump_status = Column(String(20), nullable=False)
    leakage_liters = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="water_entries")


class Bill(Base):
    """Monthly water bills for members."""
    __tablename__ = "bills"
    __table_args__ = (
        UniqueConstraint("member_id", "period", name="uq_bill_member_period"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    period = Column(String(7), nullable=False)  # YYYY-MM
    usage_liters = Column(Integer, nullable=False, default=0)
    rate_per_liter = Column(Integer, nullable=False, default=0)
    amount = Column(Integer, nullable=False)  # in rupees
    due_date = Column(Date, nullable=False)
    paid = Column(Boolean, nullable=False, default=False)
    paid_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("Member", back_populates="bills")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    skills = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="worker")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    assigned_worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, in-progress, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("Member", back_populates="complaints")
    worker = relationship("Worker", back_populates="complaints")
    updates = relationship("ComplaintUpdate", back_populates="complaint", order_by="desc(ComplaintUpdate.created_at)")


class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    progress_percent = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="updates")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # e.g. bill, maintenance, complaint, notice, alert
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member", back_populates="notifications")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_admin = relationship("Admin")

# Add to Member model relationship (forward ref handled by SQLAlchemy)
Member.bills = relationship("Bill", back_populates="member", order_by="desc(Bill.created_at)")
Member.complaints = relationship("Complaint", back_populates="member", order_by="desc(Complaint.created_at)")
Member.notifications = relationship("Notification", back_populates="member", order_by="desc(Notification.created_at)")


class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



def verify_password(plain: str, stored: str | None) -> bool:
    if not stored:
        return False
    if stored.startswith("$2"):
        try:
            return pwd_context.verify(plain, stored)
        except (ValueError, TypeError):
            return False
    return secrets.compare_digest(plain, stored)


try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass


def run_migrations() -> None:
    """Add new columns on existing MySQL DBs (safe to run multiple times)."""
    from sqlalchemy import inspect

    insp = inspect(engine)

    def cols(table: str) -> set[str]:
        return {c["name"] for c in insp.get_columns(table)}

    alters: list[str] = []
    
    mc = cols("members")
    if "city_id" not in mc:
        alters.append("ALTER TABLE members ADD COLUMN city_id INT NULL AFTER village_id")

    cc = cols("complaints")
    if "assigned_worker_id" not in cc:
        alters.append("ALTER TABLE complaints ADD COLUMN assigned_worker_id INT NULL AFTER member_id")

    if "workers" in insp.get_table_names():
        wc = cols("workers")
        if "phone" not in wc:
            alters.append("ALTER TABLE workers ADD COLUMN phone VARCHAR(15) NULL AFTER name")
            alters.append("UPDATE workers SET phone = mobile WHERE mobile IS NOT NULL")
        if "skills" not in wc:
            alters.append("ALTER TABLE workers ADD COLUMN skills VARCHAR(255) NULL AFTER phone")
            alters.append("UPDATE workers SET skills = role WHERE role IS NOT NULL")
        if "is_active" not in wc:
            alters.append("ALTER TABLE workers ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER skills")
        if "created_at" not in wc:
            alters.append("ALTER TABLE workers ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active")

    ac = cols("admins")
    if "designation" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN designation VARCHAR(100) NULL AFTER mobile"
        )
    if "department" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN department VARCHAR(100) NULL AFTER designation"
        )
    if "employee_id" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN employee_id VARCHAR(50) NULL AFTER department"
        )
    if "office_address" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN office_address VARCHAR(255) NULL AFTER employee_id"
        )
    if "salary" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN salary INT NULL AFTER office_address")
    if "residential_address" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN residential_address VARCHAR(255) NULL AFTER salary")
    if "joining_date" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN joining_date DATE NULL AFTER residential_address")
    if "age" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN age INT NULL AFTER joining_date")
    if "profile_bio" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN profile_bio TEXT NULL AFTER age")
    if "notes" not in ac:
        alters.append("ALTER TABLE admins ADD COLUMN notes TEXT NULL AFTER profile_bio")
    if "is_active" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER notes"
        )
    if "updated_at" not in ac:
        alters.append(
            "ALTER TABLE admins ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
        )

    mc = cols("members")
    if "email" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN email VARCHAR(255) NULL AFTER mobile"
        )
    if "alternate_mobile" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN alternate_mobile VARCHAR(15) NULL AFTER email"
        )
    if "consumer_number" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN consumer_number VARCHAR(50) NULL AFTER meter_id"
        )
    if "connection_type" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN connection_type VARCHAR(50) NULL AFTER consumer_number"
        )
    if "remarks" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN remarks TEXT NULL AFTER connection_type"
        )
    if "is_active" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER remarks"
        )
    if "updated_at" not in mc:
        alters.append(
            "ALTER TABLE members ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
        )

    if "bills" in insp.get_table_names():
        bc = cols("bills")
        if "member_id" not in bc and "user_id" in bc:
            alters.append("ALTER TABLE bills ADD COLUMN member_id INT NULL AFTER id")
            alters.append("UPDATE bills SET member_id = user_id WHERE member_id IS NULL")
        if "period" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN period VARCHAR(7) NULL AFTER member_id")
            alters.append("UPDATE bills SET period = DATE_FORMAT(COALESCE(created_at, NOW()), '%Y-%m') WHERE period IS NULL")
        if "usage_liters" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN usage_liters INT NOT NULL DEFAULT 0 AFTER period")
            if "total_usage" in bc:
                alters.append("UPDATE bills SET usage_liters = COALESCE(CAST(total_usage AS SIGNED), 0)")
        if "rate_per_liter" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN rate_per_liter INT NOT NULL DEFAULT 0 AFTER usage_liters")
            if "total_usage" in bc and "final_amount" in bc:
                alters.append(
                    "UPDATE bills SET rate_per_liter = CASE "
                    "WHEN COALESCE(total_usage, 0) > 0 THEN ROUND(COALESCE(final_amount, amount, 0) / total_usage) "
                    "ELSE 0 END"
                )
        if "paid" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN paid TINYINT(1) NOT NULL DEFAULT 0 AFTER due_date")
            if "status" in bc:
                alters.append("UPDATE bills SET paid = CASE WHEN status = 'paid' THEN 1 ELSE 0 END")
        if "paid_date" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN paid_date DATETIME NULL AFTER paid")
        if "notes" not in bc:
            alters.append("ALTER TABLE bills ADD COLUMN notes TEXT NULL AFTER paid_date")
        if "updated_at" not in bc:
            alters.append(
                "ALTER TABLE bills ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
            )
        # add index and uniqueness after columns exist/populate; ignore if already present
        alters.append("ALTER TABLE bills MODIFY COLUMN member_id INT NOT NULL")
        alters.append("CREATE INDEX ix_bill_member_id ON bills (member_id)")
        alters.append("CREATE INDEX ix_bill_period ON bills (period)")
        alters.append("CREATE INDEX ix_bill_due_date ON bills (due_date)")
        alters.append("ALTER TABLE bills ADD CONSTRAINT uq_bill_member_period UNIQUE (member_id, period)")

    if "app_settings" in insp.get_table_names():
        sc = cols("app_settings")
        if "updated_at" not in sc:
            alters.append(
                "ALTER TABLE app_settings ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER setting_value"
            )

    if not alters:
        return
    with engine.connect() as conn:
        for stmt in alters:
            try:
                conn.execute(text(stmt))
            except Exception:
                # Legacy DBs may already have indexes/constraints or incompatible old artifacts.
                continue
        conn.commit()


try:
    run_migrations()
except Exception as e:
    print(f"Note: DB migration skipped or partial: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _admin_to_public(a: Admin) -> dict:
    return {
        "id": a.id,
        "username": a.username,
        "full_name": a.full_name,
        "email": a.email,
        "mobile": a.mobile,
        "designation": a.designation,
        "department": a.department,
        "employee_id": a.employee_id,
        "office_address": a.office_address,
        "salary": a.salary,
        "residential_address": a.residential_address,
        "joining_date": a.joining_date.isoformat() if a.joining_date else None,
        "age": a.age,
        "profile_bio": a.profile_bio,
        "notes": a.notes,
        "is_active": a.is_active,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }



def _member_to_public(m: Member, db: Session) -> dict:
    village_name = None
    village_location = None
    if m.city_id:
        c = db.query(City).filter(City.id == m.city_id).first()
        village_name = c.name if c else None
        village_location = c.district if c else None
    elif m.village_id:
        v = db.query(Village).filter(Village.id == m.village_id).first()
        village_name = v.name if v else None
        village_location = v.location if v else None
    return {
        "id": m.id,
        "username": m.username,
        "full_name": m.full_name,
        "mobile": m.mobile,
        "email": m.email,
        "alternate_mobile": m.alternate_mobile,
        "village_id": m.city_id or m.village_id,
        "village_name": village_name,
        "village_location": village_location,
        "address": m.address,
        "meter_id": m.meter_id,
        "consumer_number": m.consumer_number,
        "connection_type": m.connection_type,
        "remarks": m.remarks,
        "is_active": m.is_active,
        "village_location": village_location,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


def _latest_bill_summary(db: Session, member_id: int) -> dict | None:
    """Latest bill for member: amount, paid status, period."""
    latest = (
        db.query(Bill)
        .filter(Bill.member_id == member_id)
        .order_by(Bill.period.desc())
        .first()
    )
    if not latest:
        return None
    return {
        "id": latest.id,
        "period": latest.period,
        "usage_liters": latest.usage_liters,
        "rate_per_liter": latest.rate_per_liter,
        "amount": latest.amount,
        "paid": latest.paid,
        "due_date": latest.due_date.isoformat() if latest.due_date else None,
    }


def _member_list_public(m: Member, db: Session) -> dict:
    """For admin list: core + latest bill summary."""
    base = _member_to_public(m, db)
    bill = _latest_bill_summary(db, m.id)
    base["latest_bill"] = bill
    return base


def _member_detail_public(m: Member, db: Session) -> dict:
    """Full detail + all bills for profile view."""
    base = _member_to_public(m, db)
    bills = db.query(Bill).filter(Bill.member_id == m.id).order_by(Bill.period.desc()).all()
    base["bills"] = [
        {
            "id": b.id,
            "period": b.period,
            "usage_liters": b.usage_liters,
            "rate_per_liter": b.rate_per_liter,
            "amount": b.amount,
            "due_date": b.due_date.isoformat() if b.due_date else None,
            "paid": b.paid,
            "paid_date": b.paid_date.isoformat() if b.paid_date else None,
            "notes": b.notes,
        }
        for b in bills
    ]
    return base



def yesterdays_entry_date() -> date:
    """Business rule: figures entered today apply to yesterday (IST)."""
    return datetime.now(TZ).date() - timedelta(days=1)


def _leakage_liters(supplied: int, consumed: int, explicit: int | None) -> int:
    if explicit is not None:
        return max(0, explicit)
    return max(0, supplied - consumed)


def _default_bill_due_date(period: str) -> date:
    year, month = [int(part) for part in period.split("-", 1)]
    if month == 12:
        return date(year + 1, 1, 5)
    return date(year, month + 1, 5)


def _normalize_tariff_rules(raw_rules: list[dict] | list[tuple[int, int]] | None) -> list[tuple[int, int]]:
    if not raw_rules:
        return DEFAULT_BILL_TARIFF_RULES
    normalized: list[tuple[int, int]] = []
    for raw in raw_rules:
        if isinstance(raw, dict):
            max_usage = int(raw.get("max_usage", 0))
            rate = int(raw.get("rate_per_liter", 0))
        else:
            max_usage = int(raw[0])
            rate = int(raw[1])
        normalized.append((max_usage, rate))
    normalized = [(max_usage, rate) for max_usage, rate in normalized if max_usage >= 0 and rate >= 0]
    normalized.sort(key=lambda item: item[0])
    if not normalized:
        return DEFAULT_BILL_TARIFF_RULES
    if normalized[-1][0] < 10**9:
        normalized.append((10**9, normalized[-1][1]))
    return normalized


def _get_tariff_rules(db: Session) -> list[tuple[int, int]]:
    row = db.query(AppSetting).filter(AppSetting.setting_key == "billing_tariff_rules").first()
    if not row:
        return DEFAULT_BILL_TARIFF_RULES
    try:
        payload = json.loads(row.setting_value)
    except Exception:
        return DEFAULT_BILL_TARIFF_RULES
    return _normalize_tariff_rules(payload)


def _save_tariff_rules(db: Session, rules: list[tuple[int, int]]) -> list[tuple[int, int]]:
    normalized = _normalize_tariff_rules(rules)
    payload = json.dumps(
        [{"max_usage": max_usage, "rate_per_liter": rate} for max_usage, rate in normalized],
        separators=(",", ":"),
    )
    row = db.query(AppSetting).filter(AppSetting.setting_key == "billing_tariff_rules").first()
    if not row:
        row = AppSetting(setting_key="billing_tariff_rules", setting_value=payload)
        db.add(row)
    else:
        row.setting_value = payload
    db.commit()
    return normalized


def _rate_for_usage(usage_liters: int, rules: list[tuple[int, int]]) -> int:
    for max_usage, rate in rules:
        if usage_liters <= max_usage:
            return rate
    return rules[-1][1]


def _daterange(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def effective_series_for_city(
    db: Session, city_id: int, start: date, end: date
) -> list[dict]:
    """Carry-forward: if a day has no row, reuse previous day's effective values."""
    prior = (
        db.query(WaterDailyEntry)
        .filter(WaterDailyEntry.city_id == city_id, WaterDailyEntry.entry_date < start)
        .order_by(WaterDailyEntry.entry_date.desc())
        .first()
    )
    last_sup, last_con = 0, 0
    last_pump = "inactive"
    if prior:
        last_sup = prior.water_supplied_liters
        last_con = prior.water_consumed_liters
        last_pump = prior.pump_status

    rows = (
        db.query(WaterDailyEntry)
        .filter(
            WaterDailyEntry.city_id == city_id,
            WaterDailyEntry.entry_date >= start,
            WaterDailyEntry.entry_date <= end,
        )
        .order_by(WaterDailyEntry.entry_date)
        .all()
    )
    by_date = {r.entry_date: r for r in rows}
    out: list[dict] = []
    for d in _daterange(start, end):
        if d in by_date:
            r = by_date[d]
            lk = r.leakage_liters
            if lk is None:
                lk = _leakage_liters(r.water_supplied_liters, r.water_consumed_liters, None)
            last_sup = r.water_supplied_liters
            last_con = r.water_consumed_liters
            last_pump = r.pump_status
            out.append(
                {
                    "date": d.isoformat(),
                    "water_supplied_liters": last_sup,
                    "water_consumed_liters": last_con,
                    "pump_status": last_pump,
                    "leakage_liters": lk,
                    "loss_percent": round(
                        (lk / last_sup * 100.0) if last_sup > 0 else 0.0, 2
                    ),
                    "carried_forward": False,
                }
            )
        else:
            lk = _leakage_liters(last_sup, last_con, None)
            out.append(
                {
                    "date": d.isoformat(),
                    "water_supplied_liters": last_sup,
                    "water_consumed_liters": last_con,
                    "pump_status": last_pump,
                    "leakage_liters": lk,
                    "loss_percent": round((lk / last_sup * 100.0) if last_sup > 0 else 0.0, 2),
                    "carried_forward": True,
                }
            )
    return out


class LoginData(BaseModel):
    username: str
    password: str
    role: str = Field(..., description="Must be 'admin' or 'member' - selects which table to authenticate against")


class AdminRegisterData(BaseModel):
    username: str
    password: str
    full_name: str
    email: str | None = None
    mobile: str | None = None
    designation: str | None = None
    department: str | None = None
    employee_id: str | None = None
    office_address: str | None = None
    notes: str | None = None


class MemberRegisterData(BaseModel):
    username: str
    password: str
    full_name: str
    mobile: str
    email: str | None = None
    alternate_mobile: str | None = None
    village_id: int | None = None
    address: str | None = None
    meter_id: str | None = None
    consumer_number: str | None = None
    connection_type: str | None = None
    remarks: str | None = None


class CityCreate(BaseModel):
    name: str
    district: str | None = None
    state: str | None = None
    notes: str | None = None


class WaterEntryCreate(BaseModel):
    city_id: int
    water_supplied_liters: int = Field(ge=0)
    water_consumed_liters: int = Field(ge=0)
    pump_status: str
    leakage_liters: int | None = Field(None, ge=0)
    notes: str | None = None


class WaterResetBody(BaseModel):
    confirm: bool = False


class MemberListQuery(BaseModel):
    active_only: bool = True


class MemberEditData(BaseModel):
    full_name: str | None = None
    mobile: str | None = None
    email: str | None = None
    password: str | None = None


class BillEditData(BaseModel):
    usage_liters: int | None = Field(None, ge=0)
    rate_per_liter: int | None = Field(None, ge=0)
    amount: int | None = Field(None, ge=0)
    due_date: str | None = None
    paid: bool | None = None
    notes: str | None = None


class BillGenerateData(BaseModel):
    period: str | None = None
    usage_liters: int = Field(..., ge=0)
    rate_per_liter: int | None = Field(default=None, ge=0)
    due_date: str | None = None
    notes: str | None = None


class TariffRuleData(BaseModel):
    max_usage: int = Field(..., ge=0)
    rate_per_liter: int = Field(..., ge=0)


class BillingTariffSettingsData(BaseModel):
    rules: list[TariffRuleData]

class ComplaintCreate(BaseModel):
    type: str
    description: str

class ComplaintStatusUpdate(BaseModel):
    status: str
    assigned_worker_id: int | None = None


class ComplaintUpdateCreate(BaseModel):
    message: str
    progress_percent: int | None = Field(default=None, ge=0, le=100)

class WorkerCreate(BaseModel):
    name: str
    phone: str
    skills: str | None = None

class NotificationCreate(BaseModel):
    member_id: int
    type: str
    title: str
    message: str


class AnnouncementCreate(BaseModel):
    title: str
    message: str



# Admin user management APIs (mock auth - token starts with mock-jwt-admin-)
def _extract_token_value(raw_header: str | None) -> str | None:
    if not raw_header:
        return None
    value = raw_header.strip()
    if value.lower().startswith("bearer "):
        return value[7:].strip()
    return value


def require_admin(authorization: str | None = Header(None, alias="Authorization")):
    token = _extract_token_value(authorization)
    if not token or not token.startswith("mock-jwt-admin-"):
        raise HTTPException(status_code=401, detail="Admin access required")
    return token


def require_member(authorization: str | None = Header(None, alias="Authorization")):
    token = _extract_token_value(authorization)
    if not token or not token.startswith("mock-jwt-member-"):
        raise HTTPException(status_code=401, detail="Member access required")
    return token


@app.get("/api/admin/settings/billing-tariff")
def get_billing_tariff_settings(
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    rules = _get_tariff_rules(db)
    return {
        "rules": [
            {"max_usage": max_usage, "rate_per_liter": rate}
            for max_usage, rate in rules
        ]
    }


@app.put("/api/admin/settings/billing-tariff")
def update_billing_tariff_settings(
    data: BillingTariffSettingsData,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    rules = _save_tariff_rules(
        db,
        [(rule.max_usage, rule.rate_per_liter) for rule in data.rules],
    )
    return {
        "message": "Billing tariff updated",
        "rules": [
            {"max_usage": max_usage, "rate_per_liter": rate}
            for max_usage, rate in rules
        ],
    }


@app.get("/api/admin/members")
def list_members(query: MemberListQuery = Depends(), db: Session = Depends(get_db), token: str = Depends(require_admin)):
    """Admin: List all/active members + village + latest bill summary."""
    q = db.query(Member).outerjoin(Village)
    if query.active_only:
        q = q.filter(Member.is_active == True)
    q = q.order_by(Member.full_name, Member.id)
    members = q.all()
    return [_member_list_public(m, db) for m in members]


@app.get("/api/admin/staff")
def list_staff(db: Session = Depends(get_db), token: str = Depends(require_admin)):
    """Admin: List all staff (admins)."""
    admins = db.query(Admin).order_by(Admin.full_name, Admin.id).all()
    return [_admin_to_public(a) for a in admins]


@app.get("/api/admin/members/{member_id}")
def get_member_detail(member_id: int, db: Session = Depends(get_db), token: str = Depends(require_admin)):
    """Admin: Full member profile + all bills."""
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_detail_public(m, db)


@app.patch("/api/admin/members/{member_id}")
def edit_member(member_id: int, data: MemberEditData, db: Session = Depends(get_db), token: str = Depends(require_admin)):
    """Admin: Edit member phone/email/password."""
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    
    updates = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name.strip() or None
    if data.mobile is not None:
        updates["mobile"] = data.mobile.strip() or None
    if data.email is not None:
        updates["email"] = data.email.strip().lower() or None
    if data.password:
        # Check uniqueness? Skip for simplicity
        updates["password"] = pwd_context.hash(data.password)
        m.updated_at = datetime.utcnow()
    
    for k, v in updates.items():
        setattr(m, k, v)
    
    db.commit()
    db.refresh(m)
    return {
        "message": "Member updated",
        "member_id": m.id,
        "record": _member_to_public(m, db)
    }


@app.patch("/api/admin/bills/{bill_id}")
def edit_bill(
    bill_id: int,
    data: BillEditData,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    """Admin: Mark bill paid/unpaid and adjust bill details."""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if data.usage_liters is not None:
        bill.usage_liters = data.usage_liters
    if data.rate_per_liter is not None:
        bill.rate_per_liter = data.rate_per_liter
    if data.amount is not None:
        bill.amount = data.amount
    elif data.usage_liters is not None or data.rate_per_liter is not None:
        bill.amount = bill.usage_liters * bill.rate_per_liter
    if data.due_date is not None:
        bill.due_date = date.fromisoformat(data.due_date)
    if data.notes is not None:
        bill.notes = data.notes.strip() or None
    if data.paid is not None:
        bill.paid = data.paid
        bill.paid_date = datetime.utcnow() if data.paid else None

    db.commit()
    db.refresh(bill)
    return {
        "message": "Bill updated",
        "bill": {
            "id": bill.id,
            "period": bill.period,
            "usage_liters": bill.usage_liters,
            "rate_per_liter": bill.rate_per_liter,
            "amount": bill.amount,
            "due_date": bill.due_date.isoformat() if bill.due_date else None,
            "paid": bill.paid,
            "paid_date": bill.paid_date.isoformat() if bill.paid_date else None,
            "notes": bill.notes,
        },
    }


@app.post("/api/admin/members/{member_id}/generate-bill")
def generate_member_bill(
    member_id: int,
    data: BillGenerateData,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    period = (data.period or datetime.now(TZ).strftime("%Y-%m")).strip()
    usage_liters = data.usage_liters
    tariff_rules = _get_tariff_rules(db)
    rate_per_liter = data.rate_per_liter if data.rate_per_liter is not None else _rate_for_usage(usage_liters, tariff_rules)
    amount = usage_liters * rate_per_liter
    due_date = date.fromisoformat(data.due_date) if data.due_date else _default_bill_due_date(period)

    bill = db.query(Bill).filter(Bill.member_id == member_id, Bill.period == period).first()
    action = "updated"
    if not bill:
        bill = Bill(
            member_id=member_id,
            period=period,
            usage_liters=usage_liters,
            rate_per_liter=rate_per_liter,
            amount=amount,
            due_date=due_date,
            paid=False,
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(bill)
        action = "created"
    else:
        bill.usage_liters = usage_liters
        bill.rate_per_liter = rate_per_liter
        bill.amount = amount
        bill.due_date = due_date
        bill.notes = data.notes.strip() if data.notes else None

    db.commit()
    db.refresh(bill)
    return {
        "message": f"Bill {action}",
        "bill": {
            "id": bill.id,
            "period": bill.period,
            "usage_liters": bill.usage_liters,
            "rate_per_liter": bill.rate_per_liter,
            "amount": bill.amount,
            "due_date": bill.due_date.isoformat() if bill.due_date else None,
            "paid": bill.paid,
            "paid_date": bill.paid_date.isoformat() if bill.paid_date else None,
            "notes": bill.notes,
        },
        "tariff": {
            "usage_liters": usage_liters,
            "rate_per_liter": rate_per_liter,
            "amount": amount,
        },
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginData(BaseModel):
    username: str
    password: str
    role: str = Field(..., description="Must be 'admin' or 'member' — selects which table to authenticate against")


class AdminRegisterData(BaseModel):
    username: str
    password: str
    full_name: str
    email: str | None = None
    mobile: str | None = None
    designation: str | None = None
    department: str | None = None
    employee_id: str | None = None
    office_address: str | None = None
    notes: str | None = None


class MemberRegisterData(BaseModel):
    username: str
    password: str
    full_name: str
    mobile: str
    email: str | None = None
    alternate_mobile: str | None = None
    village_id: int | None = None
    city_id: int | None = None
    address: str | None = None
    meter_id: str | None = None
    consumer_number: str | None = None
    connection_type: str | None = None
    remarks: str | None = None


class CityCreate(BaseModel):
    name: str
    district: str | None = None
    state: str | None = None
    notes: str | None = None


class WaterEntryCreate(BaseModel):
    city_id: int
    water_supplied_liters: int = Field(ge=0)
    water_consumed_liters: int = Field(ge=0)
    pump_status: str
    leakage_liters: int | None = Field(None, ge=0)
    notes: str | None = None



class WaterResetBody(BaseModel):
    confirm: bool = False


class MemberListQuery(BaseModel):
    active_only: bool = True


class MemberEditData(BaseModel):
    full_name: str | None = None
    mobile: str | None = None
    email: str | None = None
    password: str | None = None  # new password, hashed if provided


class BillEditData(BaseModel):
    amount: int | None = Field(None, ge=0)
    due_date: str | None = None
    paid: bool | None = None
    notes: str | None = None



@app.get("/")
def read_root():
    return {"message": "Welcome to the Jal Mitra API", "docs": "/docs"}


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.get("/api/villages")
def list_villages(db: Session = Depends(get_db)):
    rows = db.query(Village).order_by(Village.name).all()
    return [
        {"id": v.id, "name": v.name, "location": v.location} for v in rows
    ]


@app.post("/api/register/admin")
def register_admin(data: AdminRegisterData, db: Session = Depends(get_db)):
    if db.query(Admin).filter(Admin.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if data.employee_id:
        if db.query(Admin).filter(Admin.employee_id == data.employee_id).first():
            raise HTTPException(status_code=400, detail="Employee ID already registered")
    hashed = pwd_context.hash(data.password)
    row = Admin(
        username=data.username,
        password=hashed,
        full_name=data.full_name,
        email=data.email,
        mobile=data.mobile,
        designation=data.designation,
        department=data.department,
        employee_id=data.employee_id,
        office_address=data.office_address,
        notes=data.notes,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "message": "Admin registered successfully",
        "admin_id": row.id,
        "record": _admin_to_public(row),
    }


@app.post("/api/register/member")
def register_member(data: MemberRegisterData, db: Session = Depends(get_db)):
    if db.query(Member).filter(Member.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if data.village_id is not None:
        if not db.query(Village).filter(Village.id == data.village_id).first():
            raise HTTPException(status_code=400, detail="Invalid village_id")
    if data.mobile:
        existing_m = db.query(Member).filter(Member.mobile == data.mobile).first()
        if existing_m:
            raise HTTPException(status_code=400, detail="Mobile already registered")
    if data.email:
        existing_e = db.query(Member).filter(Member.email == data.email).first()
        if existing_e:
            raise HTTPException(status_code=400, detail="Email already registered")
    if data.consumer_number:
        existing_c = db.query(Member).filter(Member.consumer_number == data.consumer_number).first()
        if existing_c:
            raise HTTPException(status_code=400, detail="Consumer number already registered")
    hashed = pwd_context.hash(data.password)
    row = Member(
        username=data.username,
        password=hashed,
        full_name=data.full_name,
        mobile=data.mobile,
        email=data.email,
        alternate_mobile=data.alternate_mobile,
        village_id=data.village_id,
        city_id=data.city_id,
        address=data.address,
        meter_id=data.meter_id,
        consumer_number=data.consumer_number,
        connection_type=data.connection_type,
        remarks=data.remarks,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "message": "Member registered successfully",
        "member_id": row.id,
        "record": _member_to_public(row, db),
    }


@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    role = data.role.strip().lower()
    if role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="role must be 'admin' or 'member'")

    ident = data.username.strip()

    if role == "admin":
        admin = (
            db.query(Admin)
            .filter(
                or_(
                    Admin.username == ident,
                    Admin.email == ident,
                    Admin.mobile == ident,
                )
            )
            .first()
        )
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(data.password, admin.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if admin.password and not admin.password.startswith("$2"):
            admin.password = pwd_context.hash(data.password)
            db.commit()
        return {
            "message": "Login successful",
            "role": "admin",
            "user_id": admin.id,
            "full_name": admin.full_name or admin.username,
            "token": f"mock-jwt-admin-{admin.id}",
        }

    # member
    member = (
        db.query(Member)
        .filter(
            or_(
                Member.username == ident,
                Member.mobile == ident,
                Member.email == ident,
            )
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, member.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if member.password and not member.password.startswith("$2"):
        member.password = pwd_context.hash(data.password)
        db.commit()
    return {
        "message": "Login successful",
        "role": "member",
        "user_id": member.id,
        "full_name": member.full_name or member.username,
        "token": f"mock-jwt-member-{member.id}",
    }


@app.get("/api/member/profile")
def member_profile(db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_detail_public(member, db)


@app.get("/api/member/bills")
def member_bills(db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_detail_public(member, db)["bills"]


@app.get("/api/member/overview")
def member_overview(db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    detail = _member_detail_public(member, db)
    latest_bill = _latest_bill_summary(db, member.id)
    unpaid_count = sum(1 for bill in detail["bills"] if not bill["paid"])

    return {
        "member": detail,
        "latest_bill": latest_bill,
        "summary": {
            "unpaid_bills": unpaid_count,
            "total_bills": len(detail["bills"]),
            "paid_bills": len(detail["bills"]) - unpaid_count,
        },
    }


@app.get("/api/water/entry-meta")
def water_entry_meta():
    """IST clock + the calendar date rows will attach to (yesterday)."""
    now = datetime.now(TZ)
    y = yesterdays_entry_date()
    return {
        "timezone": "Asia/Kolkata",
        "server_now_iso": now.isoformat(),
        "recording_date_iso": y.isoformat(),
        "recording_label": f"Data you submit now is stored for {y.isoformat()} (previous calendar day, IST).",
    }


@app.get("/api/cities")
def list_cities(active_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(City)
    if active_only:
        q = q.filter(City.is_active == True)  # noqa: E712
    rows = q.order_by(City.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "state": c.state,
            "notes": c.notes,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in rows
    ]


@app.post("/api/cities")
def create_city(data: CityCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="City name required")
    if db.query(City).filter(City.name == name).first():
        raise HTTPException(status_code=400, detail="City name already exists")
    row = City(
        name=name,
        district=data.district.strip() if data.district else None,
        state=data.state.strip() if data.state else None,
        notes=data.notes.strip() if data.notes else None,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"message": "City created", "city_id": row.id, "name": row.name}


@app.post("/api/water/entries")
def create_water_entry(data: WaterEntryCreate, db: Session = Depends(get_db)):
    ps = data.pump_status.strip().lower()
    if ps not in ("active", "inactive", "maintenance"):
        raise HTTPException(status_code=400, detail="pump_status must be active, inactive, or maintenance")
    city = db.query(City).filter(City.id == data.city_id, City.is_active == True).first()  # noqa: E712
    if not city:
        raise HTTPException(status_code=400, detail="City not found or inactive")

    entry_date = yesterdays_entry_date()
    existing = (
        db.query(WaterDailyEntry)
        .filter(
            WaterDailyEntry.city_id == data.city_id,
            WaterDailyEntry.entry_date == entry_date,
        )
        .first()
    )

    lk = data.leakage_liters
    if lk is None:
        lk = _leakage_liters(data.water_supplied_liters, data.water_consumed_liters, None)

    if existing:
        existing.water_supplied_liters = data.water_supplied_liters
        existing.water_consumed_liters = data.water_consumed_liters
        existing.pump_status = ps
        existing.leakage_liters = lk
        existing.notes = data.notes.strip() if data.notes else None
        row = existing
        action = "updated"
    else:
        row = WaterDailyEntry(
            city_id=data.city_id,
            entry_date=entry_date,
            water_supplied_liters=data.water_supplied_liters,
            water_consumed_liters=data.water_consumed_liters,
            pump_status=ps,
            leakage_liters=lk,
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(row)
        action = "created"
    db.commit()
    db.refresh(row)
    return {
        "message": f"Water data {action}",
        "action": action,
        "entry_id": row.id,
        "entry_date": row.entry_date.isoformat(),
        "city_id": row.city_id,
    }


@app.get("/api/water/entries")
def list_water_entries(
    city_id: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
):
    """Raw rows for MySQL parity / debugging (also visible in Workbench table `water_daily_entries`)."""
    q = db.query(WaterDailyEntry).join(City).order_by(
        WaterDailyEntry.entry_date.desc(), City.name
    )
    if city_id is not None:
        q = q.filter(WaterDailyEntry.city_id == city_id)
    if date_from:
        q = q.filter(WaterDailyEntry.entry_date >= date.fromisoformat(date_from))
    if date_to:
        q = q.filter(WaterDailyEntry.entry_date <= date.fromisoformat(date_to))
    rows = q.all()
    out = []
    for r in rows:
        c = db.query(City).filter(City.id == r.city_id).first()
        out.append(
            {
                "id": r.id,
                "city_id": r.city_id,
                "city_name": c.name if c else None,
                "entry_date": r.entry_date.isoformat(),
                "water_supplied_liters": r.water_supplied_liters,
                "water_consumed_liters": r.water_consumed_liters,
                "pump_status": r.pump_status,
                "leakage_liters": r.leakage_liters,
                "notes": r.notes,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            }
        )
    return out


@app.get("/api/analytics/dashboard")
def analytics_dashboard(db: Session = Depends(get_db)):
    """Last 7 IST days ending yesterday; carry-forward per city then summed."""
    end = yesterdays_entry_date()
    start = end - timedelta(days=6)
    cities = db.query(City).filter(City.is_active == True).order_by(City.name).all()  # noqa: E712
    if not cities:
        daily_empty: list[dict] = []
        for i in range(7):
            d_obj = start + timedelta(days=i)
            daily_empty.append(
                {
                    "date": d_obj.isoformat(),
                    "label": d_obj.strftime("%a"),
                    "total_supplied": 0,
                    "total_consumed": 0,
                    "total_leakage": 0,
                    "loss_percent": 0.0,
                }
            )
        return {
            "range": {"start": start.isoformat(), "end": end.isoformat()},
            "summary": {
                "total_supplied_week": 0,
                "total_consumed_week": 0,
                "total_leakage_week": 0,
                "avg_loss_percent_week": 0.0,
                "active_alerts": 0,
            },
            "daily": daily_empty,
            "cities_count": 0,
        }

    per_city_series = [
        effective_series_for_city(db, c.id, start, end) for c in cities
    ]
    n_days = (end - start).days + 1
    daily: list[dict] = []
    total_sup = total_con = total_leak = 0.0
    for i in range(n_days):
        ds = 0
        dc = 0
        dl = 0
        for series in per_city_series:
            if i < len(series):
                ds += series[i]["water_supplied_liters"]
                dc += series[i]["water_consumed_liters"]
                dl += series[i]["leakage_liters"]
        total_sup += ds
        total_con += dc
        total_leak += dl
        d_obj = start + timedelta(days=i)
        daily.append(
            {
                "date": d_obj.isoformat(),
                "label": d_obj.strftime("%a"),
                "total_supplied": ds,
                "total_consumed": dc,
                "total_leakage": dl,
                "loss_percent": round((dl / ds * 100.0) if ds > 0 else 0.0, 2),
            }
        )

    avg_loss = (total_leak / total_sup * 100.0) if total_sup > 0 else 0.0

    alerts = 0
    for series in per_city_series:
        if series:
            last = series[-1]
            if last["loss_percent"] > 10:
                alerts += 1

    return {
        "range": {"start": start.isoformat(), "end": end.isoformat()},
        "summary": {
            "total_supplied_week": int(total_sup),
            "total_consumed_week": int(total_con),
            "total_leakage_week": int(total_leak),
            "avg_loss_percent_week": round(avg_loss, 2),
            "active_alerts": alerts,
        },
        "daily": daily,
        "cities_count": len(cities),
    }


@app.get("/api/analytics/leakage")
def analytics_leakage(db: Session = Depends(get_db)):
    """Per-city latest effective day in the 7-day window (carry-forward aware)."""
    end = yesterdays_entry_date()
    start = end - timedelta(days=6)
    cities = db.query(City).filter(City.is_active == True).order_by(City.name).all()  # noqa: E712
    rows_out = []
    for c in cities:
        series = effective_series_for_city(db, c.id, start, end)
        last = series[-1] if series else None
        if not last:
            continue
        lp = last["loss_percent"]
        status = "critical" if lp > 10 else ("warning" if lp > 7 else "normal")
        rows_out.append(
            {
                "city_id": c.id,
                "city_name": c.name,
                "date": last["date"],
                "supplied": last["water_supplied_liters"],
                "consumed": last["water_consumed_liters"],
                "leakage_liters": last["leakage_liters"],
                "loss_percent": last["loss_percent"],
                "status": status,
                "carried_forward": last["carried_forward"],
            }
        )
    rows_out.sort(key=lambda x: -x["loss_percent"])
    total_loss = sum(r["leakage_liters"] for r in rows_out)
    avg_loss = (
        sum(r["loss_percent"] for r in rows_out) / len(rows_out) if rows_out else 0.0
    )
    critical = sum(1 for r in rows_out if r["status"] == "critical")
    return {
        "range": {"start": start.isoformat(), "end": end.isoformat()},
        "summary": {
            "total_leakage_liters": int(total_loss),
            "avg_loss_percent": round(avg_loss, 2),
            "critical_areas": critical,
        },
        "by_city": rows_out,
    }


@app.post("/api/water/reset")
def reset_water_data(body: WaterResetBody, db: Session = Depends(get_db)):
    """Clear all water daily entries (dashboard starts from zero). Cities are kept."""
    if not body.confirm:
        raise HTTPException(status_code=400, detail="Send { \"confirm\": true }")
    db.execute(delete(WaterDailyEntry))
    db.commit()
    return {"message": "All water_daily_entries rows deleted. New entries count from now."}


@app.post("/api/member/complaints")
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    complaint = Complaint(
        member_id=member_id,
        type=data.type,
        description=data.description,
        status="pending"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return {"message": "Complaint submitted", "id": complaint.id}

@app.get("/api/member/complaints")
def list_member_complaints(db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    complaints = db.query(Complaint).filter(Complaint.member_id == member_id).order_by(Complaint.created_at.desc()).all()
    out = []
    for c in complaints:
        last_update = c.updates[0] if c.updates else None
        out.append(
            {
                "id": c.id,
                "type": c.type,
                "description": c.description,
                "status": c.status,
                "assigned_worker_id": c.assigned_worker_id,
                "assigned_worker_name": c.worker.name if c.worker else None,
                "last_update_message": last_update.message if last_update else None,
                "last_update_percent": last_update.progress_percent if last_update else None,
                "date": c.created_at.date().isoformat(),
            }
        )
    return out

@app.get("/api/admin/complaints")
def list_admin_complaints(db: Session = Depends(get_db), token: str = Depends(require_admin)):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    out = []
    for c in complaints:
        m = db.query(Member).filter(Member.id == c.member_id).first()
        area = "Unknown Area"
        if m:
            if m.city_id:
                area = m.city.name
            elif m.village_id:
                area = m.village.name
        
        last_update = c.updates[0] if c.updates else None
        out.append({
            "id": c.id,
            "member_id": c.member_id,
            "member_name": m.full_name or m.username if m else "Unknown",
            "area": area,
            "assigned_worker_id": c.assigned_worker_id,
            "assigned_worker_name": c.worker.name if c.worker else "Unassigned",
            "type": c.type,
            "description": c.description,
            "status": c.status,
            "last_update_message": last_update.message if last_update else None,
            "last_update_percent": last_update.progress_percent if last_update else None,
            "date": c.created_at.date().isoformat()
        })
    return out

@app.patch("/api/admin/complaints/{complaint_id}")
def update_complaint_status(complaint_id: int, data: ComplaintStatusUpdate, db: Session = Depends(get_db), token: str = Depends(require_admin)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    old_status = complaint.status
    old_worker_id = complaint.assigned_worker_id
    complaint.status = data.status.strip()
    if data.assigned_worker_id is not None:
        complaint.assigned_worker_id = data.assigned_worker_id
    db.commit()
    db.refresh(complaint)

    # Notify member on meaningful lifecycle changes.
    if complaint.member_id:
        if old_worker_id != complaint.assigned_worker_id and complaint.worker:
            db.add(
                Notification(
                    member_id=complaint.member_id,
                    type="complaint",
                    title=f"Worker assigned for complaint #{complaint.id}",
                    message=(
                        f"{complaint.worker.name} has been assigned to your complaint. "
                        f"Current status: {complaint.status}."
                    ),
                    is_read=False,
                )
            )
            db.commit()
        if old_status != complaint.status:
            if complaint.status == "resolved":
                db.add(
                    Notification(
                        member_id=complaint.member_id,
                        type="complaint",
                        title=f"Maintenance completed for complaint #{complaint.id}",
                        message=(
                            "Maintenance work is completed and your complaint is now resolved. "
                            "Thank you for your patience."
                        ),
                        is_read=False,
                    )
                )
                db.commit()
            elif complaint.status == "in-progress":
                db.add(
                    Notification(
                        member_id=complaint.member_id,
                        type="complaint",
                        title=f"Work started on complaint #{complaint.id}",
                        message="The maintenance team has started work on your complaint.",
                        is_read=False,
                    )
                )
                db.commit()
    return {"message": "Status updated"}


@app.get("/api/admin/complaints/{complaint_id}/updates")
def list_complaint_updates_admin(
    complaint_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    updates = db.query(ComplaintUpdate).filter(ComplaintUpdate.complaint_id == complaint_id).order_by(ComplaintUpdate.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "message": u.message,
            "progress_percent": u.progress_percent,
            "date": u.created_at.date().isoformat() if u.created_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in updates
    ]


@app.post("/api/admin/complaints/{complaint_id}/updates")
def create_complaint_update_admin(
    complaint_id: int,
    data: ComplaintUpdateCreate,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    msg = (data.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message is required")

    upd = ComplaintUpdate(
        complaint_id=complaint_id,
        message=msg,
        progress_percent=data.progress_percent,
    )
    db.add(upd)

    # Optional: auto-bump to in-progress when a progress update is added.
    if complaint.status == "pending":
        complaint.status = "in-progress"

    db.commit()
    db.refresh(upd)

    # Notify member about progress update.
    db.add(
        Notification(
            member_id=complaint.member_id,
            type="complaint",
            title=f"Complaint update for #{complaint.id}",
            message=(
                f"{msg}"
                + (
                    f" (Progress: {data.progress_percent}%)."
                    if data.progress_percent is not None
                    else ""
                )
            ),
            is_read=False,
        )
    )
    db.commit()

    return {"message": "Update added", "id": upd.id}


@app.get("/api/member/complaints/{complaint_id}/updates")
def list_complaint_updates_member(
    complaint_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(require_member),
):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id, Complaint.member_id == member_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    updates = db.query(ComplaintUpdate).filter(ComplaintUpdate.complaint_id == complaint_id).order_by(ComplaintUpdate.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "message": u.message,
            "progress_percent": u.progress_percent,
            "date": u.created_at.date().isoformat() if u.created_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in updates
    ]

@app.post("/api/admin/workers")
def create_worker(data: WorkerCreate, db: Session = Depends(get_db), token: str = Depends(require_admin)):
    worker = Worker(
        name=data.name,
        phone=data.phone,
        skills=data.skills
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return {"message": "Worker registered", "id": worker.id}

@app.get("/api/admin/workers")
def list_workers(db: Session = Depends(get_db), token: str = Depends(require_admin)):
    workers = db.query(Worker).order_by(Worker.name).all()
    return [
        {"id": w.id, "name": w.name, "phone": w.phone, "skills": w.skills, "is_active": w.is_active}
        for w in workers
    ]

@app.post("/api/admin/alerts")
def send_alert(data: NotificationCreate, db: Session = Depends(get_db), token: str = Depends(require_admin)):
    m = db.query(Member).filter(Member.id == data.member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    notif = Notification(
        member_id=data.member_id,
        type=data.type,
        title=data.title,
        message=data.message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    return {"message": "Alert sent"}

@app.get("/api/member/notifications")
def list_member_notifications(db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    notifs = db.query(Notification).filter(Notification.member_id == member_id).order_by(Notification.created_at.desc()).all()
    return [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "read": n.is_read,
        "date": n.created_at.date().isoformat()
    } for n in notifs]

@app.patch("/api/member/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), token: str = Depends(require_member)):
    member_id = int(token.removeprefix("mock-jwt-member-"))
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.member_id == member_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@app.post("/api/admin/announcements")
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    token: str = Depends(require_admin),
):
    title = (data.title or "").strip()
    message = (data.message or "").strip()
    if not title or not message:
        raise HTTPException(status_code=400, detail="title and message are required")

    admin_id = int(token.removeprefix("mock-jwt-admin-"))
    row = Announcement(
        title=title,
        message=message,
        created_by_admin_id=admin_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"message": "Announcement published", "id": row.id}


@app.get("/api/announcements")
def list_announcements(db: Session = Depends(get_db)):
    rows = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "date": a.created_at.date().isoformat() if a.created_at else None,
            "created_by_admin_id": a.created_by_admin_id,
            "created_by_name": (
                (a.created_by_admin.full_name or a.created_by_admin.username)
                if a.created_by_admin
                else "Admin"
            ),
        }
        for a in rows
    ]
