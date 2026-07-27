<?php
// update_upload_status.php - Admin API to approve/reject contractor uploads and update hours

// 1. Enable CORS for admin dashboard requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_log.php';

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
$uploadId = isset($_POST['uploadId']) ? (int)$_POST['uploadId'] : 0;
$status = isset($_POST['status']) ? trim($_POST['status']) : '';
$hours = isset($_POST['hours']) ? (float)$_POST['hours'] : -1.0;
$adminFeedback = isset($_POST['adminFeedback']) ? trim($_POST['adminFeedback']) : '';

if ($uploadId <= 0 || empty($status) || $hours < 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid inputs. Provide uploadId, valid status (e.g. Approved, Rejected), and non-negative hours."
    ]);
    exit();
}

$updated = false;

// 5. Update in Database
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("UPDATE `user_uploads` SET `status` = :status, `duration_hours` = :hours, `admin_feedback` = :admin_feedback WHERE `id` = :id");
        $stmt->execute([
            ':status' => $status,
            ':hours' => $hours,
            ':admin_feedback' => $adminFeedback,
            ':id' => $uploadId
        ]);
        $updated = true;
    } catch (PDOException $e) {
        error_log("Failed to update upload status: " . $e->getMessage());
    }
}

// 6. Update in JSON fallback
$uploadsFile = './user_uploads.json';
if (file_exists($uploadsFile)) {
    $uploads = json_decode(file_get_contents($uploadsFile), true);
    if (is_array($uploads)) {
        $found = false;
        foreach ($uploads as &$u) {
            // Match by id or fallback email & timestamp matching if id is missing
            if ((isset($u['id']) && $u['id'] == $uploadId) || (!isset($u['id']) && $pdo === null)) {
                $u['status'] = $status;
                $u['durationHours'] = $hours;
                $u['adminFeedback'] = $adminFeedback;
                $found = true;
                $updated = true;
                break;
            }
        }
        if ($found) {
            file_put_contents($uploadsFile, json_encode($uploads, JSON_PRETTY_PRINT));
        }
    }
}

if (!$updated) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update record in database."
    ]);
    exit();
}

// 7. Record the review in the admin audit trail
logAdminAction(
    $pdo,
    'verify_upload',
    "Telemetry upload #{$uploadId} set to \"{$status}\" at {$hours} hrs."
        . ($adminFeedback !== '' ? " Feedback: \"{$adminFeedback}\"" : ''),
    'admin'
);

// 8. Return success response
http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => "Telemetry upload updated successfully. New hours: $hours. Status: $status."
]);
