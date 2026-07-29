-- ============================================================================
-- RoboNexus — production schema for Hostinger (database: u928398901_robo)
--
-- Run this in hPanel -> phpMyAdmin -> SQL tab, with the u928398901_robo
-- database selected. Every statement is idempotent, so it is safe to run more
-- than once and safe to run against a database that already has data.
--
-- backend/db.php also creates these tables automatically on first request, but
-- that only works if the DB user has CREATE TABLE rights. Running this by hand
-- removes the guesswork.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. registrations — contractor onboarding records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `registrations` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `register_id`    VARCHAR(50)  NOT NULL UNIQUE,
  `full_name`      VARCHAR(255) NOT NULL,
  `email`          VARCHAR(255) NOT NULL,
  `phone`          VARCHAR(50)  NOT NULL,
  `address`        TEXT         NOT NULL,
  `bank_name`      VARCHAR(255) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `ifsc_code`      VARCHAR(50)  NOT NULL,
  `city`           VARCHAR(100) NOT NULL,
  `state`          VARCHAR(100) NOT NULL,
  `referred_by`    VARCHAR(50)  NOT NULL DEFAULT '',
  `timestamp`      DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. orders — product checkouts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`           VARCHAR(50)  NOT NULL UNIQUE,
  `customer_name`      VARCHAR(255) NOT NULL,
  `customer_phone`     VARCHAR(50)  NOT NULL,
  `customer_email`     VARCHAR(255) NOT NULL,
  `customer_address`   TEXT         NOT NULL,
  `product_id`         VARCHAR(50)  NOT NULL,
  `product_name`       VARCHAR(255) NOT NULL,
  `product_price`      VARCHAR(50)  NOT NULL,
  `payment_screenshot` VARCHAR(255) NOT NULL,
  `timestamp`          DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. contacts — contact form inquiries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contacts` (
  `id`        INT AUTO_INCREMENT PRIMARY KEY,
  `name`      VARCHAR(255) NOT NULL,
  `email`     VARCHAR(255) NOT NULL,
  `subject`   VARCHAR(255) NOT NULL,
  `message`   TEXT         NOT NULL,
  `timestamp` DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. users — contractor portal logins
--    NOTE: password is a bcrypt hash. New accounts are created by register.php
--    with the contractor's PHONE NUMBER as the initial password.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `email`          VARCHAR(255) NOT NULL UNIQUE,
  `password`       VARCHAR(255) NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `phone`          VARCHAR(50)  NOT NULL,
  `address`        TEXT         NOT NULL,
  `bank_name`      VARCHAR(255) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `ifsc_code`      VARCHAR(50)  NOT NULL,
  `referred_by`    VARCHAR(50)  NOT NULL DEFAULT '',
  `timestamp`      DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. user_uploads — telemetry video submissions and their review state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_uploads` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_email`     VARCHAR(255)   NOT NULL,
  `filename`       VARCHAR(255)   NOT NULL,
  `filepath`       VARCHAR(255)   NOT NULL,
  `user_message`   TEXT           NOT NULL,
  `admin_feedback` TEXT           NOT NULL,
  `duration_hours` DECIMAL(10,2)  NOT NULL,
  `earnings`       DECIMAL(10,2)  NOT NULL,
  `status`         VARCHAR(50)    NOT NULL,
  `timestamp`      DATETIME       NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. payments — Razorpay transactions captured via the aimstorm.in gateway
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id`        VARCHAR(100) NOT NULL,
  `order_ref`         VARCHAR(100) NOT NULL,
  `razorpay_order_id` VARCHAR(100) NOT NULL DEFAULT '',
  `register_id`       VARCHAR(50)  NOT NULL DEFAULT '',
  `customer_name`     VARCHAR(255) NOT NULL DEFAULT '',
  `customer_email`    VARCHAR(255) NOT NULL DEFAULT '',
  `customer_phone`    VARCHAR(50)  NOT NULL DEFAULT '',
  `amount`            VARCHAR(50)  NOT NULL DEFAULT '',
  `status`            VARCHAR(50)  NOT NULL DEFAULT 'paid',
  `timestamp`         DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. admin_logs — audit trail behind the "Admin Logs" console section
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `action`     VARCHAR(50)  NOT NULL,
  `actor`      VARCHAR(255) NOT NULL DEFAULT '',
  `details`    TEXT         NOT NULL,
  `ip_address` VARCHAR(64)  NOT NULL DEFAULT '',
  `timestamp`  DATETIME     NOT NULL,
  INDEX `idx_admin_logs_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- 8. settings — runtime config toggled from the admin console.
--    Currently holds `payment_mode` ('live' or 'test'), which decides whether
--    onboarding charges the full fee or ₹1. Absent row = live.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key`   VARCHAR(64)  NOT NULL PRIMARY KEY,
  `setting_value` VARCHAR(255) NOT NULL,
  `updated_at`    DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: pin the starting mode explicitly (it defaults to live anyway).
-- INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`)
--   VALUES ('payment_mode', 'live', NOW())
--   ON DUPLICATE KEY UPDATE `setting_value` = 'live', `updated_at` = NOW();


