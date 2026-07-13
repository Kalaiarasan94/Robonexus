<?php
// submit_contact.php - PHP API to process and save contact form inquiries

// 1. Enable CORS for frontend cross-origin requests
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
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "All fields (Name, Email, Subject, Message) are required."
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

$timestamp = date("Y-m-d H:i:s");

// 5. Save contact message to Database if connected, and fallback to JSON
$savedToDb = false;
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("INSERT INTO `contacts` (`name`, `email`, `subject`, `message`, `timestamp`) VALUES (:name, :email, :subject, :message, :timestamp)");
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':subject' => $subject,
            ':message' => $message,
            ':timestamp' => $timestamp
        ]);
        $savedToDb = true;
    } catch (PDOException $e) {
        error_log("Failed to insert contact inquiry into DB: " . $e->getMessage());
    }
}

// Parallel save to contacts.json
$contactsFile = './contacts.json';
$contacts = [];

if (file_exists($contactsFile)) {
    $currentData = file_get_contents($contactsFile);
    $contacts = json_decode($currentData, true);
    if (!is_array($contacts)) {
        $contacts = [];
    }
}

$newContact = [
    "name" => $name,
    "email" => $email,
    "subject" => $subject,
    "message" => $message,
    "timestamp" => $timestamp
];

$contacts[] = $newContact;

$jsonWriteSuccess = file_put_contents($contactsFile, json_encode($contacts, JSON_PRETTY_PRINT)) !== false;

if (!$savedToDb && !$jsonWriteSuccess) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to write contact inquiry to database and JSON storage."
    ]);
    exit();
}

// 6. Return success response
http_response_code(201);
echo json_encode([
    "status" => "success",
    "message" => "Message sent successfully!",
    "contact" => $newContact
]);
