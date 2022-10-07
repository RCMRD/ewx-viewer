/* The StateTool is a combobox that is populated using a wfs
   call to get the state names from a states layer */
var cStateTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cSelectRegionTool', 'cSelectBBOXTool', 'cSubStateTool', 'cQueryParamsDisplay', 'cResetQuery', 'cRegionTool'],
        events: ['select']
    },
    layerConfigUpdated: function(postingObj, callbackObj, eventObj) {
        var extendedTool = callbackObj;
        if (extendedTool.vectorAdded === true) {
            var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            map.removeLayer(extendedTool.vector);
            map.addLayer(extendedTool.vector);
        }
    },
    // Callback function that is called when area selector tool is used
    // Set the value of the state combobox if its valid
    aoiSelectedCallback: function(callbackObj, postingObj) {
        var extendedTool = callbackObj;
        var aoiTool = postingObj;
        var stateValue = null;
        var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
        var map = mapPanelBlock.component.map;
        
        extendedTool.vector.getSource().clear();
        if (extendedTool.vectorAdded === true) {
            extendedTool.vectorAdded = false;
            map.removeLayer(extendedTool.vector);
        }

        /* Callback function that sets the state value on the tool if valid */
        var setValueCallback = function(value)
        {
            if (extendedTool.owningBlock.rendered === true) {
                extendedTool.component.setValue(value);
                extendedTool.stateValue = null;
            } else {
                extendedTool.stateValue = value;
            }

            if (stateValue === null) {
                //Set the state on the Query Params Display block to null
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                }
            }
        }
        /* Only set the value if the selectRegionTool was used since selectBBOXtool doesn't have a state */
        if (typeof(aoiTool.lastClickCoord) !== 'undefined' && typeof(aoiTool.selectedFeatureId) !== 'undefined') {
            /* Callback function that gets the stateValue of the features */
            var featureInfoCallback = function(returnFeatures)
            {
                    if (returnFeatures.features.length > 0) {
                        var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                        var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
                        stateValue = returnFeatures.features[0].properties[idProperty];
                    }
                    setValueCallback(stateValue);
            }

            // Retrieve feature info from states layer using the aoi tool's last clicked coordinates.
            var statesBoundary = extendedTool.getStatesLayer();
            mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMapUsingPromises(statesBoundary, aoiTool.lastClickCoord, map, featureInfoCallback);
            //featureInfoCallback(mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(statesBoundary, aoiTool.lastClickCoord, map));

        } else {
            setValueCallback(stateValue);
        }
    },
    createExtendedTool : function(owningBlock) {
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var extendedTool = {
            owningBlock: owningBlock,
            selectedStateId: null,
            stateValue: null,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            vectorAdded: false,
            selectedCoords: null,
            selectedProjection: null,
            /* getStatesLayer will get the states layer to be used to query for the state names
             * and also the geoms once a state is selected */
            getStatesLayer() {
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = this.owningBlock.blockConfigs.layers[0];
                var layer = mapper.layers.query(
                    layersConfig,
                    {
                        id: layerMapping.id
                    },
                    ['overlays', 'boundaries']
                )[0];
                
                return layer;

            },
            /* getStatesStore will query the states layer for the state name
             * and state_fips and put it into a data store for loading the combobbox */
            getStatesStore() {
                var layer = this.getStatesLayer();
                var layerMapping = this.owningBlock.blockConfigs.layers[0];
                var featureInfoMapping = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['display', 'id']);
                var properties = [];
                
                for (var i = 0, len = featureInfoMapping.length; i < len; i+=1) {
                    properties.push(featureInfoMapping[i].propertyName);
                }

                var propertyNameParam = '&propertyName='+properties.join(',');
                var url = layer.source.wfs;
                var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json'+propertyNameParam;
                //var url = 'http://igskmncnvs191.cr.usgs.gov:8080/geoserver/mtbs/wfs?service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=json'+propertyNameParam+cqlFilterParam;
                var store = [];
                mapper.common.asyncAjax({
                    type: 'POST',
                    url: url,
                    params: params,
                    callbackObj: this,
                    callback: function(response, extendedTool) {
                        //This returns the json of the state_fips, state for each record
                        var stateCollection = JSON.parse(response.responseText);
                        var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                        var featureInfoMapping = layerMapping.featureInfo;
                        var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['id'], 'propertyName');
                        var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display'], 'propertyName')[0];
                        var fields = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display', 'id'], 'propertyName');
                        
                        var features = mapper.OpenLayers.combineFeaturesByProperties(stateCollection.features, idProperties);
                        var states = [];
                        //var lookup = {};
                        //Some states can have more than one geometry due to islands, etc so
                        //make the list distinct
                        for (var v = 0, len = features.length; v < len; v +=1)
                        {
                            var feature = features[v];
                            var obj = {};
                            for (var i = 0, length = featureInfoMapping.length; i < length; i+=1) {
                                var featureInfoMap = featureInfoMapping[i];
                                var value = mapper.layers.toolMapping.getFeatureInfoValue(feature, featureInfoMap.propertyName);
                                obj[featureInfoMap.propertyName] = value;
                            }
                            states.push(obj);
                        }
                        //Sort the list alphabetically
                        states.sort(function(a,b) {
                            if (a[displayProperty].toLowerCase() < b[displayProperty].toLowerCase()) {
                                return -1;
                            }
                            if (a[displayProperty].toLowerCase() > b[displayProperty].toLowerCase()) {
                                return 1;
                            }
                            return 0;
                        });
                        // The data store holding the states
                        var store = Ext.create('Ext.data.Store', {
                            fields : fields,
                            data: states
                        });
                        /* Bind the store to the combobox */
                        extendedTool.component.bindStore(store);
                        
                        if (extendedTool.hasOwnProperty('stateValue') && extendedTool.stateValue !== null) {
                            extendedTool.component.setValue(extendedTool.stateValue);
                        }
                    }
                });
            },
            /* Using our coordinates get an open layers object */
            getOLGeometry: function(coords, type, coordProjection) {
                var mapPanelBlock = this.owningblock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var mapProjection = map.getView().getProjection().getCode();
                
                if (coordProjection !== mapProjection) {
                    coords = mapper.OpenLayers.convertCoordProj(coords, coordProjection, mapProjection);
                }
                if (type === 'MultiPolygon') {
                    return new ol.geom.MultiPolygon(coords);
                } else if (type === 'Polygon') {
                    return new ol.geom.Polygon(coords);
                }
                return null;
            },
            /* Get the states geometry */
            getStateGeometry: function() {
                if (this.vectorAdded === true) {
                    this.vector.getSource().clear();
                } else {
                    var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.addLayer(this.vector);
                    this.vectorAdded = true;
                }
                var stateId = extendedTool.selectedStateId;
                var layerMapping = this.owningBlock.blockConfigs.layers[0];
                var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
                var cqlIdQuery = idProperty + " = '" + stateId + "'";
                var cqlFilterParam='&CQL_FILTER='+cqlIdQuery;
                var layer = this.getStatesLayer();
                var url = layer.source.wfs;
                var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json'+cqlFilterParam;
                mapper.common.asyncAjax({
                    type: 'POST',
                    url: url,
                    params: params,
                    callbackObj: {
                        layer: layer,
                        extendedTool: this
                    },  
                    callback: function(response, callbackObj) {
                        
                        var layer = callbackObj.layer;
                        var extendedTool = callbackObj.extendedTool;
                        var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        var mapProjection = map.getView().getProjection().getCode();
                        var featureCollection = JSON.parse(response.responseText);
                        var statesLayerCRS = layer.srs;
                        var features = featureCollection.features;
                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
                        var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                        var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['display'], 'propertyName')[0];
                        
                        var mappedOverlays = mapper.layers.toolMapping.filterByTypes(extendedTool.owningBlock.blockConfigs.layers, ['overlay']);
                        //var polygons = [];
                        
                        /*for (var i = 0, len = features.length; i < len; i+=1) {
                            var feature = features[i];
                            var coordinates = feature.geometry.coordinates;
                            polygons = polygons.concat(coordinates);                                 
                        }*/
                        if (features.length > 1) {
                            var feature = mapper.OpenLayers.combineFeaturesByProperties(features, idProperties)[0];
                        } else {
                            var feature = features[0];
                        }
                        if (mapProjection !== statesLayerCRS) {
                            extendedTool.selectedCoords = mapper.OpenLayers.convertCoordProj(JSON.parse(JSON.stringify(feature.geometry.coordinates)), statesLayerCRS, mapProjection);
                        } else {
                            extendedTool.selectedCoords = feature.geometry.coordinates;
                        }
                        extendedTool.selectedProjection = mapProjection;
                        var vector = new ol.layer.Vector({
                            source: new ol.source.Vector()
                        });
                        
                        var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                        if (cqlFilterDisplayBlock !== null) {
                            cqlFilterDisplayBlock.extendedTool.setFilter('state', 'State: '+feature.properties[displayProperty]);
                        }
                        
                        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                        
                        var id = callbackObj.extendedTool.cqlFilterId;
                        
                        for (var i = 0, len = mappedOverlays.length; i < len; i+=1) {
                            var mappedOverlay = mappedOverlays[i];
                            
                            var overlayers = mapper.layers.query(
                                layersConfig,
                                {
                                    type: 'layer',
                                    mask: false,
                                    id: mappedOverlay.id
                                },
                                ['overlays', 'boundaries']
                            );
                            
                            if (overlayers.length === 0) continue;
                            var overlayer = overlayers[0];
                            
                            if (!overlayer.hasOwnProperty('cqlFilter')) {
                                overlayer.cqlFilter = {};
                            }
                            if (!overlayer.cqlFilter.hasOwnProperty(id)) {
                                overlayer.cqlFilter[id] = '';
                            }
                            
                            var statesLayerCRS = layer.srs;
                            var geomString = mapper.OpenLayers.getCqlGeometry(feature.geometry.coordinates, statesLayerCRS, overlayer.srs);
                            var cqlFilter = "INTERSECTS("+overlayer.geometryName+", MULTIPOLYGON"+geomString+")";
                            overlayer.cqlFilter[id] = cqlFilter;

                            /* Update the map with the fires based on the cql filter */
                            mapper.OpenLayers.forceLayerUpdateById(overlayer.id, map);
                        }

                        /* Zoom in on the map to the state selected */
                        var coordinates = mapper.OpenLayers.convertCoordProj(feature.geometry.coordinates, statesLayerCRS, mapProjection);
                        var type = feature.geometry.type;
                        var olGeom;
                        if (type === 'MultiPolygon'){
                            olGeom = new ol.geom.MultiPolygon(coordinates);
                        } else {
                            olGeom = new ol.geom.Polygon(coordinates);
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
                        
                        map.getView().fit(olGeom, map.getSize());
                        
                        map.removeLayer(extendedTool.vector);
                        map.addLayer(extendedTool.vector);

                        /* Update the Fire statistics panel */
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
                
                extendedTool.component.setValue(null);
                extendedTool.stateValue = null;
                
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                }
            }, extendedTool);
        }
        
        var resetQueryBlock = owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === false) return;
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layers = mapper.layers.query(
                    layersConfig,
                    {
                        id: layerMapping.id
                    },
                    ['overlays', 'boundaries']
                );
                
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter.hasOwnProperty(extendedTool.cqlFilterId)) {
                        layer.cqlFilter[extendedTool.cqlFilterId] = null;
                    }
                }
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                }
                
                extendedTool.component.setValue(null);
                extendedTool.stateValue = null;
                
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
            }, extendedTool);
        }
        
        /* Set up the listener for select region tool so the state gets set to the selected state */
        var selectRegionToolBlock = owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionToolBlock !== null) {
            selectRegionToolBlock.on('aoiSelected', owningBlock.itemDefinition.aoiSelectedCallback, extendedTool);
        }
        
        /* Set up the listener for the bbox tool so the state gets set to null */
        var selectBBOXToolBlock = owningBlock.getReferencedBlock('cSelectBBOXTool');
        if (selectBBOXToolBlock !== null) {
            selectBBOXToolBlock.on('aoiSelected', owningBlock.itemDefinition.aoiSelectedCallback, extendedTool);
        }
        
        var subStateBlock = owningBlock.getReferencedBlock('cSubStateTool');
        if (subStateBlock !== null) {
            subStateBlock.on('select', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
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
        
        var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
        var featureInfoMapping = layerMapping.featureInfo;
        var valueField = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['id'], 'propertyName')[0];
        var displayField = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display'], 'propertyName')[0];

        // Simple ComboBox using the data store
        var simpleCombo = Ext.create('Ext.form.field.ComboBox', {
            extendedTool: extendedTool,
            fieldLabel: 'State',
            autoRender: true,
            editable: false,
            region : "north",
            width: 225,
            labelWidth: 50,
            style : {
                marginTop: "10px",
                marginLeft : '35px',
                marginRight : '35px',
            },
            queryMode: 'local',
            typeAhead: true,
            valueField: valueField,
            displayField: displayField,
            listeners: {
                expand: function(combo) {
                    var val = combo.getValue();

                    if (val !== null) {
                        var rec = combo.findRecordByValue(combo.getValue()),
                        node = combo.picker.getNode(rec);

                        combo.picker.getTargetEl().setScrollTop(node.offsetTop);
                    }
                },
                /* When a new state is selected, it should get the geometry of that state from the 
                   states layer and display the fires for that specific state.
                   It will also then need to populate the counties or watershed combobox
                   based on which ever one is selected */
                select : function(t, options) {
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var layers = mapper.layers.query(
                        layersConfig.overlays,
                        {
                            type : 'layer',
                            display : true,
                            mask: false
                        }
                    );

                    this.extendedTool.selectedStateId = t.value;
                    this.extendedTool.getStateGeometry();

                },
                afterrender : function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.getStatesStore();
                }
            }
        });
        return simpleCombo;
    }
}

export var toolName = "cStateTool";
export var tool = cStateTool;