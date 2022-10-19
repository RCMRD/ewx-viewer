<?php 
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once("./settings.php");

$projectIds;
$coordProjection;
$coordinates;
$resolution;
$email;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!array_key_exists('projects', $_POST) || !array_key_exists('projection', $_POST) || !array_key_exists('resolution', $_POST) || 
        !array_key_exists('coordinates', $_POST) || !array_key_exists('email', $_POST) || !array_key_exists('products', $_POST)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "Missing required parameter(s)."
        ));
        exit;
    }
    $projects = urldecode($_POST['projects']);
    $projection = urldecode($_POST['projection']);
    $resolution = urldecode($_POST['resolution']);
    $coordinates = '{"coordinates":'.urldecode($_POST['coordinates']).'}';
    $email = urldecode($_POST['email']);
    $products = urldecode($_POST['products']);
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!array_key_exists('projects', $_GET) || !array_key_exists('projection', $_GET) || !array_key_exists('resolution', $_GET) || 
        !array_key_exists('coordinates', $_GET) || !array_key_exists('email', $_GET) || !array_key_exists('products', $_GET)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "Missing required parameter(s)."
        ));
        exit;
    }
    $projects = urldecode($_GET['projects']);
    $projection = urldecode($_GET['projection']);
    $resolution = urldecode($_GET['resolution']);
    $coordinates = '{"coordinates":'.urldecode($_GET['coordinates']).'}';
    $email = urldecode($_GET['email']);
    $products = urldecode($_GET['products']);
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
    $stmt = $mysqli->prepare("INSERT INTO queue_cdi_downloads (batchID, email, coordinates, projection, project, resolution, products) VALUES(?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $batchId, $email, $coordinates, $projection, $projects, $resolution, $products);
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