<?php
// record_payment.php - Server-to-server payment record from the aimstorm.in gateway.
//
// WHY THIS EXISTS
// Previously the ONLY thing that wrote to the `payments` table was register.php,
// which the customer's BROWSER calls after being redirected back from the
// gateway. If the browser never made that trip — UPI app-switch returning in a
// fresh tab (sessionStorage is per-tab), tab closed, connection dropped — the
// money was taken by Razorpay and RoboNexus had no record of it at all.
//
// aimstorm.in/verify.php now calls this the moment it verifies the signature, so
// the payment is recorded regardless of what the browser does afterwards.
// register.php later fills in the register_id when onboarding completes.
//
// Authenticated with an HMAC over the payment fields using a shared secret, so
// nobody can POST fake payments into your admin panel.

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

require_once __DIR__ . '/db.php';

if (!function_exists('loadUsersFallbackLocal')) {
    function loadUsersFallbackLocal() {
        $f = __DIR__ . '/users.json';
        if (!file_exists($f)) return [];
        $d = json_decode(file_get_contents($f), true);
        return is_array($d) ? $d : [];
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed."]);
    exit();
}

$secret = isset($_ENV['GATEWAY_SHARED_SECRET']) ? trim($_ENV['GATEWAY_SHARED_SECRET']) : '';
if ($secret === '') {
    error_log("record_payment: GATEWAY_SHARED_SECRET is not set — refusing to record.");
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gateway integration is not configured."]);
    exit();
}

$paymentId = isset($_POST['payment_id']) ? trim($_POST['payment_id']) : '';
$orderId   = isset($_POST['order_id']) ? trim($_POST['order_id']) : '';
$amount    = isset($_POST['amount']) ? trim($_POST['amount']) : '';
$name      = isset($_POST['name']) ? trim($_POST['name']) : '';
$email     = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone     = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$signature = isset($_POST['signature']) ? trim($_POST['signature']) : '';

if ($paymentId === '' || $signature === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "payment_id and signature are required."]);
    exit();
}

// Signed payload — order matters and must match the gateway side exactly.
$expected = hash_hmac('sha256', $paymentId . '|' . $orderId . '|' . $amount, $secret);
if (!hash_equals($expected, $signature)) {
    error_log("record_payment: signature mismatch for payment {$paymentId}");
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Invalid signature."]);
    exit();
}

$timestamp = date('Y-m-d H:i:s');
$recorded = false;
$duplicate = false;

if ($pdo !== null) {
    try {
        // Idempotent: the gateway may retry, and register.php may also arrive.
        $check = $pdo->prepare("SELECT `id` FROM `payments` WHERE `payment_id` = :pid LIMIT 1");
        $check->execute([':pid' => $paymentId]);
        if ($check->fetch()) {
            $duplicate = true;
            $recorded = true;
        } else {
            $stmt = $pdo->prepare(
                "INSERT INTO `payments`
                 (`payment_id`, `order_ref`, `razorpay_order_id`, `register_id`,
                  `customer_name`, `customer_email`, `customer_phone`, `amount`, `status`, `timestamp`)
                 VALUES (:pid, :ref, :rzp_order, '', :name, :email, :phone, :amount, 'paid', :ts)"
            );
            $stmt->execute([
                ':pid' => $paymentId,
                ':ref' => $orderId,
                ':rzp_order' => $orderId,
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':amount' => $amount,
                ':ts' => $timestamp,
            ]);
            $recorded = true;
        }
    } catch (PDOException $e) {
        error_log("record_payment DB write failed: " . $e->getMessage());
    }
}

// JSON fallback so a database outage still cannot lose a payment.
if (!$recorded) {
    $f = __DIR__ . '/payments.json';
    $rows = [];
    if (file_exists($f)) {
        $d = json_decode(file_get_contents($f), true);
        if (is_array($d)) $rows = $d;
    }
    foreach ($rows as $r) {
        if (($r['paymentId'] ?? '') === $paymentId) { $duplicate = true; break; }
    }
    if (!$duplicate) {
        $rows[] = [
            'paymentId' => $paymentId,
            'orderRef' => $orderId,
            'razorpayOrderId' => $orderId,
            'registerId' => '',
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'amount' => $amount,
            'status' => 'paid',
            'timestamp' => $timestamp,
        ];
        file_put_contents($f, json_encode($rows, JSON_PRETTY_PRINT), LOCK_EX);
    }
    $recorded = true;
}

// ---------------------------------------------------------------------------
// Provision the contractor account too.
//
// Recording the payment alone is not enough: without a `users` row the customer
// who just paid cannot log in, and support gets "I paid but it says invalid
// email". The gateway already passes name/email/phone, which is everything an
// account needs, so create it here rather than waiting for a browser that may
// never come back. Address and referral are filled in later by register.php if
// the browser does return.
// ---------------------------------------------------------------------------
$accountCreated = false;
$accountExisted = false;
$registerId = '';

