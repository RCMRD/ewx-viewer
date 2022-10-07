<?php

header("Content-type: application/json");

/*
if (empty($_GET['fewsId']) || empty($_GET['region']) || empty($_GET['periodicity']) || empty($_GET['statistic']) || empty($_GET['vector_dataset']) || empty($_GET['raster_dataset']) || empty($_GET['seasons']) || empty($_GET['servlet_endpoint']) || empty($_GET['callback'])){
	$parent = array("Error"=>array("message"=>"Parameter(s) Missing", "Mandatory KVP Parameter Format"=>"fewsId={fewsId}&region={region}&periodicity={periodicity}&statistic={statistic}&vector_dataset={vector_dataset}&raster_dataset={raster_dataset}&seasons={seasons}&servlet_endpoint={servlet_endpoint}"));
	$json = json_encode($parent);
	print stripslashes(json_format($json));
	return;
}*/

$fewsId = urlencode($_GET['fewsId']); 
$region = $_GET['region'];
$periodicity = $_GET['periodicity'];
$statistic = $_GET['statistic'];
$vector_dataset = $_GET['vector_dataset'];
$raster_dataset = $_GET['raster_dataset'];
$seasons = $_GET['seasons'];
$servlet_endpoint = $_GET['servlet_endpoint'];
$callback = null;
if (array_key_exists('callback', $_GET)) $callback = $_GET['callback'];

//$timeSeriesURL = "http://earlywarning.usgs.gov:8080/EWX/TimeSeriesServlet?fewsId=$fewsId&region=$region&periodicity=$periodicity&statistic=$statistic&vector_dataset=$vector_dataset&raster_dataset=$raster_dataset&include_accumulated=false&include_seasons_list=true&seasons=$seasons";

$timeSeriesURL = "$servlet_endpoint?fewsId=$fewsId&region=$region&periodicity=$periodicity&statistic=$statistic&vector_dataset=$vector_dataset&raster_dataset=$raster_dataset&include_accumulated=false&include_seasons_list=true&seasons=$seasons";

//echo $timeSeriesURL;



$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $timeSeriesURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
curl_setopt($ch, CURLOPT_HTTPHEADER, array('X_FORWARDED_FOR:'.$_SERVER['REMOTE_ADDR']));
$data = curl_exec($ch);

$data =  normalizeData($data);

if ($callback !== null) {
    print "$callback(".json_format($data). ")";
} else {
    print json_format($data);
}

function normalizeData($data) {
	$dataArr  = json_decode($data);
	$normalizedY = 0;
	foreach ($dataArr->time_series->values as $year => $values) {
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
