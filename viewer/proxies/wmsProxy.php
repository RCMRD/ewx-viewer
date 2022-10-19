<?php

//header('Access-Control-Allow-Origin:*');
header('Content-Type:text/xml');

$url = '';
$request = '';
$service = '';
$wmtver = '';

$xForwardedFor = '';
$queryString = filter_var($_SERVER['QUERY_STRING'], FILTER_SANITIZE_STRING);

if (array_key_exists('HTTP_X_FORWARDED_FOR', $_SERVER)) {
    $xForwardedFor = "\r\nHTTP_X_FORWARDED_FOR: " . $_SERVER['HTTP_X_FORWARDED_FOR'];
}

$_GETKeyLower = array_change_key_case($_GET, CASE_LOWER);
$getCapabilitiesURL = "";

if (!array_key_exists('url', $_GETKeyLower)) {
    die('<error>No url parameter.</error>');
} else {
    if (!filter_var($_GETKeyLower['url'], FILTER_VALIDATE_URL) === false) {
		foreach ($_GET as $key => $value) {
			$getCapabilitiesURL .= "$key=$value&";
		}
		$getCapabilitiesURL = rtrim(ltrim( substr($getCapabilitiesURL, 4, strlen($getCapabilitiesURL))), "&");

    } else {
        die('<error>Invalid parameter [url].</error>');
    }
}

$getCapabilitiesURLQuery = explode("&", parse_url($getCapabilitiesURL, PHP_URL_QUERY));

$validGetCapabilitiesQueries = array("wmtver=1.0.0&request=capabilities", "service=wms&request=getcapabilities");

$found = array(false, "");
foreach ($validGetCapabilitiesQueries as $key => $validKVP) {
	foreach ($getCapabilitiesURLQuery as $index => $keyValuePair) {
		if (stristr($validKVP, $keyValuePair)) {
			$validKVP = str_replace(strtolower($keyValuePair), "", $validKVP);
			$found = array(false, $validKVP);
		}
	}
	
	$validGetCapabilitiesQueries[$key] = $validKVP;
	if ($validGetCapabilitiesQueries[$key] == "&") {
		$found[0] = true;
		break;
	} 
}


if ($found[0] == false) {
	
	if ($found[1]) {
		die('<error>Incorrectly submitted or Missing Parameter(s). Check the WMS spec corresponding to your version.</error>');
	} else {
		die('<error>Bad Request.</error>');
	}
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $getCapabilitiesURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
//curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
//curl_setopt($ch, CURLOPT_SSLVERSION, 1.2);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('X_FORWARDED_FOR:'.$_SERVER['REMOTE_ADDR']));
$data = curl_exec($ch);

print $data;

?>
