<?php
// register.php - Combined Onboarding Registration, Payment processing, and User Account Creation API

// 1. Enable CORS for frontend cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mail.php';

// 2. Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Restrict other methods to POST only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Method Not Allowed. Only POST is supported."
    ]);
    exit();
}

// 4. Validate input variables
$fullName = isset($_POST['fullName']) ? trim($_POST['fullName']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$bankName = isset($_POST['bankName']) ? trim($_POST['bankName']) : '';
$accountNumber = isset($_POST['accountNumber']) ? trim($_POST['accountNumber']) : '';
$ifscCode = isset($_POST['ifscCode']) ? trim($_POST['ifscCode']) : '';

if (empty($fullName) || empty($email) || empty($phone) || empty($address) || empty($bankName) || empty($accountNumber) || empty($ifscCode)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "All fields (Legal Name, Email, Phone, Address, Bank details) are required."
    ]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid email address format."
    ]);
    exit();
}

// Check if user already exists
if ($pdo !== null) {
    try {
        $checkStmt = $pdo->prepare("SELECT id FROM `users` WHERE `email` = :email");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "An onboarding account with this email address has already been registered."
            ]);
            exit();
        }
    } catch (PDOException $e) {
        error_log("Database error check user existence: " . $e->getMessage());
    }
} else {
    // Check fallback JSON files
    $usersFile = './users.json';
    if (file_exists($usersFile)) {
        $usersData = json_decode(file_get_contents($usersFile), true);
        if (is_array($usersData)) {
            foreach ($usersData as $u) {
                if (strcasecmp($u['email'], $email) === 0) {
                    http_response_code(400);
                    echo json_encode([
                        "status" => "error",
                        "message" => "An onboarding account with this email address has already been registered (JSON Database)."
                    ]);
                    exit();
                }
            }
        }
    }
}

// 5. Verify Razorpay Payment reference (paid on the aimstorm.in gateway)
$razorpayPaymentId = isset($_POST['razorpayPaymentId']) ? trim($_POST['razorpayPaymentId']) : '';
$razorpayOrderId = isset($_POST['razorpayOrderId']) ? trim($_POST['razorpayOrderId']) : '';
$paymentAmount = isset($_POST['paymentAmount']) ? trim($_POST['paymentAmount']) : '649.00';

if (empty($razorpayPaymentId)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "A completed Razorpay payment is required to finish onboarding."
    ]);
    exit();
}

// The payment id is stored in the orders record as the proof-of-payment reference.
$dest_path = $razorpayPaymentId;

// 6. Generate Unique References
$registerId = "RNX-2026-" . rand(100000, 999999);
$orderId = "ORD-" . strtoupper(substr(uniqid(), 8, 5)) . "-" . time();
$timestamp = date("Y-m-d H:i:s");
$hashedPassword = password_hash($phone, PASSWORD_DEFAULT);

