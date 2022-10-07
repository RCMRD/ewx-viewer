<?php

header("Content-type: application/json");

if (!array_key_exists('servlet_endpoint', $_GET)) {
    print (json_encode(array('error' => "missing servlet_endpoint parameter")));
    exit;
}
if (!array_key_exists('data_path', $_GET)) {
    print (json_encode(array('error' => "missing data_path parameter")));
    exit;
}
/*if (!array_key_exists('callback', $_GET)) {
    print (json_encode(array('error' => "missing callback parameter")));
    exit;
}*/

$servlet_endpoint = $_GET['servlet_endpoint'];
$data_path = $_GET['data_path'];
$callback = null;
if (array_key_exists('callback', $_GET)) {
    $callback = $_GET['callback'];
}

$json;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $servlet_endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
curl_setopt($ch, CURLOPT_HTTPHEADER, array('X_FORWARDED_FOR:'.$_SERVER['REMOTE_ADDR']));

try {
    $json = curl_exec($ch);
} catch (Exception $e) {
    $errorLog = fopen('./normalizeSnowProxy.log', 'a+');
    fwrite($errorLog, $e->getMessage()."\r\n");
    fclose($errorLog);
}

if ($json !== null) {
	$data = json_decode($json);
	if (array_key_exists('message', $data)) {
		print $json;
	} else {
		$data = normalize($data, explode('.', $data_path));
		if ($callback !== null) {
			print "$callback(".json_encode($data).")";
		} else {
			print json_encode($data);
		}
	}
} else {
    print (json_encode(array('message' => 'No data')));
}

function normalize($data, $dataPath) {
    if (count($dataPath) === 0) {
        foreach ($data as $year => $values) {
            foreach ($values as $value) {
                $value->y *= .001;
            }
        }
    } else {
        $property = array_shift($dataPath);
        $data->$property = normalize($data->$property, $dataPath);
    }
    return $data;
}

?>