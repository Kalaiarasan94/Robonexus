<?php
// admin/index.php - Secure Admin Control Panel at /admin
require_once __DIR__ . '/../backend/db.php';
require_once __DIR__ . '/../backend/admin_log.php';

session_start();

// Get admin credentials from environment variables
$adminUser = isset($_ENV['ADMIN_USERNAME']) ? $_ENV['ADMIN_USERNAME'] : 'admin';
$adminPass = isset($_ENV['ADMIN_PASSWORD']) ? $_ENV['ADMIN_PASSWORD'] : 'admin123';

// True when backend/.env was not loaded and we fell back to the public defaults.
$usingDefaultCredentials = !isset($_ENV['ADMIN_PASSWORD']);

// 1. Handle Logout Action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        logAdminAction($pdo, 'logout', 'Admin signed out of the console.',
            isset($_SESSION['username']) ? $_SESSION['username'] : 'admin');
    }
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header("Location: index.php");
    exit();
}

// 2. Handle Login Action
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $usernameInput = isset($_POST['username']) ? trim($_POST['username']) : '';
    $passwordInput = isset($_POST['password']) ? trim($_POST['password']) : '';

    if ($usernameInput === $adminUser && $passwordInput === $adminPass) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['username'] = $usernameInput;
        logAdminAction($pdo, 'login', 'Successful admin sign-in.', $usernameInput);
        header("Location: index.php");
        exit();
    } else {
        $loginError = 'Invalid admin credentials. Please try again.';
        logAdminAction($pdo, 'login_failed',
            'Failed sign-in attempt for username "' . $usernameInput . '".', $usernameInput);
    }
}

// Check authorization
$isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
$currentAdmin = isset($_SESSION['username']) ? $_SESSION['username'] : 'admin';

// 3. Load Data if Logged In
$registrations = [];
$orders = [];
$contacts = [];
$uploads = [];
$payments = [];
$adminLogs = [];
$totalRevenue = 0;
$paymentsTotal = 0;
$userCount = 0;

if ($isLoggedIn) {
    if ($pdo !== null) {
        // Query from Database
        try {
            $stmt = $pdo->query("SELECT * FROM `registrations` ORDER BY `timestamp` DESC");
            $dbRegs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbRegs as $row) {
                $registrations[] = [
                    'registerId' => $row['register_id'],
                    'fullName' => $row['full_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'city' => $row['city'],
                    'state' => $row['state'],
                    'timestamp' => $row['timestamp']
                ];
            }
        } catch (PDOException $e) {
            error_log("Failed to query registrations from DB: " . $e->getMessage());
        }

        try {
            $stmt = $pdo->query("SELECT * FROM `orders` ORDER BY `timestamp` DESC");
            $dbOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbOrders as $row) {
                $orders[] = [
                    'orderId' => $row['order_id'],
                    'timestamp' => $row['timestamp'],
                    'customer' => [
                        'name' => $row['customer_name'],
                        'phone' => $row['customer_phone'],
                        'email' => isset($row['customer_email']) ? $row['customer_email'] : '',
                        'address' => $row['customer_address']
                    ],
                    'product' => [
                        'id' => $row['product_id'],
                        'name' => $row['product_name'],
                        'price' => $row['product_price']
                    ],
                    'paymentScreenshot' => $row['payment_screenshot']
                ];

                $cleanPrice = preg_replace('/[^\d\.]/', '', $row['product_price']);
                $totalRevenue += (float)$cleanPrice;
            }
        } catch (PDOException $e) {
            error_log("Failed to query orders from DB: " . $e->getMessage());
        }

        try {
            $stmt = $pdo->query("SELECT * FROM `contacts` ORDER BY `timestamp` DESC");
            $dbContacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbContacts as $row) {
                $contacts[] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'subject' => $row['subject'],
                    'message' => $row['message'],
                    'timestamp' => $row['timestamp']
                ];
            }
        } catch (PDOException $e) {
            error_log("Failed to query contacts from DB: " . $e->getMessage());
        }

        try {
            $stmt = $pdo->query("SELECT * FROM `user_uploads` ORDER BY `timestamp` DESC");
            $dbUploads = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbUploads as $row) {
                $uploads[] = [
                    'id' => (int)$row['id'],
                    'userEmail' => $row['user_email'],
                    'filename' => $row['filename'],
                    'filepath' => $row['filepath'],
                    'userMessage' => isset($row['user_message']) ? $row['user_message'] : '',
                    'adminFeedback' => isset($row['admin_feedback']) ? $row['admin_feedback'] : '',
                    'durationHours' => (float)$row['duration_hours'],
                    'earnings' => (float)$row['earnings'],
                    'status' => $row['status'],
                    'timestamp' => $row['timestamp']
                ];
            }
        } catch (PDOException $e) {
            error_log("Failed to query user_uploads from DB: " . $e->getMessage());
        }

        try {
            $stmt = $pdo->query("SELECT * FROM `payments` ORDER BY `timestamp` DESC");
            $dbPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbPayments as $row) {
                $payments[] = [
                    'paymentId' => $row['payment_id'],
                    'orderRef' => $row['order_ref'],
                    'razorpayOrderId' => isset($row['razorpay_order_id']) ? $row['razorpay_order_id'] : '',
                    'registerId' => isset($row['register_id']) ? $row['register_id'] : '',
                    'name' => $row['customer_name'],
                    'email' => $row['customer_email'],
                    'phone' => $row['customer_phone'],
                    'amount' => $row['amount'],
                    'status' => $row['status'],
                    'timestamp' => $row['timestamp']
                ];
                $paymentsTotal += (float)preg_replace('/[^\d\.]/', '', $row['amount']);
            }
        } catch (PDOException $e) {
            error_log("Failed to query payments from DB: " . $e->getMessage());
        }

        try {
            $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        } catch (PDOException $e) {
            error_log("Failed to count users from DB: " . $e->getMessage());
        }

        try {
            $stmt = $pdo->query("SELECT * FROM `admin_logs` ORDER BY `timestamp` DESC, `id` DESC LIMIT 300");
            $dbLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($dbLogs as $row) {
                $adminLogs[] = [
                    'action' => $row['action'],
                    'actor' => $row['actor'],
                    'details' => $row['details'],
                    'ipAddress' => $row['ip_address'],
                    'timestamp' => $row['timestamp']
                ];
            }
        } catch (PDOException $e) {
            error_log("Failed to query admin_logs from DB: " . $e->getMessage());
        }
    } else {
        // Fallback to JSON files in backend if Database is offline
        $registrationsFile = __DIR__ . '/../backend/registrations.json';
        if (file_exists($registrationsFile)) {
            $regData = file_get_contents($registrationsFile);
            $registrations = json_decode($regData, true);
            if (!is_array($registrations)) {
                $registrations = [];
            }
            usort($registrations, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });
        }

        $ordersFile = __DIR__ . '/../backend/orders.json';
        if (file_exists($ordersFile)) {
            $orderData = file_get_contents($ordersFile);
            $orders = json_decode($orderData, true);
            if (!is_array($orders)) {
                $orders = [];
            }
            usort($orders, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });

            foreach ($orders as $order) {
                if (isset($order['product']['price'])) {
                    $cleanPrice = preg_replace('/[^\d\.]/', '', $order['product']['price']);
                    $totalRevenue += (float)$cleanPrice;
                }
            }
        }

        $contactsFile = __DIR__ . '/../backend/contacts.json';
        if (file_exists($contactsFile)) {
            $contactData = file_get_contents($contactsFile);
            $contacts = json_decode($contactData, true);
            if (!is_array($contacts)) {
                $contacts = [];
            }
            usort($contacts, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });
        }

        $uploadsFile = __DIR__ . '/../backend/user_uploads.json';
        if (file_exists($uploadsFile)) {
            $uploadsData = file_get_contents($uploadsFile);
            $uploads = json_decode($uploadsData, true);
            if (!is_array($uploads)) {
                $uploads = [];
            }
            usort($uploads, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });
            // Adapt keys for uploads loop
            foreach ($uploads as &$u) {
                if (!isset($u['userEmail']) && isset($u['user_email'])) $u['userEmail'] = $u['user_email'];
                if (!isset($u['userMessage']) && isset($u['user_message'])) $u['userMessage'] = $u['user_message'];
                if (!isset($u['adminFeedback']) && isset($u['admin_feedback'])) $u['adminFeedback'] = $u['admin_feedback'];
                if (!isset($u['durationHours']) && isset($u['duration_hours'])) $u['durationHours'] = $u['duration_hours'];
            }
            unset($u);
        }

        // Payments fallback
        $paymentsFile = __DIR__ . '/../backend/payments.json';
        if (file_exists($paymentsFile)) {
            $payments = json_decode(file_get_contents($paymentsFile), true);
            if (!is_array($payments)) {
                $payments = [];
            }
            usort($payments, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });
            foreach ($payments as $p) {
                if (isset($p['amount'])) {
                    $paymentsTotal += (float)preg_replace('/[^\d\.]/', '', $p['amount']);
                }
            }
        }

        // User count fallback
        $usersFile = __DIR__ . '/../backend/users.json';
        if (file_exists($usersFile)) {
            $usersData = json_decode(file_get_contents($usersFile), true);
            $userCount = is_array($usersData) ? count($usersData) : 0;
        }

        // Admin logs fallback
        $logsFile = __DIR__ . '/../backend/admin_logs.json';
        if (file_exists($logsFile)) {
            $adminLogs = json_decode(file_get_contents($logsFile), true);
            if (!is_array($adminLogs)) {
                $adminLogs = [];
            }
            usort($adminLogs, function($a, $b) {
                return strcmp($b['timestamp'], $a['timestamp']);
            });
            $adminLogs = array_slice($adminLogs, 0, 300);
        }

        // The JSON stores were written by several generations of the form handlers,
        // so individual records can be missing keys the tables below read. Fill in
        // defaults once here rather than guarding every echo in the markup.
        $fill = function (array $rows, array $defaults) {
            foreach ($rows as $i => $row) {
                $rows[$i] = array_merge($defaults, is_array($row) ? $row : []);
            }
            return $rows;
        };

        $registrations = $fill($registrations, [
            'registerId' => '', 'fullName' => '', 'email' => '', 'phone' => '',
            'city' => '', 'state' => '', 'timestamp' => ''
        ]);

        $contacts = $fill($contacts, [
            'name' => '', 'email' => '', 'subject' => '', 'message' => '', 'timestamp' => ''
        ]);

        $payments = $fill($payments, [
            'paymentId' => '', 'registerId' => '', 'name' => '', 'email' => '',
            'phone' => '', 'amount' => '', 'status' => 'paid', 'timestamp' => ''
        ]);

        $uploads = $fill($uploads, [
            'id' => 0, 'userEmail' => '', 'filename' => '', 'filepath' => '',
            'userMessage' => '', 'adminFeedback' => '', 'durationHours' => 0,
            'status' => 'Pending', 'timestamp' => ''
        ]);

        // These files predate the `id` column, so synthesise a positional one to keep
        // the review controls addressable. See the note in the Telemetry view.
        foreach ($uploads as $i => $row) {
            if (empty($row['id'])) {
                $uploads[$i]['id'] = $i + 1;
            }
        }

        foreach ($orders as $i => $row) {
            $orders[$i] = array_merge([
                'orderId' => '', 'timestamp' => '', 'paymentScreenshot' => ''
            ], is_array($row) ? $row : []);
            $orders[$i]['customer'] = array_merge(
                ['name' => '', 'phone' => '', 'email' => '', 'address' => ''],
                isset($orders[$i]['customer']) && is_array($orders[$i]['customer']) ? $orders[$i]['customer'] : []
            );
            $orders[$i]['product'] = array_merge(
                ['id' => '', 'name' => '', 'price' => ''],
                isset($orders[$i]['product']) && is_array($orders[$i]['product']) ? $orders[$i]['product'] : []
            );
        }
    }
}