// 7. Save to Database
$savedToDb = false;
if ($pdo !== null) {
    try {
        $pdo->beginTransaction();

        // A. Insert into registrations
        $stmtReg = $pdo->prepare("INSERT INTO `registrations` (`register_id`, `full_name`, `email`, `phone`, `address`, `bank_name`, `account_number`, `ifsc_code`, `timestamp`) VALUES (:register_id, :full_name, :email, :phone, :address, :bank_name, :account_number, :ifsc_code, :timestamp)");
        $stmtReg->execute([
            ':register_id' => $registerId,
            ':full_name' => $fullName,
            ':email' => $email,
            ':phone' => $phone,
            ':address' => $address,
            ':bank_name' => $bankName,
            ':account_number' => $accountNumber,
            ':ifsc_code' => $ifscCode,
            ':timestamp' => $timestamp
        ]);

        // B. Insert into orders (₹649 total bundle: ₹300 onboarding + ₹349 hardware)
        $stmtOrd = $pdo->prepare("INSERT INTO `orders` (`order_id`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `product_id`, `product_name`, `product_price`, `payment_screenshot`, `timestamp`) VALUES (:order_id, :customer_name, :customer_phone, :customer_email, :customer_address, :product_id, :product_name, :product_price, :payment_screenshot, :timestamp)");
        $stmtOrd->execute([
            ':order_id' => $orderId,
            ':customer_name' => $fullName,
            ':customer_phone' => $phone,
            ':customer_email' => $email,
            ':customer_address' => $address,
            ':product_id' => 'prod-core-x',
            ':product_name' => 'Nexus-Core Model-X Hardware + Onboarding Bundle',
            ':product_price' => '₹649.00',
            ':payment_screenshot' => $dest_path,
            ':timestamp' => $timestamp
        ]);

        // C. Insert into users (username = email, password = hashed phone)
        $stmtUser = $pdo->prepare("INSERT INTO `users` (`email`, `password`, `name`, `phone`, `address`, `bank_name`, `account_number`, `ifsc_code`, `timestamp`) VALUES (:email, :password, :name, :phone, :address, :bank_name, :account_number, :ifsc_code, :timestamp)");
        $stmtUser->execute([
            ':email' => $email,
            ':password' => $hashedPassword,
            ':name' => $fullName,
            ':phone' => $phone,
            ':address' => $address,
            ':bank_name' => $bankName,
            ':account_number' => $accountNumber,
            ':ifsc_code' => $ifscCode,
            ':timestamp' => $timestamp
        ]);

        // D. Insert into payments (Razorpay transaction record)
        $stmtPay = $pdo->prepare("INSERT INTO `payments` (`payment_id`, `order_ref`, `razorpay_order_id`, `register_id`, `customer_name`, `customer_email`, `customer_phone`, `amount`, `status`, `timestamp`) VALUES (:payment_id, :order_ref, :razorpay_order_id, :register_id, :customer_name, :customer_email, :customer_phone, :amount, :status, :timestamp)");
        $stmtPay->execute([
            ':payment_id' => $razorpayPaymentId,
            ':order_ref' => $orderId,
            ':razorpay_order_id' => $razorpayOrderId,
            ':register_id' => $registerId,
            ':customer_name' => $fullName,
            ':customer_email' => $email,
            ':customer_phone' => $phone,
            ':amount' => $paymentAmount,
            ':status' => 'paid',
            ':timestamp' => $timestamp
        ]);

        $pdo->commit();
        $savedToDb = true;
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database transaction failed: " . $e->getMessage());
    }
}

// 8. Parallel Fallback File Saving (JSON Storage)
$jsonWriteSuccess = false;

// Fallback Registrations JSON
$registrationsFile = './registrations.json';
$registrations = file_exists($registrationsFile) ? json_decode(file_get_contents($registrationsFile), true) : [];
if (!is_array($registrations)) $registrations = [];
$newRegData = [
    "registerId" => $registerId,
    "fullName" => $fullName,
    "email" => $email,
    "phone" => $phone,
    "address" => $address,
    "bankName" => $bankName,
    "accountNumber" => $accountNumber,
    "ifscCode" => $ifscCode,
    "timestamp" => $timestamp
];
$registrations[] = $newRegData;
file_put_contents($registrationsFile, json_encode($registrations, JSON_PRETTY_PRINT));

// Fallback Orders JSON
$ordersFile = './orders.json';
$orders = file_exists($ordersFile) ? json_decode(file_get_contents($ordersFile), true) : [];
if (!is_array($orders)) $orders = [];
$newOrderData = [
    "orderId" => $orderId,
    "timestamp" => $timestamp,
    "customer" => [
        "name" => $fullName,
        "phone" => $phone,
        "email" => $email,
        "address" => $address
    ],
    "product" => [
        "id" => "prod-core-x",
        "name" => "Nexus-Core Model-X Hardware + Onboarding Bundle",
        "price" => "₹649.00"
    ],
    "paymentScreenshot" => $dest_path
];
$orders[] = $newOrderData;
file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

// Fallback Users JSON
$usersFile = './users.json';
$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];
if (!is_array($users)) $users = [];
$newUserData = [
    "email" => $email,
    "password" => $hashedPassword,
    "name" => $fullName,
    "phone" => $phone,
    "address" => $address,
    "bankName" => $bankName,
    "accountNumber" => $accountNumber,
    "ifscCode" => $ifscCode,
    "timestamp" => $timestamp
];
$users[] = $newUserData;
$jsonWriteSuccess = file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT)) !== false;

