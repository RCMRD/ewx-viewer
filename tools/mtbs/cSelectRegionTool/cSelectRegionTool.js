var cSelectRegionTool = {
    options: {
        events: ['aoiSelected'],
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cQueryParamsDisplay', 'cResetQuery', 'cSelectRegionToolRadioGroup', 'cRegionTool']
    },
    layersConfigChanged: function(layersConfig, callbackObj, postingObj) {
        var extendedTool = callbackObj;
        var layer = extendedTool.currentBoundary;
        
        // Check the current state of the wfs request.
        var requestStatus = extendedTool.wfsRequestStatus;
        if (extendedTool.lastRequest !== null) {
            if (requestStatus.start === true) {
                // If a request for another boundary has been started but not yet returned, cancel the request.
                if (requestStatus.returned === false) {
                    extendedTool.lastRequest.requestCanceled = true;
                } else {
                    // If a request for another boundary is currently building out features for that boundary, stop building the features.
                    if (extendedTool.intervalId !== null) {
                        window.clearInterval(extendedTool.intervalId);
                    }
                    requestStatus.returned = false;
                    requestStatus.complete = false;
                }
            }
        } else {
            requestStatus.start = true;
            requestStatus.returned = false;
            requestStatus.complete = false;
        }
        
        // Reset all information about the previous boundary.
        //extendedTool.currentBoundary = layer;
        extendedTool.vector.getSource().clear();
        extendedTool.featureInfo = {};
        extendedTool.selectedFeatureId = null;
        extendedTool.hoveredFeatureId = null;
        
        // Prevent loading all features if loadAllFeatures is configured as false for the selected boundary.
        var layerMapping = extendedTool.owningBlock.blockConfigs.layers;
        var mappedLayer = mapper.layers.toolMapping.getLayerConfigs(extendedTool.currentBoundary.id, layerMapping);
        if (mappedLayer.loadAllFeatures === false) {
            requestStatus.start = false;
            requestStatus.returned = false;
            requestStatus.complete = false;
            extendedTool.loadAllFeatures = false;
            return;
        }
        extendedTool.loadAllFeatures = true;
        
        if (extendedTool.component && extendedTool.component.pressed === true) {
            extendedTool.removeMapEvent();
            extendedTool.addMapEvent();
        }
        
        var url = layer.source.wfs;
        
        var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json';
        extendedTool.lastRequest = mapper.common.asyncAjax({
            type: 'POST',
            url: url,
            params: params,
            callbackObj: {
                extendedTool: extendedTool,
                boundary: layer
            },
            callback: function(response, callbackObj) {
                if (response.requestCanceled === true) {
                    return;
                }
                var extendedTool = callbackObj.extendedTool;
                extendedTool.wfsRequestStatus.returned = true;
                var featureInfo = JSON.parse(response.responseText);
                var projection = callbackObj.boundary.srs;
                
                var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var mapProjection = map.getView().getProjection().getCode();
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers;
                var mappedLayer = mapper.layers.toolMapping.getLayerConfigs(callbackObj.boundary.id, layerMapping);
                var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['display'], 'propertyName')[0];
                var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['id'], 'propertyName')[0];
                var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, [idProperty], 'area', 'perimeter');
                
                extendedTool.featureInfo = {};
                var vectorLayer = extendedTool.vector;
                var vectorSource = vectorLayer.getSource();
                vectorSource.clear(true);
                
                for (var i = 0, len = features.length; i < len; i+=1) {
                    var feature = features[i];
                    
                    var coordinates = feature.geometry.coordinates;
                    
                    var type = feature.geometry.type;
                    var geometry;
                    
                    if (projection !== mapProjection) {
                        coordinates = mapper.OpenLayers.convertCoordProj(coordinates, projection, mapProjection);
                    }
                    if (type === 'MultiPolygon') {
                        geometry = new ol.geom.MultiPolygon(coordinates);
                    } else if (type === 'Polygon') {
                        geometry = new ol.geom.Polygon(coordinates);
                    }
                    var olFeature = new ol.Feature(geometry);
                    
                    var boundary = extendedTool.currentBoundary;
                    var layerMapping = extendedTool.owningBlock.blockConfigs.layers;
                    var displayValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, displayProperty);
                    var idValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, idProperty);
                    
                    olFeature.setId(idValue);
                    extendedTool.featureInfo[idValue] = {
                        geometryName: feature.geometry_name,
                        geometryType: feature.geometry.type,
                        id: idValue,
                        name: displayValue,
                        properties: JSON.parse(JSON.stringify(feature.properties))
                    };
                    
                    if (idValue === extendedTool.hoveredFeatureId) {
                        olFeature.setStyle(extendedTool.getHoveredStyle());
                    } else if (idValue === extendedTool.selectedFeatureId) {
                        olFeature.setStyle(extendedTool.getSelectedStyle());
                    } else {
                        olFeature.setStyle(extendedTool.getStyle());
                    }
                    
                    vectorSource.addFeature(olFeature);
                }
                
                extendedTool.wfsRequestStatus.complete = true;
            }
        });
    },
    createExtendedTool: function(owningBlock) {
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;

        var toggleGroupId = null;
        if (owningMapWindow !== null) {
            toggleGroupId = owningMapWindow.toggleGroupId;
        }
        
        // Create the div to store the overlay.
        var overlayId = 'overlay-'+mapper.common.getRandomString(32, 36);
        var overlayDiv = document.createElement('div');
        overlayDiv.id = overlayId;
        overlayDiv.className = 'map-text-overlay';
        document.body.appendChild(overlayDiv);
        
        var extendedTool = {
            owningBlock: owningBlock,
            pressed: false,
            // Used to decide when and how to cancel new wfs requests.
            wfsRequestStatus: {
                sent: false,  // If true, the wfs request has been sent.
                returned: false,  // If true, the request has been returned.
                complete: false  // If true, all features are finished being added to the vector layer.
            },
            // Stores a reference to the last xmlHTTPRequest object.
            lastRequest: null,
            mapEventsAdded: false,
            toggleGroupId: toggleGroupId,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            // Stores the overlay to show feature info on hover.
            overlay: new ol.Overlay({
                element: document.getElementById(overlayId),
                positioning: 'bottom-left'
            }),
            overlayId: overlayId,
            vectors: {},
            toolUniqueID: mapper.common.getRandomString(32, 36),
            // Stores the event id keys for the map pointermove and click event listeners 
            // so they can be turned off without removing any other listeners that might be added.
            pointermoveEventKey: null,
            clickEventKey: null,
            // Stores the id of the last feature that is hovered over or selected.
            hoveredFeatureId: null,
            selectedFeatureId: null,
            // Stores extra properties about each feature from a featureInfo request.
            featureInfo: {},
            // Stores a reference to the boundary layer that the vector is currently storing features for.
            currentBoundary: null,
            // Used when building out features for the wfs request.
            featureInfoIndex: 0,
            featureInfoLength: 0,
            intervalId: null,
            isHighlighting: false,
            isSelecting: false,
            loadAllFeatures: false,
            selectedCoords: null,
            selectedProjection: null,
            setCqlFilter: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var cqlFilterDisplayBlock = this.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                var boundary = this.currentBoundary;
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = this.owningBlock.blockConfigs.layers;
                var overlays = [];
                var parentLayerMapping = null, childLayerMapping = null;
                var mapProjection = map.getView().getProjection().getCode();
                
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    var layerMap = layerMapping[i];
                    
                    if (layerMap.id === boundary.id) {
                        if (parentLayerMapping === null && layerMap.type === 'child') {
                            childLayerMapping = {
                                layerConfigs: boundary,
                                layerMap: layerMap
                            };
                            // Continue looping so both child and parent layers can be found.
                            continue;
                        } else if (layerMap.type === 'parent') {
                            parentLayerMapping = {
                                layerConfigs: boundary,
                                layerMap: layerMap
                            };
                            // If the parent layer is the currently selected boundary, no child layer can be selected so break out of loop.
                            //break;
                        }
                    }
                    
                    var layer = mapper.layers.query(
                        layersConfig,
                        {
                            type: 'layer',
                            mask: false,
                            id: layerMap.id
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layer.length > 0) {
                        if (layerMap.type === 'parent') {
                            parentLayerMapping = {
                                layerConfigs: layer[0],
                                layerMap: layerMap
                            };
                        } else if (layerMap.type === 'overlay') {
                            overlays.push(layer[0]);
                        }
                    }
                }
                
                if (cqlFilterDisplayBlock !== null) {
                    var parentFeatureInfo = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(parentLayerMapping.layerConfigs, this.lastClickCoord, map);
                    var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(parentLayerMapping.layerMap.featureInfo, ['display'], 'propertyName');
                    var displayValue = mapper.layers.toolMapping.getFeatureInfoValue(parentFeatureInfo.features, displayProperty[0]);
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', 'State: '+displayValue);
                }
                
                if (childLayerMapping !== null) {
                    if (cqlFilterDisplayBlock !== null) {
                        var displayText = '';
                        var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(childLayerMapping.layerMap.featureInfo, ['display'])[0];
                        var displayValue = mapper.layers.toolMapping.getFeatureInfoValue(this.featureInfo[this.selectedFeatureId], displayProperty.propertyName);
                        var displayName = displayProperty.displayName;
                        displayText = displayProperty.displayName+': '+displayValue;
                        cqlFilterDisplayBlock.extendedTool.setFilter('subState', displayText);
                    }
                } else {
                    if (cqlFilterDisplayBlock !== null) {
                        cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                    }
                }
                
                for (var i = 0, len = overlays.length; i < len; i+=1) {
                    var overlay = overlays[i];
                    var cqlFilter = null;
                    if (!overlay.hasOwnProperty('cqlFilter')) {
                        overlay.cqlFilter = {};
                    }
                    
                    if (this.selectedFeatureId !== null) {
                        var featureProperties = this.featureInfo[this.selectedFeatureId];
                        var coords = this.vector.getSource().getFeatureById(this.selectedFeatureId).getGeometry().getCoordinates();
                        var geomString = mapper.OpenLayers.getCqlGeometry(JSON.parse(JSON.stringify(coords)), mapProjection, overlay.srs);
                        cqlFilter = "INTERSECTS("+overlay.geometryName+","+featureProperties.geometryType.toUpperCase()+geomString+")";
                    }
                    
                    overlay.cqlFilter[this.cqlFilterId] = cqlFilter;
                    mapper.OpenLayers.forceLayerUpdateById(overlay.id, map);
                }
                
                this.selectedCoords = this.vector.getSource().getFeatureById(this.selectedFeatureId).getGeometry().getCoordinates();
                this.selectedProjection = mapProjection;
                
                this.owningBlock.fire('aoiSelected', this, this.selectedCoords);
                if (overlays.length > 0) {
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        layersConfig,
                        mapper.layers);
                }
                
                map.removeLayer(this.vector);
                map.addLayer(this.vector);
            },
            getSelectedStyle: function() {
                return new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : 'rgba(0,0,255,1)',
                        width : 4
                    }),
                    fill : new ol.style.Fill({
                        color : 'rgba(0,0,0,0)'
                    })
                });
            },
            getHoveredStyle: function() {
                return new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : 'rgba(255,154,0,0.5)',
                        width : 1
                    }),
                    fill : new ol.style.Fill({
                        color : 'rgba(255,154,0,0.5)'
                    })
                });
            },
            getStyle: function(color) {
                if (typeof(color) === 'undefined') {
                    color = 'rgba(0,0,0,0)';
                }
                
                var fill = new ol.style.Fill({
                    color : color
                });

                var style = new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : color,
                        width : 2
                    }),
                    fill : fill
                });
                
                return style;
            },
            resetFeatureStyle: function(id) {
                var feature = this.vector.getSource().getFeatureById(id);
                feature.setStyle(this.getStyle());
            },
            getFeatureInfo: function(coord) {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                var featureInfo = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(this.currentBoundary, coord, map);
                if (featureInfo.emptyFeatures === true) return null;
                
                return featureInfo;
            },
            getOLGeometry: function(coords, type, coordProjection) {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
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
            getOLFeature: function(feature, projection) {
                var coordinates = feature.geometry.coordinates;
                
                var geometry = this.getOLGeometry(coordinates, feature.geometry.type, projection);
                var olFeature = new ol.Feature(geometry);
                
                var boundary = this.currentBoundary;
                var layerMapping = this.owningBlock.blockConfigs.layers;
                var mappedLayer = mapper.layers.toolMapping.getLayerConfigs(boundary.id, layerMapping);
                
                var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['display'], 'propertyName')[0];
                var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['id'], 'propertyName')[0];
                var displayValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, displayProperty);
                var idValue = mapper.layers.toolMapping.getFeatureInfoValue(feature, idProperty);
                
                olFeature.setId(idValue);
                this.featureInfo[idValue] = {
                    geometryName: feature.geometry_name,
                    geometryType: feature.geometry.type,
                    id: idValue,
                    name: displayValue,
                    properties: JSON.parse(JSON.stringify(feature.properties))
                };
                
                return olFeature;
            },
            setPopup: function(coords, featureId) {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                var featureInfo = this.featureInfo[featureId];
                document.getElementById(this.overlayId).innerHTML = featureInfo.name;
                this.overlay.setPosition(coords);
            },
            handlePointermove: function(event) {
                var coord = event.coordinate;
                if (this.currentBoundary === null || this.isSelecting === true) return;
                this.isHighlighting = true;
                
                var olFeatures = this.vector.getSource().getFeaturesAtCoordinate(coord);
                if (olFeatures.length > 0) { // If feature already exists in vector layer.
                    var olFeature = olFeatures[0];
                    var olFeatureId = olFeature.getId();
                    this.setPopup(coord, olFeatureId);
                    if (olFeatureId !== this.hoveredFeatureId) { // Ensure we are not hovering over the already highlighted polygon.
                        if (this.hoveredFeatureId !== null) {
                            if (this.loadAllFeatures === true) {
                                this.resetFeatureStyle(this.hoveredFeatureId);
                            } else {
                                var existingFeature = this.vector.getSource().getFeatureById(this.hoveredFeatureId);
                                if (existingFeature !== null) {
                                    this.vector.getSource().removeFeature(existingFeature);
                                }
                            }
                        }
                        
                        if (olFeatureId !== this.selectedFeatureId) { // Ensure we are not trying to highlight the selected feature.
                            this.hoveredFeatureId = olFeatureId;
                            var style = this.getHoveredStyle();
                            olFeature.setStyle(style);
                        } else {
                            this.hoveredFeatureId = null;
                        }
                    }
                } else if (this.wfsRequestStatus.complete === false) {
                    if (this.hoveredFeatureId !== null) {
                        if (this.loadAllFeatures === true) {
                            this.resetFeatureStyle(this.hoveredFeatureId);
                        } else {
                            var olFeature = this.vector.getSource().getFeatureById(this.hoveredFeatureId);
                            if (olFeature !== null) {
                                this.vector.getSource().removeFeature(olFeature);
                            }
                        }
                    }
                    var layer = extendedTool.currentBoundary;
                    var featureInfo = this.getFeatureInfo(coord);
                    if (featureInfo !== null) {
                        var style = this.getHoveredStyle();
                        var projection = layer.srs;
                        var olFeature = this.getOLFeature(featureInfo.features[0], projection);
                        var olFeatureId = olFeature.getId();
                        this.setPopup(coord, olFeatureId);
                        if (this.selectedFeatureId === olFeatureId) {
                            this.hoveredFeatureId = null;
                            return;
                        }
                        this.hoveredFeatureId = olFeatureId;
                        var existingFeature = this.vector.getSource().getFeatureById(olFeatureId);
                        if (existingFeature !== null) {
                            existingFeature.setStyle(style);
                        } else {
                            olFeature.setStyle(style);
                            this.vector.getSource().addFeature(olFeature);
                        }
                    } else {
                        this.hoveredFeatureId = null;
                    }
                } else if (this.hoveredFeatureId !== null) {
                    var olFeature = this.vector.getSource().getFeatureById(this.hoveredFeatureId);
                    if (olFeature !== null) {
                        if (this.loadAllFeatures === true) {
                            olFeature.setStyle(this.getStyle());
                        } else {
                            this.vector.getSource().removeFeature(olFeature);
                        }
                    }
                    this.hoveredFeatureId = null;
                }
                
                this.isHighlighting = false;
            },
            handleClick: function(event) {
                if (this.currentBoundary === null) return;
                if (this.isHighlighting === true) { // If its in the middle of highlighting a feature, wait for the highlight to finish.
                    this.intervalId = setInterval(function(extendedTool, event) {
                        if (extendedTool.isHighlighting === false) {
                            clearInterval(extendedTool.intervalId);
                            extendedTool.handleClick(event);
                        }
                    }, 10, this, event);
                    return;
                }
                this.isSelecting = true;
                this.lastClickCoord = event.coordinate;
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                if (this.hoveredFeatureId !== null) {
                    if (this.loadAllFeatures === true) {
                        this.resetFeatureStyle(this.hoveredFeatureId);
                    } else {
                        var olFeature = this.vector.getSource().getFeatureById(this.hoveredFeatureId);
                        if (olFeature) {
                            this.vector.getSource().removeFeature(olFeature);
                        }
                    }
                    this.hoveredFeatureId = null;
                }
                
                var olFeatures = this.vector.getSource().getFeaturesAtCoordinate(event.coordinate);
                if (olFeatures.length > 0) {
                    var olFeature = olFeatures[0];
                    /* If the feature boundary we're selecting is the same as previous
                     * just set the style so the table doesn't get reload */
                    if (this.selectedFeatureId !== olFeature.getId()){
                        if (this.selectedFeatureId !== null) {
                            if (this.loadAllFeatures === true) {
                                this.resetFeatureStyle(this.selectedFeatureId);
                            } else {
                                var selectedFeature = this.vector.getSource().getFeatureById(this.selectedFeatureId);
                                if (selectedFeature) {
                                    this.vector.getSource().removeFeature(selectedFeature);
                                }
                            }
                        } 
                        this.selectedFeatureId = olFeature.getId();
                        olFeature.setStyle(this.getSelectedStyle());         
                        this.setCqlFilter();
                        map.getView().fit(olFeature.getGeometry(), map.getSize());
                    }
                } else {
                    if (this.selectedFeatureId !== null) {
                        if (this.loadAllFeatures === true) {
                            this.resetFeatureStyle(this.selectedFeatureId);
                        } else {
                            var selectedFeature = this.vector.getSource().getFeatureById(this.selectedFeatureId);
                            if (selectedFeature) {
                                this.vector.getSource().removeFeature(selectedFeature);
                            }
                        }
                        this.selectedFeatureId = null;
                    } 
                    var featureInfo = this.getFeatureInfo(event.coordinate);
                    var layer = this.currentBoundary;
                    if (featureInfo !== null) {
                        var projection = layer.srs;
                        var olFeature = this.getOLFeature(featureInfo.features[0], projection);
                        this.selectedFeatureId = olFeature.getId();
                        var style = this.getSelectedStyle();
                        olFeature.setStyle(style);
                        this.vector.getSource().addFeature(olFeature);
                        this.setCqlFilter();
                        map.getView().fit(olFeature.getGeometry(), map.getSize());
                    }
                }
                this.isSelecting = false;
            },
            addMapEvent: function() {
                if (this.mapEventsAdded === true) return;
                this.mapEventsAdded = true;
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                map.addLayer(this.vector);
                map.addOverlay(this.overlay);
                
                this.pointermoveEventKey = map.on('pointermove', function(event) {
                    this.handlePointermove(event);
                }, this);
                
                this.clickEventKey = map.on('click', function(event) {
                    this.handleClick(event);
                }, this);
            },
            removeMapEvent: function() {
                if (this.mapEventsAdded === false) return;
                this.mapEventsAdded = false;
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var source = this.vector.getSource();
                if (this.selectedFeatureId !== null) {
                    var selectedFeature = source.getFeatureById(this.selectedFeatureId);
                    if (selectedFeature) {
                        selectedFeature.setStyle(this.getStyle());
                    }
                }
                if (this.hoveredFeatureId !== null) {
                    var hoveredFeature = source.getFeatureById(this.hoveredFeatureId);
                    if (hoveredFeature) {
                        hoveredFeature.setStyle(this.getStyle());
                    }
                }
                this.selectedFeatureId = null;
                this.hoveredFeatureId = null;
                
                this.overlay.getElement().innerHTML = '';
                this.overlay.setPosition([-92783496, 0]);
                
                map.unByKey(this.pointermoveEventKey);
                map.unByKey(this.clickEventKey);
                map.removeLayer(this.vector);
                map.removeOverlay(this.overlay);
            },
            setSelected: function(boundary) {
                if (this.pressed === true) {
                    if (boundary === false) {
                        this.currentBoundary = null;
                    } else {
                        this.currentBoundary = boundary;
                        this.vector.getSource().clear();
                        this.featureInfo = {};
                        this.selectedFeatureId = null;
                        this.hoveredFeatureId = null;
                        var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        map.removeLayer(this.vector);
                        map.addLayer(this.vector);
                    }
                } else if (boundary !== false) {
                    this.currentBoundary = boundary;
                }
            },
            toggle: function(state) {
                if (state === true) {
                    if (this.pressed === false) {
                        var siblings = this.owningBlock.parent.childItems;
                        for (var i = 0, len = siblings.length; i < len; i+=1) {
                            var sibling = siblings[i];
                            if (sibling.id === this.owningBlock.id) continue;
                            if (sibling.extendedTool.hasOwnProperty('toggle')) {
                                sibling.extendedTool.toggle(false);
                            } else if (sibling.component.enableToggle === true && sibling.component.pressed === true) {
                                sibling.component.toggle(false);
                            }
                        }
                        
                        this.pressed = true;
                        this.addMapEvent();
                        this.component.addCls('selected-menu-btn');
                    }
                } else {
                    this.pressed = false;
                    this.component.removeCls('selected-menu-btn');
                    this.removeMapEvent();
                }
            }
        };
        
        var regionBlock = owningBlock.getReferencedBlock('cRegionTool');
        if (regionBlock !== null) {
            regionBlock.on('regionSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
                
                extendedTool.toggle(false);
            }, extendedTool);
        }
        
        var resetQueryBlock = owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var overlays = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        type: 'layer',
                        mask: false
                    }
                );
                
                for (var i = 0, len = overlays.length; i < len; i+=1) {
                    var overlay = overlays[i];
                    if (overlay.hasOwnProperty('cqlFilter') && overlay.cqlFilter.hasOwnProperty(extendedTool.cqlFilterId)) {
                        overlay.cqlFilter[extendedTool.cqlFilterId] = null;
                    }
                }
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
                
                extendedTool.toggle(false);
            }, extendedTool);
        }
        
        var radioGroupBlock = owningBlock.getReferencedBlock('cSelectRegionToolRadioGroup');
        if (radioGroupBlock !== null) {
            radioGroupBlock.on('select', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var radioGroupTool = postingObj;
                var value = radioGroupTool.selectedValue;
                
                if (value !== null) {
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var layers = mapper.layers.query(
                        layersConfig,
                        {
                            type: 'layer',
                            mask: false,
                            id: value
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layers.length > 0) {
                        extendedTool.setSelected(layers[0]);
                    }
                    extendedTool.owningBlock.itemDefinition.layersConfigChanged(layersConfig, extendedTool);
                }
            }, extendedTool);
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
        
        var extTool = {
            xtype: 'button',
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: 'fa fa-aoi-map-select',
            tooltip : block.tooltip,
            width: block.width,
            height: block.height,
            id : extendedTool.toolUniqueID,
            listeners : {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            },
            menu: Ext.create('Ext.menu.Menu', {
                extendedTool: extendedTool,
                items: [{
                    xtype: 'panel',
                    style: 'padding: 0; margin: 0;',
                    bodyStyle: 'padding: 0; margin: 0;',
                    items: menu
                }],
                listeners : {
                    hide : function () {
                        //refocus the mapwindow
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        var mapperWindow = mapWindowBlock.extendedTool;
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                            mapperWindow,
                            mapperWindow);
                    },
                    show : function () {
                        this.extendedTool.toggle(true);
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                    }
                }
            })
        }
        
        return extTool;
    }
}

export var toolName = "cSelectRegionTool";
export var tool = cSelectRegionTool;