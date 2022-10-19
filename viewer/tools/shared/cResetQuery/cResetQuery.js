var cResetQuery = {
    options: {
        requiredBlocks: ['cMapPanel'],
        events: ['click']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;

        var component = {
            extendedTool: extendedTool,
            xtype: 'button',
            text: 'Reset',
            tooltip : block.tooltip,
            handler: function() {
                location.reload();
                /*var cqlFilterChangeDetection = {};
                var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layers = mapper.layers.query(
                    layersConfig,
                    {
                        type: 'layer'
                    },
                    ['overlays', 'boundaries']
                );
                
                // Store all current cql filters for change detection.
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    cqlFilterChangeDetection[layer.id] = {};
                    if (!layer.hasOwnProperty('cqlFilter')) continue;
                    
                    for (var prop in layer.cqlFilter) {
                        cqlFilterChangeDetection[layer.id][prop] = layer.cqlFilter[prop];
                    }
                }
                
                this.extendedTool.owningBlock.fire('click');
                
                // Check all cql filters for changes. If any has changed or been added, update the layer and post layer updated event.
                // A property containing a cql filter should never be removed. To remove, set to null.
                var layerChanged = false;
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    if (!layer.hasOwnProperty('cqlFilter')) continue;
                    
                    for (var prop in layer.cqlFilter) {
                        // If the filter existed before the reset and the filter hasn't changed, continue the loop.
                        if (cqlFilterChangeDetection[layer.id].hasOwnProperty(prop) && layer.cqlFilter[prop] === cqlFilterChangeDetection[layer.id][prop]) continue;
                        
                        layerChanged = true;
                        mapper.OpenLayers.forceLayerUpdateById(layer.id, map);
                    }
                }
                
                if (layerChanged === true) {
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        layersConfig,
                        mapper.layers);
                }
                
                var regionFolders = mapper.layers.query(
                    layersConfig,
                    function(folder) {
                        if (folder.type !== 'folder' || !folder.hasOwnProperty('regionId') || folder.regionId === '' || folder.regionId === null) return false;
                        var displayedLayers = mapper.layers.query(
                            folder.folder,
                            {
                                type: 'layer',
                                display: true
                            }
                        );
                        
                        if (displayedLayers.length > 0) return true;
                        return false;
                    },
                    ['overlays', 'boundaries']
                );
                
                if (regionFolders.length > 0) {
                    var regionId = regionFolders[0].regionId;
                    var region = mapper.common.getRegionWithRegionID(regionId);
                    map.getView().fit(region.bbox, map.getSize());
                }*/
            },
            listeners : {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cResetQuery";
export var tool = cResetQuery;