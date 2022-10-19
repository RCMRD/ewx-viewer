<?php

$template = '<?xml version="1.0" encoding="UTF-8"?><GetCoverage version="1.0.0" service="WCS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wcs" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xsi:schemaLocation="http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/getCoverage.xsd">
  <sourceCoverage>replaceLayerName</sourceCoverage>
  <domainSubset>
    <spatialSubset>
      <gml:Envelope srsName="replaceSRS">
        <gml:pos>replaceLowerLeftX replaceLowerLeftY</gml:pos>
        <gml:pos>replaceUpperRightX replaceUpperRightY</gml:pos>
      </gml:Envelope>
      <gml:Grid dimension="2">
        <gml:limits>
          <gml:GridEnvelope>
            <gml:low>0 0</gml:low>
            <gml:high>replaceGridOffsetX replaceGridOffsetY</gml:high>
          </gml:GridEnvelope>
        </gml:limits>
        <gml:axisName>x</gml:axisName>
        <gml:axisName>y</gml:axisName>
      </gml:Grid>
    </spatialSubset>
  </domainSubset>
  <output>
    <crs>replaceOutputSRS</crs>
    <format>GeoTIFF</format>
  </output>
</GetCoverage>';


//$layerNameToUse = "rfe2:rfe2_africa_3-month-02_mm_stm_mean";
//$lowerLeftXToUse = -20.049999237060547;
//$lowerLeftYToUse = -40.050001956522465;
//$upperRightXToUse = 55.05000188201666;
//$upperRightYToUse = 40.04999923706055;

//localhost/wcsProxy.php?layerNameToUse=rfe2:rfe2_africa_3-month-02_mm_stm_mean&lowerLeftXToUse=-20.049999237060547&lowerLeftYToUse=-40.050001956522465&upperRightXToUse=55.05000188201666&upperRightYToUse=40.04999923706055


//localhost/wcsProxy.php?layerNameToUse=rfe2:rfe2_africa_3-month-02_mm_stm_mean&lowerLeftXToUse=-20.049999237060547&lowerLeftYToUse=-40.050001956522465&upperRightXToUse=55.05000188201666&upperRightYToUse=40.04999923706055&wcsURL=http%3A%2F%2Figskmncngs103%3A8080%2Fgeoserver%2Fwcs%2FGetCoverage

//http://igskmncngs103:106/scinextgv416/proxies/wcsProxy.php?layerNameToUse=rfe2:rfe2_africa_1-dekad-17-2016_mm_data&lowerLeftXToUse=-2128992.2837949917&lowerLeftYToUse=-4214602.30674088&upperRightXToUse=5858710.218962431&upperRightYToUse=4615766.178543388&wcsURLToUse=http%3A%2F%2Figskmncngs103%3A8080%2Fgeoserver%2Fwcs%2FGetCoverage&srsToUse=EPSG:3857

$layerNameToUse= $_GET['layerNameToUse'];
$lowerLeftXToUse= $_GET['lowerLeftXToUse'];
$lowerLeftYToUse= $_GET['lowerLeftYToUse'];
$upperRightXToUse= $_GET['upperRightXToUse'];
$upperRightYToUse= $_GET['upperRightYToUse'];
$resolution= $_GET['resolution'];

$resolutionB4 = $resolution;

$xDist = $upperRightXToUse - $lowerLeftXToUse;
$yDist = $upperRightYToUse - $lowerLeftYToUse;

$nativeSrs = $_GET['nativeSrs'];
$srsToUse = $_GET['srsToUse'];
$outputSrsToUse = $_GET['outputSrsToUse'];
$wcsURL = $_GET['wcsURLToUse'];


