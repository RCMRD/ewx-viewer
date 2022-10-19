<?php 
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once("./settings.php");

$email;
$layers;
$categories;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!array_key_exists('email', $_POST) || !array_key_exists('layers', $_POST) || !array_key_exists('categories', $_POST)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "Missing required parameter(s)."
        ));
        exit;
    }
    $email = urldecode($_POST['email']);
    $layers = urldecode($_POST['layers']);
	$categories = urldecode($_POST['categories']);
	
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!array_key_exists('email', $_GET) || !array_key_exists('layers', $_GET)|| !array_key_exists('categories', $_GET)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "Missing required parameter(s)."
        ));
        exit;
    }
    $email = $_GET['email'];
    $layers = $_GET['layers'];
	$categories = $_GET['categories'];
	
}

function generateRandomString($length = 20) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

$batchId = generateRandomString();

try {
    $mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    $stmt = $mysqli->prepare("INSERT INTO queue_downloads (batchID, email, layers, categories) VALUES(?, ?, ?, ?)");
    $stmt->bind_param("ssss", $batchId, $email, $layers, $categories);
    $result = $stmt->execute();
    
    if ($result) {
        print json_encode(array(
            'success' => true
        ));
    } else {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "An error occured while adding to the queue. Please try again later"
        ));
    }
} catch (PDOException $e) {
    print json_encode(array(
        'success' => false,
        'errorMessage' => "An error occured while adding to the queue. Please try again later"
    ));
}

?>