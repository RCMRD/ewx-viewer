<?php

$url = "https://agriculturehotspots.icpac.net/asap/wms?";

 
$newurl = $url.$_SERVER['QUERY_STRING'];
//print $newurl;
//die();


//$newurl = "http://data.rcmrd.org:8080/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=rfe2%3Arfe2_africa_1-dekad-23-2017_mm_data&TILED=true&mapperWMSURL=http%3A%2F%2Flocalhost%2Fngv2%2Fproxies%2FrcrmdProxy.php%3F&SRS=EPSG%3A3857&jsonLayerId=africaRfeDekadalData&STYLES=fews_rfe2_dekad_data_raster_ngviewer&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=5009377.085697312%2C-5009377.085697312%2C10018754.171394624%2C-9.313225746154785e-10";


$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $newurl);
//curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17');
curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0 AppleWebKit/537.17 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.17');
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($curl, CURLOPT_HEADER, false);
$data = curl_exec($curl);
curl_close($curl);


//check if it is a getfeatureinfo request
if (strpos($newurl, 'INFO_FORMAT=application') !== false) 
{
    //echo 'true';
    
    header('Content-Type:application/json');
    
}
else
{
    header('Content-Type:image/png');
}

header('Access-Control-Allow-Origin:*');

print $data;

?>
