<?php
// upload_video.php - API for contractor telemetry video file uploads

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
$hours = isset($_POST['hours']) ? (float)$_POST['hours'] : 0.0;
$userMessage = isset($_POST['userMessage']) ? trim($_POST['userMessage']) : '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "User email parameter is required."
    ]);
    exit();
}

if ($hours <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Please enter a valid positive number of hours worked."
    ]);
    exit();
}

// 5. Handle File Upload and Size Limits
$dest_path = '';
$originalFileName = '';

if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['video']['tmp_name'];
    $originalFileName = $_FILES['video']['name'];
    $fileSize = $_FILES['video']['size'];
    $fileType = $_FILES['video']['type'];
    
    // Size limit check: 500MB (500 * 1024 * 1024 bytes)
    $maxSizeLimit = 500 * 1024 * 1024;
    if ($fileSize > $maxSizeLimit) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "File size exceeds the maximum limit of 500MB. Please compress your video and try again."
        ]);
        exit();
    }
    
    $fileNameCmps = explode(".", $originalFileName);
    $fileExtension = strtolower(end($fileNameCmps));
    
    // Allow standard video and telemetry log formats
    $allowedExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'json'];
    
    if (in_array($fileExtension, $allowedExtensions)) {
        // Create directory if it doesn't exist
        $uploadFileDir = './uploads/telemetry/';
        if (!file_exists($uploadFileDir)) {
            mkdir($uploadFileDir, 0777, true);
        }
        
        // Clean name and make it unique
        $newFileName = 'telemetry_' . time() . '_' . rand(1000, 9999) . '.' . $fileExtension;
        $dest_path = $uploadFileDir . $newFileName;
        
        if (!move_uploaded_file($fileTmpPath, $dest_path)) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "There was an error moving the uploaded telemetry file to destination."
            ]);
            exit();
        }
    } else {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Unsupported file format. Allowed formats: " . implode(', ', $allowedExtensions)
        ]);
        exit();
    }
} else {
    $errCode = isset($_FILES['video']) ? $_FILES['video']['error'] : 'No file uploaded';
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Telemetry file upload is required (Error code: $errCode)."
    ]);
    exit();
}

// 6. Set initial upload data
$durationHours = $hours; // Set hours directly from user input
$earnings = 0.00; // Payments features removed, keep 0.00 in DB
$status = "Pending"; // New submissions are pending admin approval
$adminFeedback = ""; // Empty feedback initially
$timestamp = date("Y-m-d H:i:s");

// 7. Save to Database
$savedToDb = false;
$lastInsertedId = 0;
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("INSERT INTO `user_uploads` (`user_email`, `filename`, `filepath`, `user_message`, `admin_feedback`, `duration_hours`, `earnings`, `status`, `timestamp`) VALUES (:user_email, :filename, :filepath, :user_message, :admin_feedback, :duration_hours, :earnings, :status, :timestamp)");
        $stmt->execute([
            ':user_email' => $email,
            ':filename' => $originalFileName,
            ':filepath' => $dest_path,
            ':user_message' => $userMessage,
            ':admin_feedback' => $adminFeedback,
            ':duration_hours' => $durationHours,
            ':earnings' => $earnings,
            ':status' => $status,
            ':timestamp' => $timestamp
        ]);
        $lastInsertedId = $pdo->lastInsertId();
        $savedToDb = true;
    } catch (PDOException $e) {
        error_log("Failed to save telemetry upload to DB: " . $e->getMessage());
    }
}

// 8. Parallel Save to JSON fallback
$uploadsFile = './user_uploads.json';
$uploads = file_exists($uploadsFile) ? json_decode(file_get_contents($uploadsFile), true) : [];
if (!is_array($uploads)) $uploads = [];

if (!$savedToDb) {
    $lastInsertedId = time() . rand(100, 999);
}

$newUpload = [
    "id" => (int)$lastInsertedId,
    "userEmail" => $email,
    "filename" => $originalFileName,
    "filepath" => $dest_path,
    "userMessage" => $userMessage,
    "adminFeedback" => $adminFeedback,
    "durationHours" => (float)$durationHours,
    "earnings" => (float)$earnings,
    "status" => $status,
    "timestamp" => $timestamp
];
$uploads[] = $newUpload;
$jsonWriteSuccess = file_put_contents($uploadsFile, json_encode($uploads, JSON_PRETTY_PRINT)) !== false;

if (!$savedToDb && !$jsonWriteSuccess) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to save upload telemetry data to database."
    ]);
    exit();
}

// 9. Return success response with analyzed telemetry details
http_response_code(201);
echo json_encode([
    "status" => "success",
    "message" => "Telemetry file uploaded successfully and queued for verification.",
    "telemetry" => $newUpload
]);
