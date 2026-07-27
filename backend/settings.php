<?php
// settings.php - Runtime configuration the admin console can change.
//
// Right now this holds one thing: whether onboarding payments run in TEST mode
// (₹1, for verifying the live gateway end to end) or LIVE mode (the real fee).
//
// Same storage strategy as the rest of the backend: MySQL when reachable,
// JSON file otherwise. backend/.htaccess denies *.json over HTTP.

require_once __DIR__ . '/db.php';

// The two amounts the toggle switches between.
if (!defined('PAYMENT_ACTIVATION_FEE')) define('PAYMENT_ACTIVATION_FEE', 300.00);
if (!defined('PAYMENT_HARDWARE_FEE'))   define('PAYMENT_HARDWARE_FEE', 349.00);
if (!defined('PAYMENT_AMOUNT_LIVE'))    define('PAYMENT_AMOUNT_LIVE', PAYMENT_ACTIVATION_FEE + PAYMENT_HARDWARE_FEE);
if (!defined('PAYMENT_AMOUNT_TEST'))    define('PAYMENT_AMOUNT_TEST', 1.00);

if (!function_exists('settingsFilePath')) {
    function settingsFilePath() {
        return __DIR__ . '/settings.json';
    }
}

if (!function_exists('getSetting')) {
    function getSetting($pdo, $key, $default = null) {
        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare("SELECT `setting_value` FROM `settings` WHERE `setting_key` = :k LIMIT 1");
                $stmt->execute([':k' => $key]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row !== false) {
                    return $row['setting_value'];
                }
                return $default;
            } catch (PDOException $e) {
                error_log("Settings read failed: " . $e->getMessage());
                // fall through to the JSON store
            }
        }

        $file = settingsFilePath();
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if (is_array($data) && array_key_exists($key, $data)) {
                return $data[$key];
            }
        }
        return $default;
    }
}

if (!function_exists('setSetting')) {
    function setSetting($pdo, $key, $value) {
        $now = date('Y-m-d H:i:s');
        $ok = false;

        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare(
                    "INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`)
                     VALUES (:k, :v, :t)
                     ON DUPLICATE KEY UPDATE `setting_value` = :v2, `updated_at` = :t2"
                );
                $stmt->execute([':k' => $key, ':v' => $value, ':t' => $now, ':v2' => $value, ':t2' => $now]);
                $ok = true;
            } catch (PDOException $e) {
                error_log("Settings write failed: " . $e->getMessage());
            }
        }

        // Always mirror to the JSON store so the value survives a DB outage.
        $file = settingsFilePath();
        $data = [];
        if (file_exists($file)) {
            $decoded = json_decode(file_get_contents($file), true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }
        $data[$key] = $value;
        if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX) !== false) {
            $ok = true;
        }

        return $ok;
    }
}

if (!function_exists('getPaymentMode')) {
    /** @return string 'test' or 'live' — anything unrecognised is treated as live. */
    function getPaymentMode($pdo) {
        return getSetting($pdo, 'payment_mode', 'live') === 'test' ? 'test' : 'live';
    }
}

if (!function_exists('getPaymentAmount')) {
    /** The authoritative amount to charge, in rupees. */
    function getPaymentAmount($pdo) {
        return getPaymentMode($pdo) === 'test' ? PAYMENT_AMOUNT_TEST : PAYMENT_AMOUNT_LIVE;
    }
}
