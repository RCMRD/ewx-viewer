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
							<!--<sld:ColorMapEntry color="#FFFFFF" opacity="0.0" quantity="-0.1" label="NoData"/>-->
							<sld:ColorMapEntry color="#FFFFFF" opacity="0.0" quantity="0.0" label="NoData"/>
							<sld:ColorMapEntry color="#E1BEB4" opacity="1.0" quantity="10.0" label="10.0"/>
							<sld:ColorMapEntry color="#B4F9AA" opacity="1.0" quantity="25.0" label="25.0"/>
							<sld:ColorMapEntry color="#78F573" opacity="1.0" quantity="50.0" label="50.0"/>
							<sld:ColorMapEntry color="#37D23C" opacity="1.0" quantity="100.0" label="100.0"/>
							<sld:ColorMapEntry color="#B4F0FA" opacity="1.0" quantity="150.0" label="150.0"/>
							<sld:ColorMapEntry color="#50A5F5" opacity="1.0" quantity="200.0" label="200.0"/>
							<sld:ColorMapEntry color="#1E6EEB" opacity="1.0" quantity="250.0" label="250.0"/>
							<sld:ColorMapEntry color="#FDE877" opacity="1.0" quantity="300.0" label="300.0"/>
							<sld:ColorMapEntry color="#FEA017" opacity="1.0" quantity="400.0" label="400.0"/>
							<sld:ColorMapEntry color="#FF320C" opacity="1.0" quantity="500.0" label="500.0"/>
							<sld:ColorMapEntry color="#8C1787" opacity="1.0" quantity="600.0" label="600.0"/>
						</sld:ColorMap>
						<sld:ContrastEnhancement/>
					</sld:RasterSymbolizer>
				</sld:Rule>
			</sld:FeatureTypeStyle>
		</sld:UserStyle>
	</sld:NamedLayer>
</sld:StyledLayerDescriptor>