if ($email !== '' && $phone !== '') {
    $existing = null;

    if ($pdo !== null) {
        try {
            $q = $pdo->prepare("SELECT `email` FROM `users` WHERE `email` = :e LIMIT 1");
            $q->execute([':e' => $email]);
            $existing = $q->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            error_log("record_payment user lookup failed: " . $e->getMessage());
        }
    } else {
        foreach (loadUsersFallbackLocal() as $u) {
            if (strcasecmp($u['email'] ?? '', $email) === 0) { $existing = $u; break; }
        }
    }

    if ($existing !== null) {
        $accountExisted = true;
    } else {
        $registerId = "RNX-2026-" . rand(100000, 999999);
        $orderRef   = "ORD-" . strtoupper(substr(uniqid(), 8, 5)) . "-" . time();
        // Same credential rule as register.php: the password is the phone number.
        $hashed = password_hash($phone, PASSWORD_DEFAULT);

        if ($pdo !== null) {
            try {
                $pdo->beginTransaction();
                $pdo->prepare(
                    "INSERT INTO `registrations` (`register_id`,`full_name`,`email`,`phone`,`address`,
                        `bank_name`,`account_number`,`ifsc_code`,`referred_by`,`timestamp`)
                     VALUES (:r,:n,:e,:p,'','','','','',:t)"
                )->execute([':r'=>$registerId, ':n'=>$name, ':e'=>$email, ':p'=>$phone, ':t'=>$timestamp]);

                $pdo->prepare(
                    "INSERT INTO `users` (`email`,`password`,`name`,`phone`,`address`,
                        `bank_name`,`account_number`,`ifsc_code`,`referred_by`,`timestamp`)
                     VALUES (:e,:pw,:n,:p,'','','','','',:t)"
                )->execute([':e'=>$email, ':pw'=>$hashed, ':n'=>$name, ':p'=>$phone, ':t'=>$timestamp]);

                $pdo->prepare(
                    "INSERT INTO `orders` (`order_id`,`customer_name`,`customer_phone`,`customer_email`,
                        `customer_address`,`product_id`,`product_name`,`product_price`,`payment_screenshot`,`timestamp`)
                     VALUES (:o,:n,:p,:e,'','prod-core-x','Nexus-Core Model-X Hardware + Onboarding Bundle',:amt,:pay,:t)"
                )->execute([':o'=>$orderRef, ':n'=>$name, ':p'=>$phone, ':e'=>$email,
                            ':amt'=>'₹'.$amount, ':pay'=>$paymentId, ':t'=>$timestamp]);

                $pdo->prepare("UPDATE `payments` SET `register_id` = :r WHERE `payment_id` = :p")
                    ->execute([':r'=>$registerId, ':p'=>$paymentId]);

                $pdo->commit();
                $accountCreated = true;
            } catch (PDOException $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                error_log("record_payment account creation failed: " . $e->getMessage());
            }
        }

        if (!$accountCreated) {
            // JSON fallback
            $uf = __DIR__ . '/users.json';
            $users = file_exists($uf) ? json_decode(file_get_contents($uf), true) : [];
            if (!is_array($users)) $users = [];
            $users[] = ['email'=>$email, 'password'=>$hashed, 'name'=>$name, 'phone'=>$phone,
                        'address'=>'', 'bankName'=>'', 'accountNumber'=>'', 'ifscCode'=>'',
                        'referredBy'=>'', 'timestamp'=>$timestamp];
            file_put_contents($uf, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX);

            $rf = __DIR__ . '/registrations.json';
            $regs = file_exists($rf) ? json_decode(file_get_contents($rf), true) : [];
            if (!is_array($regs)) $regs = [];
            $regs[] = ['registerId'=>$registerId, 'fullName'=>$name, 'email'=>$email, 'phone'=>$phone,
                       'address'=>'', 'bankName'=>'', 'accountNumber'=>'', 'ifscCode'=>'',
                       'referredBy'=>'', 'timestamp'=>$timestamp];
            file_put_contents($rf, json_encode($regs, JSON_PRETTY_PRINT), LOCK_EX);
            $accountCreated = true;
        }

        // Send the credentials so the customer can actually get in.
        if ($accountCreated) {
            @include_once __DIR__ . '/mail.php';
            if (function_exists('sendMail')) {
                $body = "<h2>Your RoboNexus account is ready</h2>
                    <p>Hi " . htmlspecialchars($name) . ", we received your payment of ₹"
                    . htmlspecialchars($amount) . ".</p>
                    <ul>
                        <li><strong>Worker ID:</strong> " . htmlspecialchars($registerId) . "</li>
                        <li><strong>Username:</strong> " . htmlspecialchars($email) . "</li>
                        <li><strong>Password:</strong> " . htmlspecialchars($phone) . "</li>
                    </ul>
                    <p>Please sign in and change your password.</p>";
                @sendMail($email, "RoboNexus: Your account credentials", $body, true);
            }
        }
    }
}

http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => $duplicate ? "Payment already recorded." : "Payment recorded.",
    "duplicate" => $duplicate,
    "accountCreated" => $accountCreated,
    "accountExisted" => $accountExisted,
    "registerId" => $registerId,
]);
