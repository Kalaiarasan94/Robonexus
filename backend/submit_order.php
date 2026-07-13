<?php
// submit_order.php - PHP Backend API for Order Checkouts

// 1. Enable CORS for local Next.js frontend (e.g., http://localhost:3000) and other origins
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';

// 2. Handle OPTIONS preflight requests immediately
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
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$productId = isset($_POST['productId']) ? trim($_POST['productId']) : '';
$productName = isset($_POST['productName']) ? trim($_POST['productName']) : '';
$productPrice = isset($_POST['productPrice']) ? trim($_POST['productPrice']) : '';

if (empty($name) || empty($phone) || empty($address) || empty($productId) || empty($productName) || empty($productPrice)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Missing required fields. Please provide name, phone, address, productId, productName, and productPrice."
    ]);
    exit();
}

// 5. Generate order ID
$orderId = "ORD-" . strtoupper(substr(uniqid(), 8, 5)) . "-" . time();
$dest_path = ''; // Screenshot uploader removed

// 7. Store the order to Database if connected, and fallback to JSON
$savedToDb = false;
$timestamp = date("Y-m-d H:i:s");
if ($pdo !== null) {
    try {
        $stmt = $pdo->prepare("INSERT INTO `orders` (`order_id`, `customer_name`, `customer_phone`, `customer_address`, `product_id`, `product_name`, `product_price`, `payment_screenshot`, `timestamp`) VALUES (:order_id, :customer_name, :customer_phone, :customer_address, :product_id, :product_name, :product_price, :payment_screenshot, :timestamp)");
        $stmt->execute([
            ':order_id' => $orderId,
            ':customer_name' => $name,
            ':customer_phone' => $phone,
            ':customer_address' => $address,
            ':product_id' => $productId,
            ':product_name' => $productName,
            ':product_price' => $productPrice,
            ':payment_screenshot' => $dest_path,
            ':timestamp' => $timestamp
        ]);
        $savedToDb = true;
    } catch (PDOException $e) {
        error_log("Failed to insert order into DB: " . $e->getMessage());
    }
}

// Parallel save to orders.json file
$ordersFile = './orders.json';
$orders = [];

if (file_exists($ordersFile)) {
    $currentData = file_get_contents($ordersFile);
    $orders = json_decode($currentData, true);
    if (!is_array($orders)) {
        $orders = [];
    }
}

$newOrder = [
    "orderId" => $orderId,
    "timestamp" => $timestamp,
    "customer" => [
        "name" => $name,
        "phone" => $phone,
        "address" => $address
    ],
    "product" => [
        "id" => $productId,
        "name" => $productName,
        "price" => $productPrice
    ],
    "paymentScreenshot" => $dest_path
];

$orders[] = $newOrder;

$jsonWriteSuccess = file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT)) !== false;

if (!$savedToDb && !$jsonWriteSuccess) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to write order data to database and JSON storage."
    ]);
    exit();
}

// 8. Return success response
http_response_code(201);
echo json_encode([
    "status" => "success",
    "message" => "Order placed successfully!",
    "orderId" => $orderId,
    "order" => $newOrder
]);
