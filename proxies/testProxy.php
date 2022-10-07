<?php

$url = $_GET['url'];
$callback = null;
if (array_key_exists('callback', $_GET)) {
    $callback = $_GET['callback'];
}
//$url = "http://data.rcmrd.org:8910/rest/timeseries/version/2.0/vector_dataset/africa:g2008_1/raster_dataset/chirps/region/africa/periodicity/1-month/statistic/data/zone/South%20Sudan%2BWestern%20Bahr%20el%20Ghazal/seasons/1981%2C1982%2C1983%2C1984%2C1985%2C1986%2C1987%2C1988%2C1989%2C1990%2C1991%2C1992%2C1993%2C1994%2C1995%2C1996%2C1997%2C1998%2C1999%2C2000%2C2001%2C2002%2C2003%2C2004%2C2005%2C2006%2C2007%2C2008%2C2009%2C2010%2C2011%2C2012%2C2013%2C2014%2C2015%2C2016%2C2017%2C2018%2C/calculation_type/mean";

$json = null;
$ch = curl_init();
$url = str_replace(',', '%2C', $url);
$url = str_replace(' ', '%20', $url);
$url = str_replace('+', '%2B', $url);

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

try {
    $json = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);
} catch (Exception $e) {
	echo $e->getMessage();
}

if ($json !== null) {
    if ($callback !== null) {
        print "$callback(".$json.")";
    } else {
        print $json;
    }
} else {
    print (json_encode(array('message' => 'No data')));
}


?>