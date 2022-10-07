<?php

header("Content-type: application/json");

$vector_dataset = $_GET['vector_dataset'];
$raster_dataset = $_GET['raster_dataset'];
$region = $_GET['region'];
$periodicity = $_GET['periodicity'];
$statistic = $_GET['statistic'];
$lat = $_GET['lat'];
$lon = $_GET['lon'];
$seasons = $_GET['seasons'];
$calculation_type = $_GET['calculation_type'];
$meanMedian = '';
if (array_key_exists('mean-median', $_GET)) {
	$meanMedian = '/mean-median/'.$_GET['mean-median'];
}
$servlet_endpoint = $_GET['servlet_endpoint'];
$callback = null;
if (array_key_exists('callback', $_GET)) $callback = $_GET['callback'];

$timeSeriesURL = "$servlet_endpoint/rest/timeseries/version/3.0/vector_dataset/$vector_dataset/raster_dataset/$raster_dataset/region/$region/periodicity/$periodicity/statistic/$statistic/lat/$lat/lon/$lon/seasons/$seasons/calculation_type/$calculation_type$meanMedian";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $timeSeriesURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
curl_setopt($ch, CURLOPT_HTTPHEADER, array('X_FORWARDED_FOR:'.$_SERVER['REMOTE_ADDR']));
$data = curl_exec($ch);
$data = json_decode($data);
if (array_key_exists('message', $data)) {
	print json_encode($data);
} else {
	$data =  normalizeData($data,$raster_dataset);

	if ($callback !== null) {
		print "$callback(".json_format($data). ")";
	} else {
		print json_format($data);
	}
}

/*
https://igskmncnvs220.cr.usgs.gov:8919/rest/timeseries/version/2.0/vector_dataset/fewsafrica:g2008_af_1/raster_dataset/fewsrfe2/region/fewsafrica/periodicity/1-dekad/statistic/data/zone/Democratic%20Republic%20of%20the%20Congo%2BKasai-Oriental/seasons/2000%2C2001%2C2002%2C2003%2C2004%2C2005%2C2006%2C2007%2C2008%2C2009%2C2010%2C2011%2C2012%2C2013%2C2014%2C2015%2C2016%2C2017%2C2018%2Cstm/calculation_type/mean?callback=callback1
*/

function normalizeData($dataArr,$dataset) {
	$normalizedY = 0;
	foreach ($dataArr->$dataset->time_series->values as $year => $values) {
		foreach ($values as $value) {
				$normalizedY = ($value->y-100)/100;
				$value->y = $normalizedY;
		}
	}
	
	return json_encode($dataArr);
}

function json_format($json) {
    $tab = " ";
    $newJson = "";
    $indentLevel = 0;
    $inString = false;
   
    $jsonObj = json_decode($json);
   
    if(!$jsonObj){
        return false;
	}
    $json = json_encode($jsonObj);
    $len = strlen($json);

    for($c = 0; $c < $len; $c++) {
        $char = $json[$c];
        switch($char)
        {
			case '{':
            case '[':
                if(!$inString) {
                    $newJson .= $char . "\n" . str_repeat($tab, $indentLevel+1);
                    $indentLevel++;
                } else {
                    $newJson .= $char;
                }
                break;
            case '}':
            case ']':
                if(!$inString) {
                    $indentLevel--;
                    $newJson .= "\n" . str_repeat($tab, $indentLevel) . $char;
                } else {
                    $newJson .= $char;
                }
                break;
            case ',':
                if(!$inString) {
                    $newJson .= ",\n" . str_repeat($tab, $indentLevel);
                } else {
                    $newJson .= $char;
                }
                break;
            case ':':
                if(!$inString) {
                    $newJson .= ": ";
                } else {
                    $newJson .= $char;
                }
                break;
            case '"':
                $inString = !$inString;
            default:
                $newJson .= $char;
                break;                   
        }
    }
   
    return $newJson;
}



?>
