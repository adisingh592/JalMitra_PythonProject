-- Water ops tables (also created by SQLAlchemy create_all). USE jalmiktra;

CREATE TABLE IF NOT EXISTS cities (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  district VARCHAR(120) DEFAULT NULL,
  state VARCHAR(120) DEFAULT NULL,
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS water_daily_entries (
  id INT NOT NULL AUTO_INCREMENT,
  city_id INT NOT NULL,
  entry_date DATE NOT NULL,
  water_supplied_liters INT NOT NULL,
  water_consumed_liters INT NOT NULL,
  pump_status VARCHAR(20) NOT NULL,
  leakage_liters INT DEFAULT NULL,
  notes TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_water_city_entry_date (city_id, entry_date),
  KEY ix_water_entry_date (entry_date),
  CONSTRAINT fk_water_city FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View registered admins/members + water data
-- SELECT * FROM cities;
-- SELECT * FROM water_daily_entries ORDER BY entry_date DESC, city_id;
