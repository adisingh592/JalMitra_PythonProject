-- JalMitra — full profile columns for admins & members (MySQL 8+)
-- Run: CREATE DATABASE IF NOT EXISTS jalmiktra; USE jalmiktra; then this file.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS villages (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  mobile VARCHAR(15) DEFAULT NULL,
  designation VARCHAR(100) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  employee_id VARCHAR(50) DEFAULT NULL,
  office_address VARCHAR(255) DEFAULT NULL,
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username),
  KEY ix_admins_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS members (
  id INT NOT NULL AUTO_INCREMENT,
  village_id INT DEFAULT NULL,
  full_name VARCHAR(100) DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  alternate_mobile VARCHAR(15) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  meter_id VARCHAR(50) DEFAULT NULL,
  consumer_number VARCHAR(50) DEFAULT NULL,
  connection_type VARCHAR(50) DEFAULT NULL,
  remarks TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_members_username (username),
  KEY ix_members_mobile (mobile),
  KEY ix_members_email (email),

  KEY ix_members_consumer (consumer_number),
  CONSTRAINT fk_members_village FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bills (
  id INT NOT NULL AUTO_INCREMENT,
  member_id INT NOT NULL,
  period VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
  usage_liters INT NOT NULL DEFAULT 0 COMMENT 'liters',
  rate_per_liter INT NOT NULL DEFAULT 0 COMMENT 'rupees per liter',
  amount INT NOT NULL COMMENT 'rupees',
  due_date DATE NOT NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  paid_date DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bill_member_period (member_id, period),
  KEY ix_bill_member_id (member_id),
  KEY ix_bill_period (period),
  KEY ix_bill_due_date (due_date),
  CONSTRAINT fk_bills_member FOREIGN KEY (member_id) REFERENCES members(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id INT NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
