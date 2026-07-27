<?php
// get_payment_config.php - Authoritative onboarding price + payment mode.
//
// Read by two callers:
//   1. the RoboNexus /register page, so the UI shows the right figures, and
//   2. aimstorm.in/payment.php, which uses this as the amount it actually
//      charges instead of trusting the amount in its own query string.
//
// Read-only and safe to expose: it returns pricing that is already printed on
// the public registration page. No secrets here.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

require_once __DIR__ . '/settings.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$mode = getPaymentMode($pdo);

http_response_code(200);
echo json_encode([
    "status"        => "success",
    "mode"          => $mode,
    "amount"        => (float) getPaymentAmount($pdo),
    "activationFee" => (float) PAYMENT_ACTIVATION_FEE,
    "hardwareFee"   => (float) PAYMENT_HARDWARE_FEE,
    "liveAmount"    => (float) PAYMENT_AMOUNT_LIVE,
]);
