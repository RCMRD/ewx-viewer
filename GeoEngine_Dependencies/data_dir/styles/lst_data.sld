<!--SLD file created with GeoCat Bridge v2.6.0 using ArcGIS Desktop without Geoserver extensions.
 Date: 09 March 2020
 See www.geocat.net for more details-->
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd"
  version="1.0.0">
  <NamedLayer>
    <Name>lst_data</Name>
    <UserStyle>
      <Name>lst_data</Name>
      <Title>lst_data</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>1</Opacity>
            <ColorMap
              type="intervals">
              <ColorMapEntry
                color="#4575B5"
                opacity="0"
                quantity="-9999"
                label="No Data" />
              <ColorMapEntry
                color="#6E8FB8"
                opacity="1"
                quantity="10"
                label="Low Temp" />
              <ColorMapEntry
                color="#99AEBD"
                opacity="1"
                quantity="20"
                label="20" />
              <ColorMapEntry
                color="#C0CCBE"
                opacity="1"
                quantity="25"
                label="Moderate Temp" />
              <ColorMapEntry
                color="#FAB984"
                opacity="1"
                quantity="30"
                label="30" />
              <ColorMapEntry
                color="#E66043"
                opacity="1"
                quantity="40"
                label="High Temp" />
              <ColorMapEntry
                color="#D62F27"
                opacity="1"
                quantity="50.1"
                label=">=50" />
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>