var cMapDownloadsMenuItem = {
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

                //var includeBoundaries = blockConfigs.includeBoundaries;
                //var overrideExtentWithFullExtent = blockConfigs.overrideExtentWithFullExtent;


                
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
                    
                    var region = mapper.regions[0];
                    if (regionFolder.length > 0) {
                        var regionId = regionFolder[0].regionId;
                        region = mapper.common.getRegionWithRegionID(regionId);
                    }
                    
                    downloadUrl = layer.source.wcs;
                    var wcsProxy = custom.remoteResource.WCSProxyURL;
                    if (typeof(wcsProxy) === 'string' && wcsProxy !== '') {
                        downloadUrl = mapper.common.buildUrlParams(
                            wcsProxy,
                            {
                                layer: layer,
                                region: region,
                                currentExtent: mapper.OpenLayers.getCurrentMapWindowExtent(openlayersMap)
                            }
                        );
                    } else {
                        if (layer.hasOwnProperty('cqlFilter')) {
                            var cqlFilter = [];
                            for (var prop in layer.cqlFilter) {
                                if (layer.cqlFilter[prop] !== null) cqlFilter.push(layer.cqlFilter[prop]);
                            }
                            downloadUrl += '?FILTER=' + cqlFilter.join(' AND ');
                        }
                    }
                } else if (type === 'wms') {
                    var downloadUrl = mapper.OpenLayers.getDownloadURLofTopOverlay(
                        layersConfig,
                        openlayersMap,
                        format,
                        mapPanelBlock.component.getWidth(),
                        mapPanelBlock.component.getHeight(),
                        layer.style);
                }
                
                //mapper.log(downloadUrl);
                mapper.common.startDownloadOfImageURL(downloadUrl, format, title + "." + extension, function () {tempMask.hide();});	
            }
        };
        
        return menuItem;
    }
};

export var toolName = "cMapDownloadsMenuItem";
export var tool = cMapDownloadsMenuItem;