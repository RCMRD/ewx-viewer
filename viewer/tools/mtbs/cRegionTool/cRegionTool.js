var cRegionTool = {
    options: {
        events: ['regionSelected', 'rendercomponent'],
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cQueryParamsDisplay', 'cResetQuery', 'cSelectRegionTool', 'cSelectBBOXTool', 'cStateTool', 'cSubStateTool']
    },
    removeVector: function(callbackObj, postingObj) {
        var extendedTool = callbackObj;
        if (extendedTool.vectorAdded === true) {
            extendedTool.vectorAdded = false;
            var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            extendedTool.vector.getSource().clear();
            map.removeLayer(extendedTool.vector);
        }
        
        var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
        if (cqlFilterDisplayBlock !== null) {
            cqlFilterDisplayBlock.extendedTool.setFilter('region', null);
        }
        
        extendedTool.component.clearValue();
    },
    createExtendedTool: function(owningBlock) {
        var selectedRegionId = mapper.regions[0].id;
        if (mapper.urlParameters.hasOwnProperty('region')) {
            var region = mapper.common.getRegionWithRegionID(mapper.urlParameters.region);
            if (region !== null) {
                selectedRegionId = region.id;
            }
        }
        
        var extendedTool = {
            owningBlock: owningBlock,
            selectedRegionId: selectedRegionId,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            vectorAdded: false,
            selectedCoords: null,
            selectedProjection: null,
            selectRegion: function(regionId) {
                var region = mapper.common.getRegionWithRegionID(regionId);
                var extent = region.bbox;
                var regionProj = region.srs;
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var firstProj = map.getView().getProjection().getCode();
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = mapper.layers.toolMapping.filterByTypes(this.owningBlock.blockConfigs.layers, ['overlay']);
                
                if (this.vectorAdded === true) {
                    this.vector.getSource().clear();
                } else {
                    this.vectorAdded = true;
                    map.addLayer(this.vector);
                }
                this.selectedCoords = extent;
                this.selectedProjection = firstProj;
                
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    var layerMap = layerMapping[i];
                    var layer = mapper.layers.query(
                        layersConfig,
                        {
                            type: 'layer',
                            mask: false,
                            id: layerMap.id
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layer.length === 0) continue;
                    layer = layer[0];
                    
                    var newProj = layer.srs;
                    var newExtent = JSON.parse(JSON.stringify(extent));
                    if (firstProj !== newProj) {
                        var minxy = proj4(firstProj, newProj, [newExtent[0],newExtent[1]]);
                        var maxxy = proj4(firstProj, newProj, [newExtent[2],newExtent[3]]);
                        newExtent = [minxy[0],minxy[1],maxxy[0],maxxy[1]];
                    }
                    
                    if (!layer.hasOwnProperty('cqlFilter')) {
                        layer.cqlFilter = {};
                    }
                    
                    if (!layer.cqlFilter.hasOwnProperty(this.cqlFilterId)) {
                        layer.cqlFilter[this.cqlFilterId] = null;
                    }
                    
                    layer.cqlFilter[this.cqlFilterId] = "BBOX("+layer.geometryName+","+newExtent.join(',')+")";
                    mapper.OpenLayers.forceLayerUpdateById(layer.id, map);
                }
                
                // Convert extent into a series of points for a polygon.
                if (firstProj !== regionProj) {
                    //coords = mapper.OpenLayers.convertCoordProj(coords, regionProj, firstProj);
                    var minxy = proj4(regionProj, firstProj, [extent[0],extent[1]]);
                    var maxxy = proj4(regionProj, firstProj, [extent[2],extent[3]]);
                    extent = [minxy[0],minxy[1],maxxy[0],maxxy[1]];
                }
                var coords = [[[extent[0], extent[3]], [extent[0], extent[1]], [extent[2], extent[1]], [extent[2], extent[3]]]];
                var olFeature = new ol.Feature(new ol.geom.Polygon(coords));
                olFeature.setStyle(new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : 'rgba(0,0,255,1)',
                        width : 4
                    }),
                    fill : new ol.style.Fill({
                        color : 'rgba(0,0,0,0)'
                    })
                }));
                this.vector.getSource().addFeature(olFeature);
                map.removeLayer(this.vector);
                map.addLayer(this.vector);
                
                setTimeout(function(extent, map) {
                    map.getView().fit(extent, map.getSize());
                }, 10, extent, map);
                
                
                var cqlFilterDisplayBlock = this.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('region', 'Region: '+region.title);
                }
                
                this.owningBlock.fire('regionSelected', this);
            }
        };
        
        var resetQueryBlock = owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var layerMapping = mapper.layers.toolMapping.filterByTypes(extendedTool.owningBlock.blockConfigs.layers, ['overlays']);
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    var layerMap = layerMapping[i];
                    var layer = mapper.layers.query(
                        layersConfig,
                        {
                            type: 'layer',
                            mask: false,
                            id: layerMap.id
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layer.length === 0) continue;
                    layer = layer[0];
                    
                    if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter.hasOwnProperty(extendedTool.cqlFilterId)) {
                        layer.cqlFilter[extendedTool.cqlFilterId] = null;
                    }
                }
                
                extendedTool.component.setValue(extendedTool.selectedRegionId);
                //extendedTool.selectRegion(extendedTool.selectedRegionId);
            }, extendedTool);
        }
        
        var selectRegionBlock = owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionBlock !== null) {
            selectRegionBlock.on('aoiSelected', owningBlock.itemDefinition.removeVector, extendedTool);
        }
        
        var selectBboxBlock = owningBlock.getReferencedBlock('cSelectBBOXTool');
        if (selectBboxBlock !== null) {
            selectBboxBlock.on('aoiSelected', owningBlock.itemDefinition.removeVector, extendedTool);
        }
        
        var stateBlock = owningBlock.getReferencedBlock('cStateTool');
        if (stateBlock !== null) {
            stateBlock.on('select', owningBlock.itemDefinition.removeVector, extendedTool);
        }
        
        var subStateBlock = owningBlock.getReferencedBlock('cSubStateTool');
        if (subStateBlock !== null) {
            subStateBlock.on('select', owningBlock.itemDefinition.removeVector, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var owningMapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
        if (!owningMapWindowBlock.hasOwnProperty('featureCqlFilterId')) {
            owningMapWindowBlock.featureCqlFilterId = mapper.common.getRandomString(32, 36);
        }
        extendedTool.cqlFilterId = owningMapWindowBlock.featureCqlFilterId;
        var regionConfigs = mapper.regions;
        var data = [];
        
        for (var i = 0, len = regionConfigs.length; i < len; i+=1) {
            var regionConfig = regionConfigs[i];
            data.push({
                value: regionConfig.id,
                text: regionConfig.title
            });
        }
        
        var store = Ext.create('Ext.data.Store', {
            fields: ['value', 'text'],
            data: data
        });
        var selectedRegion = extendedTool.selectedRegionId;
        
        var regionTool = {
            extendedTool: extendedTool,
            valueField: 'value',
            displayField: 'text',
            store: store,
            width: block.width,
            editable: false,
            emptyText: 'Select a Region',
            value: selectedRegion,
            listeners: {
                change: function(combo) {
                    var value = combo.getValue();
                    if (value !== null) {
                        this.extendedTool.selectRegion(value);
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                            mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId()),
                            mapper.layers);
                    }
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    this.extendedTool.owningBlock.fire('rendercomponent', this.extendedTool);
                    
                    var value = this.getValue();
                    if (value !== null) {
                        var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        if (mapPanelBlock.rendered === false) {
                            mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                                var extendedTool = callbackObj;
                                var value = extendedTool.component.getValue();
                                extendedTool.selectRegion(value);
                                
                                mapper.EventCenter.defaultEventCenter.postEvent(
                                    mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                                    mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId()),
                                    mapper.layers);
                            }, this.extendedTool);
                        } else {
                            this.extendedTool.selectRegion(value);
                            mapper.EventCenter.defaultEventCenter.postEvent(
                                mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                                mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId()),
                                mapper.layers);
                        }
                    }
                }
            }
        };
        
        var combo = Ext.create('Ext.form.field.ComboBox', regionTool);
        extendedTool.component = combo;
        return combo;
    }
}

export var toolName = "cRegionTool";
export var tool = cRegionTool;