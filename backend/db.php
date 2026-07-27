<?php
// db.php - Database connection manager for RoboNexus PHP backend
require_once __DIR__ . '/config.php';

// Determine environment
$dbEnv = isset($_ENV['DB_ENV']) ? trim($_ENV['DB_ENV']) : 'local';

if ($dbEnv === 'production') {
    $dbHost = isset($_ENV['DB_PROD_HOST']) ? trim($_ENV['DB_PROD_HOST']) : '127.0.0.1';
    $dbName = isset($_ENV['DB_PROD_NAME']) ? trim($_ENV['DB_PROD_NAME']) : 'robonexus_prod';
    $dbUser = isset($_ENV['DB_PROD_USER']) ? trim($_ENV['DB_PROD_USER']) : 'admin_prod';
    $dbPass = isset($_ENV['DB_PROD_PASS']) ? trim($_ENV['DB_PROD_PASS']) : '';
} else {
    $dbHost = isset($_ENV['DB_LOCAL_HOST']) ? trim($_ENV['DB_LOCAL_HOST']) : 'localhost';
    $dbName = isset($_ENV['DB_LOCAL_NAME']) ? trim($_ENV['DB_LOCAL_NAME']) : 'robonexus_local';
    $dbUser = isset($_ENV['DB_LOCAL_USER']) ? trim($_ENV['DB_LOCAL_USER']) : 'root';
    $dbPass = isset($_ENV['DB_LOCAL_PASS']) ? trim($_ENV['DB_LOCAL_PASS']) : '';
}

$pdo = null;

