<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
	<sld:NamedLayer>
		<sld:Name>raster</sld:Name>
		<sld:UserStyle>
			<sld:Name>raster</sld:Name>
			<sld:Title>A boring default style</sld:Title>
			<sld:Abstract>A sample style for rasters</sld:Abstract>
			<sld:FeatureTypeStyle>
				<sld:Name>name</sld:Name>
				<sld:FeatureTypeName>Feature</sld:FeatureTypeName>
				<sld:Rule>
					<sld:RasterSymbolizer>
						<sld:ColorMap extended="true">
							<sld:ColorMapEntry color="#FFFFFF" opacity="0.0" quantity="-301" label="NoData"/>
							<sld:ColorMapEntry color="#5F0016" opacity="1.0" quantity="-300" label="-300"/>
							<sld:ColorMapEntry color="#A80061" opacity="1.0" quantity="-100" label="-100"/>
							<sld:ColorMapEntry color="#FF7521" opacity="1.0" quantity="-75" label="-75"/>
							<sld:ColorMapEntry color="#F8A600" opacity="1.0" quantity="-50" label="-50"/>
							<sld:ColorMapEntry color="#FACF00" opacity="1.0" quantity="-25" label="-25"/>
							<sld:ColorMapEntry color="#DDDDDD" opacity="1.0" quantity="-10" label="-10"/>
							<sld:ColorMapEntry color="#DDDDDD" opacity="0.0" quantity="9.9" label="9.9"/>
							<sld:ColorMapEntry color="#BDEDFF" opacity="1.0" quantity="10" label="10"/>
							<sld:ColorMapEntry color="#66C9FF" opacity="1.0" quantity="25" label="25"/>
							<sld:ColorMapEntry color="#0091D9" opacity="1.0" quantity="50" label="50"/>
							<sld:ColorMapEntry color="#0069AB" opacity="1.0" quantity="75" label="75"/>
							<sld:ColorMapEntry color="#0000FF" opacity="1.0" quantity="100" label="100"/>
							<sld:ColorMapEntry color="#2F2F4F" opacity="1.0" quantity="300" label="300"/>
						</sld:ColorMap>
						<sld:ContrastEnhancement/>
					</sld:RasterSymbolizer>
				</sld:Rule>
			</sld:FeatureTypeStyle>
		</sld:UserStyle>
	</sld:NamedLayer>
</sld:StyledLayerDescriptor>