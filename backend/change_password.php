<?php
// change_password.php - API to update/reset password for contractor user accounts

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
$newPassword = isset($_POST['newPassword']) ? trim($_POST['newPassword']) : '';

if (empty($email) || empty($newPassword)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Both email address and the new password are required."
    ]);
    exit();
}

if (strlen($newPassword) < 4) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Password must be at least 4 characters long."
    ]);
    exit();
}

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
$updated = false;

// 5. Update Database
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("UPDATE `users` SET `password` = :password WHERE `email` = :email");
        $stmt->execute([
            ':password' => $hashedPassword,
            ':email' => $email
        ]);
        if ($stmt->rowCount() > 0) {
            $updated = true;
        }
    } catch (PDOException $e) {
        error_log("Password change DB error: " . $e->getMessage());
    }
}

// 6. Update Fallback JSON file
$usersFile = './users.json';
if (file_exists($usersFile)) {
    $usersData = json_decode(file_get_contents($usersFile), true);
    if (is_array($usersData)) {
        $found = false;
        foreach ($usersData as &$u) {
            if (strcasecmp($u['email'], $email) === 0) {
                $u['password'] = $hashedPassword;
                $found = true;
                $updated = true;
                break;
            }
        }
        if ($found) {
            file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        }
    }
}

// 7. Check if change was successful
if (!$updated) {
    // If the database row wasn't modified because the password was already the same, it rowCount is 0,
    // but the user exists. Let's make sure the user exists before saying it failed.
    $userExists = false;
    if ($pdo !== null) {
        $check = $pdo->prepare("SELECT id FROM `users` WHERE `email` = :email");
        $check->execute([':email' => $email]);
        if ($check->fetch()) $userExists = true;
    }
    
    if (!$userExists && file_exists($usersFile)) {
        $usersData = json_decode(file_get_contents($usersFile), true);
        if (is_array($usersData)) {
            foreach ($usersData as $u) {
                if (strcasecmp($u['email'], $email) === 0) {
                    $userExists = true;
                    break;
                }
            }
        }
    }

    if (!$userExists) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "No account found matching this email address."
        ]);
        exit();
    }
}

// 8. Return success response
http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => "Security passkey successfully updated."
]);
