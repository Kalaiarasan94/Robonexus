<?php
// admin_log.php - Append-only audit trail for the admin console.
//
// Mirrors the storage strategy used everywhere else in this backend: write to
// MySQL when it is available, otherwise degrade to a JSON file. backend/.htaccess
// denies *.json over HTTP, so the fallback store is not publicly readable.

if (!function_exists('logAdminAction')) {
    /**
     * Record one admin-console event.
     *
     * @param PDO|null $pdo     Live connection, or null when the DB is offline.
     * @param string   $action  Short machine-ish verb: login, login_failed, logout, verify_upload.
     * @param string   $details Human-readable description shown in the console.
     * @param string   $actor   Who did it. Defaults to the logged-in admin username.
     */
    function logAdminAction($pdo, $action, $details = '', $actor = 'admin') {
        $entry = [
            'action'    => $action,
            'actor'     => $actor,
            'details'   => $details,
            'ipAddress' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
            'timestamp' => date('Y-m-d H:i:s')
        ];

        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare(
                    "INSERT INTO `admin_logs` (`action`, `actor`, `details`, `ip_address`, `timestamp`)
                     VALUES (:action, :actor, :details, :ip, :ts)"
                );
                $stmt->execute([
                    ':action'  => $entry['action'],
                    ':actor'   => $entry['actor'],
                    ':details' => $entry['details'],
                    ':ip'      => $entry['ipAddress'],
                    ':ts'      => $entry['timestamp']
                ]);
                return;
            } catch (PDOException $e) {
                error_log("Admin log DB write failed: " . $e->getMessage());
                // fall through to the JSON store
            }
        }

        $file = __DIR__ . '/admin_logs.json';
        $existing = [];
        if (file_exists($file)) {
            $decoded = json_decode(file_get_contents($file), true);
            if (is_array($decoded)) {
                $existing = $decoded;
            }
        }
        $existing[] = $entry;

        // Keep the fallback file from growing without bound.
        if (count($existing) > 500) {
            $existing = array_slice($existing, -500);
        }

        file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT), LOCK_EX);
    }
}
