var cMapDownloadsMenuItemRAWFullExtent = {
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
                mapper.log(mapperWindow);
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                var openlayersMap = mapPanelBlock.component.map;

                var includeBoundaries = blockConfigs.includeBoundaries;
                var overrideExtentWithFullExtent = blockConfigs.overrideExtentWithFullExtent;


                
                var downloadUrl = '';
                
                var extension = '';
                if (format === 'image/geotiff') {
                    extension = 'tiff';
                } else if (format === 'image/png') {
                    extension = 'png';
                }
                
                var tempMask = new Ext.LoadMask(Ext.get(mapWindowBlock.component.id), {
                        msg : "Generating download ..."
                    });
                tempMask.show();

                var windowJsonLayers = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        type: 'layer',
                        display: true,
                        mask: false,
                        loadOnly: false
                    }
                );

                if (windowJsonLayers.length == 0)
                    return null;

                windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

                var layer = windowJsonLayers[windowJsonLayers.length - 1];

                var title = mapper.layers.getTopLayerTitle(layersConfig.overlays).replace(/,/g, "").replace(/ /g, "_");

                var region = '';

                if (type === 'wcs') 
                {


                    
                    var regionFolder = mapper.layers.query(
                        layersConfig.overlays,
                        function(folder) {
                            if (folder.type !== 'folder' || !folder.hasOwnProperty('regionId')) return false;
                            var displayedLayers = mapper.layers.query(
                                folder.folder,
                                {
                                    type: 'layer',
                                    display: true,
                                    mask: false,
                                    loadOnly: false
                                }
                            );
                            
                            if (displayedLayers.length > 0) return true;
                            return false;
                        }
                    );
                    
                    region = mapper.regions[0];
                    if (regionFolder.length > 0) 
                    {
                        var regionId = regionFolder[0].regionId;
                        region = mapper.common.getRegionWithRegionID(regionId);
                    }

                    
                    
                    downloadUrl = layer.source.wcs;
                    var wcsProxy2 = custom.remoteResource.WCSProxyURL2;
                    if (typeof(wcsProxy2) === 'string' && wcsProxy2 !== '') 
                    {
                        downloadUrl = mapper.common.buildUrlParams(
                            wcsProxy2,
                            {
                                layer: layer,
                                region: region,
                                //currentExtent: mapper.OpenLayers.getCurrentMapWindowExtent(openlayersMap)
                                currentExtent: region.bbox
                            }
                        );
                    } 
                } 

                //mapper.log(downloadUrl);
                mapper.common.startDownloadOfImageURL(downloadUrl, format, title + "." + extension, function () {tempMask.hide();});	
                
            }
        };
        
        return menuItem;
    }
}


export var toolName = "cMapDownloadsMenuItemRAWFullExtent";
export var tool = cMapDownloadsMenuItemRAWFullExtent;