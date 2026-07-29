<?php
// request_withdrawal.php - Contractor raises a payout request against their wallet.
//
// The amount is re-checked against the wallet balance computed server-side, so a
// tampered request cannot withdraw more than has actually been earned.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/referral.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed. Only POST is supported."]);
    exit();
}

$email         = isset($_POST['email']) ? trim($_POST['email']) : '';
$amount        = isset($_POST['amount']) ? (float) $_POST['amount'] : 0.0;
$accountHolder = isset($_POST['accountHolder']) ? trim($_POST['accountHolder']) : '';
$bankName      = isset($_POST['bankName']) ? trim($_POST['bankName']) : '';
$accountNumber = isset($_POST['accountNumber']) ? trim($_POST['accountNumber']) : '';
$ifscCode      = isset($_POST['ifscCode']) ? trim($_POST['ifscCode']) : '';

if ($email === '' || $accountHolder === '' || $bankName === '' || $accountNumber === '' || $ifscCode === '') {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Account holder name, bank name, account number and IFSC code are all required."
    ]);
    exit();
}

// Resolve the account so we can compute their real balance.
$user = null;
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("SELECT `name`, `email`, `phone` FROM `users` WHERE `email` = :e LIMIT 1");
        $stmt->execute([':e' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) $user = $row;
    } catch (PDOException $e) {
        error_log("Withdrawal user lookup failed: " . $e->getMessage());
    }
}
if ($user === null) {
    foreach (loadUsersFallback() as $u) {
        if (strcasecmp($u['email'] ?? '', $email) === 0) {
            $user = ['name' => $u['name'] ?? '', 'email' => $u['email'], 'phone' => $u['phone'] ?? ''];
            break;
        }
    }
}

if ($user === null) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "No account found for that email address."]);
    exit();
}

$wallet = getWalletSummary($pdo, $user['email'], $user['phone']);

if ($amount < MIN_WITHDRAWAL) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "The minimum withdrawal is ₹" . number_format(MIN_WITHDRAWAL, 2) . "."
    ]);
    exit();
}

// Authoritative check — never trust the amount the client thinks it has.
if ($amount > $wallet['available']) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "You can withdraw at most ₹" . number_format($wallet['available'], 2)
            . ". Requests already awaiting payout are excluded from this figure."
    ]);
    exit();
}

$now = date('Y-m-d H:i:s');
$saved = false;

if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO `withdrawals`
             (`user_email`, `user_name`, `amount`, `account_holder`, `bank_name`, `account_number`, `ifsc_code`, `status`, `admin_note`, `requested_at`)
             VALUES (:email, :name, :amount, :holder, :bank, :acct, :ifsc, 'pending', '', :ts)"
        );
        $stmt->execute([
            ':email' => $user['email'], ':name' => $user['name'], ':amount' => $amount,
            ':holder' => $accountHolder, ':bank' => $bankName, ':acct' => $accountNumber,
            ':ifsc' => $ifscCode, ':ts' => $now,
        ]);
        $saved = true;
    } catch (PDOException $e) {
        error_log("Withdrawal insert failed: " . $e->getMessage());
    }
}

// JSON fallback store
$f = __DIR__ . '/withdrawals.json';
$existing = [];
if (file_exists($f)) {
    $d = json_decode(file_get_contents($f), true);
    if (is_array($d)) $existing = $d;
}
$existing[] = [
    'id' => count($existing) + 1,
    'userEmail' => $user['email'],
    'userName' => $user['name'],
    'amount' => $amount,
    'accountHolder' => $accountHolder,
    'bankName' => $bankName,
    'accountNumber' => $accountNumber,
    'ifscCode' => $ifscCode,
    'status' => 'pending',
    'adminNote' => '',
    'requestedAt' => $now,
    'processedAt' => null,
];
if (file_put_contents($f, json_encode($existing, JSON_PRETTY_PRINT), LOCK_EX) !== false) {
    $saved = true;
}

if (!$saved) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Could not record your withdrawal request. Please try again."]);
    exit();
}

http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => "Withdrawal request submitted. Our team will transfer ₹" . number_format($amount, 2) . " to your account.",
    "amount" => $amount
]);
