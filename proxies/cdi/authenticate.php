<?php 

require_once("./settings.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!array_key_exists('email', $_POST) || !array_key_exists('password', $_POST)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "email and password fields required."
        ));
    }
    $email = urldecode($_POST['email']);
    $password = sha1(urldecode($_POST['password']));
} /*else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!array_key_exists('email', $_GET) || !array_key_exists('password', $_GET)) {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "email and password fields required."
        ));
    }
    $email = urldecode($_GET['email']);
    $password = urldecode($_GET['password']);
} */else {
    print json_encode(array(
        'success' => false,
        'errorMessage' => "Only POST requests are accepted."
    ));
}

try {
    $mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    $stmt = $mysqli->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND password = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $stmt->bind_result($numRows);
    $stmt->fetch();
    
    if ((int)$numRows > 0) {
        print json_encode(array(
            'success' => true
        ));
    } else {
        print json_encode(array(
            'success' => false,
            'errorMessage' => "Invalid login credentials."
        ));
    }
} catch (PDOException $e) {
    print json_encode(array(
        'success' => false,
        'errorMessage' => "An error occured while attempting to authenticate. Please try again later"
    ));
}

?>