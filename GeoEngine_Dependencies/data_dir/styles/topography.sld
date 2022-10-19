<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
	<sld:NamedLayer>
		<sld:Name>raster</sld:Name>
		<sld:UserStyle>
			<sld:Name>raster</sld:Name>
			<sld:Title>dem style</sld:Title>
			<sld:Abstract>dem style</sld:Abstract>
			<sld:FeatureTypeStyle>
				<sld:Name>name</sld:Name>
				<sld:FeatureTypeName>Feature</sld:FeatureTypeName>
				<sld:Rule>
					<sld:RasterSymbolizer>
						<sld:OverlapBehavior>
							<sld:null/>
						</sld:OverlapBehavior>
						<sld:ColorMap>
							<!--<sld:ColorMapEntry color="#00ff00" opacity="1.0" quantity="-500" label="-500"/>
							<sld:ColorMapEntry color="#00fa00" opacity="1.0" quantity="-417" label="-417"/>
							<sld:ColorMapEntry color="#14f500" opacity="1.0" quantity="-333" label="-333"/>
							<sld:ColorMapEntry color="#28f502" opacity="1.0" quantity="-250" label="-250"/>
							<sld:ColorMapEntry color="#3cf505" opacity="1.0" quantity="-167" label="-167"/>
							<sld:ColorMapEntry color="#50f50a" opacity="1.0" quantity="-83" label="-83"/>
							<sld:ColorMapEntry color="#64f014" opacity="1.0" quantity="-1" label="-1"/>-->
							<sld:ColorMapEntry color="#7deb32" opacity="0" quantity="0" label="0"/>
							<sld:ColorMapEntry color="#78c818" opacity="1.0" quantity="30" label="30"/>
							<sld:ColorMapEntry color="#38840c" opacity="1.0" quantity="105" label="105"/>
							<sld:ColorMapEntry color="#2c4b04" opacity="1.0" quantity="300" label="300"/>
							<sld:ColorMapEntry color="#ffff00" opacity="1.0" quantity="400" label="400"/>
							<sld:ColorMapEntry color="#dcdc00" opacity="1.0" quantity="700" label="700"/>
							<sld:ColorMapEntry color="#b47800" opacity="1.0" quantity="1200" label="1200"/>
							<sld:ColorMapEntry color="#c85000" opacity="1.0" quantity="1400" label="1400"/>
							<sld:ColorMapEntry color="#be4100" opacity="1.0" quantity="1600" label="1600"/>
							<sld:ColorMapEntry color="#963000" opacity="1.0" quantity="2000" label="2000"/>
							<sld:ColorMapEntry color="#3c0200" opacity="1.0" quantity="3000" label="3000"/>
							<sld:ColorMapEntry color="#ffffff" opacity="1.0" quantity="5000" label="5000"/>
							<sld:ColorMapEntry color="#ffffff" opacity="1.0" quantity="5000" label="7000"/>
							<!--<sld:ColorMapEntry color="#ffffff" opacity="1.0" quantity="13000" label="13000"/>-->
						</sld:ColorMap>
						<sld:ContrastEnhancement/>
						<sld:ShadedRelief>
							<sld:BrightnessOnly>false</sld:BrightnessOnly>
							<sld:ReliefFactor>55</sld:ReliefFactor>
						</sld:ShadedRelief>
					</sld:RasterSymbolizer>
				</sld:Rule>
			</sld:FeatureTypeStyle>
		</sld:UserStyle>
	</sld:NamedLayer>
</sld:StyledLayerDescriptor>