/**
 * Presentation helper: map an audit action verb to an icon + tone.
 */
function logActionMeta($action) {
    switch ($action) {
        case 'login':
            return ['icon' => 'fa-right-to-bracket', 'tone' => 'ok',      'label' => 'Sign in'];
        case 'login_failed':
            return ['icon' => 'fa-shield-halved',    'tone' => 'danger',  'label' => 'Failed sign in'];
        case 'logout':
            return ['icon' => 'fa-right-from-bracket','tone' => 'neutral','label' => 'Sign out'];
        case 'verify_upload':
            return ['icon' => 'fa-clipboard-check',  'tone' => 'info',    'label' => 'Verification'];
        default:
            return ['icon' => 'fa-circle-info',      'tone' => 'neutral', 'label' => ucfirst(str_replace('_', ' ', $action))];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoboNexus Admin Console</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        /* ============================================================
           Design tokens — light console
           ============================================================ */
        :root {
            --bg:            #f5f6f8;
            --surface:       #ffffff;
            --surface-alt:   #fafbfc;
            --sidebar-bg:    #ffffff;

            --border:        #e5e7eb;
            --border-strong: #d3d7de;

            --text:          #101828;
            --text-soft:     #475467;
            --text-muted:    #8b93a3;

            --primary:       #4f46e5;
            --primary-hover: #4338ca;
            --primary-soft:  #eef2ff;
            --primary-line:  #c7d2fe;

            --ok:            #067647;
            --ok-soft:       #ecfdf3;
            --ok-line:       #abefc6;

            --warn:          #b54708;
            --warn-soft:     #fffaeb;
            --warn-line:     #fedf89;

            --danger:        #b42318;
            --danger-soft:   #fef3f2;
            --danger-line:   #fecdca;

            --info:          #026aa2;
            --info-soft:     #f0f9ff;
            --info-line:     #b9e6fe;

            --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
            --shadow-md: 0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04);
            --shadow-lg: 0 12px 32px -8px rgba(16, 24, 40, 0.14);

            --radius:    10px;
            --radius-sm: 7px;
            --sidebar-w: 252px;

            --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html { -webkit-text-size-adjust: 100%; }

        body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            font-size: 14px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        a { color: inherit; }

        /* ============================================================
           Login
           ============================================================ */
        .login-shell {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background:
                radial-gradient(1000px 500px at 50% -10%, #eef2ff 0%, transparent 70%),
                var(--bg);
        }

        .login-card {
            width: 100%;
            max-width: 400px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow: var(--shadow-lg);
            padding: 36px 32px;
        }

        .login-brand {
            display: flex;
            align-items: center;
            gap: 11px;
            justify-content: center;
            margin-bottom: 26px;
        }

        .login-brand img {
            width: 38px; height: 38px;
            border-radius: 9px;
            object-fit: cover;
        }

        .login-brand span { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
        .login-brand span em { font-style: normal; color: var(--primary); }

        .login-card h1 {
            font-size: 20px;
            font-weight: 650;
            letter-spacing: -0.02em;
            text-align: center;
            margin-bottom: 5px;
        }

        .login-card .sub {
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
            margin-bottom: 26px;
        }

        .field { margin-bottom: 16px; }

        .field label {
            display: block;
            font-size: 13px;
            font-weight: 550;
            color: var(--text-soft);
            margin-bottom: 6px;
        }

        .input-wrap { position: relative; display: flex; align-items: center; }

        .input-wrap > i {
            position: absolute;
            left: 12px;
            color: var(--text-muted);
            font-size: 13px;
            pointer-events: none;
        }

        .input-wrap input {
            width: 100%;
            font: inherit;
            font-size: 14px;
            color: var(--text);
            background: var(--surface);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-sm);
            padding: 10px 12px 10px 36px;
            transition: border-color .15s, box-shadow .15s;
        }

        .input-wrap input::placeholder { color: #b0b6c2; }

        .input-wrap input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14);
        }

        .btn-primary {
            width: 100%;
            font: inherit;
            font-weight: 600;
            font-size: 14px;
            color: #fff;
            background: var(--primary);
            border: none;
            border-radius: var(--radius-sm);
            padding: 11px 16px;
            cursor: pointer;
            transition: background .15s;
        }

        .btn-primary:hover { background: var(--primary-hover); }

        .alert {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            font-size: 13px;
            border-radius: var(--radius-sm);
            padding: 10px 12px;
            margin-bottom: 18px;
            line-height: 1.45;
        }

        .alert i { margin-top: 2px; }

        .alert-danger {
            background: var(--danger-soft);
            border: 1px solid var(--danger-line);
            color: var(--danger);
        }

        .alert-warn {
            background: var(--warn-soft);
            border: 1px solid var(--warn-line);
            color: var(--warn);
        }

        /* ============================================================
           App shell
           ============================================================ */
        .app { display: flex; min-height: 100vh; }

        .sidebar {
            width: var(--sidebar-w);
            flex-shrink: 0;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 40;
        }

        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 18px 18px;
            border-bottom: 1px solid var(--border);
            min-height: 65px;
        }

        .sidebar-brand img {
            width: 32px; height: 32px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
        }

        .sidebar-brand .name {
            font-weight: 700;
            font-size: 14px;
            letter-spacing: -0.01em;
            line-height: 1.2;
        }

        .sidebar-brand .name em { font-style: normal; color: var(--primary); }
        .sidebar-brand .role { font-size: 11px; color: var(--text-muted); }

        .sidebar-nav {
            flex: 1;
            overflow-y: auto;
            padding: 14px 12px 18px;
        }

        .nav-group { margin-bottom: 18px; }

        .nav-group-label {
            font-size: 10.5px;
            font-weight: 650;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 0 10px;
            margin-bottom: 6px;
        }

        .nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            font: inherit;
            font-size: 13.5px;
            font-weight: 500;
            color: var(--text-soft);
            background: none;
            border: none;
            border-radius: var(--radius-sm);
            padding: 8px 10px;
            margin-bottom: 1px;
            cursor: pointer;
            text-align: left;
            transition: background .12s, color .12s;
        }

        .nav-item > i {
            width: 16px;
            text-align: center;
            font-size: 13px;
            color: var(--text-muted);
            transition: color .12s;
        }

        .nav-item:hover { background: #f2f4f7; color: var(--text); }
        .nav-item:hover > i { color: var(--text-soft); }

        .nav-item.active {
            background: var(--primary-soft);
            color: var(--primary);
            font-weight: 600;
        }

        .nav-item.active > i { color: var(--primary); }

        .nav-count {
            margin-left: auto;
            font-size: 11px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            color: var(--text-muted);
            background: #f2f4f7;
            border-radius: 20px;
            padding: 1px 7px;
        }

        .nav-item.active .nav-count {
            background: #fff;
            color: var(--primary);
        }

        .sidebar-foot {
            border-top: 1px solid var(--border);
            padding: 12px;
        }

        .admin-chip {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 8px;
            border-radius: var(--radius-sm);
        }

        .avatar {
            width: 30px; height: 30px;
            flex-shrink: 0;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: var(--primary);
            color: #fff;
            font-size: 12px;
            font-weight: 650;
            text-transform: uppercase;
        }

        .admin-chip .who { min-width: 0; }
        .admin-chip .who b { display: block; font-size: 13px; font-weight: 600; }
        .admin-chip .who small { color: var(--text-muted); font-size: 11px; }

        .btn-logout {
            margin-left: auto;
            width: 30px; height: 30px;
            display: grid;
            place-items: center;
            border-radius: var(--radius-sm);
            color: var(--text-muted);
            text-decoration: none;
            transition: background .12s, color .12s;
        }

        .btn-logout:hover { background: var(--danger-soft); color: var(--danger); }

        /* ============================================================
           Main column
           ============================================================ */
        .main {
            flex: 1;
            min-width: 0;
            margin-left: var(--sidebar-w);
            display: flex;
            flex-direction: column;
        }

        .topbar {
            position: sticky;
            top: 0;
            z-index: 30;
            display: flex;
            align-items: center;
            gap: 14px;
            min-height: 65px;
            padding: 12px 26px;
            background: rgba(255, 255, 255, 0.86);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid var(--border);
        }

        .menu-toggle {
            display: none;
            width: 34px; height: 34px;
            place-items: center;
            font-size: 15px;
            color: var(--text-soft);
            background: none;
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-sm);
            cursor: pointer;
        }

        .topbar h1 {
            font-size: 17px;
            font-weight: 650;
            letter-spacing: -0.02em;
            line-height: 1.25;
        }

        .topbar .crumb { font-size: 12.5px; color: var(--text-muted); }

        .topbar-right {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 550;
            border-radius: 20px;
            padding: 4px 10px;
            white-space: nowrap;
        }

        .pill i { font-size: 7px; }
        .pill-ok     { background: var(--ok-soft);     color: var(--ok);     border: 1px solid var(--ok-line); }
        .pill-warn   { background: var(--warn-soft);   color: var(--warn);   border: 1px solid var(--warn-line); }

        .content { padding: 26px; flex: 1; }

        .view { display: none; }
        .view.active { display: block; animation: rise .22s ease-out; }

        @keyframes rise {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: none; }
        }

        /* ============================================================
           Stat cards
           ============================================================ */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(252px, 1fr));
            gap: 14px;
            margin-bottom: 22px;
        }

        .stat {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-sm);
            padding: 16px 17px;
            display: flex;
            align-items: flex-start;
            gap: 13px;
        }

        .stat-icon {
            width: 38px; height: 38px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 9px;
            font-size: 15px;
        }

        .i-indigo { background: var(--primary-soft); color: var(--primary); }
        .i-green  { background: var(--ok-soft);      color: var(--ok); }
        .i-blue   { background: var(--info-soft);    color: var(--info); }
        .i-amber  { background: var(--warn-soft);    color: var(--warn); }
        .i-rose   { background: var(--danger-soft);  color: var(--danger); }
        .i-slate  { background: #f2f4f7;             color: var(--text-soft); }

        .stat .label {
            display: block;
            font-size: 12.5px;
            color: var(--text-muted);
            margin-bottom: 3px;
        }

        .stat .value {
            display: block;
            font-size: 22px;
            font-weight: 680;
            letter-spacing: -0.025em;
            font-variant-numeric: tabular-nums;
            line-height: 1.15;
        }

        /* ============================================================
           Cards + tables
           ============================================================ */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
        }

        .card + .card { margin-top: 18px; }

        .card-head {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            padding: 15px 18px;
            border-bottom: 1px solid var(--border);
            background: var(--surface-alt);
        }

        .card-head h2 {
            font-size: 14.5px;
            font-weight: 650;
            letter-spacing: -0.01em;
        }

        .card-head p { font-size: 12.5px; color: var(--text-muted); }

        .count-tag {
            font-size: 11.5px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            color: var(--text-soft);
            background: #f2f4f7;
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1px 8px;
        }

        .search {
            margin-left: auto;
            position: relative;
            display: flex;
            align-items: center;
        }

        .search i {
            position: absolute;
            left: 10px;
            font-size: 12px;
            color: var(--text-muted);
            pointer-events: none;
        }

        .search input {
            font: inherit;
            font-size: 13px;
            width: 210px;
            max-width: 100%;
            color: var(--text);
            background: var(--surface);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-sm);
            padding: 7px 10px 7px 30px;
            transition: border-color .15s, box-shadow .15s;
        }

        .search input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.13);
        }

        .table-scroll { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; }

        thead th {
            font-size: 11px;
            font-weight: 650;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted);
            text-align: left;
            white-space: nowrap;
            background: var(--surface-alt);
            border-bottom: 1px solid var(--border);
            padding: 9px 16px;
        }

        tbody td {
            font-size: 13px;
            color: var(--text-soft);
            border-bottom: 1px solid #f0f1f4;
            padding: 12px 16px;
            vertical-align: top;
        }

        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #fafbfc; }

        .strong { font-weight: 600; color: var(--text); }
        .nowrap { white-space: nowrap; }
        .wrap-cell { white-space: normal; line-height: 1.45; }
        .num { font-variant-numeric: tabular-nums; }

        .link { color: var(--primary); text-decoration: none; }
        .link:hover { text-decoration: underline; }

        .stack { display: flex; flex-direction: column; gap: 2px; }
        .stack .sub { font-size: 12px; color: var(--text-muted); }

        .mono {
            font-family: var(--mono);
            font-size: 12px;
            letter-spacing: -0.01em;
        }

        .tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11.5px;
            font-weight: 600;
            border-radius: 6px;
            padding: 2px 7px;
            white-space: nowrap;
        }

        .tag-mono { font-family: var(--mono); font-weight: 500; letter-spacing: -0.02em; }

        .t-indigo  { background: var(--primary-soft); color: var(--primary); border: 1px solid var(--primary-line); }
        .t-green   { background: var(--ok-soft);      color: var(--ok);      border: 1px solid var(--ok-line); }
        .t-amber   { background: var(--warn-soft);    color: var(--warn);    border: 1px solid var(--warn-line); }
        .t-rose    { background: var(--danger-soft);  color: var(--danger);  border: 1px solid var(--danger-line); }
        .t-blue    { background: var(--info-soft);    color: var(--info);    border: 1px solid var(--info-line); }
        .t-slate   { background: #f2f4f7;             color: var(--text-soft); border: 1px solid var(--border); }

        .muted-note { color: var(--text-muted); font-size: 12.5px; font-style: italic; }

        .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 550;
            color: var(--primary);
            background: var(--surface);
            border: 1px solid var(--primary-line);
            border-radius: 6px;
            padding: 4px 9px;
            text-decoration: none;
            white-space: nowrap;
            transition: background .12s;
        }

        .btn-ghost:hover { background: var(--primary-soft); }

        /* Empty states */
        .empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 11px;
            padding: 54px 24px;
            text-align: center;
        }

        .empty i {
            width: 46px; height: 46px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #f2f4f7;
            color: var(--text-muted);
            font-size: 17px;
        }

        .empty p { font-size: 13.5px; color: var(--text-muted); max-width: 380px; }

        /* ============================================================
           Verification control (telemetry review)
           ============================================================ */
        .verify {
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 210px;
        }

        .verify-row { display: flex; gap: 6px; }

        .verify input[type="number"],
        .verify select,
        .verify textarea {
            font: inherit;
            font-size: 12.5px;
            color: var(--text);
            background: var(--surface);
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 6px 8px;
            transition: border-color .15s, box-shadow .15s;
        }

        .verify input[type="number"] { width: 78px; font-family: var(--mono); }
        .verify select { flex: 1; cursor: pointer; }
        .verify textarea { resize: vertical; min-height: 46px; }

        .verify input:focus, .verify select:focus, .verify textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.13);
        }

        .btn-verify {
            font: inherit;
            font-size: 12.5px;
            font-weight: 600;
            color: #fff;
            background: var(--primary);
            border: none;
            border-radius: 6px;
            padding: 7px 12px;
            cursor: pointer;
            transition: background .15s;
        }

        .btn-verify:hover { background: var(--primary-hover); }
        .btn-verify:disabled { background: var(--text-muted); cursor: default; }

        /* ============================================================
           Audit log timeline
           ============================================================ */
        .log-list { padding: 6px 0; }

        .log-row {
            display: flex;
            align-items: flex-start;
            gap: 13px;
            padding: 12px 18px;
            border-bottom: 1px solid #f0f1f4;
        }

        .log-row:last-child { border-bottom: none; }
        .log-row:hover { background: #fafbfc; }

        .log-icon {
            width: 30px; height: 30px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 50%;
            font-size: 12px;
        }

        .log-body { min-width: 0; flex: 1; }

        .log-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 1px;
        }

        .log-detail { font-size: 12.5px; color: var(--text-soft); word-break: break-word; }

        .log-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 4px;
            font-size: 11.5px;
            color: var(--text-muted);
        }

        .log-meta span { display: inline-flex; align-items: center; gap: 4px; }

        /* ============================================================
           Responsive
           ============================================================ */
        .scrim {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(16, 24, 40, 0.45);
            z-index: 35;
        }

        .scrim.show { display: block; }

        @media (max-width: 1024px) {
            .sidebar { transform: translateX(-100%); transition: transform .22s ease; box-shadow: var(--shadow-lg); }
            .sidebar.open { transform: none; }
            .main { margin-left: 0; }
            .menu-toggle { display: grid; }
            .content { padding: 18px 16px; }
            .topbar { padding: 12px 16px; }
        }

        @media (max-width: 640px) {
            .search { margin-left: 0; width: 100%; }
            .search input { width: 100%; }
            .stat .value { font-size: 20px; }
        }
    </style>
