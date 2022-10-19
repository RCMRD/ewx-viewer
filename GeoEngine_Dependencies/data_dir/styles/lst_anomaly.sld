<!--SLD file created with GeoCat Bridge v2.6.0 using ArcGIS Desktop without Geoserver extensions.
 Date: 09 March 2020
 See www.geocat.net for more details-->
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd"
  version="1.0.0">
  <NamedLayer>
    <Name>lst_anomaly</Name>
    <UserStyle>
      <Name>lst_anomaly</Name>
      <Title>lst_anomaly</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>1</Opacity>
            <ColorMap
              type="intervals">
              <ColorMapEntry
                color="#FFFCFF"
                opacity="0"
                quantity="-9999"
                label="No Data" />
              <ColorMapEntry
                color="#FF96FF"
                opacity="1"
                quantity="-7.0"
                label="-7.0" />
              <ColorMapEntry
                color="#FF00FF"
                opacity="1"
                quantity="-6.0"
                label="-6.0" />
              <ColorMapEntry
                color="#9900FF"
                opacity="1"
                quantity="-5.0"
                label="-5.0" />
              <ColorMapEntry
                color="#0000FF"
                opacity="1"
                quantity="-4.0"
                label="-4.0" />
              <ColorMapEntry
                color="#3B83FF"
                opacity="1"
                quantity="-3.0"
                label="-3.0" />
              <ColorMapEntry
                color="#00FFFF"
                opacity="1"
                quantity="-2.0"
                label="-2.0" />
              <ColorMapEntry
                color="#30FF8D"
                opacity="1"
                quantity="-1.0"
                label="-1.0" />
              <ColorMapEntry
                color="#00FF00"
                opacity="1"
                quantity="1.0"
                label="1.0" />
              <ColorMapEntry
                color="#99FF00"
                opacity="1"
                quantity="2.0"
                label="2.0" />
              <ColorMapEntry
                color="#FFFF00"
                opacity="1"
                quantity="3.0"
                label="3.0" />
              <ColorMapEntry
                color="#FFBF00"
                opacity="1"
                quantity="4.0"
                label="4.0" />
              <ColorMapEntry
                color="#FF8000"
                opacity="1"
                quantity="5.0"
                label="5.0" />
              <ColorMapEntry
                color="#BD4200"
                opacity="1"
                quantity="6.0"
                label="6.0" />
              <ColorMapEntry
                color="#800000"
                opacity="1"
                quantity="7.0"
                label="7.0" />
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>