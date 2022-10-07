var cSelectProjectsList = {
    options: {
        requiredBlocks: ['cSelectBBOXTool', 'cMapPanel', 'cSelectRegionTool', 'cRegionTool', 'cStateTool', 'cSubStateTool'],
        events: ['selectionchange']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            mask: null,
            isMasked: false,
            lastRequest: {
                requestObj: null,
                requestComplete: false
            },
            wfsRequestStatus: {
                total: 0,
                completed: 0
            },
            selectedCoordinates: [],
            storeRecords: [],
            maskComponent: function() {
                if (this.isMasked === true) return;
                this.isMasked = true;
                if (this.mask === null) {
                    this.mask = new Ext.LoadMask(this.component, {
                        msg : "Loading Projects ..."
                    });
                }
                this.mask.show();
            },
            unMaskComponent: function() {
                if (this.isMasked === false) return;
                this.mask.hide();
                this.isMasked = false;
            },
            clearRecords: function() {
                this.storeRecords = [];
            },
            reloadStore: function() {
                var store = Ext.create('Ext.data.Store', {
                    fields: ['value','text'],
                    data: this.storeRecords
                });
                this.component.reset();
                this.component.bindStore(store);
            },
            getCoordsFromExtent: function(extent) {
                var minx = extent[0],
                miny = extent[1],
                maxx = extent[2],
                maxy = extent[3];
                return [[[[minx,miny], [minx,maxy], [maxx,maxy], [maxx,miny], [minx,miny]]]];
            },
            getProjects: function(coordinates) {
                this.maskComponent();
                this.clearRecords();
                
                var metadata = [];
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var mapProjection = map.getView().getProjection().getCode();
                
                var blockConfigs = this.owningBlock.blockConfigs;
                var layerMapping = blockConfigs.layers;
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerIds = [];
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    layerIds.push(layerMapping[i].id);
                }
                
                var layers = mapper.layers.query(
                    layersConfig,
                    function(layer) {
                        if (layer.type === 'layer' && layer.display === true && layerIds.indexOf(layer.id) !== -1) {
                            return true;
                        }
                        return false;
                    },
                    ['overlays', 'boundaries', 'baselayers']
                );
                
                if (this.lastRequest.requestObj !== null && this.lastRequest.requestComplete === false) {
                    this.lastRequest.requestObj.requestCanceled = true;
                }
                this.lastRequest.requestComplete = false;
                this.wfsRequestStatus.total = layers.length;
                this.wfsRequestStatus.completed = 0;
                
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    var layerProjection = layer.srs;
                    var url = layer.source.wfs;
                    var name = layer.name;
                    
                    var geomString = mapper.OpenLayers.getCqlGeometry(coordinates, mapProjection, layerProjection);
                    var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layerProjection+'&typeNames='+name+"&outputFormat=application/json&CQL_FILTER=INTERSECTS(the_geom, MULTIPOLYGON"+geomString+")";
                    
                    this.lastRequest.requestObj = mapper.common.asyncAjax({
                        type: 'POST',
                        url: url,
                        params: params,
                        callbackObj: {
                            extendedTool: this,
                            layer: layer,
                            geomString: geomString,
                            coordinates: coordinates
                        },
                        callback: function(response, callbackObj) {
                            if (response.requestCanceled === true) {
                                return;
                            }
                            var extendedTool = callbackObj.extendedTool;
                            var layer = callbackObj.layer;
                            var featureInfo = JSON.parse(response.responseText);
                            
                            if (featureInfo.features.length > 0) {
                                var mappedLayers = extendedTool.owningBlock.blockConfigs.layers;
                                var mappedLayer;
                                for (var i = 0, len = mappedLayers.length; i < len; i+=1) {
                                    if (mappedLayers[i].id === layer.id) {
                                        mappedLayer = mappedLayers[i];
                                        break;
                                    }
                                }
                                
                                var idProperty;
                                for (var i = 0, len = mappedLayer.featureInfo.length; i < len; i+=1) {
                                    if (mappedLayer.featureInfo[i].type === 'id') {
                                        idProperty = mappedLayer.featureInfo[i].propertyName;
                                        break;
                                    }
                                }
                                
                                var features = featureInfo.features;
                                for (var i = 0, len = features.length; i < len; i+=1) {
                                    var id = features[i].properties[idProperty];
                                    extendedTool.storeRecords.push({value: id, text: id});
                                }
                            }
                            
                            extendedTool.wfsRequestStatus.completed += 1;
                            if (extendedTool.wfsRequestStatus.total === extendedTool.wfsRequestStatus.completed) {
                                extendedTool.lastRequest.requestComplete = true;
                                extendedTool.reloadStore();
                                extendedTool.unMaskComponent();
                            }
                        }
                    });
                }
            }
        };
        
        var selectBboxTool = owningBlock.getReferencedBlock('cSelectBBOXTool');
        if (selectBboxTool !== null) {
            selectBboxTool.on('aoiSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectBboxTool = postingObj,
                extent = selectBboxTool.selectedExtent,
                coords = extendedTool.getCoordsFromExtent(extent);
                extendedTool.selectedCoordinates = coords;
                extendedTool.getProjects(extendedTool.selectedCoordinates);
            }, extendedTool);
        }
        
        var selectRegionBlock = owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionBlock !== null) {
            selectRegionBlock.on('aoiSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectRegionTool = postingObj;
                extendedTool.selectedCoordinates = selectRegionTool.selectedCoords;
                extendedTool.getProjects(extendedTool.selectedCoordinates);
            }, extendedTool);
        }
        
        var selectStateBlock = owningBlock.getReferencedBlock('cStateTool');
        if (selectStateBlock !== null) {
            selectStateBlock.on('select', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectStateTool = postingObj;
                extendedTool.selectedCoordinates = selectStateTool.selectedCoords;
                extendedTool.getProjects(extendedTool.selectedCoordinates);
            }, extendedTool);
        }
        
        var selectSubStateBlock = owningBlock.getReferencedBlock('cSubStateTool');
        if (selectSubStateBlock !== null) {
            selectSubStateBlock.on('select', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectSubStateTool = postingObj;
                extendedTool.selectedCoordinates = selectSubStateTool.selectedCoords;
                extendedTool.getProjects(extendedTool.selectedCoordinates);
            }, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        var height = block.height;
        var store = Ext.create('Ext.data.Store', {
            fields: ['value','text'],
            data: [{text: '', value: 'value'}] // Needs to start with a dummy record or nothing will show the first time a new record is added.
        });
        var component = {
            extendedTool: extendedTool,
            xtype: 'itemselector',
            name: 'itemselector',
            displayField: 'text',
            valueField: 'value',
            width: width,
            height: height,
            store: store,
            fieldLabel: 'Available Projects',
            labelAlign: 'top',
            buttons: ['add', 'remove'],
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    var regionBlock = this.extendedTool.owningBlock.getReferencedBlock('cRegionTool');
                    if (regionBlock !== null) {
                        if (regionBlock.rendered === true) {
                            var extent = regionBlock.extendedTool.selectedCoords;
                            var coords = this.extendedTool.getCoordsFromExtent(extent);
                            this.extendedTool.selectedCoordinates = coords;
                            this.extendedTool.getProjects(extendedTool.selectedCoordinates);
                        }
                        
                        regionBlock.on('regionSelected', function(callbackObj, postingObj) {
                            var extendedTool = callbackObj,
                            regionTool = postingObj,
                            extent = regionTool.selectedCoords,
                            coords = extendedTool.getCoordsFromExtent(extent);
                            extendedTool.selectedCoordinates = coords;
                            extendedTool.getProjects(extendedTool.selectedCoordinates);
                        }, this.extendedTool);
                    }
                },
                change: function(itemselector, newValue) {
                    this.extendedTool.owningBlock.fire('selectionchange', extendedTool, newValue);
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cSelectProjectsList";
export var tool = cSelectProjectsList;