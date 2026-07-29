<?php
// check_referral.php - Validate a referral code (a contractor's phone number)
// and return the referrer's name so the registration form can confirm it live.
//
// Returns only the name — never the email or any other detail — so this cannot
// be used to harvest contact details by walking phone numbers.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

require_once __DIR__ . '/referral.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$code = isset($_GET['code']) ? trim($_GET['code']) : '';

if (normalisePhone($code) === '') {
    http_response_code(200);
    echo json_encode(["status" => "success", "found" => false, "message" => "Enter a referral ID."]);
    exit();
}

$referrer = findUserByReferralCode($pdo, $code);

http_response_code(200);
if ($referrer === null) {
    echo json_encode([
        "status"  => "success",
        "found"   => false,
        "message" => "No contractor found with that referral ID."
    ]);
} else {
    echo json_encode([
        "status"       => "success",
        "found"        => true,
        "referrerName" => $referrer['name'],
        "message"      => "Referred by " . $referrer['name']
    ]);
}