</head>
<body>

<?php if (!$isLoggedIn): ?>

    <!-- ============================ LOGIN ============================ -->
    <div class="login-shell">
        <div class="login-card">
            <div class="login-brand">
                <img src="logo_robo.jpeg" alt="RoboNexus">
                <span>Robo<em>Nexus</em></span>
            </div>

            <h1>Admin Console</h1>
            <p class="sub">Sign in to manage registrations, payments and telemetry.</p>

            <?php if ($loginError): ?>
                <div class="alert alert-danger">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span><?php echo htmlspecialchars($loginError); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($usingDefaultCredentials): ?>
                <div class="alert alert-warn">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span><strong>backend/.env was not loaded.</strong> This console is running on the
                    built-in default credentials. Check that the file is named <code>.env</code> with a leading dot.</span>
                </div>
            <?php endif; ?>

            <form method="POST" action="index.php">
                <input type="hidden" name="login" value="1">

                <div class="field">
                    <label for="username">Username</label>
                    <div class="input-wrap">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" name="username" id="username" required
                               placeholder="Enter username" autocomplete="username">
                    </div>
                </div>

                <div class="field" style="margin-bottom: 22px;">
                    <label for="password">Password</label>
                    <div class="input-wrap">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" name="password" id="password" required
                               placeholder="Enter password" autocomplete="current-password">
                    </div>
                </div>

                <button type="submit" class="btn-primary">Sign in</button>
            </form>
        </div>
    </div>

