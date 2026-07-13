<?php
// login.php - API for contractor login authentication

// 1. Enable CORS for frontend requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';

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
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Both email address and password are required to login."
    ]);
    exit();
}

$user = null;

// 5. Query user from Database
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `email` = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $dbUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($dbUser) {
            $user = [
                "email" => $dbUser['email'],
                "password" => $dbUser['password'],
                "name" => $dbUser['name'],
                "phone" => $dbUser['phone'],
                "address" => $dbUser['address'],
                "bankName" => $dbUser['bank_name'],
                "accountNumber" => $dbUser['account_number'],
                "ifscCode" => $dbUser['ifsc_code']
            ];
        }
    } catch (PDOException $e) {
        error_log("Login DB error: " . $e->getMessage());
    }
}

// 6. JSON Fallback query
if ($user === null) {
    $usersFile = './users.json';
    if (file_exists($usersFile)) {
        $usersData = json_decode(file_get_contents($usersFile), true);
        if (is_array($usersData)) {
            foreach ($usersData as $u) {
                if (strcasecmp($u['email'], $email) === 0) {
                    $user = $u;
                    break;
                }
            }
        }
    }
}

// 7. Verify credentials
if ($user === null || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid email address or security passkey."
    ]);
    exit();
}

// 8. Return success response
http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => "Access authentication granted.",
    "user" => [
        "name" => $user['name'],
        "email" => $user['email'],
        "phone" => $user['phone'],
        "address" => $user['address'],
        "bankName" => $user['bankName'],
        "accountNumber" => $user['accountNumber'],
        "ifscCode" => $user['ifscCode']
    ]
]);
