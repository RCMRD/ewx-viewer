<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0" xmlns:gml="http://www.opengis.net/gml" xmlns:sld="http://www.opengis.net/sld">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>zscore.2011.070809</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:ChannelSelection>
              <sld:GrayChannel>
                <sld:SourceChannelName>1</sld:SourceChannelName>
              </sld:GrayChannel>
            </sld:ChannelSelection>
            <sld:ColorMap type="values">
			  <sld:ColorMapEntry color="#def0d0" opacity="1" label="NoData" quantity="-9999"/>
			  <sld:ColorMapEntry color="#d7191c" opacity="1" label="-4.0" quantity="-4.0"/>
              <sld:ColorMapEntry color="#d7191c" opacity="1" label="-3.0" quantity="-3.0"/>
              <sld:ColorMapEntry color="#e75437" opacity="1" label="-2.0" quantity="-2.0"/>
              <sld:ColorMapEntry color="#f69053" opacity="1" label="-1.5" quantity="-1.5"/>
              <sld:ColorMapEntry color="#febe74" opacity="1" label="-1.0" quantity="-1.0"/>
              <sld:ColorMapEntry color="#ffdf9a" opacity="1" label="-0.5" quantity="-0.5"/>
              <sld:ColorMapEntry color="#def0d0" opacity="1" label="0" quantity="0"/>
              <sld:ColorMapEntry color="#bce1e1" opacity="1" label="0.5" quantity="0.5"/>
              <sld:ColorMapEntry color="#92c6df" opacity="1" label="1.0" quantity="1.0"/>
              <sld:ColorMapEntry color="#5fa1cb" opacity="1" label="1.5" quantity="1.5"/>
              <sld:ColorMapEntry color="#2c7bb6" opacity="1" label="2.0" quantity="2.0"/>
              <sld:ColorMapEntry color="#2c2276" opacity="1" label="3.0" quantity="3.0"/>
              <sld:ColorMapEntry color="#2c2242" opacity="1" label="4.0" quantity="4.0"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>