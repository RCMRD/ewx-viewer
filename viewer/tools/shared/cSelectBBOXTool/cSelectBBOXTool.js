var cSelectBBOXTool = {
    options: {
        events: ['aoiSelected'],
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cQueryParamsDisplay', 'cResetQuery', 'cRegionTool']
    },
    createExtendedTool : function(owningBlock) {
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var toggleGroupId = null;
        if (owningMapWindow !== null) {
            toggleGroupId = owningMapWindow.toggleGroupId;
        }
        
        var extendedTool = {
            owningBlock: owningBlock,
            toggleGroupId: toggleGroupId,
            toolUniqueID: mapper.common.getRandomString(32, 36),
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            selectedExtent: null,
            selectedProjection: null,
            vectorAdded: false
        };
        
        var mapInteraction = new ol.interaction.DragBox({
            condition : ol.events.condition.always
        });
        
        mapInteraction.on('boxstart', function(event) {
            this.vector.getSource().clear();
        }, extendedTool);
        
        mapInteraction.on('boxend', function(event) {
            var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            var mapProjection = map.getView().getProjection().getCode();
            var cqlFilterDisplayBlock = this.owningBlock.getReferencedBlock('cQueryParamsDisplay');
            var geom = this.mapInteraction.getGeometry();
            var extent = geom.getExtent();
            this.selectedExtent = geom.getExtent();
            this.selectedProjection = mapProjection;
            
            var olFeature = new ol.Feature(geom.clone());
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
            
            if (cqlFilterDisplayBlock !== null) {
                cqlFilterDisplayBlock.extendedTool.setFilter('bbox', 'BBOX: '+extent.join(', '));
            }
            
            // Retrieve all layers mapped in the template.json with a type of "overlay". These are the layers that will be filtered by the selected AOI.
            var mappedOverlays = mapper.layers.toolMapping.filterByTypes(extendedTool.owningBlock.blockConfigs.layers, ['overlay']);
            var layerIds = [];
            for (var i = 0, len = mappedOverlays.length; i < len; i+=1) {
                layerIds.push(mappedOverlays[i].id);
            }
            
            var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
            var layers = mapper.layers.query(
                layersConfig,
                function(layer) {
                    if (layer.type === 'layer' && layer.mask === false && layerIds.indexOf(layer.id) !== -1) return true;
                    return false;
                },
                ['overlays', 'boundaries']
            );
            
            for (var i = 0, len = layers.length; i < len; i+=1) {
                var layer = layers[i];
                var newProj = layer.srs;
                var newExtent = JSON.parse(JSON.stringify(extent));
                if (mapProjection !== newProj) {
                    var minxy = proj4(mapProjection, newProj, [newExtent[0],newExtent[1]]);
                    var maxxy = proj4(mapProjection, newProj, [newExtent[2],newExtent[3]]);
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
                map.getView().fit(extent, map.getSize());
            }

            //Fire the event to set the State Combobox appropriately
            this.owningBlock.fire('aoiSelected', this);
            
            mapper.EventCenter.defaultEventCenter.postEvent(
                mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                layersConfig,
                mapper.layers);
        }, extendedTool);
        
        extendedTool.mapInteraction = mapInteraction;
        
        var regionBlock = owningBlock.getReferencedBlock('cRegionTool');
        if (regionBlock !== null) {
            regionBlock.on('regionSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('state', null);
                    cqlFilterDisplayBlock.extendedTool.setFilter('subState', null);
                }
                
                extendedTool.component.toggle(false);
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
                    cqlFilterDisplayBlock.extendedTool.setFilter('bbox', null);
                }
                
                extendedTool.component.toggle(false);
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

        var extBBOXTool = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: 'fa fa-bbox',
            xtype: 'button',
            //text: 'Select Box on Map',
            tooltip : block.tooltip,
            enableToggle : true,
            toggleGroup: extendedTool.toggleGroupId,
            id : extendedTool.toolUniqueID,
            pressed : block.pressed,
            listeners : {
                toggle : function (button, pressed) {
                    var me = this;
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;

                    if(me.pressed) {
                        map.addInteraction(me.extendedTool.mapInteraction);
                        var siblings = me.extendedTool.owningBlock.parent.childItems;
                        for (var i = 0, len = siblings.length; i < len; i+=1) {
                            var sibling = siblings[i];
                            if (sibling.id === me.extendedTool.owningBlock.id) continue;
                            if (sibling.component.enableToggle === true && sibling.component.pressed === true) {
                                sibling.component.toggle(false);
                            } else if (sibling.extendedTool.hasOwnProperty('toggle')) {
                                sibling.extendedTool.toggle(false);
                            }
                        }
                        
                        map.addLayer(this.extendedTool.vector);
                    } else {
                        map.removeInteraction(me.extendedTool.mapInteraction);
                        var cqlFilterDisplayBlock = this.extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                        if (cqlFilterDisplayBlock !== null) {
                            cqlFilterDisplayBlock.extendedTool.setFilter('bbox', null);
                        }
                        map.removeLayer(this.extendedTool.vector);
                        this.extendedTool.vector.getSource().clear();
                    }
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    if (this.pressed === true) {
                        var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        if (mapPanelBlock.rendered === false) {
                            mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                                var mapPanel = postingObj;
                                var extBBOXTool = callbackObj;
                                var map = mapPanel.owningBlock.component.map;
                                map.addInteraction(extBBOXTool.mapInteraction);
                            }, this.extendedTool);
                        } else {
                            var map = mapPanelBlock.component.map;
                            map.addInteraction(me.extendedTool.mapInteraction);
                        }
                    }
                }
            }
        };
        
        return extBBOXTool;
    }
};

export var toolName = "cSelectBBOXTool";
export var tool = cSelectBBOXTool;