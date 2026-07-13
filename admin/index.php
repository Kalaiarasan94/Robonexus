<?php
// admin/index.php - Secure Admin Control Panel at /admin
require_once __DIR__ . '/../backend/db.php';

session_start();

// Get admin credentials from environment variables
$adminUser = isset($_ENV['ADMIN_USERNAME']) ? $_ENV['ADMIN_USERNAME'] : 'admin';
$adminPass = isset($_ENV['ADMIN_PASSWORD']) ? $_ENV['ADMIN_PASSWORD'] : 'admin123';

// 1. Handle Logout Action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
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
        header("Location: index.php");
        exit();
    } else {
        $loginError = 'Invalid admin credentials. Please try again.';
    }
}

// Check authorization
$isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// 3. Load Data if Logged In
$registrations = [];
$orders = [];
$contacts = [];
$uploads = [];
$payments = [];
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
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoboNexus Admin Control Dashboard</title>
    <!-- Share Tech Mono for code, Cambria Math is loaded from system font stack -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <!-- FontAwesome for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg-color: #0b0b0f;
            --card-color: #15171c;
            --border-color: rgba(140, 149, 166, 0.15);
            --cyan: #ffffff;
            --purple: #2d7eff;
            --violet: #8c95a6;
            --text-color: #ffffff;
            --text-muted: #8c95a6;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: "Cambria Math", Cambria, Georgia, serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            position: relative;
        }

        /* Subtle mesh background, softened for premium aesthetic */
        body::before {
            content: "";
            position: fixed;
            inset: 0;
            background-image: radial-gradient(circle, rgba(243, 244, 246, 0.005) 1px, transparent 1px);
            background-size: 32px 32px;
            z-index: -2;
            pointer-events: none;
        }

        body::after {
            content: "";
            position: fixed;
            width: 80vw;
            height: 80vw;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(45, 126, 255, 0.04) 0%, transparent 70%);
            top: -20vw;
            left: -20vw;
            z-index: -1;
            pointer-events: none;
        }

        .bg-glow-right {
            position: fixed;
            width: 80vw;
            height: 80vw;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(140, 149, 166, 0.03) 0%, transparent 70%);
            bottom: -20vw;
            right: -20vw;
            z-index: -1;
            pointer-events: none;
        }

        header {
            border-bottom: 1px solid var(--border-color);
            background-color: rgba(5, 5, 12, 0.8);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 40;
            padding: 1rem 2rem;
        }

        .header-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: white;
            font-size: 1.25rem;
            font-weight: 700;
        }

        .logo-icon {
            background: linear-gradient(135deg, var(--cyan), var(--purple));
            height: 36px;
            width: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
        }

        .logo-icon i {
            color: white;
            font-size: 0.95rem;
        }

        .logo span {
            background: linear-gradient(to right, #ffffff, #d1d5db);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo span span {
            color: var(--cyan);
            -webkit-text-fill-color: initial;
        }

        .btn-logout {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            padding: 0.5rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-logout:hover {
            background-color: rgb(239, 68, 68);
            border-color: rgb(239, 68, 68);
            color: white;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }

        main {
            max-width: 1400px;
            width: 100%;
            margin: 2rem auto;
            padding: 0 2rem;
            flex-grow: 1;
        }

        /* Login Layout styling */
        .login-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 160px);
        }

        .login-card {
            width: 100%;
            max-width: 420px;
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 2.5rem;
            backdrop-filter: blur(12px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            position: relative;
        }

        .login-card::before {
            content: "";
            position: absolute;
            inset: -1px;
            background: linear-gradient(135deg, var(--purple), var(--cyan));
            border-radius: 24px;
            z-index: -1;
            opacity: 0.3;
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-header i {
            font-size: 2.5rem;
            background: linear-gradient(135deg, var(--violet), var(--cyan));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }

        .login-header h1 {
            font-size: 1.75rem;
            font-weight: 800;
            color: white;
        }

        .login-header p {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-family: "Share Tech Mono", monospace;
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .form-control {
            width: 100%;
            background-color: rgba(5, 5, 12, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            font-size: 0.85rem;
            color: white;
            transition: all 0.3s;
        }

        .form-control:focus {
            outline: none;
            border-color: var(--cyan);
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
        }

        .alert-error {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-login {
            width: 100%;
            background: linear-gradient(135deg, var(--purple), var(--cyan));
            border: none;
            color: white;
            padding: 0.85rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(6, 182, 212, 0.15);
        }

        .btn-login:hover {
            box-shadow: 0 5px 20px rgba(6, 182, 212, 0.3);
            transform: translateY(-1px);
        }

        /* Dashboard Overview Grid */
        .stats-grid {
            display: grid;
            grid-template-cols: 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
            .stats-grid {
                grid-template-cols: repeat(4, 1fr);
            }
        }

        .stat-card {
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            gap: 1.25rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: all 0.3s;
        }

        .stat-card:hover {
            border-color: var(--cyan);
            box-shadow: 0 4px 25px rgba(6, 182, 212, 0.1);
        }

        .stat-icon {
            height: 52px;
            width: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: white;
        }

        .stat-icon.blue {
            background-color: rgba(6, 182, 212, 0.15);
            border: 1px solid rgba(6, 182, 212, 0.3);
            color: var(--cyan);
        }

        .stat-icon.purple {
            background-color: rgba(124, 58, 237, 0.15);
            border: 1px solid rgba(124, 58, 237, 0.3);
            color: var(--violet);
        }

        .stat-icon.green {
            background-color: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #4ade80;
        }

        .stat-info {
            display: flex;
            flex-direction: column;
        }

        .stat-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .stat-val {
            font-size: 1.75rem;
            font-weight: 800;
            color: white;
            margin-top: 0.25rem;
        }

        /* Tabs Interface */
        .tabs-header {
            display: flex;
            gap: 1rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-family: "Outfit", sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 0.75rem 1.25rem;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        .tab-btn.active {
            color: white;
        }

        .tab-btn.active::after {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(to right, var(--cyan), var(--purple));
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Table Design */
        .table-card {
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            overflow: hidden;
            backdrop-filter: blur(12px);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }

        .table-responsive {
            overflow-x: auto;
            width: 100%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        th {
            background-color: rgba(5, 5, 12, 0.9);
            padding: 1rem 1.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-family: "Share Tech Mono", monospace;
            border-bottom: 1px solid var(--border-color);
        }

        td {
            padding: 1.15rem 1.5rem;
            font-size: 0.85rem;
            border-bottom: 1px solid rgba(167, 139, 250, 0.06);
            color: #d1d5db;
        }

        tr:hover td {
            background-color: rgba(167, 139, 250, 0.03);
            color: white;
        }

        .badge-id {
            background-color: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.2);
            color: var(--cyan);
            font-family: "Share Tech Mono", monospace;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-date {
            color: var(--text-muted);
            font-size: 0.8rem;
            white-space: nowrap;
        }

        .customer-cell {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .customer-name {
            font-weight: 600;
            color: white;
        }

        .customer-sub {
            font-size: 0.75rem;
            color: var(--text-muted);
        }

        .btn-view-screenshot {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background-color: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            color: var(--violet);
            text-decoration: none;
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            transition: all 0.3s;
        }

        .btn-view-screenshot:hover {
            background-color: var(--purple);
            border-color: var(--purple);
            color: white;
            box-shadow: 0 0 10px rgba(124, 58, 237, 0.3);
        }

        .empty-state {
            padding: 4rem 2rem;
            text-align: center;
            color: var(--text-muted);
        }

        .empty-state i {
            font-size: 2.5rem;
            color: rgba(167, 139, 250, 0.2);
            margin-bottom: 1rem;
        }

        .empty-state p {
            font-size: 0.9rem;
        }

        footer {
            padding: 2rem;
            text-align: center;
            border-t: 1px solid var(--border-color);
            color: var(--text-muted);
            font-size: 0.75rem;
            font-family: "Share Tech Mono", monospace;
            margin-top: auto;
        }
    </style>
</head>
<body>
    <div class="bg-glow-right"></div>

    <!-- Main Navigation Header -->
    <header>
        <div class="header-container">
            <a href="index.php" class="logo">
                <div class="logo-icon" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <img src="logo_robo.jpeg" alt="RoboNexus Logo" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <span>Robo<span>Nexus</span> Admin Control</span>
            </a>
            
            <?php if ($isLoggedIn): ?>
                <a href="index.php?action=logout" class="btn-logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Log Out
                </a>
            <?php endif; ?>
        </div>
    </header>

    <main>
        <?php if (!$isLoggedIn): ?>
            <!-- LOGIN PANEL -->
            <div class="login-wrapper">
                <div class="login-card">
                    <div class="login-header">
                        <i class="fa-solid fa-shield-halved"></i>
                        <h1>Control Login</h1>
                        <p>Authenticate security access to telemetry records</p>
                    </div>

                    <?php if ($loginError): ?>
                        <div class="alert-error">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span><?php echo htmlspecialchars($loginError); ?></span>
                        </div>
                    <?php endif; ?>

                    <form method="POST" action="index.php">
                        <input type="hidden" name="login" value="1">
                        
                        <div class="form-group">
                            <label for="username">Access Identity</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-user-gear"></i>
                                <input 
                                    type="text" 
                                    name="username" 
                                    id="username" 
                                    required 
                                    class="form-control" 
                                    placeholder="Username"
                                    autocomplete="off"
                                >
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 2rem;">
                            <label for="password">Security Passkey</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-key"></i>
                                <input 
                                    type="password" 
                                    name="password" 
                                    id="password" 
                                    required 
                                    class="form-control" 
                                    placeholder="Password"
                                >
                            </div>
                        </div>

                        <button type="submit" class="btn-login">
                            Decrypt Access Control
                        </button>
                    </form>
                </div>
            </div>
        <?php else: ?>
            <!-- DASHBOARD PANEL -->
            
            <!-- Statistics Overview Summary Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon purple">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Telemetry Contractors</span>
                        <span class="stat-val"><?php echo count($registrations); ?></span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fa-solid fa-dolly"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Product Checkouts</span>
                        <span class="stat-val"><?php echo count($orders); ?></span>
                    </div>
                </div>

            <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fa-solid fa-wallet"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Logged Revenue</span>
                        <span class="stat-val">₹<?php echo number_format($totalRevenue, 2); ?></span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background-color: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); color: #ec4899;">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Contact Inquiries</span>
                        <span class="stat-val"><?php echo count($contacts); ?></span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background-color: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); color: #06b6d4;">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Registered Users</span>
                        <span class="stat-val"><?php echo $userCount; ?></span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background-color: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); color: #7c3aed;">
                        <i class="fa-solid fa-indian-rupee-sign"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Razorpay Collected (<?php echo count($payments); ?>)</span>
                        <span class="stat-val">₹<?php echo number_format($paymentsTotal, 2); ?></span>
                    </div>
                </div>
            </div>

            <!-- Tab Headers Navigation -->
            <div class="tabs-header">
                <button class="tab-btn active" onclick="switchTab('contractors')">
                    <i class="fa-solid fa-id-card-clip" style="margin-right: 0.5rem;"></i>
                    Contractor Registers
                </button>
                <button class="tab-btn" onclick="switchTab('payments')">
                    <i class="fa-solid fa-credit-card" style="margin-right: 0.5rem;"></i>
                    Payments
                </button>
                <button class="tab-btn" onclick="switchTab('orders')">
                    <i class="fa-solid fa-receipt" style="margin-right: 0.5rem;"></i>
                    Product Sales Logs
                </button>
                <button class="tab-btn" onclick="switchTab('contacts')">
                    <i class="fa-solid fa-envelope" style="margin-right: 0.5rem;"></i>
                    Contact Inquiries
                </button>
                <button class="tab-btn" onclick="switchTab('uploads')">
                    <i class="fa-solid fa-file-video" style="margin-right: 0.5rem;"></i>
                    Telemetry Submissions
                </button>
            </div>

            <!-- Tab Content 1: Contractor Registrations -->
            <div id="tab-contractors" class="tab-content active">
                <div class="table-card">
                    <div class="table-responsive">
                        <?php if (count($registrations) > 0): ?>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Register ID</th>
                                        <th>Contractor Name</th>
                                        <th>Email Address</th>
                                        <th>Phone Coordinate</th>
                                        <th>Location Area</th>
                                        <th>Log Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($registrations as $reg): ?>
                                        <tr>
                                            <td>
                                                <span class="badge-id"><?php echo htmlspecialchars($reg['registerId']); ?></span>
                                            </td>
                                            <td style="font-weight: 600; color: white;">
                                                <?php echo htmlspecialchars($reg['fullName']); ?>
                                            </td>
                                            <td>
                                                <a href="mailto:<?php echo htmlspecialchars($reg['email']); ?>" style="color: var(--violet); text-decoration: none; hover:underline;">
                                                    <?php echo htmlspecialchars($reg['email']); ?>
                                                </a>
                                            </td>
                                            <td><?php echo htmlspecialchars($reg['phone']); ?></td>
                                            <td><?php echo htmlspecialchars($reg['city']) . ', ' . htmlspecialchars($reg['state']); ?></td>
                                            <td>
                                                <span class="badge-date"><?php echo htmlspecialchars($reg['timestamp']); ?></span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fa-solid fa-folder-open"></i>
                                <p>No contractor registrations recorded in the database queue.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Tab Content: Razorpay Payments -->
            <div id="tab-payments" class="tab-content">
                <div class="table-card">
                    <div class="table-responsive">
                        <?php if (count($payments) > 0): ?>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Payment ID</th>
                                        <th>Worker / Register ID</th>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Paid At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($payments as $pay): ?>
                                        <tr>
                                            <td>
                                                <span class="badge-id"><?php echo htmlspecialchars($pay['paymentId']); ?></span>
                                            </td>
                                            <td>
                                                <span class="badge-id"><?php echo htmlspecialchars(isset($pay['registerId']) ? $pay['registerId'] : ''); ?></span>
                                            </td>
                                            <td style="font-weight: 600; color: white;">
                                                <?php echo htmlspecialchars($pay['name']); ?>
                                            </td>
                                            <td>
                                                <a href="mailto:<?php echo htmlspecialchars($pay['email']); ?>" style="color: var(--violet); text-decoration: none;">
                                                    <?php echo htmlspecialchars($pay['email']); ?>
                                                </a>
                                            </td>
                                            <td><?php echo htmlspecialchars($pay['phone']); ?></td>
                                            <td style="font-weight: 700; color: #4ade80;">₹<?php echo htmlspecialchars($pay['amount']); ?></td>
                                            <td>
                                                <span class="badge-id" style="color: #4ade80; background-color: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2);">
                                                    <?php echo htmlspecialchars($pay['status']); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge-date"><?php echo htmlspecialchars($pay['timestamp']); ?></span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fa-solid fa-credit-card"></i>
                                <p>No Razorpay payments recorded yet. Completed onboarding payments will appear here.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Tab Content 2: Store Product Orders -->
            <div id="tab-orders" class="tab-content">
                <div class="table-card">
                    <div class="table-responsive">
                        <?php if (count($orders) > 0): ?>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer Details</th>
                                        <th>Delivery Address</th>
                                        <th>Purchased Product</th>
                                        <th>Paid Amount</th>
                                        <th>Registration</th>
                                        <th>Payment Screenshot</th>
                                        <th>Log Time</th>
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
                                            <td>
                                                <span class="badge-id" style="color: #4ade80; background-color: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2);">
                                                    <?php echo htmlspecialchars($order['orderId']); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <div class="customer-cell">
                                                    <span class="customer-name"><?php echo htmlspecialchars($order['customer']['name']); ?></span>
                                                    <span class="customer-sub"><i class="fa-solid fa-phone" style="font-size: 0.7rem; margin-right: 0.3rem;"></i><?php echo htmlspecialchars($order['customer']['phone']); ?></span>
                                                    <?php if (isset($order['customer']['email']) && !empty($order['customer']['email'])): ?>
                                                        <span class="customer-sub"><i class="fa-solid fa-envelope" style="font-size: 0.7rem; margin-right: 0.3rem;"></i><a href="mailto:<?php echo htmlspecialchars($order['customer']['email']); ?>" style="color: var(--violet); text-decoration: none;"><?php echo htmlspecialchars($order['customer']['email']); ?></a></span>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="max-width: 250px; white-space: normal; line-height: 1.4; font-size: 0.8rem;">
                                                    <?php echo htmlspecialchars($order['customer']['address']); ?>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="customer-cell">
                                                    <span class="customer-name" style="font-size: 0.85rem;"><?php echo htmlspecialchars($order['product']['name']); ?></span>
                                                    <span class="customer-sub" style="color: var(--cyan);"><?php echo htmlspecialchars($order['product']['id']); ?></span>
                                                </div>
                                            </td>
                                            <td style="font-weight: 700; color: white;">
                                                <?php echo htmlspecialchars($order['product']['price']); ?>
                                            </td>
                                            <td>
                                                <?php if ($regId !== null): ?>
                                                    <span class="badge-id" style="color: #a78bfa; background-color: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.2);">
                                                        <?php echo htmlspecialchars($regId); ?>
                                                    </span>
                                                <?php else: ?>
                                                    <span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Not Registered</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if (isset($order['paymentScreenshot']) && !empty($order['paymentScreenshot'])): ?>
                                                    <?php
                                                    $paymentRef = $order['paymentScreenshot'];
                                                    ?>
                                                    <?php if (strpos($paymentRef, 'pay_') === 0): ?>
                                                        <span class="badge-id"><i class="fa-solid fa-credit-card"></i> <?php echo htmlspecialchars($paymentRef); ?></span>
                                                    <?php else: ?>
                                                        <?php
                                                        $screenshotPath = htmlspecialchars($paymentRef);
                                                        if (strpos($screenshotPath, './') === 0) {
                                                            $viewLink = '../backend/' . substr($screenshotPath, 2);
                                                        } else {
                                                            $viewLink = '../backend/' . $screenshotPath;
                                                        }
                                                        ?>
                                                        <a href="<?php echo $viewLink; ?>" target="_blank" class="btn-view-screenshot">
                                                            <i class="fa-solid fa-receipt"></i>
                                                            View Receipt
                                                        </a>
                                                    <?php endif; ?>
                                                <?php else: ?>
                                                    <span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">No Receipt</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <span class="badge-date"><?php echo htmlspecialchars($order['timestamp']); ?></span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fa-solid fa-receipt"></i>
                                <p>No product checkouts or payment screenshot receipts uploaded.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Tab Content 3: Contact Inquiries -->
            <div id="tab-contacts" class="tab-content">
                <div class="table-card">
                    <div class="table-responsive">
                        <?php if (count($contacts) > 0): ?>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Inquiry ID</th>
                                        <th>Sender Name</th>
                                        <th>Email Address</th>
                                        <th>Category/Subject</th>
                                        <th>Message Details</th>
                                        <th>Log Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($contacts as $index => $contact): ?>
                                        <tr>
                                            <td>
                                                <span class="badge-id" style="color: #ec4899; background-color: rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.2);">
                                                    #<?php echo count($contacts) - $index; ?>
                                                </span>
                                            </td>
                                            <td style="font-weight: 600; color: white;">
                                                <?php echo htmlspecialchars($contact['name']); ?>
                                            </td>
                                            <td>
                                                <a href="mailto:<?php echo htmlspecialchars($contact['email']); ?>" style="color: var(--violet); text-decoration: none; hover:underline;">
                                                    <?php echo htmlspecialchars($contact['email']); ?>
                                                </a>
                                            </td>
                                            <td>
                                                <span style="text-transform: capitalize; color: var(--cyan); font-weight: 500;">
                                                    <?php echo htmlspecialchars($contact['subject']); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <div style="max-width: 400px; white-space: normal; line-height: 1.4; font-size: 0.8rem; color: #d1d5db;">
                                                    <?php echo htmlspecialchars($contact['message']); ?>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="badge-date"><?php echo htmlspecialchars($contact['timestamp']); ?></span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fa-solid fa-envelope"></i>
                                <p>No contact inquiries recorded in the database queue.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Tab Content 4: Telemetry Uploads -->
            <div id="tab-uploads" class="tab-content">
                <div class="table-card">
                    <div class="table-responsive">
                        <?php if (count($uploads) > 0): ?>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Log ID</th>
                                        <th>Contractor Email</th>
                                        <th>Filename & Video Path</th>
                                        <th>User Msg & Admin Feedback</th>
                                        <th>Reported Hours</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($uploads as $log): ?>
                                        <tr id="upload-row-<?php echo $log['id']; ?>">
                                            <td>
                                                <span class="badge-id" style="color: var(--cyan); background-color: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.2);">
                                                    #<?php echo htmlspecialchars($log['id']); ?>
                                                </span>
                                            </td>
                                            <td style="font-weight: 600; color: white; font-size: 0.8rem;">
                                                <?php echo htmlspecialchars($log['userEmail']); ?>
                                            </td>
                                            <td>
                                                <div class="customer-cell">
                                                    <span class="customer-name" style="font-size: 0.85rem; font-weight: 600;"><?php echo htmlspecialchars($log['filename']); ?></span>
                                                    <?php if (!empty($log['filepath'])): ?>
                                                        <?php
                                                        $filepath = htmlspecialchars($log['filepath']);
                                                        $link = strpos($filepath, './') === 0 ? '../backend/' . substr($filepath, 2) : '../backend/' . $filepath;
                                                        ?>
                                                        <a href="<?php echo $link; ?>" target="_blank" style="color: var(--cyan); text-decoration: none; font-size: 0.75rem; margin-top: 0.25rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                                                            <i class="fa-solid fa-file-video"></i> View Video File
                                                        </a>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="font-size: 0.8rem; color: #d1d5db; max-width: 300px; white-space: normal; line-height: 1.4;">
                                                    <strong>User message:</strong> <?php echo !empty($log['userMessage']) ? htmlspecialchars($log['userMessage']) : '<span style="color: var(--text-muted); font-style: italic;">None</span>'; ?><br>
                                                    <div style="margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                                                        <strong>Feedback:</strong> 
                                                        <span id="feedback-text-<?php echo $log['id']; ?>" style="color: var(--cyan);">
                                                            <?php echo !empty($log['adminFeedback']) ? htmlspecialchars($log['adminFeedback']) : '<span style="color: var(--text-muted); font-style: italic;">None</span>'; ?>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="font-weight: 700; color: white; font-family: 'Share Tech Mono', monospace; font-size: 0.9rem;">
                                                <span id="hours-text-<?php echo $log['id']; ?>"><?php echo htmlspecialchars($log['durationHours']); ?></span> hrs
                                            </td>
                                            <td>
                                                <?php
                                                $status = $log['status'];
                                                $badgeStyle = "color: var(--text-muted); background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1);";
                                                if ($status === 'Approved' || $status === 'Verified') {
                                                    $badgeStyle = "color: #4ade80; background-color: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2);";
                                                } elseif ($status === 'Rejected') {
                                                    $badgeStyle = "color: #f87171; background-color: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.2);";
                                                }
                                                ?>
                                                <span class="badge-id" id="badge-status-<?php echo $log['id']; ?>" style="<?php echo $badgeStyle; ?>">
                                                    <?php echo htmlspecialchars($status); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <!-- Action Buttons and input inline layout -->
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 200px;">
                                                    <div style="display: flex; gap: 0.25rem;">
                                                        <input type="number" step="0.01" placeholder="Hours" id="input-hours-<?php echo $log['id']; ?>" value="<?php echo htmlspecialchars($log['durationHours']); ?>" style="width: 70px; background: rgba(5,5,12,0.8); border: 1px solid var(--border-color); color: white; border-radius: 4px; padding: 4px 6px; font-size: 0.8rem; font-family: monospace;" />
                                                        <select id="select-status-<?php echo $log['id']; ?>" style="background: rgba(5,5,12,0.8); border: 1px solid var(--border-color); color: white; border-radius: 4px; padding: 4px; font-size: 0.8rem; cursor: pointer;">
                                                            <option value="Pending" <?php if ($status === 'Pending') echo 'selected'; ?>>Pending</option>
                                                            <option value="Approved" <?php if ($status === 'Approved' || $status === 'Verified') echo 'selected'; ?>>Approved</option>
                                                            <option value="Rejected" <?php if ($status === 'Rejected') echo 'selected'; ?>>Rejected</option>
                                                        </select>
                                                    </div>
                                                    <textarea placeholder="Feedback message..." id="input-feedback-<?php echo $log['id']; ?>" rows="2" style="background: rgba(5,5,12,0.8); border: 1px solid var(--border-color); color: white; border-radius: 4px; padding: 4px 6px; font-size: 0.8rem; resize: none; font-family: inherit;"><?php echo htmlspecialchars($log['adminFeedback']); ?></textarea>
                                                    <button onclick="submitApproval(<?php echo $log['id']; ?>)" style="background: linear-gradient(135deg, var(--cyan), var(--violet)); border: none; color: white; border-radius: 4px; padding: 6px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Submit Verification
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fa-solid fa-file-video"></i>
                                <p>No contractor telemetry logs or video submissions received yet.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Tab Switch Script -->
            <script>
                function switchTab(tabName) {
                    // Remove active classes
                    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                    // Add active classes
                    const buttons = document.querySelectorAll('.tab-btn');
                    if (tabName === 'contractors') {
                        buttons[0].classList.add('active');
                        document.getElementById('tab-contractors').classList.add('active');
                    } else if (tabName === 'payments') {
                        buttons[1].classList.add('active');
                        document.getElementById('tab-payments').classList.add('active');
                    } else if (tabName === 'orders') {
                        buttons[2].classList.add('active');
                        document.getElementById('tab-orders').classList.add('active');
                    } else if (tabName === 'contacts') {
                        buttons[3].classList.add('active');
                        document.getElementById('tab-contacts').classList.add('active');
                    } else if (tabName === 'uploads') {
                        buttons[4].classList.add('active');
                        document.getElementById('tab-uploads').classList.add('active');
                    }
                }

                function submitApproval(uploadId) {
                    const hoursVal = document.getElementById('input-hours-' + uploadId).value;
                    const statusVal = document.getElementById('select-status-' + uploadId).value;
                    const feedbackVal = document.getElementById('input-feedback-' + uploadId).value;

                    if (!hoursVal || parseFloat(hoursVal) < 0) {
                        alert("Please enter a valid amount of hours.");
                        return;
                    }

                    const formData = new FormData();
                    formData.append("uploadId", uploadId);
                    formData.append("hours", hoursVal);
                    formData.append("status", statusVal);
                    formData.append("adminFeedback", feedbackVal);

                    fetch('../backend/update_upload_status.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            alert("Verification updated successfully!");
                            // Dynamically update fields
                            document.getElementById('hours-text-' + uploadId).textContent = parseFloat(hoursVal).toFixed(2);
                            document.getElementById('feedback-text-' + uploadId).textContent = feedbackVal ? feedbackVal : 'None';
                            
                            const badge = document.getElementById('badge-status-' + uploadId);
                            badge.textContent = statusVal;
                            
                            if (statusVal === 'Approved') {
                                badge.style = "color: #4ade80; background-color: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2);";
                            } else if (statusVal === 'Rejected') {
                                badge.style = "color: #f87171; background-color: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.2);";
                            } else {
                                badge.style = "color: var(--text-muted); background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1);";
                            }
                        } else {
                            alert("Error updating approval status: " + data.message);
                        }
                    })
                    .catch(error => {
                        console.error("Error:", error);
                        alert("Failed to submit verification to backend.");
                    });
                }
            </script>
        <?php endif; ?>
    </main>

    <footer>
        ROBONEXUS SYSTEM v4.5 // TELEMETRY GATEWAY ACTIVE // SECURE ADMIN CONSOLE
    </footer>
</body>
</html>
