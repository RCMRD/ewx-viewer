var cMapDownloadsMenuItemPNG = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var menuItem = {
            extendedTool: extendedTool,
            text : block.text,
            handler : function () {
                var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                
                var blockConfigs = this.extendedTool.owningBlock.blockConfigs;
                var type = blockConfigs.type;
                var format = blockConfigs.format;
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                var openlayersMap = mapPanelBlock.component.map;

                var includeBoundaries = blockConfigs.includeBoundaries;
                var overrideExtentWithFullExtent = blockConfigs.overrideExtentWithFullExtent;

                var tempMask = new Ext.LoadMask(Ext.get(mapWindowBlock.component.id), {
                        msg : "Generating download ..."
                    });
                tempMask.show();

                //--------------

                //var windowJsonLayers = mapper.common.getAllLayersIncludeOverlayIncludeBoundaryRequireDisplay(layersConfig, true, false, true);

				var windowJsonLayers = mapper.layers.query(
                    layersConfig,
                    {
                        type: 'layer',
                        display: true,
                        mask: false,
                        loadOnly: false
                    },
                    ['overlays','boundaries']
                );
				
                if (windowJsonLayers.length == 0)
                    return null;

                windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

                var layer = windowJsonLayers[0];

                var aURL = mapper.OpenLayers.getDownloadURLOfMapImage(
                        layersConfig,
                        openlayersMap,
                        "image/png",
                        mapPanelBlock.component.getWidth(),
                        mapPanelBlock.component.getHeight());

                //To include just the overlay, remove boundaries from mapper.layers.query and use the below aURL
                //aURL = mapper.OpenLayers.getDownloadURLOfJSONLayerObject(windowJsonLayers[0],openlayersMap,"image/png",mapPanelBlock.component.getWidth(),mapPanelBlock.component.getHeight());

                var title = mapper.layers.getTopLayerTitle(layersConfig.overlays).replace(/,/g, "").replace(/ /g, "_");

                var legendURL = mapper.legend.getLegendURL(layer);

                if (legendURL === null) {
                    mapper.common.startDownloadOfImageURL(aURL, 'image/png', title + ".png", function () {
                        tempMask.hide();
                    });
                } else {
                    mapper.common.startDownloadOfImageURLWithLegend(aURL, legendURL, 'image/png', title + ".png", function () {
                        tempMask.hide();
                    });
                }
            

            }
        };
        
        return menuItem;
    }
}

export var toolName = "cMapDownloadsMenuItemPNG";
export var tool = cMapDownloadsMenuItemPNG;