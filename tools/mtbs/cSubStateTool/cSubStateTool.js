var cSubStateTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cStateTool', 'cSelectRegionTool', 'cSelectBBOXTool', 'cQueryParamsDisplay', 'cResetQuery', 'cSelectRegionMenuRadioGroup', 'cRegionTool', 'cRegionSelectorMenu', 'cSelectRegionToolRadioGroup'],
        events: ['select']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            lastBoundaryId: null,
            lastSelectedStateId: null,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            vectorAdded: false,
            layer: null,
            selectedLayerId: null,
            presetSelection: null,
            selectedCoords: null,
            getChildBoundaryId: function() {
                var boundaryToggleTool = this.owningBlock.getReferencedBlock('cBoundaryToggleTool');
                if (boundaryToggleTool.component.pressed === true) {
                    return boundaryToggleTool.extendedTool.boundaryId;
                }
                
                var relatedBlueprints = boundaryToggleTool.blueprint.relatedBlockBlueprints;
                for (var i = 0, len = relatedBlueprints.length; i < len; i+=1) {
                    var blueprint = relatedBlueprints[i];
                    if (blueprint.block !== null && blueprint.block.component.pressed === true) {
                        return blueprint.block.extendedTool.boundaryId;
                    }
                }
                
                return null;
            },
            setStore: function(selectedId) {
                if (this.owningBlock.rendered !== true || this.layer === null) return;
                var statesBlock = this.owningBlock.getReferencedBlock('cStateTool');
                var stateId = (statesBlock.extendedTool.stateValue === null) ? statesBlock.component.getValue() : statesBlock.extendedTool.stateValue;
                var layerMapping = this.owningBlock.blockConfigs.layers;
                var parentLayerMapping;
                var childLayerMapping;
                var childLayerId = this.layer.id;
                
                if (stateId === null || childLayerId === null) {
                    this.component.setValue(null);
                    this.component.getStore().removeAll();
                    return;
                }
                
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    var mapping = layerMapping[i];
                    if (mapping.id === childLayerId) {
                        childLayerMapping = mapping;
                    } else if (mapping.type === 'parentBoundary') {
                        parentLayerMapping = mapping;
                    }
                }
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var parentBoundary = mapper.layers.query(
                    layersConfig.boundaries,
                    {
                        id: parentLayerMapping.id
                    }
                )[0];
                var childBoundary = mapper.layers.query(
                    layersConfig.boundaries,
                    {
                        id: childLayerMapping.id
                    }
                )[0];
                
                if (stateId === this.lastSelectedStateId && childBoundary.id === this.lastBoundaryId) {
                    return;
                }
                
                this.component.setValue(null);
                this.component.getStore().removeAll();
                
                this.lastSelectedStateId = stateId;
                this.lastBoundaryId = childBoundary.id;
                
                if (childBoundary !== null) {
                    var url = parentBoundary.source.wfs;
                    var parentIdProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(parentLayerMapping.featureInfo, ['id'], 'propertyName')[0];
                    
                    var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+parentBoundary.srs+'&typeNames='+parentBoundary.name+"&outputFormat=application/json&cql_filter=where "+parentIdProperty+" = '"+stateId+"'";
                    mapper.common.asyncAjax({
                        type: 'POST',
                        url: url,
                        params: params,
                        callbackObj: {
                            extendedTool: this,
                            boundary: childBoundary,
                            parentBoundary: parentBoundary,
                            selectedId: selectedId
                        },
                        callback: function(response, callbackObj) {
                            var extendedTool = callbackObj.extendedTool;
                            var boundary = callbackObj.boundary;
                            var featureInfo = JSON.parse(response.responseText);
                            if (featureInfo.features.length === 0) return;
                            
                            var mappedLayer = mapper.layers.toolMapping.getLayerConfigs(callbackObj.parentBoundary.id, extendedTool.owningBlock.blockConfigs.layers);
                            var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['id'], 'propertyName');
                            
                            var feature = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperty)[0];
                            var url = boundary.source.wfs;
                            var coordProjection = callbackObj.parentBoundary.srs;
                            var cqlFilterGeom = mapper.OpenLayers.getCqlGeometry(feature.geometry.coordinates, coordProjection, boundary.srs);
                            var cqlFilter = "INTERSECTS("+feature.geometry_name+","+feature.geometry.type+cqlFilterGeom+")";
                            
                            var layerMapping = mapper.layers.toolMapping.getLayerConfigs(boundary.id, extendedTool.owningBlock.blockConfigs.layers);
                            var featureMapping = layerMapping.featureInfo;
                            var propertyNames = [];
                            
                            for (var i = 0, len = featureMapping.length; i < len; i+=1) {
                                propertyNames.push(featureMapping[i].propertyName);
                            }
                            
                            var featureParam = '&propertyName='+propertyNames.join(',');
                            
                            var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+boundary.srs+'&typeNames='+boundary.name+"&outputFormat=application/json"+featureParam+"&cql_filter="+cqlFilter;
                            mapper.common.asyncAjax({
                                type: 'POST',
                                url: url,
                                params: params,
                                callbackObj: {
                                    extendedTool: extendedTool,
                                    boundaryId: boundary.id,
                                    selectedId: callbackObj.selectedId
                                },
                                callback: function(response, callbackObj) {
                                    var featureInfo = JSON.parse(response.responseText);
                                    var extendedTool = callbackObj.extendedTool;
                                    var boundaryId = callbackObj.boundaryId;
                                    var layerMapping = mapper.layers.toolMapping.getLayerConfigs(boundaryId, extendedTool.owningBlock.blockConfigs.layers);
                                    var featureMapping = layerMapping.featureInfo;
                                    
                                    var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureMapping, ['display'])[0];
                                    var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureMapping, ['id'], 'propertyName')[0];
                                    var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, [idProperty]);
                                    var data = [];
                                    var fields = ["name", "value"];
                                    
                                    for (var i = 0, len = features.length; i < len; i+=1) {
                                        var feature = features[i];
                                        var obj = {
                                            name: feature.properties[displayProperty.propertyName],
                                            value: mapper.layers.toolMapping.getFeatureId(featureMapping, feature)
                                        };
                                        data.push(obj);
                                    }
                                    
                                    data.sort(function(a,b) {
                                        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                                        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                                        return 0;
                                    });
                                    
                                    extendedTool.component.emptyText = 'Select ' + displayProperty.displayName;
                                    extendedTool.component.applyEmptyText();
                                    
                                    var store = Ext.create('Ext.data.Store', {
                                        fields: fields,
                                        data: data
                                    });
                                    extendedTool.component.bindStore(store);
                                    extendedTool.component.setValue(callbackObj.selectedId);
                                }
                            });
                        }
                    });
                }
            },
            setPolygonSelected: function() {
                if (this.vectorAdded === true) {  // Remove existing features from vector.
                    this.vector.getSource().clear();
                } else {  // Vector hasn't been added to the map yet so add it here.
                    var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    
                    map.addLayer(this.vector);
                    this.vectorAdded = true;
                }
                
                if (this.layer === null) return;
                
                var cqlFilter = [];
                
                // Create cql filter based on the configured feature id property and selected feature id.
                var layerMapping = mapper.layers.toolMapping.getLayerConfigs(this.layer.id, this.owningBlock.blockConfigs.layers);
                var featureMapping = layerMapping.featureInfo;
                var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureMapping, ['id'], 'propertyName')[0];
                cqlFilter.push(idProperty + " = '" + this.component.getValue() + "'");
                
                var url = this.layer.source.wfs;
                var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+this.layer.srs+'&typeNames='+this.layer.name+"&outputFormat=application/json&cql_filter="+cqlFilter.join(' AND ');
                mapper.common.asyncAjax({
                    type: 'POST',
                    url: url,
                    params: params,
                    callbackObj: {
                        extendedTool: extendedTool,
                        boundary: this.layer
                    },
                    callback: function(response, callbackObj) {
                        var featureInfo = JSON.parse(response.responseText);
                        var extendedTool = callbackObj.extendedTool;
                        var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        var boundary = callbackObj.boundary;
                        var projection = boundary.srs;
                        var mapProjection = map.getView().getProjection().getCode();
                        var idProperty;
                        var feature;
                        var coords;
                        var displayText = '';
                        
                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(boundary.id, extendedTool.owningBlock.blockConfigs.layers);
                        var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName')[0];
                        
                        if (featureInfo.features.length > 1) {  // For multipolygons, combine all polygons into single feature.
                            feature = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperty)[0];
                        } else {
                            feature = featureInfo.features[0];
                        }
                        
                        var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['display'])[0];
                        var displayValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, displayProperty.propertyName);
                        displayText = displayProperty.displayName+': '+displayValue;
                        
                        var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                        if (cqlFilterDisplayBlock !== null) {
                            cqlFilterDisplayBlock.extendedTool.setFilter('subState', displayText);
                        }
                        
                        // Convert feature coordinates into map projection.
                        coords = mapper.OpenLayers.convertCoordProj(feature.geometry.coordinates, projection, mapProjection);
                        extendedTool.selectedCoords = coords;
                        extendedTool.selectedProjection = mapProjection;
                        var type = feature.geometry.type;
                        var geomName = feature.geometry_name;
                        
                        var olGeom;
                        if (type === 'MultiPolygon'){
                            olGeom = new ol.geom.MultiPolygon(coords);
                        } else {
                            olGeom = new ol.geom.Polygon(coords);
                        }
                        
                        var olFeature = new ol.Feature(olGeom);
                        olFeature.setStyle(new ol.style.Style({
                            stroke : new ol.style.Stroke({
                                color : 'rgba(0,0,255,1)',
                                width : 4
                            }),
                            fill : new ol.style.Fill({
                                color : 'rgba(0,0,0,0)'
                            })
                        }));
                        
                        extendedTool.vector.getSource().addFeature(olFeature);
                        
                        // Ensure the vector layer shows in front of other layers.
                        map.removeLayer(extendedTool.vector);
                        map.addLayer(extendedTool.vector);
                        
                        map.getView().fit(olGeom, map.getSize());
                        
                        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                        var mappedOverlays = mapper.layers.toolMapping.filterByTypes(extendedTool.owningBlock.blockConfigs.layers, ['overlay']);
                        
                        // Set cql filter on all configured overlays.
                        for (var i = 0, len = mappedOverlays.length; i < len; i+=1) {
                            var mappedOverlay = mappedOverlays[i];
                            var overlays = mapper.layers.query(
                                layersConfig.overlays,
                                {
                                    type: 'layer',
                                    mask: false,
                                    id: mappedOverlay.id
                                }
                            );
                            
                            if (overlays.length === 0) continue;
                            var overlay = overlays[0];
                            
                            if (!overlay.hasOwnProperty('cqlFilter')) {
                                overlay.cqlFilter = {};
                            }
                            if (!overlay.cqlFilter.hasOwnProperty(extendedTool.cqlFilterId)) {
                                overlay.cqlFilter[extendedTool.cqlFilterId] = null;
                            }
                            
                            var cqlGeomString = mapper.OpenLayers.getCqlGeometry(feature.geometry.coordinates, projection, overlay.srs);
                            var cqlFilter = 'INTERSECTS('+overlay.geometryName+','+type+cqlGeomString+')';
                            overlay.cqlFilter[extendedTool.cqlFilterId] = cqlFilter;
                            mapper.OpenLayers.forceLayerUpdateById(overlay.id, map);
                        }
                        
                        extendedTool.owningBlock.fire('select', extendedTool);
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                            layersConfig,
                            mapper.layers);
                    }
                });
            }
        };
        
        var regionBlock = owningBlock.getReferencedBlock('cRegionTool');
        if (regionBlock !== null) {
            regionBlock.on('regionSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === false) return;
                
                // Empty the options in the combobox.
                extendedTool.component.clearValue();
                extendedTool.component.bindStore(Ext.create('Ext.data.Store', {
                    fields: ['name', 'value'],
                    data: []
                }));
                extendedTool.component.emptyText = '';
                extendedTool.component.applyEmptyText();
                
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
            }, extendedTool);
        }
        
        // Register callback for when reset button is clicked.
        var resetQueryBlock = owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === false) return;
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers;
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                
                // Remove any cql filters on layers added by this tool.
                for (var j = 0, length = layerMapping.length; j < length; j+=1) {
                    var mappedLayer = layerMapping[j];
                    
                    var layers = mapper.layers.query(
                        layersConfig,
                        {
                            id: mappedLayer.id
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    for (var i = 0, len = layers.length; i < len; i+=1) {
                        var layer = layers[i];
                        if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter.hasOwnProperty(extendedTool.cqlFilterId)) {
                            layer.cqlFilter[extendedTool.cqlFilterId] = null;
                        }
                    }
                }
                
                // Remove displayed filter.
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
                
                // Empty the options in the combobox.
                extendedTool.component.clearValue();
                extendedTool.component.bindStore(Ext.create('Ext.data.Store', {
                    fields: ['name', 'value'],
                    data: []
                }));
                extendedTool.component.emptyText = '';
                extendedTool.component.applyEmptyText();
                
                // Remove vector from the map.
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
                
                extendedTool.component.hide();
            }, extendedTool);
        }
        
        // Register callback to the select bbox tool.
        var selectBboxBlock = owningBlock.getReferencedBlock('cSelectBBOXTool');
        if (selectBboxBlock !== null) {
            selectBboxBlock.on('aoiSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                // Hide the combobox.
                if (extendedTool.owningBlock.rendered === true) extendedTool.component.hide();
                extendedTool.lastSelectedStateId = null;
                
                // Remove displayed filter.
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
                
                // Remove vector from the map.
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
            }, extendedTool);
        }
        
        // Register callback to the layer radio group tool.
        var radioGroupBlock = owningBlock.getReferencedBlock('cSelectRegionMenuRadioGroup');
        if (radioGroupBlock !== null) {
            radioGroupBlock.on('select', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var radioGroupTool = postingObj;
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerId = radioGroupTool.selectedValue;
                
                var layers = mapper.layers.query(
                    layersConfig,
                    {
                        type: 'layer',
                        mask: false,
                        id: layerId
                    },
                    ['overlays', 'boundaries']
                );
                
                if (layerId === null || layers.length === 0) {
                    // Hide the combobox.
                    //if (extendedTool.owningBlock.rendered === true) extendedTool.component.hide();
                    extendedTool.layer = null;
                    
                    // Remove displayed filter.
                    var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                    if (cqlFilterDisplayBlock !== null) {
                        cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                    }
                    
                    // Remove vector from the map.
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                    
                    // Empty the options in the combobox.
                    extendedTool.component.clearValue();
                    extendedTool.component.bindStore(Ext.create('Ext.data.Store', {
                        fields: ['name', 'value'],
                        data: []
                    }));
                    extendedTool.component.emptyText = '';
                    extendedTool.component.applyEmptyText();
                } else {
                    var layer = layers[0];
                    extendedTool.layer = layer;
                    extendedTool.component.show();
                    extendedTool.setStore();
                }
            }, extendedTool);
        }
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.layerConfigUpdated,
            extendedTool);

        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var owningMapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
        if (!owningMapWindowBlock.hasOwnProperty('featureCqlFilterId')) {
            owningMapWindowBlock.featureCqlFilterId = mapper.common.getRandomString(32, 36);
        }
        extendedTool.cqlFilterId = owningMapWindowBlock.featureCqlFilterId;

        // Simple ComboBox using the data store
        var simpleCombo = Ext.create('Ext.form.field.ComboBox', {
            extendedTool: extendedTool,
            fieldLabel: '',
            autoRender: true,
            editable: false,
            width: 225,
            labelWidth: 50,
            hidden: true,
            style : {
                marginTop: "10px",
                marginLeft : '35px',
                marginRight : '35px',
            },
            store: Ext.create('Ext.data.Store', {
                fields: ['name', 'value'],
                data: []
            }),
            queryMode: 'local',
            typeAhead: true,
            valueField: 'value',
            displayField: 'name',
            listeners: {
                expand: function(combo) {
                    var val = combo.getValue();

                    if (val !== null) {
                        var rec = combo.findRecordByValue(combo.getValue()),
                        node = combo.picker.getNode(rec);

                        combo.picker.getTargetEl().setScrollTop(node.offsetTop);
                    }
                },
                select : function(combo, records) {
                    this.extendedTool.setPolygonSelected(this.getValue());
                },
                afterrender : function(combo, records) {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        });
        
        // Reset items in combobox when new state is selected.
        var statesComboBlock = extendedTool.owningBlock.getReferencedBlock('cStateTool');
        if (statesComboBlock !== null) {
            statesComboBlock.on('select', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                extendedTool.setStore();
                
                if (extendedTool.component.isHidden()) {
                    var menuRadioGroupBlock = extendedTool.owningBlock.getReferencedBlock('cSelectRegionMenuRadioGroup');
                    var values = menuRadioGroupBlock.component.getValue();
                    var value = null;
                    for (var prop in values) {
                        value = values[prop];
                    }
                    
                    if (value !== null) {
                        extendedTool.component.show();
                    }
                }
                
                // Remove displayed filter.
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
            }, extendedTool);
        }
        
        // Combobox will not be rendered until the menu is shown. In this case, if aoi was selected from another tool, load that selection.
        var selectOnMapTool = extendedTool.owningBlock.getReferencedBlock('cRegionSelectorMenu');
        if (selectOnMapTool !== null) {
            selectOnMapTool.on('menushow', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var statesBlock = extendedTool.owningBlock.getReferencedBlock('cStateTool');
                // Check if states block exists, is rendered, and has a state selected.
                if (statesBlock !== null && statesBlock.rendered === true && (statesBlock.extendedTool.stateValue !== null || statesBlock.component.getValue() !== null)) {
                    var menuRadioGroupBlock = extendedTool.owningBlock.getReferencedBlock('cSelectRegionMenuRadioGroup');
                    if (menuRadioGroupBlock !== null) {
                        var values = menuRadioGroupBlock.component.getValue();
                        var value = null;
                        for (var prop in values) {
                            value = values[prop];
                            break;
                        }
                        
                        if (value !== null) {
                            var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                            var layers = mapper.layers.query(
                                layersConfig,
                                {
                                    type: 'layer',
                                    id: value
                                },
                                ['overlays', 'boundaries']
                            );
                            
                            if (layers.length > 0) {
                                var layer = layers[0];
                                extendedTool.layer = layer;
                                extendedTool.component.show();
                                
                                if (extendedTool.selectedLayerId !== null) {
                                    if (extendedTool.selectedLayerId !== value) {
                                        extendedTool.selectedLayerId = null;
                                        extendedTool.setStore();
                                        return;
                                    }
                                    extendedTool.selectedLayerId = null;
                                }
                                
                                var idValue = null;
                                
                                var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                                var selectRegionTool = extendedTool.owningBlock.getReferencedBlock('cSelectRegionTool');
                                if (mapPanelBlock !== null && selectRegionTool !== null && selectRegionTool.extendedTool.hasOwnProperty('lastClickCoord')) {
                                    var map = mapPanelBlock.component.map;
                                    var featureInfo = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(layer, selectRegionTool.extendedTool.lastClickCoord, map);
                                    if (featureInfo.features.length > 0) {
                                        var feature = featureInfo.features[0];
                                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
                                        var idProperty = mapper.layers.toolMapping.filterByTypes(layerMapping.featureInfo, ['id'], 'propertyName')[0];
                                        idValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, idProperty);
                                    }
                                }
                                extendedTool.setStore(idValue);
                            }
                        }
                    }
                }
            }, extendedTool);
        }
        
        var selectRegionTool = extendedTool.owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionTool !== null) {
            selectRegionTool.on('aoiSelected', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var selectRegionTool = postingObj;
                var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                if (extendedTool.vectorAdded === true) {
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
                
                var menuRadioGroupBlock = extendedTool.owningBlock.getReferencedBlock('cSelectRegionToolRadioGroup');
                if (menuRadioGroupBlock !== null && menuRadioGroupBlock.rendered === true) {
                    var values = menuRadioGroupBlock.component.getValue();
                    var value = null;
                    for (var prop in values) {
                        value = values[prop];
                        break;
                    }
                }
                
                if (value !== null && extendedTool.owningBlock.rendered === false) {
                    var layerMapping = mapper.layers.toolMapping.getLayerConfigs(value, extendedTool.owningBlock.blockConfigs.layers);
                    extendedTool.selectedLayerId = value;
                }
                
                if (extendedTool.layer !== null && extendedTool.owningBlock.rendered === true) {
                    var featureInfo = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(extendedTool.layer, selectRegionTool.lastClickCoord, map);
                    if (featureInfo.features.length > 0) {
                        var feature = featureInfo.features[0];
                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(extendedTool.layer.id, extendedTool.owningBlock.blockConfigs.layers);
                        var idProperty = mapper.layers.toolMapping.filterByTypes(layerMapping.featureInfo, ['id'], 'propertyName')[0];
                        var idValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, idProperty);
                        extendedTool.component.setValue(idValue);
                    }
                }
            }, extendedTool);
        }
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
            extendedTool.owningBlock.itemDefinition.layerConfigUpdated,
            extendedTool);
        
        return simpleCombo;
    },
    layerConfigUpdated: function(postingObj, callbackObj, eventObj) {
        var extendedTool = callbackObj;
        extendedTool.setStore();
    }
}

export var toolName = "cSubStateTool";
export var tool = cSubStateTool;