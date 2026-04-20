"""
Seed / refresh dummy accounts (bcrypt). Run from backend folder:
  python seed_db.py

Re-run anytime to reset passwords for the dummy users below.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


from main import Base, Village, Admin, Member, Bill, pwd_context, PREFERRED_DATABASE_URL


SQLALCHEMY_DATABASE_URL = os.getenv("JALMITRA_DATABASE_URL", PREFERRED_DATABASE_URL)

# --- Dummy logins (use these on /login after picking Admin or Member) ---
DUMMY_ADMIN_USER = "admin"
DUMMY_ADMIN_PASS = "jalmitra123"
DUMMY_MEMBER_USER = "member1"
DUMMY_MEMBER_PASS = "jalmitra123"
DUMMY_MEMBER_MOBILE = "9999999991"  # can sign in as member with this instead of username


def seed_engine():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    return engine


def upsert_admin(db, username: str, password: str, **fields) -> None:
    h = pwd_context.hash(password)
    row = db.query(Admin).filter(Admin.username == username).first()
    if row:
        row.password = h
        for k, v in fields.items():
            if v is not None and hasattr(row, k):
                setattr(row, k, v)
        print(f"Reset password for admin: {username}")
    else:
        db.add(
            Admin(
                username=username,
                password=h,
                full_name=fields.get("full_name"),
                email=fields.get("email"),
                mobile=fields.get("mobile"),
                designation=fields.get("designation"),
                department=fields.get("department"),
                employee_id=fields.get("employee_id"),
                office_address=fields.get("office_address"),
                salary=fields.get("salary"),
                residential_address=fields.get("residential_address"),
                joining_date=fields.get("joining_date"),
                age=fields.get("age"),
                profile_bio=fields.get("profile_bio"),
                notes=fields.get("notes"),
                is_active=True,
            )
        )
        print(f"Created admin: {username}")



def upsert_member(db, username: str, password: str, **fields) -> None:
    h = pwd_context.hash(password)
    row = db.query(Member).filter(Member.username == username).first()
    if row:
        row.password = h
        for k, v in fields.items():
            if v is not None and hasattr(row, k):
                setattr(row, k, v)
        print(f"Reset password for member: {username}")
    else:
        db.add(
            Member(
                username=username,
                password=h,
                full_name=fields.get("full_name"),
                mobile=fields.get("mobile"),
                email=fields.get("email"),
                alternate_mobile=fields.get("alternate_mobile"),
                village_id=fields.get("village_id"),
                address=fields.get("address"),
                meter_id=fields.get("meter_id"),
                consumer_number=fields.get("consumer_number"),
                connection_type=fields.get("connection_type"),
                remarks=fields.get("remarks"),
                is_active=True,
            )
        )
        print(f"Created member: {username}")


def upsert_bill(
    db,
    member_id: int,
    period: str,
    amount: int,
    paid: bool = False,
    usage_liters: int | None = None,
    rate_per_liter: int | None = None,
    **fields,
) -> None:
    """Upsert monthly bill for member."""
    row = db.query(Bill).filter(Bill.member_id == member_id, Bill.period == period).first()
    usage = usage_liters if usage_liters is not None else amount * 10
    rate = rate_per_liter if rate_per_liter is not None else max(1, round(amount / usage)) if usage > 0 else 1
    if row:
        row.amount = amount
        row.paid = paid
        row.usage_liters = usage
        row.rate_per_liter = rate
        for k, v in fields.items():
            if v is not None and hasattr(row, k):
                setattr(row, k, v)
        print(f"Updated bill {period} for member {member_id}: Rs {amount} {'paid' if paid else 'pending'}")
    else:
        from datetime import date, timedelta
        due = date.today().replace(day=5)  # 5th of next month
        if due < date.today():
            due = (date.today() + timedelta(days=30)).replace(day=5)
        db.add(
            Bill(
                member_id=member_id,
                period=period,
                usage_liters=usage,
                rate_per_liter=rate,
                amount=amount,
                due_date=due,
                paid=paid,
                **fields
            )
        )
        print(f"Created bill {period} for member {member_id}: Rs {amount} {'paid' if paid else 'pending'}")


def seed():

    engine = seed_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()


    # Seed more villages
    villages_data = [
        {"name": "Village A", "location": "North zone"},
        {"name": "Village B", "location": "South zone"},
        {"name": "Village C", "location": "East zone"},
        {"name": "Village D", "location": "West zone"},
    ]
    for v in villages_data:
        if not db.query(Village).filter(Village.name == v["name"]).first():
            db.add(Village(**v))
    db.commit()

    v_a = db.query(Village).filter(Village.name == "Village A").first().id
    v_b = db.query(Village).filter(Village.name == "Village B").first().id
    v_c = db.query(Village).filter(Village.name == "Village C").first().id
    v_d = db.query(Village).filter(Village.name == "Village D").first().id

    from datetime import date
    upsert_admin(
        db,
        DUMMY_ADMIN_USER,
        DUMMY_ADMIN_PASS,
        full_name="Demo Administrator",
        email="admin@jalmitra.local",
        mobile="9876543210",
        designation="System Administrator",
        department="Jal Mitra Operations",
        employee_id="ADM-DEMO-001",
        office_address="Block Office, Demo District",
        salary=75000,
        residential_address="123 Admin Quarters, Block A, City Center",
        joining_date=date(2022, 5, 10),
        age=34,
        profile_bio="Lead systems administrator for Jal Mitra, overseeing daily ops and backend scaling.",
        notes="Seeded demo account — visible in MySQL table `admins`.",
    )

    upsert_admin(
        db,
        "admin2",
        DUMMY_ADMIN_PASS,
        full_name="Sanjay Gupta",
        email="sanjay@jalmitra.local",
        mobile="9876543211",
        designation="Field Engineer",
        department="Maintenance",
        employee_id="ADM-FE-002",
        office_address="Field Office, Zone East",
        salary=45000,
        residential_address="Flat 402, Sunrise Apartments",
        joining_date=date(2023, 1, 15),
        age=28,
        profile_bio="Field engineer responsible for physical leakage inspections and hardware repairs.",
        notes="",
    )

    upsert_admin(
        db,
        "admin3",
        DUMMY_ADMIN_PASS,
        full_name="Anjali Desai",
        email="anjali@jalmitra.local",
        mobile="9876543212",
        designation="Operations Manager",
        department="Management",
        employee_id="ADM-MGR-003",
        office_address="Main HQ, City Center",
        salary=95000,
        residential_address="Villa 12, Green Park",
        joining_date=date(2021, 11, 1),
        age=41,
        profile_bio="Oversees regional village rollout and compliance auditing.",
        notes="",
    )

    # Demo members
    upsert_member(
        db,
        "member1",
        DUMMY_MEMBER_PASS,
        full_name="Raj Patel",
        mobile="9999999991",
        email="raj@example.com",
        village_id=v_a,
        meter_id="MTR-001",
        consumer_number="CN-001",
        connection_type="domestic",
    )
    db.commit()
    m1_id = db.query(Member).filter(Member.username == "member1").first().id

    upsert_member(
        db,
        "member2",
        DUMMY_MEMBER_PASS,
        full_name="Priya Sharma",
        mobile="9999999992",
        email="priya@example.com",
        village_id=v_b,
        meter_id="MTR-002",
        consumer_number="CN-002",
        connection_type="commercial",
    )
    db.commit()
    m2_id = db.query(Member).filter(Member.username == "member2").first().id

    upsert_member(
        db,
        "member3",
        DUMMY_MEMBER_PASS,
        full_name="Amit Kumar",
        mobile="9999999993",
        email="amit@example.com",
        village_id=v_c,
        meter_id="MTR-003",
        consumer_number="CN-003",
        connection_type="domestic",
    )
    db.commit()
    m3_id = db.query(Member).filter(Member.username == "member3").first().id

    # Demo bills (mix paid/unpaid)
    for mid, name in [(m1_id, "member1"), (m2_id, "member2"), (m3_id, "member3")]:
        upsert_bill(db, mid, "2024-04", 285, paid=True, usage_liters=2850, rate_per_liter=1)
        upsert_bill(db, mid, "2024-05", 320, paid=True, usage_liters=3200, rate_per_liter=1)
        upsert_bill(db, mid, "2024-06", 350, paid=False, usage_liters=3500, rate_per_liter=1)  # unpaid

    db.commit()
    db.close()


    print("")
    print("========== USE THESE ON http://127.0.0.1:5173/login ==========")
    print("  Admin portal:  username  %s" % DUMMY_ADMIN_USER)
    print("                 password  %s" % DUMMY_ADMIN_PASS)
    print("  Member portal: username  %s   (or mobile %s)" % (DUMMY_MEMBER_USER, DUMMY_MEMBER_MOBILE))
    print("                 password  %s" % DUMMY_MEMBER_PASS)
    print("==============================================================")
    print("Seeding complete.")


if __name__ == "__main__":
    seed()