try {
    // 1 & 2. Auto-create the database if it is missing. This is a convenience for
    // zero-config local XAMPP runs ONLY. On shared hosting (Hostinger) the DB user
    // is scoped to one pre-made database and has no CREATE privilege — and may not
    // be able to connect without naming a database at all. Both of those are
    // expected there, so this whole block is best-effort: if it fails we carry on
    // to step 3 and connect to the database the host already created for us.
    // (Previously a failure here threw out of the outer try, leaving $pdo null and
    // silently degrading the live site to JSON-file storage.)
    try {
        $tempPdo = new PDO("mysql:host=$dbHost;charset=utf8mb4", $dbUser, $dbPass);
        $tempPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (PDOException $e) {
        error_log("RoboNexus: skipping DB auto-create (expected on shared hosting): " . $e->getMessage());
    }
    $tempPdo = null; // Close connection

    // 3. Connect to the specific database
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 4. Auto-create schema tables
    // Table 1: contractor registrations
    $pdo->exec("CREATE TABLE IF NOT EXISTS `registrations` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `register_id` VARCHAR(50) NOT NULL UNIQUE,
        `full_name` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL,
        `phone` VARCHAR(50) NOT NULL,
        `city` VARCHAR(100) NOT NULL,
        `state` VARCHAR(100) NOT NULL,
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 2: checkout orders
    $pdo->exec("CREATE TABLE IF NOT EXISTS `orders` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `order_id` VARCHAR(50) NOT NULL UNIQUE,
        `customer_name` VARCHAR(255) NOT NULL,
        `customer_phone` VARCHAR(50) NOT NULL,
        `customer_address` TEXT NOT NULL,
        `product_id` VARCHAR(50) NOT NULL,
        `product_name` VARCHAR(255) NOT NULL,
        `product_price` VARCHAR(50) NOT NULL,
        `payment_screenshot` VARCHAR(255) NOT NULL,
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 3: contact inquiries
    $pdo->exec("CREATE TABLE IF NOT EXISTS `contacts` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL,
        `subject` VARCHAR(255) NOT NULL,
        `message` TEXT NOT NULL,
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 4: users for dashboard login
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `name` VARCHAR(255) NOT NULL,
        `phone` VARCHAR(50) NOT NULL,
        `address` TEXT NOT NULL,
        `bank_name` VARCHAR(255) NOT NULL,
        `account_number` VARCHAR(100) NOT NULL,
        `ifsc_code` VARCHAR(50) NOT NULL,
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 5: user_uploads for video submissions
    $pdo->exec("CREATE TABLE IF NOT EXISTS `user_uploads` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_email` VARCHAR(255) NOT NULL,
        `filename` VARCHAR(255) NOT NULL,
        `filepath` VARCHAR(255) NOT NULL,
        `user_message` TEXT NOT NULL,
        `admin_feedback` TEXT NOT NULL,
        `duration_hours` DECIMAL(10,2) NOT NULL,
        `earnings` DECIMAL(10,2) NOT NULL,
        `status` VARCHAR(50) NOT NULL,
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 6: razorpay payments captured via the aimstorm.in gateway
    $pdo->exec("CREATE TABLE IF NOT EXISTS `payments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `payment_id` VARCHAR(100) NOT NULL,
        `order_ref` VARCHAR(100) NOT NULL,
        `razorpay_order_id` VARCHAR(100) NOT NULL DEFAULT '',
        `register_id` VARCHAR(50) NOT NULL DEFAULT '',
        `customer_name` VARCHAR(255) NOT NULL DEFAULT '',
        `customer_email` VARCHAR(255) NOT NULL DEFAULT '',
        `customer_phone` VARCHAR(50) NOT NULL DEFAULT '',
        `amount` VARCHAR(50) NOT NULL DEFAULT '',
        `status` VARCHAR(50) NOT NULL DEFAULT 'paid',
        `timestamp` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 7: admin_logs — audit trail of admin console activity
    $pdo->exec("CREATE TABLE IF NOT EXISTS `admin_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `action` VARCHAR(50) NOT NULL,
        `actor` VARCHAR(255) NOT NULL DEFAULT '',
        `details` TEXT NOT NULL,
        `ip_address` VARCHAR(64) NOT NULL DEFAULT '',
        `timestamp` DATETIME NOT NULL,
        INDEX `idx_admin_logs_timestamp` (`timestamp`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Table 8: settings — runtime config toggled from the admin console
    $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
        `setting_key` VARCHAR(64) NOT NULL PRIMARY KEY,
        `setting_value` VARCHAR(255) NOT NULL,
        `updated_at` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Check & Alter tables if columns are missing
    // 1. Alter orders to add customer_email
    try {
        $pdo->query("SELECT `customer_email` FROM `orders` LIMIT 1;");
    } catch (PDOException $e) {
        try {
            $pdo->exec("ALTER TABLE `orders` ADD COLUMN `customer_email` VARCHAR(255) NOT NULL AFTER `customer_phone`;");
        } catch (PDOException $ex) {
            error_log("Failed to alter table orders: " . $ex->getMessage());
        }
    }

    // 2. Alter registrations to add address, bank details
    try {
        $pdo->query("SELECT `address` FROM `registrations` LIMIT 1;");
    } catch (PDOException $e) {
        try {
            $pdo->exec("ALTER TABLE `registrations` 
                ADD COLUMN `address` TEXT NOT NULL AFTER `phone`,
                ADD COLUMN `bank_name` VARCHAR(255) NOT NULL AFTER `address`,
                ADD COLUMN `account_number` VARCHAR(100) NOT NULL AFTER `bank_name`,
                ADD COLUMN `ifsc_code` VARCHAR(50) NOT NULL AFTER `account_number`;");
        } catch (PDOException $ex) {
            error_log("Failed to alter table registrations: " . $ex->getMessage());
        }
    }

    // 3. Alter user_uploads to add user_message and admin_feedback
    try {
        $pdo->query("SELECT `user_message` FROM `user_uploads` LIMIT 1;");
    } catch (PDOException $e) {
        try {
            $pdo->exec("ALTER TABLE `user_uploads` 
                ADD COLUMN `user_message` TEXT NOT NULL DEFAULT '' AFTER `filepath`,
                ADD COLUMN `admin_feedback` TEXT NOT NULL DEFAULT '' AFTER `status`;");
        } catch (PDOException $ex) {
            error_log("Failed to alter table user_uploads: " . $ex->getMessage());
        }
    }

} catch (PDOException $e) {
    // Graceful degradation: Log connection error, but let script continue. 
    // Handlers will verify if $pdo is null and fall back to json file storage.
    error_log("RoboNexus Database Error: " . $e->getMessage());
    $pdo = null;
}