/*

"resolution" is a loosely used term that needs to be changed
its actually pixel size, where pixelsize is the size per pixel in how many coordinates 
it takes up in the reference coordinate system.

EG:
QDRI VegDRI Raster = EPSG:3785 pixelSize = 1277.43
FEWS RFE2 Raster = EPSG:4326 pixelsize = 0.1

PixelSize info can be looked up from the properties of the raster in qgis, which
you can get to by right clicking on it in the qgis layer list

The thing is with wcs requests, you have to specify a bounding box, and then
pixel height + pixel width that you want back. So you need to convert the coordinate bbox to pixel height and pixel width.

The wcs request needs both.


*/

//this is a hack right now to transform the
//EPSG:4326 pixel size to EPSG:3785/3857
//Right now we only have EPSG:4326 + EPSG3857 rasters in our viewers that use the
//wcs download
#if ($srsToUse == "EPSG:4326" and $outputSrsToUse != "EPSG:4326") {

#yes for source4326/4326
#no for source3857/4326

if ($outputSrsToUse == "EPSG:4326" and $nativeSrs == "EPSG:4326") {
  $resolution = $resolution*111120;
} 

//converts coordinate distance to on disk image pixel size
$gridOffsetX = round($xDist/$resolution);
$gridOffsetY = round($yDist/$resolution);



$newFileText = str_replace("replaceLayerName",$layerNameToUse,$template);
$newFileText = str_replace("replaceLowerLeftX",$lowerLeftXToUse,$newFileText);
$newFileText = str_replace("replaceLowerLeftY",$lowerLeftYToUse,$newFileText);
$newFileText = str_replace("replaceUpperRightX",$upperRightXToUse,$newFileText);
$newFileText = str_replace("replaceUpperRightY",$upperRightYToUse,$newFileText);
$newFileText = str_replace("replaceGridOffsetX",$gridOffsetX,$newFileText);
$newFileText = str_replace("replaceGridOffsetY",$gridOffsetY,$newFileText);
$newFileText = str_replace("replaceSRS",$srsToUse,$newFileText);
$newFileText = str_replace("replaceOutputSRS",$outputSrsToUse,$newFileText);

//echo $resolution;
//echo $outputSrsToUse;
//echo $nativeSrs;
//echo $srsToUse;
//echo $newFileText;
//return;

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++

curl -H "Content-Type: text/xml" -X POST -d @the3.xml -o downloaded.tif http://igskmncngs103:8080/geoserver/wcs/GetCoverage

<?xml version="1.0" encoding="UTF-8"?><GetCoverage version="1.0.0" service="WCS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wcs" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xsi:schemaLocation="http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/getCoverage.xsd">
  <sourceCoverage>rfe2:rfe2_africa_3-month-02_mm_stm_mean</sourceCoverage>
  <domainSubset>
    <spatialSubset>
      <gml:Envelope srsName="EPSG:4326">
        <gml:pos>-20.049999237060547 -40.050001956522465</gml:pos>
        <gml:pos>55.05000188201666 40.04999923706055</gml:pos>
      </gml:Envelope>
      <gml:Grid dimension="2">
        <gml:limits>
          <gml:GridEnvelope>
            <gml:low>0 0</gml:low>
            <gml:high>751 801</gml:high>
          </gml:GridEnvelope>
        </gml:limits>
        <gml:axisName>x</gml:axisName>
        <gml:axisName>y</gml:axisName>
      </gml:Grid>
    </spatialSubset>
  </domainSubset>
  <output>
    <crs>EPSG:4326</crs>
    <format>GeoTIFF</format>
  </output>
</GetCoverage>

+++++++++++++++++++++++++++++++++++++++++++++
*/

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
$ch = curl_init();

//curl_setopt($ch, CURLOPT_URL, "http://igskmncngs103:8080/geoserver/wcs/GetCoverage");
curl_setopt($ch, CURLOPT_URL, $wcsURL);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $newFileText);
curl_setopt($ch, CURLOPT_POST, true);

$headers = array();
$headers[] = "Content-Type: text/xml";
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
}
curl_close ($ch);

#header('Content-type: image/geotiff');
echo $result;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++





?>