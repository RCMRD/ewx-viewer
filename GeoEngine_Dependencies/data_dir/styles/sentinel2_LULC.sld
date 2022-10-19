<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
	<sld:NamedLayer>
		<sld:Name>Sentinel2_LULC2016</sld:Name>
		<sld:UserStyle>
			<sld:Name>Sentinel2_LULC2016</sld:Name>
			<sld:FeatureTypeStyle>
				<sld:Rule>
					<sld:RasterSymbolizer>
						<sld:Geometry>
							<ogc:PropertyName>grid</ogc:PropertyName>
						</sld:Geometry>
						<sld:ColorMap type="values">
							<sld:ColorMapEntry color="#000000" opacity="0.0" quantity="0" label="No Data"/>
							<sld:ColorMapEntry color="#00a000" opacity="1.0" quantity="1" label="Trees cover areas"/>
							<sld:ColorMapEntry color="#966400" opacity="1.0" quantity="2" label="Shrubs cover areas"/>
							<sld:ColorMapEntry color="#ffb400" opacity="1.0" quantity="3" label="Grassland"/>
							<sld:ColorMapEntry color="#ffff64" opacity="1.0" quantity="4" label="Cropland"/>
							<sld:ColorMapEntry color="#00dc82" opacity="1.0" quantity="5" label="Vegetation acquatic or regularly flooded"/>
							<sld:ColorMapEntry color="#ffebaf" opacity="1.0" quantity="6" label="Lichen mosses / Sparse vegetation"/>
							<sld:ColorMapEntry color="#fff5d7" opacity="1.0" quantity="7" label="Bare areas"/>
							<sld:ColorMapEntry color="#c31400" opacity="1.0" quantity="8" label="Built up areas"/>
							<sld:ColorMapEntry color="#0046c8" opacity="1.0" quantity="10" label="Open water"/>
						</sld:ColorMap>
						<sld:ContrastEnhancement/>
					</sld:RasterSymbolizer>
				</sld:Rule>
			</sld:FeatureTypeStyle>
		</sld:UserStyle>
	</sld:NamedLayer>
</sld:StyledLayerDescriptor>