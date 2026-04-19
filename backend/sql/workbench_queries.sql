-- Run in MySQL Workbench after: USE jalmiktra;

-- All registered admins (password column shows bcrypt hash — do not share)
SELECT id, username, full_name, email, mobile, designation, department, employee_id,
       office_address, notes, is_active, created_at, updated_at, password
FROM admins
ORDER BY id;

-- All registered members with village name
SELECT m.id, m.username, m.full_name, m.mobile, m.email, m.alternate_mobile,
       m.address, m.meter_id, m.consumer_number, m.connection_type, m.remarks,
       m.village_id, v.name AS village_name, m.is_active, m.created_at, m.updated_at,
       m.password
FROM members m
LEFT JOIN villages v ON v.id = m.village_id
ORDER BY m.id;

-- Villages reference
SELECT * FROM villages ORDER BY id;

-- Cities (admin-managed areas for water data entry)
SELECT * FROM cities ORDER BY id;

-- Daily water figures (one row per city per calendar day = “recording” day)
SELECT w.id, w.entry_date, c.name AS city_name, w.water_supplied_liters, w.water_consumed_liters,
       w.pump_status, w.leakage_liters, w.notes, w.submitted_at
FROM water_daily_entries w
JOIN cities c ON c.id = w.city_id
ORDER BY w.entry_date DESC, c.name;
