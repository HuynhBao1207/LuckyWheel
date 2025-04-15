<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Xử lý request OPTIONS (Preflight request)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'mysql';
$user = 'root';
$password = 'root';
$database = 'lucky_wheel';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Lỗi kết nối database"]));
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["prize"])) {
    $prize = $conn->real_escape_string($data["prize"]);
    $sql = "INSERT INTO spin_results (prize) VALUES ('$prize')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Lưu thành công"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi lưu kết quả"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Dữ liệu không hợp lệ"]);
}

$conn->close();
?>
