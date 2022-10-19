var cGraphTool = {
    options: {
        events: ['chartrequested', 'featureinfoupdated', 'mapclicked'],
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    layersConfigUpdated: function(eventObject, callbackObject, postingObject) {
        var extendedTool = callbackObject;
        var mapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
        if (mapWindowBlock.id !== postingObject.owningBlock.id) return;
        extendedTool.setEnabled();
    },
    createExtendedTool: function(owningBlock) {
        var toolUniqueID = mapper.common.getRandomString(32, 36);
        
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        var mapPanelBlock = owningBlock.getReferencedBlock('cMapPanel');
        
        // Create the div to store the overlay.
        var overlayId = 'overlay-'+mapper.common.getRandomString(32, 36);
        var overlayDiv = document.createElement('div');
        overlayDiv.id = overlayId;
        overlayDiv.className = 'map-text-overlay';
        document.body.appendChild(overlayDiv);
        
        var extendedGraphTool = {
            owningBlock: owningBlock,
            toggleGroupId: owningMapWindow.toggleGroupId,
            enabled: true,
            //after this gets given away to the toolbar it is copied
            //and can no longer be referenced from this object
            //directly
            //you have to use Ext.getCmp(this.extIdentifyToolID);
            //to access it
            //dont forget that
            //relatedOLMap : relatedOLMap,

            extToolID : toolUniqueID,
            
            // Used to decide when and how to cancel new wfs requests.
            /*wfsRequestStatus: {
                sent: false,  // If true, the wfs request has been sent.
                returned: false,  // If true, the request has been returned.
                complete: false  // If true, all features are finished being added to the vector layer.
            },*/
            
            // Stores a reference to the last xmlHTTPRequest object.
            lastRequest: null,
            
            // Stores the overlay to show feature info on hover.
            overlay: new ol.Overlay({
                element: document.getElementById(overlayId),
                positioning: 'bottom-left',
				offset: [1, -1]
            }),
            overlayId: overlayId,
            pointermoveEventKey: null,
            currentLayer: null,
            mappedLayer: null,
            lastCoords: null,
            overlayAdded: false,
            addPopup: function(map) {
                if (this.overlayAdded === false) {
                    this.overlayAdded = true;
                    map.addOverlay(this.overlay);
                }
            },
            setPopup: function(coords, featureName) {
                document.getElementById(this.overlayId).innerHTML = featureName;
                this.overlay.setPosition(coords);
            },
            removePopup: function(map) {
                if (this.overlayAdded === true) {
                    this.overlayAdded = false;
                    map.removeOverlay(this.overlay);
                }
            },
            
            addMapEvent: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                if (mapPanelBlock.rendered === false) {
                    mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj, eventObj) {
                        var extendedTool = callbackObj;
                        extendedTool.setPointermove();
                    }, this);
                } else {
                    this.setPointermove();
                }
            },
            removeMapEvent: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                map.unByKey(this.pointermoveEventKey);
                this.pointermoveEventKey = null;
                this.removePopup(map);
            },
            
            setPointermove: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                if (this.pointermoveEventKey !== null) {
                    map.unByKey(this.pointermoveEventKey);
                }
                var boundary = this.currentLayer;
                this.pointermoveEventKey = map.on('pointermove', function(event) {
                    var coords = event.coordinate;
                    this.lastCoords = coords;
                    setTimeout(function(extendedTool, coords) {
                        if (extendedTool.lastCoords[0] === coords[0] && extendedTool.lastCoords[1] === coords[1]) {
                            var featureInfoUrl = mapper.OpenLayers.getGetFeatureInfoUrl(coords, map, boundary);
                            var splitUrl = featureInfoUrl.split('?');
                            
                            if (extendedTool.lastRequest !== null && extendedTool.lastRequest.returned !== true) {
                                extendedTool.lastRequest.canceled = true;
                            }
                            
                            extendedTool.lastRequest = mapper.common.asyncAjax({
                                url: splitUrl[0],
                                params: splitUrl[1],
                                type: 'POST',
                                callbackObj: {
                                    extendedTool: extendedTool,
                                    coords: coords
                                },
                                callback: function(request, callbackObj) {
                                    if (request.canceled === true) return;
                                    request.returned = true;
                                    var featureInfo = JSON.parse(request.responseText);
                                    var features = featureInfo.features;
                                    var extendedTool = callbackObj.extendedTool;
                                    if (features.length === 0) {
                                        extendedTool.removePopup(map);
                                        return;
                                    }
                                    extendedTool.addPopup(map);
                                    var coordinates = callbackObj.coords;
                                    var displayText = [];
                                    var mappedFeatureInfo = extendedTool.mappedLayer.featureInfo;
									if (mappedFeatureInfo.length > 0)
									{
										for (var i = 0, len = mappedFeatureInfo.length; i < len; i+=1) {
											if (features[0].properties.hasOwnProperty(mappedFeatureInfo[i].propertyName)) {
												displayText.push(features[0].properties[mappedFeatureInfo[i].propertyName]);
											}
										}
										extendedTool.setPopup(coordinates, displayText.join('<br>'));
									}
                                }
                            });
                        }
                    }, 20, this, coords);
                }, this);
                this.addPopup(map);
            },
            
            setEnabled : function() {
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                if (mapperWindow === null) return;
                this.currentLayer = null;
                var mappedLayers = this.owningBlock.blockConfigs.layers;
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                var chartsConfig = mapper.charts;
                
                var overlays = mapper.layers.query(
                    layersConfig.overlays,
                    function(layer) {
                        if (layer.type !== 'layer') return false;
                        if ((layer.display === true || layer.loadOnly === true) && layer.mask === false) return true;
                        return false;
                    }
                );
                
				var boundaryFolderId = mapper.amcharts.getEnabledBoundaryFolder(layersConfig.boundaries);
				var boundaryFolder = mapper.layers.query(layersConfig.boundaries, {id: boundaryFolderId});
                var boundaries = mapper.layers.query(
                    boundaryFolder,
                    function(layer) {
                        if (layer.type !== 'layer') return false;
                        if ((layer.display === true || layer.loadOnly === true) && layer.mask === false) return true;
                        return false;
                    }
                );
                
                
                // Loop through 
                var enabled = false;
                var mappedLayer = null;
                var chartsLength = chartsConfig.length;
                var overlaysLength = overlays.length;
                var boundariesLength = boundaries.length;
                var mappedLayersLength = mappedLayers.length;
                // Loop through chart configuration in the data.json
                for (var i = 0; i < chartsLength; i+=1) {
                    var chartConfig = chartsConfig[i];
                    // Loop through overlays and boundaries in the data.json for an overlay/boundary pair 
                    // that is turned on and matches what is in the chart configs.
                    // We only display popups for polygon names if a chart would be rendered if 
                    // the user clicks on that polygon with the current raster in the map.
                    for (var j = 0; j < overlaysLength; j+=1) {
                        var overlay = overlays[j];
                        var configuredOverlayDisplayed = false;
                        
                        for (var k = 0, len = chartConfig.overlays.length; k < len; k+=1) {
                            var configuredOverlay = chartConfig.overlays[k];
                            if (overlay.id === configuredOverlay.for_layer_id) {
                                configuredOverlayDisplayed = true;
                                break;
                            }
                        }
                        if (configuredOverlayDisplayed === false) continue;
                        
                        for (var k = 0; k < boundariesLength; k+=1) {
                            var boundary = boundaries[k];
                            if (chartConfig.boundaries.indexOf(boundary.id) === -1) continue;
                            // Loop through layer mapping in template.json to ensure boundary is configured to be used.
                            for (var ii = 0; ii < mappedLayersLength; ii+=1) {
                                if (mappedLayers[ii].id === boundary.id) {
                                    mappedLayer = mappedLayers[ii];
                                    this.currentLayer = boundary;
                                    enabled = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                this.mappedLayer = mappedLayer;
                
                if (enabled === false) {
                    if (this.hasOwnProperty('component')) {
                        this.component.hide();
                        if (this.component.pressed === true) this.removeMapEvent();
                    }
                } else {
                    if (this.hasOwnProperty('component')) {
                        this.component.show();
                        if (this.component.pressed === true) this.addMapEvent();
                    }
                }
                
                this.enabled = enabled;
            },
            
            featureInfoUpdated: function() {
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                var layersConfigId = mapperWindow.layersConfigId;
                var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
                mapper.layers.setLayersConfigById(layersConfigId,layersConfig);
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED,
                    mapperWindow,
                    this);
                this.owningBlock.fire('featureinfoupdated', mapperWindow);
            },
            
            graphToolMapClickListenerCallbackFunction : function (callbackObject, postingObject, eventObject) {

                //tools act upon the mapwindow
                //so this identify tool should
                //get the mapclick event and then modify the
                //featureinfo then post the featureInfoAvailable event

                var graphTool = callbackObject;
                if (graphTool.enabled === false || !graphTool.hasOwnProperty('component')) return;
                graphTool.owningBlock.fire('mapclicked', graphTool);
                var event = eventObject;
                var mapPanelTool = postingObject;
                var mapWindowBlock = graphTool.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;

                var map = mapPanelTool.component.map;

                var isPressed = Ext.getCmp(callbackObject.extToolID).pressed;

                if (isPressed) {
                    var layersConfigId = mapperWindow.layersConfigId;
                    var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
                    var layer;

                    if (layer = mapper.OpenLayers.getCrosshairLayer(map)) {
                        map.removeLayer(layer);
                    }

                    var crossHairLayer = mapper.OpenLayers.drawCrossHair(event.coordinate);
                    map.addLayer(crossHairLayer);
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_FETCHING,
                        mapperWindow,
                        callbackObject);
                    
                    mapper.OpenLayers.getLayersFeatureInfo(event.coordinate, map, layersConfig, graphTool, 'featureInfoUpdated');
                    
                    //graphTool.owningBlock.fire('chartrequested', mapperWindow);
                }
            }
        };
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_LAYER_CONFIGURATION_UPDATED,
            owningBlock.itemDefinition.layersConfigUpdated,
            extendedGraphTool);
        
        mapPanelBlock.on('click', extendedGraphTool.graphToolMapClickListenerCallbackFunction, extendedGraphTool);
        
        extendedGraphTool.setEnabled();
        
        return extendedGraphTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extGraphTool = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: (block.iconClass) ? block.iconClass : 'fa fa-area-chart',
            tooltip : block.tooltip,
            enableToggle : true,
            toggleGroup: extendedTool.toggleGroupId,
            id : extendedTool.extToolID,
            pressed : block.pressed,
            //disabled : !extendedTool.enabled,
            hidden : !extendedTool.enabled,
            listeners : {
                toggle : function (button, pressed) 
                {
                    var me = this;
                    if (!(me.pressed || Ext.ButtonToggleManager.getPressed(me.toggleGroup))) 
                    {
                        me.toggle(true, true);
                    }
                    
                    if(me.pressed)
                    {
                        var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        map.getInteractions().clear();
                        var d = new ol.interaction.MouseWheelZoom();
                        map.addInteraction(d);
                        if (me.extendedTool.enabled === true) me.extendedTool.addMapEvent();
                    } else {
                        me.extendedTool.removeMapEvent();
                    }
                    
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    if (this.pressed === true && this.extendedTool.enabled === true) this.extendedTool.addMapEvent();
                }
            }
        }
        
        return extGraphTool;
    }
};

export var toolName = "cGraphTool";
export var tool = cGraphTool;