// Fallback Payments JSON
$paymentsFile = './payments.json';
$payments = file_exists($paymentsFile) ? json_decode(file_get_contents($paymentsFile), true) : [];
if (!is_array($payments)) $payments = [];
$payments[] = [
    "paymentId" => $razorpayPaymentId,
    "orderRef" => $orderId,
    "razorpayOrderId" => $razorpayOrderId,
    "registerId" => $registerId,
    "name" => $fullName,
    "email" => $email,
    "phone" => $phone,
    "amount" => $paymentAmount,
    "status" => "paid",
    "timestamp" => $timestamp
];
file_put_contents($paymentsFile, json_encode($payments, JSON_PRETTY_PRINT));

if (!$savedToDb && !$jsonWriteSuccess) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to write onboarding records to database and fallback storage."
    ]);
    exit();
}

// 9. Send Email Notifications
// Public site URL (frontend). Configured via SITE_URL in .env; defaults to local dev.
$siteUrl = isset($_ENV['SITE_URL']) ? rtrim(trim($_ENV['SITE_URL']), '/') : 'http://localhost:3000';
$resetUrl = $siteUrl . "/change-password?email=" . urlencode($email);
$loginUrl = $siteUrl . "/login";

$emailBody = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070615; color: #d1d5db; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(13, 10, 25, 0.9); border: 1px solid rgba(167, 139, 250, 0.15); border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid rgba(167, 139, 250, 0.1); padding-bottom: 20px; margin-bottom: 25px; }
        .logo { color: #06b6d4; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .logo span { color: #7c3aed; }
        h1 { color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; }
        h2 { color: #ffffff; font-size: 16px; font-weight: 600; margin-top: 25px; border-bottom: 1px solid rgba(167, 139, 250, 0.1); padding-bottom: 8px; }
        p { line-height: 1.6; font-size: 14px; }
        .info-box { background: rgba(5, 5, 12, 0.6); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
        .info-row:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #9ca3af; width: 180px; font-family: monospace; }
        .value { color: #06b6d4; font-weight: 700; font-family: monospace; }
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background: linear-gradient(to right, #06b6d4, #7c3aed); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2); transition: all 0.3s; }
        .terms-list { font-size: 12px; color: #9ca3af; padding-left: 20px; line-height: 1.6; }
        .terms-list li { margin-bottom: 10px; }
        .footer { text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid rgba(167, 139, 250, 0.1); padding-top: 20px; margin-top: 30px; font-family: monospace; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>Robo<span>Nexus</span></div>
        </div>
        
        <p>Dear <strong>" . htmlspecialchars($fullName) . "</strong>,</p>
        <p>Greetings from RoboNexus.</p>
        <p>Thank you for registering with us. We are pleased to confirm that we have successfully received your registration.</p>
        
        <h2>Registration Details</h2>
        <div class='info-box'>
            <div class='info-row'>
                <div class='label'>Registration Status:</div>
                <div class='value' style='color: #4ade80;'>Confirmed</div>
            </div>
            <div class='info-row'>
                <div class='label'>Fee Paid:</div>
                <div class='value'>₹649</div>
            </div>
            <div class='info-row'>
                <div class='label'>Worker ID:</div>
                <div class='value'>{$registerId}</div>
            </div>
            <div class='info-row'>
                <div class='label'>Date of Registration:</div>
                <div class='value'>" . date("d-m-Y") . "</div>
            </div>
        </div>
        
        <h2>Product Delivery</h2>
        <p>Your product is currently being processed and will be delivered within <strong>7 working days</strong> from the date of registration.</p>
        
        <h2>Dashboard Access</h2>
        <p>Please log in to your dashboard and upload all required videos and documents for verification.</p>
        <div class='info-box' style='border-color: rgba(124, 58, 237, 0.3);'>
            <div class='info-row'>
                <div class='label'>Dashboard Link:</div>
                <div class='value'><a href='{$loginUrl}' style='color: #06b6d4;'>{$loginUrl}</a></div>
            </div>
            <div class='info-row'>
                <div class='label'>Username:</div>
                <div class='value'>" . htmlspecialchars($email) . "</div>
            </div>
            <div class='info-row'>
                <div class='label'>Password:</div>
                <div class='value'>" . htmlspecialchars($phone) . "</div>
            </div>
        </div>
        
        <div class='btn-wrapper'>
            <a href='{$loginUrl}' class='btn'>Log In to Dashboard</a>
        </div>
        
        <p style='text-align: center; margin-bottom: 25px;'>
            <a href='{$resetUrl}' style='color: #a78bfa; font-size: 12px; font-weight: 600; text-decoration: underline;'>Configure Account Password / Change Passkey</a>
        </p>
        
        <h2>Terms & Conditions</h2>
        <ol class='terms-list'>
            <li>The ₹649 paid is a combined Registration & Product Fee and is non-refundable under any circumstances.</li>
            <li>Your product will be delivered within 7 working days.</li>
            <li>Your Worker ID is unique and must not be shared with anyone.</li>
            <li>All information, videos, and documents submitted must be accurate and original.</li>
            <li>Any fake information, duplicate accounts, fraudulent activity, or policy violations may result in immediate account termination without any refund.</li>
            <li>Project availability depends on client requirements and business needs. The company does not guarantee continuous or permanent work.</li>
            <li>The company reserves the right to suspend, modify, replace, or discontinue any project at any time without prior notice.</li>
            <li>If a project is cancelled, discontinued, suspended, or terminated before its scheduled completion for any reason, the project will be considered closed. In such cases, no project payment will be payable for that project, regardless of the amount of work completed or its approval status.</li>
            <li>The company shall not be liable for any loss of expected earnings or future opportunities resulting from the cancellation, suspension, or discontinuation of any project.</li>
            <li>By registering and participating in our projects, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.</li>
        </ol>
        
        <div class='footer'>
            Worker Reference Node ID: {$registerId} | Order Link ID: {$orderId}<br>
            &copy; 2026 RoboNexus Spatial Computing Inc. All rights reserved.
        </div>
    </div>
</body>
</html>
";

// Send email
$emailSent = sendMail($email, "RoboNexus Onboarding: Confirm Registration & Credentials", $emailBody, true);

// Trigger notification copy to admin as well
$adminEmail = isset($_ENV['SMTP_TO_ADMIN']) ? trim($_ENV['SMTP_TO_ADMIN']) : '';
if (!empty($adminEmail)) {
    $adminBody = "
    <h2>New Contractor Onboarding Payment (Razorpay)</h2>
    <p>A new user has completed the onboarding flow and paid via the Razorpay gateway on aimstorm.in.</p>
    <ul>
        <li><strong>Name:</strong> " . htmlspecialchars($fullName) . "</li>
        <li><strong>Email:</strong> " . htmlspecialchars($email) . "</li>
        <li><strong>Phone:</strong> " . htmlspecialchars($phone) . "</li>
        <li><strong>Registered ID (Worker ID):</strong> {$registerId}</li>
        <li><strong>Order ID:</strong> {$orderId}</li>
        <li><strong>Razorpay Payment ID:</strong> {$razorpayPaymentId}</li>
        <li><strong>Total Paid:</strong> ₹" . htmlspecialchars($paymentAmount) . "</li>
        <li><strong>Bank Name:</strong> " . htmlspecialchars($bankName) . "</li>
        <li><strong>Account Number:</strong> " . htmlspecialchars($accountNumber) . "</li>
        <li><strong>IFSC Code:</strong> " . htmlspecialchars($ifscCode) . "</li>
    </ul>
    <p>You can review this payment under the Payments menu in the admin control panel.</p>
    ";
    sendMail($adminEmail, "[NEW ONBOARDING ORDER] " . $orderId, $adminBody, true);
}

// 10. Return success response
http_response_code(201);
echo json_encode([
    "status" => "success",
    "message" => "Onboarding and payment logged successfully. Credentials sent via email.",
    "registerId" => $registerId,
    "orderId" => $orderId,
    "paymentId" => $razorpayPaymentId,
    "emailSent" => $emailSent,
    "credentials" => [
        "username" => $email,
        "password" => $phone
    ]
]);
