<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
	<sld:NamedLayer>
		<sld:Name>data_2002_012_tif</sld:Name>
		<sld:UserStyle>
			<sld:Name>data_2002_012_tif</sld:Name>
			<sld:Title>data 2002 012 tif</sld:Title>
			<sld:FeatureTypeStyle>
				<sld:Name>name</sld:Name>
				<sld:Rule>
					<sld:RasterSymbolizer>
						<sld:ColorMap>
							<sld:ColorMapEntry color="#FFFFFF" opacity="1" quantity="-1" label="NoData"/>
							<sld:ColorMapEntry color="#a50026" opacity="1" quantity="-0.1" label="Water Bodies"/>
							<sld:ColorMapEntry color="#d73027" opacity="1" quantity="0.1" label="Barren Areas"/>
							<sld:ColorMapEntry color="#fdae61" opacity="1" quantity="0.2" label="Moderate NDVI"/>
							<sld:ColorMapEntry color="#fee08b" opacity="1" quantity="0.3" label="Moderate NDVI"/>
							<sld:ColorMapEntry color="#d9ef8b" opacity="1" quantity="0.4" label="Moderate NDVI"/>
							<sld:ColorMapEntry color="#66bd63" opacity="1" quantity="0.5" label="High NDVI"/>
							<sld:ColorMapEntry color="#1a9850" opacity="1" quantity="0.6" label="High NDVI"/>
							<sld:ColorMapEntry color="#006837" opacity="1" quantity="0.7" label="Higher NDVI"/>
							<!--<sld:ColorMapEntry color="#66bd63" opacity="1" quantity="0.8" label="High NDVI"/>
							<sld:ColorMapEntry color="" opacity="1" quantity="0.9" label="High NDVI"/>
							<sld:ColorMapEntry color="" opacity="1" quantity="1.0" label="High NDVI"/>-->
						</sld:ColorMap>
						<sld:ContrastEnhancement/>
					</sld:RasterSymbolizer>
				</sld:Rule>
			</sld:FeatureTypeStyle>
		</sld:UserStyle>
	</sld:NamedLayer>
</sld:StyledLayerDescriptor>