-- ---------------------------------------------------------------------------
-- 9. withdrawals — wallet payout requests raised from the customer portal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_email`     VARCHAR(255)  NOT NULL,
  `user_name`      VARCHAR(255)  NOT NULL DEFAULT '',
  `amount`         DECIMAL(10,2) NOT NULL,
  `account_holder` VARCHAR(255)  NOT NULL DEFAULT '',
  `bank_name`      VARCHAR(255)  NOT NULL DEFAULT '',
  `account_number` VARCHAR(100)  NOT NULL DEFAULT '',
  `ifsc_code`      VARCHAR(50)   NOT NULL DEFAULT '',
  `status`         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `admin_note`     TEXT          NOT NULL,
  `requested_at`   DATETIME      NOT NULL,
  `processed_at`   DATETIME      NULL DEFAULT NULL,
  INDEX `idx_withdrawals_user` (`user_email`),
  INDEX `idx_withdrawals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 10. Referral linkage. `referred_by` holds the REFERRER'S PHONE NUMBER, which
--     is what a contractor's referral ID actually is. Run these two only if the
--     tables already existed before referrals were added; the CREATE statements
--     above do not include the column.
-- ---------------------------------------------------------------------------
ALTER TABLE `users`         ADD COLUMN IF NOT EXISTS `referred_by` VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE `registrations` ADD COLUMN IF NOT EXISTS `referred_by` VARCHAR(50) NOT NULL DEFAULT '';


-- ============================================================================
-- UPGRADING AN OLDER DATABASE
--
-- Skip this whole section on a fresh database — the CREATE TABLE statements
-- above already include these columns.
--
-- Only run these if you have EXISTING tables created before the address /
-- bank-details / feedback fields were added. `IF NOT EXISTS` on ADD COLUMN
-- works on MariaDB (what Hostinger runs). On MySQL 8 it is not supported —
-- there, drop the "IF NOT EXISTS" and just ignore any "duplicate column" error.
-- ============================================================================

-- ALTER TABLE `orders`
--   ADD COLUMN IF NOT EXISTS `customer_email` VARCHAR(255) NOT NULL AFTER `customer_phone`;

-- ALTER TABLE `registrations`
--   ADD COLUMN IF NOT EXISTS `address`        TEXT         NOT NULL AFTER `phone`,
--   ADD COLUMN IF NOT EXISTS `bank_name`      VARCHAR(255) NOT NULL AFTER `address`,
--   ADD COLUMN IF NOT EXISTS `account_number` VARCHAR(100) NOT NULL AFTER `bank_name`,
--   ADD COLUMN IF NOT EXISTS `ifsc_code`      VARCHAR(50)  NOT NULL AFTER `account_number`;

-- ALTER TABLE `user_uploads`
--   ADD COLUMN IF NOT EXISTS `user_message`   TEXT NOT NULL DEFAULT '' AFTER `filepath`,
--   ADD COLUMN IF NOT EXISTS `admin_feedback` TEXT NOT NULL DEFAULT '' AFTER `status`;


-- ============================================================================
-- VERIFY — run after importing. Expect 7 rows.
-- ============================================================================
-- SHOW TABLES;
-- SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES
--   WHERE TABLE_SCHEMA = 'u928398901_robo' ORDER BY TABLE_NAME;