<?php else: ?>

    <!-- ============================ CONSOLE ============================ -->
    <div class="app">
        <div class="scrim" id="scrim" onclick="closeSidebar()"></div>

        <aside class="sidebar" id="sidebar">
            <div class="sidebar-brand">
                <img src="logo_robo.jpeg" alt="RoboNexus">
                <div>
                    <div class="name">Robo<em>Nexus</em></div>
                    <div class="role">Admin Console</div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-group">
                    <div class="nav-group-label">Main</div>
                    <button class="nav-item active" data-view="overview">
                        <i class="fa-solid fa-grip"></i> Overview
                    </button>
                </div>

                <div class="nav-group">
                    <div class="nav-group-label">Revenue</div>
                    <button class="nav-item" data-view="payments">
                        <i class="fa-solid fa-credit-card"></i> Payments
                        <span class="nav-count"><?php echo count($payments); ?></span>
                    </button>
                    <button class="nav-item" data-view="transactions">
                        <i class="fa-solid fa-receipt"></i> Transactions
                        <span class="nav-count"><?php echo count($orders); ?></span>
                    </button>
                </div>

                <div class="nav-group">
                    <div class="nav-group-label">Records</div>
                    <button class="nav-item" data-view="contractors">
                        <i class="fa-solid fa-id-card-clip"></i> Contractors
                        <span class="nav-count"><?php echo count($registrations); ?></span>
                    </button>
                    <button class="nav-item" data-view="telemetry">
                        <i class="fa-solid fa-file-video"></i> Telemetry
                        <span class="nav-count"><?php echo count($uploads); ?></span>
                    </button>
                    <button class="nav-item" data-view="inquiries">
                        <i class="fa-solid fa-envelope"></i> Inquiries
                        <span class="nav-count"><?php echo count($contacts); ?></span>
                    </button>
                </div>

                <div class="nav-group">
                    <div class="nav-group-label">System</div>
                    <button class="nav-item" data-view="logs">
                        <i class="fa-solid fa-clock-rotate-left"></i> Admin Logs
                        <span class="nav-count"><?php echo count($adminLogs); ?></span>
                    </button>
                </div>
            </nav>

            <div class="sidebar-foot">
                <div class="admin-chip">
                    <div class="avatar"><?php echo htmlspecialchars(substr($currentAdmin, 0, 2)); ?></div>
                    <div class="who">
                        <b><?php echo htmlspecialchars($currentAdmin); ?></b>
                        <small>Administrator</small>
                    </div>
                    <a href="index.php?action=logout" class="btn-logout" title="Sign out">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </a>
                </div>
            </div>
        </aside>

        <div class="main">
            <header class="topbar">
                <button class="menu-toggle" onclick="openSidebar()" aria-label="Open navigation">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div>
                    <h1 id="pageTitle">Overview</h1>
                    <div class="crumb" id="pageCrumb">Everything happening across RoboNexus</div>
                </div>
                <div class="topbar-right">
                    <?php if ($pdo !== null): ?>
                        <span class="pill pill-ok"><i class="fa-solid fa-circle"></i> MySQL live</span>
                    <?php else: ?>
                        <span class="pill pill-warn" title="Database unreachable — showing JSON fallback data">
                            <i class="fa-solid fa-circle"></i> JSON fallback
                        </span>
                    <?php endif; ?>
                </div>
            </header>

            <div class="content">

                <!-- ==================== OVERVIEW ==================== -->
                <section class="view active" id="view-overview">
                    <?php if ($usingDefaultCredentials): ?>
                        <div class="alert alert-warn" style="margin-bottom: 18px;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span><strong>backend/.env was not loaded</strong> — this console is running on the
                            built-in default credentials (<code>admin</code>/<code>admin123</code>). Confirm the file
                            is named <code>.env</code> with a leading dot.</span>
                        </div>
                    <?php endif; ?>

                    <?php if ($pdo === null): ?>
                        <div class="alert alert-warn" style="margin-bottom: 18px;">
                            <i class="fa-solid fa-database"></i>
                            <span><strong>Database unreachable.</strong> Everything below is read from the JSON
                            fallback files, and new submissions are being written there instead of MySQL.</span>
                        </div>
                    <?php endif; ?>

                    <div class="stats">
                        <div class="stat">
                            <div class="stat-icon i-indigo"><i class="fa-solid fa-users"></i></div>
                            <div>
                                <span class="label">Contractors</span>
                                <span class="value"><?php echo count($registrations); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-green"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                            <div>
                                <span class="label">Razorpay collected</span>
                                <span class="value">₹<?php echo number_format($paymentsTotal, 2); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-blue"><i class="fa-solid fa-wallet"></i></div>
                            <div>
                                <span class="label">Product revenue</span>
                                <span class="value">₹<?php echo number_format($totalRevenue, 2); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-slate"><i class="fa-solid fa-dolly"></i></div>
                            <div>
                                <span class="label">Transactions</span>
                                <span class="value"><?php echo count($orders); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-amber"><i class="fa-solid fa-file-video"></i></div>
                            <div>
                                <span class="label">Telemetry uploads</span>
                                <span class="value"><?php echo count($uploads); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-rose"><i class="fa-solid fa-envelope"></i></div>
                            <div>
                                <span class="label">Open inquiries</span>
                                <span class="value"><?php echo count($contacts); ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-indigo"><i class="fa-solid fa-user-check"></i></div>
                            <div>
                                <span class="label">Portal accounts</span>
                                <span class="value"><?php echo $userCount; ?></span>
                            </div>
                        </div>

                        <div class="stat">
                            <div class="stat-icon i-slate"><i class="fa-solid fa-clock-rotate-left"></i></div>
                            <div>
                                <span class="label">Logged admin events</span>
                                <span class="value"><?php echo count($adminLogs); ?></span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-head">
                            <h2>Recent activity</h2>
                            <span class="count-tag">Last 8 events</span>
                        </div>
                        <?php if (count($adminLogs) > 0): ?>
                            <div class="log-list">
                                <?php foreach (array_slice($adminLogs, 0, 8) as $log): ?>
                                    <?php
                                    $meta = logActionMeta($log['action']);
                                    $toneClass = ['ok' => 'i-green', 'danger' => 'i-rose', 'info' => 'i-blue', 'neutral' => 'i-slate'];
                                    ?>
                                    <div class="log-row">
                                        <div class="log-icon <?php echo $toneClass[$meta['tone']]; ?>">
                                            <i class="fa-solid <?php echo $meta['icon']; ?>"></i>
                                        </div>
                                        <div class="log-body">
                                            <div class="log-title"><?php echo htmlspecialchars($meta['label']); ?></div>
                                            <div class="log-detail"><?php echo htmlspecialchars($log['details']); ?></div>
                                            <div class="log-meta">
                                                <span><i class="fa-regular fa-user"></i><?php echo htmlspecialchars($log['actor']); ?></span>
                                                <span><i class="fa-regular fa-clock"></i><?php echo htmlspecialchars($log['timestamp']); ?></span>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="empty">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                                <p>No admin activity recorded yet. Sign-ins and verifications will appear here.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </section>

                <!-- ==================== PAYMENTS ==================== -->
                <section class="view" id="view-payments">
                    <div class="card">
                        <div class="card-head">
                            <h2>Razorpay payments</h2>
                            <span class="count-tag"><?php echo count($payments); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search payments…" oninput="filterTable(this, 'tbl-payments')">
                            </div>
                        </div>
                        <div class="table-scroll">
                            <?php if (count($payments) > 0): ?>
                                <table id="tbl-payments">
                                    <thead>
                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Register ID</th>
                                            <th>Customer</th>
                                            <th>Phone</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Paid at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($payments as $pay): ?>
                                            <tr>
                                                <td><span class="tag tag-mono t-indigo"><?php echo htmlspecialchars($pay['paymentId']); ?></span></td>
                                                <td>
                                                    <?php if (!empty($pay['registerId'])): ?>
                                                        <span class="tag tag-mono t-slate"><?php echo htmlspecialchars($pay['registerId']); ?></span>
                                                    <?php else: ?>
                                                        <span class="muted-note">—</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <div class="stack">
                                                        <span class="strong"><?php echo htmlspecialchars($pay['name']); ?></span>
                                                        <a class="sub link" href="mailto:<?php echo htmlspecialchars($pay['email']); ?>"><?php echo htmlspecialchars($pay['email']); ?></a>
                                                    </div>
                                                </td>
                                                <td class="nowrap"><?php echo htmlspecialchars($pay['phone']); ?></td>
                                                <td class="strong num nowrap">₹<?php echo htmlspecialchars($pay['amount']); ?></td>
                                                <td><span class="tag t-green"><i class="fa-solid fa-check"></i><?php echo htmlspecialchars($pay['status']); ?></span></td>
                                                <td class="nowrap mono"><?php echo htmlspecialchars($pay['timestamp']); ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php else: ?>
                                <div class="empty">
                                    <i class="fa-solid fa-credit-card"></i>
                                    <p>No Razorpay payments recorded yet. Completed onboarding payments appear here.</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

                <!-- ==================== TRANSACTIONS ==================== -->
                <section class="view" id="view-transactions">
                    <div class="card">
                        <div class="card-head">
                            <h2>Product transactions</h2>
                            <span class="count-tag"><?php echo count($orders); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search transactions…" oninput="filterTable(this, 'tbl-orders')">
                            </div>
                        </div>
                        <div class="table-scroll">
                            <?php if (count($orders) > 0): ?>
                                <table id="tbl-orders">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Delivery address</th>
                                            <th>Product</th>
                                            <th>Amount</th>
                                            <th>Registration</th>
                                            <th>Receipt</th>
                                            <th>Logged</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($orders as $order): ?>
                                            <?php
                                            // Match contractor registration by customer phone or name
                                            $regId = null;
                                            $cleanCustomerPhone = preg_replace('/\D/', '', $order['customer']['phone']);
                                            foreach ($registrations as $reg) {
                                                $cleanRegPhone = preg_replace('/\D/', '', $reg['phone']);
                                                if (!empty($cleanCustomerPhone) && $cleanCustomerPhone === $cleanRegPhone) {
                                                    $regId = $reg['registerId'];
                                                    break;
                                                }
                                                if (strcasecmp(trim($order['customer']['name']), trim($reg['fullName'])) === 0) {
                                                    $regId = $reg['registerId'];
                                                    break;
                                                }
                                            }
                                            ?>
                                            <tr>
                                                <td><span class="tag tag-mono t-green"><?php echo htmlspecialchars($order['orderId']); ?></span></td>
                                                <td>
                                                    <div class="stack">
                                                        <span class="strong"><?php echo htmlspecialchars($order['customer']['name']); ?></span>
                                                        <span class="sub"><?php echo htmlspecialchars($order['customer']['phone']); ?></span>
                                                        <?php if (!empty($order['customer']['email'])): ?>
                                                            <a class="sub link" href="mailto:<?php echo htmlspecialchars($order['customer']['email']); ?>"><?php echo htmlspecialchars($order['customer']['email']); ?></a>
                                                        <?php endif; ?>
                                                    </div>
                                                </td>
                                                <td><div class="wrap-cell" style="max-width: 230px;"><?php echo htmlspecialchars($order['customer']['address']); ?></div></td>
                                                <td>
                                                    <div class="stack">
                                                        <span class="strong"><?php echo htmlspecialchars($order['product']['name']); ?></span>
                                                        <span class="sub mono"><?php echo htmlspecialchars($order['product']['id']); ?></span>
                                                    </div>
                                                </td>
                                                <td class="strong num nowrap"><?php echo htmlspecialchars($order['product']['price']); ?></td>
                                                <td>
                                                    <?php if ($regId !== null): ?>
                                                        <span class="tag tag-mono t-indigo"><?php echo htmlspecialchars($regId); ?></span>
                                                    <?php else: ?>
                                                        <span class="muted-note">Not registered</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if (!empty($order['paymentScreenshot'])): ?>
                                                        <?php $paymentRef = $order['paymentScreenshot']; ?>
                                                        <?php if (strpos($paymentRef, 'pay_') === 0): ?>
                                                            <span class="tag tag-mono t-blue"><i class="fa-solid fa-credit-card"></i><?php echo htmlspecialchars($paymentRef); ?></span>
                                                        <?php else: ?>
                                                            <?php
                                                            $screenshotPath = htmlspecialchars($paymentRef);
                                                            $viewLink = (strpos($screenshotPath, './') === 0)
                                                                ? '../backend/' . substr($screenshotPath, 2)
                                                                : '../backend/' . $screenshotPath;
                                                            ?>
                                                            <a href="<?php echo $viewLink; ?>" target="_blank" rel="noopener" class="btn-ghost">
                                                                <i class="fa-solid fa-receipt"></i> View
                                                            </a>
                                                        <?php endif; ?>
                                                    <?php else: ?>
                                                        <span class="muted-note">None</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td class="nowrap mono"><?php echo htmlspecialchars($order['timestamp']); ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php else: ?>
                                <div class="empty">
                                    <i class="fa-solid fa-receipt"></i>
                                    <p>No product checkouts recorded yet.</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

                <!-- ==================== CONTRACTORS ==================== -->
                <section class="view" id="view-contractors">
                    <div class="card">
                        <div class="card-head">
                            <h2>Contractor registrations</h2>
                            <span class="count-tag"><?php echo count($registrations); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search contractors…" oninput="filterTable(this, 'tbl-regs')">
                            </div>
                        </div>
                        <div class="table-scroll">
                            <?php if (count($registrations) > 0): ?>
                                <table id="tbl-regs">
                                    <thead>
                                        <tr>
                                            <th>Register ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Location</th>
                                            <th>Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($registrations as $reg): ?>
                                            <tr>
                                                <td><span class="tag tag-mono t-indigo"><?php echo htmlspecialchars($reg['registerId']); ?></span></td>
                                                <td class="strong"><?php echo htmlspecialchars($reg['fullName']); ?></td>
                                                <td><a class="link" href="mailto:<?php echo htmlspecialchars($reg['email']); ?>"><?php echo htmlspecialchars($reg['email']); ?></a></td>
                                                <td class="nowrap"><?php echo htmlspecialchars($reg['phone']); ?></td>
                                                <td class="nowrap"><?php echo htmlspecialchars($reg['city'] . ', ' . $reg['state']); ?></td>
                                                <td class="nowrap mono"><?php echo htmlspecialchars($reg['timestamp']); ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php else: ?>
                                <div class="empty">
                                    <i class="fa-solid fa-id-card-clip"></i>
                                    <p>No contractor registrations recorded yet.</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

                <!-- ==================== TELEMETRY ==================== -->
                <section class="view" id="view-telemetry">
                    <div class="card">
                        <div class="card-head">
                            <h2>Telemetry submissions</h2>
                            <span class="count-tag"><?php echo count($uploads); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search submissions…" oninput="filterTable(this, 'tbl-uploads')">
                            </div>
                        </div>
                        <div class="table-scroll">
                            <?php if (count($uploads) > 0): ?>
                                <table id="tbl-uploads">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Contractor</th>
                                            <th>File</th>
                                            <th>Message &amp; feedback</th>
                                            <th>Hours</th>
                                            <th>Status</th>
                                            <th>Review</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($uploads as $log): ?>
                                            <?php
                                            $status = $log['status'];
                                            $statusClass = 't-slate';
                                            if ($status === 'Approved' || $status === 'Verified') {
                                                $statusClass = 't-green';
                                            } elseif ($status === 'Rejected') {
                                                $statusClass = 't-rose';
                                            } elseif ($status === 'Pending') {
                                                $statusClass = 't-amber';
                                            }
                                            ?>
                                            <tr id="upload-row-<?php echo $log['id']; ?>">
                                                <td><span class="tag tag-mono t-slate">#<?php echo htmlspecialchars($log['id']); ?></span></td>
                                                <td class="strong"><?php echo htmlspecialchars($log['userEmail']); ?></td>
                                                <td>
                                                    <div class="stack">
                                                        <span class="strong" style="font-size: 12.5px;"><?php echo htmlspecialchars($log['filename']); ?></span>
                                                        <?php if (!empty($log['filepath'])): ?>
                                                            <?php
                                                            $filepath = htmlspecialchars($log['filepath']);
                                                            $link = (strpos($filepath, './') === 0)
                                                                ? '../backend/' . substr($filepath, 2)
                                                                : '../backend/' . $filepath;
                                                            ?>
                                                            <a href="<?php echo $link; ?>" target="_blank" rel="noopener" class="sub link">
                                                                <i class="fa-solid fa-play"></i> View video
                                                            </a>
                                                        <?php endif; ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="wrap-cell" style="max-width: 260px;">
                                                        <div style="font-size: 12.5px;">
                                                            <?php echo !empty($log['userMessage'])
                                                                ? htmlspecialchars($log['userMessage'])
                                                                : '<span class="muted-note">No message</span>'; ?>
                                                        </div>
                                                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border);">
                                                            <span style="font-size: 11px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; color: var(--text-muted);">Feedback</span>
                                                            <div id="feedback-text-<?php echo $log['id']; ?>" style="font-size: 12.5px;">
                                                                <?php echo !empty($log['adminFeedback'])
                                                                    ? htmlspecialchars($log['adminFeedback'])
                                                                    : '<span class="muted-note">None</span>'; ?>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="strong num nowrap">
                                                    <span id="hours-text-<?php echo $log['id']; ?>"><?php echo htmlspecialchars($log['durationHours']); ?></span> hrs
                                                </td>
                                                <td>
                                                    <span class="tag <?php echo $statusClass; ?>" id="badge-status-<?php echo $log['id']; ?>">
                                                        <?php echo htmlspecialchars($status); ?>
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="verify">
                                                        <div class="verify-row">
                                                            <input type="number" step="0.01" min="0" placeholder="Hrs"
                                                                   id="input-hours-<?php echo $log['id']; ?>"
                                                                   value="<?php echo htmlspecialchars($log['durationHours']); ?>"
                                                                   aria-label="Approved hours">
                                                            <select id="select-status-<?php echo $log['id']; ?>" aria-label="Submission status">
                                                                <option value="Pending"  <?php if ($status === 'Pending') echo 'selected'; ?>>Pending</option>
                                                                <option value="Approved" <?php if ($status === 'Approved' || $status === 'Verified') echo 'selected'; ?>>Approved</option>
                                                                <option value="Rejected" <?php if ($status === 'Rejected') echo 'selected'; ?>>Rejected</option>
                                                            </select>
                                                        </div>
                                                        <textarea id="input-feedback-<?php echo $log['id']; ?>" rows="2"
                                                                  placeholder="Feedback to contractor…"
                                                                  aria-label="Admin feedback"><?php echo htmlspecialchars($log['adminFeedback']); ?></textarea>
                                                        <button class="btn-verify" onclick="submitApproval(<?php echo $log['id']; ?>, this)">
                                                            Save review
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php else: ?>
                                <div class="empty">
                                    <i class="fa-solid fa-file-video"></i>
                                    <p>No telemetry videos submitted yet.</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

                <!-- ==================== INQUIRIES ==================== -->
                <section class="view" id="view-inquiries">
                    <div class="card">
                        <div class="card-head">
                            <h2>Contact inquiries</h2>
                            <span class="count-tag"><?php echo count($contacts); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search inquiries…" oninput="filterTable(this, 'tbl-contacts')">
                            </div>
                        </div>
                        <div class="table-scroll">
                            <?php if (count($contacts) > 0): ?>
                                <table id="tbl-contacts">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Sender</th>
                                            <th>Email</th>
                                            <th>Subject</th>
                                            <th>Message</th>
                                            <th>Received</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($contacts as $index => $contact): ?>
                                            <tr>
                                                <td><span class="tag tag-mono t-slate"><?php echo count($contacts) - $index; ?></span></td>
                                                <td class="strong"><?php echo htmlspecialchars($contact['name']); ?></td>
                                                <td><a class="link" href="mailto:<?php echo htmlspecialchars($contact['email']); ?>"><?php echo htmlspecialchars($contact['email']); ?></a></td>
                                                <td><span class="tag t-blue" style="text-transform: capitalize;"><?php echo htmlspecialchars($contact['subject']); ?></span></td>
                                                <td><div class="wrap-cell" style="max-width: 400px;"><?php echo htmlspecialchars($contact['message']); ?></div></td>
                                                <td class="nowrap mono"><?php echo htmlspecialchars($contact['timestamp']); ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php else: ?>
                                <div class="empty">
                                    <i class="fa-solid fa-envelope"></i>
                                    <p>No contact inquiries received yet.</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

                <!-- ==================== ADMIN LOGS ==================== -->
                <section class="view" id="view-logs">
                    <div class="card">
                        <div class="card-head">
                            <h2>Admin activity log</h2>
                            <span class="count-tag"><?php echo count($adminLogs); ?></span>
                            <div class="search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="search" placeholder="Search log…" oninput="filterLogs(this)">
                            </div>
                        </div>

                        <?php if (count($adminLogs) > 0): ?>
                            <div class="log-list" id="logList">
                                <?php foreach ($adminLogs as $log): ?>
                                    <?php
                                    $meta = logActionMeta($log['action']);
                                    $toneClass = ['ok' => 'i-green', 'danger' => 'i-rose', 'info' => 'i-blue', 'neutral' => 'i-slate'];
                                    ?>
                                    <div class="log-row">
                                        <div class="log-icon <?php echo $toneClass[$meta['tone']]; ?>">
                                            <i class="fa-solid <?php echo $meta['icon']; ?>"></i>
                                        </div>
                                        <div class="log-body">
                                            <div class="log-title"><?php echo htmlspecialchars($meta['label']); ?></div>
                                            <div class="log-detail"><?php echo htmlspecialchars($log['details']); ?></div>
                                            <div class="log-meta">
                                                <span><i class="fa-regular fa-user"></i><?php echo htmlspecialchars($log['actor']); ?></span>
                                                <span><i class="fa-regular fa-clock"></i><?php echo htmlspecialchars($log['timestamp']); ?></span>
                                                <?php if (!empty($log['ipAddress'])): ?>
                                                    <span><i class="fa-solid fa-location-crosshairs"></i><?php echo htmlspecialchars($log['ipAddress']); ?></span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="empty">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                                <p>No admin activity recorded yet. Sign-ins, failed attempts and telemetry
                                   verifications are written here as they happen.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </section>

            </div>
        </div>
    </div>

    <script>
        /* ---------- Navigation ---------- */
        var PAGE_META = {
            overview:     ['Overview',      'Everything happening across RoboNexus'],
            payments:     ['Payments',      'Razorpay onboarding payments'],
            transactions: ['Transactions',  'Product checkouts and receipts'],
            contractors:  ['Contractors',   'Registered contractor accounts'],
            telemetry:    ['Telemetry',     'Video submissions awaiting review'],
            inquiries:    ['Inquiries',     'Messages from the contact form'],
            logs:         ['Admin Logs',    'Audit trail of console activity']
        };

        function showView(name) {
            if (!PAGE_META[name]) { name = 'overview'; }

            document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
            var target = document.getElementById('view-' + name);
            if (target) { target.classList.add('active'); }

            document.querySelectorAll('.nav-item').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-view') === name);
            });

            document.getElementById('pageTitle').textContent = PAGE_META[name][0];
            document.getElementById('pageCrumb').textContent = PAGE_META[name][1];

            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', '#' + name);
            }
            closeSidebar();
            window.scrollTo(0, 0);
        }

        document.querySelectorAll('.nav-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                showView(btn.getAttribute('data-view'));
            });
        });

        // Restore the section from the URL hash so a refresh keeps your place.
        showView((window.location.hash || '#overview').replace('#', ''));

        /* ---------- Mobile sidebar ---------- */
        function openSidebar() {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('scrim').classList.add('show');
        }

        function closeSidebar() {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('scrim').classList.remove('show');
        }

        /* ---------- Client-side filtering ---------- */
        function filterTable(input, tableId) {
            var table = document.getElementById(tableId);
            if (!table) { return; }
            var q = input.value.toLowerCase().trim();
            table.querySelectorAll('tbody tr').forEach(function (row) {
                row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
            });
        }

        function filterLogs(input) {
            var q = input.value.toLowerCase().trim();
            document.querySelectorAll('#logList .log-row').forEach(function (row) {
                row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
            });
        }

        /* ---------- Telemetry verification ---------- */
        function submitApproval(uploadId, btn) {
            var hoursVal    = document.getElementById('input-hours-' + uploadId).value;
            var statusVal   = document.getElementById('select-status-' + uploadId).value;
            var feedbackVal = document.getElementById('input-feedback-' + uploadId).value;

            if (!hoursVal || parseFloat(hoursVal) < 0) {
                alert('Please enter a valid number of hours.');
                return;
            }

            var original = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Saving…';

            var formData = new FormData();
            formData.append('uploadId', uploadId);
            formData.append('hours', hoursVal);
            formData.append('status', statusVal);
            formData.append('adminFeedback', feedbackVal);

            fetch('../backend/update_upload_status.php', { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.status === 'success') {
                        document.getElementById('hours-text-' + uploadId).textContent = parseFloat(hoursVal).toFixed(2);
                        document.getElementById('feedback-text-' + uploadId).textContent = feedbackVal || 'None';

                        var badge = document.getElementById('badge-status-' + uploadId);
                        badge.textContent = statusVal;
                        badge.className = 'tag ' + (
                            statusVal === 'Approved' ? 't-green' :
                            statusVal === 'Rejected' ? 't-rose'  : 't-amber'
                        );

                        btn.textContent = 'Saved ✓';
                        setTimeout(function () {
                            btn.disabled = false;
                            btn.textContent = original;
                        }, 1600);
                    } else {
                        alert('Error updating review: ' + data.message);
                        btn.disabled = false;
                        btn.textContent = original;
                    }
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    alert('Failed to submit review to the backend.');
                    btn.disabled = false;
                    btn.textContent = original;
                });
        }
    </script>

<?php endif; ?>

</body>
</html>
