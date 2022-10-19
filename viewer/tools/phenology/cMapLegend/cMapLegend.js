var cMapLegend = {
    options: {
        requiredBlocks: ['cMapPanel', 'cMapWindow'],
        autoShow: false
    },
    layersConfigUpdated: function (newLayerConfig,callbackObject,postingObject) {
        var mapPanelExtendedTool = callbackObject;
        var mapWindowBlock = mapPanelExtendedTool.owningBlock.getReferencedBlock('cMapWindow');
        var mapperWindow = mapWindowBlock.extendedTool;
        
        if (mapperWindow !== null && mapper.layers.getLayersConfigInstanceId() == mapperWindow.layersConfigId) {
            mapPanelExtendedTool.updateLegendImage();
        }
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            imageLoadCallback: function(mapperWindow, image, title) {
                var legendPanel = this.component;
                var mapWindowId = mapperWindow.component.getId();
                var mapWindowBodyEl = document.getElementById(mapWindowId+'-body');
                var maxHeight = parseInt(mapWindowBodyEl.style.height) - 20;
                legendPanel.update('<div class="legend-title" id="legend-title">' + title + '</div>' + '<img id="'+legendPanel.getId()+'-image" src="' + image.src + '">');
                if (image.height > maxHeight) {
                    legendPanel.setAutoScroll(true);
                    legendPanel.setHeight(maxHeight);
                    var width = image.width + 20;
                    legendPanel.setWidth(width);
                } else {
                    legendPanel.setAutoScroll(false);
                    //legendPanel.setHeight(image.height);
                    var width = image.width;
                    //legendPanel.setWidth(width);
                }

                legendPanel.updateLocation();
            },
            updateLegendImage: function () {
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                //var windowJsonLayers = mapper.common.getAllLayersIncludeOverlayIncludeBoundaryRequireDisplay(layersConfig, true, false, false);
                var windowJsonLayers = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        type: 'layer',
                        display: true,
                        mask: false
                    }
                );
                
                if (windowJsonLayers.length == 0)
                    return;

                windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

                var layer = windowJsonLayers[0];

                var legendURL;
                if (layer.legend && layer.legend.hasOwnProperty('customImageURL') && layer.legend.customImageURL !== null && layer.legend.customImageURL !== '') {
                    legendURL = layer.legend.customImageURL;
                } else {
                    legendURL = mapper.legend.getLegendURL(layer);
                }
                
                if (legendURL == null)
                    return;
                var image = new Image();
                image.src = legendURL;
                var title = layer.legend.title;
                var extendedTool = this;
                image.onload = function () {
                    if (mapWindowBlock.rendered == true) {
                        extendedTool.imageLoadCallback(mapWindowBlock.extendedTool, this, title);
                    } else {
                        var image = this;
                        mapWindowBlock.on('rendercomponent', function(callbackObj, postingObj, eventObj) {
                            var extendedTool = callbackObj;
                            var mapperWindow = postingObj;
                            extendedTool.imageLoadCallback(mapperWindow, image, title);
                        }, extendedTool);
                    }
                }
            }
        };
        
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var mapperWindow = mapWindowBlock.extendedTool;
        
        mapWindowBlock.on('resize', function(callbackObj, postingObj, eventObj) {
            var extendedTool = callbackObj;
            var mapperWindow = postingObj;
            var mapWindowBodyEl = document.getElementById(mapperWindow.component.getId()+'-body');
            var maxHeight = parseInt(mapWindowBodyEl.style.height) - 40;
            var legendImage = document.getElementById(extendedTool.component.getId()+'-image');
            if (legendImage === null) return;
            var imageHeight = legendImage.height;
            if (maxHeight < imageHeight) {
                extendedTool.component.setAutoScroll(true);
                extendedTool.component.setHeight(maxHeight);
            } else {
                extendedTool.component.setAutoScroll(false);
                //extendedTool.component.setHeight(imageHeight);
            }
        }, extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var legendPanel = {
            extendedTool : extendedTool,
            xtype: 'panel',
            header : false,
            border : 0,
            constrain : true,
            html : "<img></img>",
            bodyStyle : "border: none; border-radius:5px;",
            style : {
                borderWidth : '1px',
                borderStyle : 'solid',
                bottom: '5px',
                right: '5px'
            },
            //width: 30,
            //height: 100,
            closable : false,
            items : {
                border : false
            },
            focusOnToFront: false,
            autoShow: true,
            hideMode: 'visibility',
            updateLocation : function () {
                var parent = this.extendedTool.owningBlock.parent;
                if (parent.rendered === true) {
                    var parentComponent = parent.component;
                    this.anchorTo(parentComponent.getEl(), 'br-br?', [-5, -5]);
                    this.toFront(true);
                } else {
                    parent.on('rendercomponent', function(callbackObj, postingObj, eventObj) {
                        var mapLegendComponent = callbackObj;
                        var parentExtendedTool = postingObj;
                        var parentComponent = parentExtendedTool.component;
                        this.anchorTo(parentComponent.getEl(), 'br-br?', [-5, -5]);
                        this.toFront(true);
                    }, this);
                }
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    setTimeout(function(component) {
                        var parentComponent = component.extendedTool.owningBlock.parent.component;
                        component.extendedTool.updateLegendImage();
                        component.updateLocation();
                        
                        var mapWindowBlock = component.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        
                        mapWindowBlock.on('move', function(legendPanel) {
                            if (legendPanel.active === true) {
                                legendPanel.updateLocation();
                            }
                        }, component);
                        
                        mapWindowBlock.on('activate', function(legendPanel) {
                            if (legendPanel.active === true) {
                                legendPanel.updateLocation();
                            }
                        }, component);
                        
                        mapWindowBlock.on('resize', function(legendPanel) {
                            if (legendPanel.active === true) {
                                legendPanel.updateLocation();
                            }
                        }, component);
                        
                        mapWindowBlock.on('collapse', function(legendPanel) {
                            legendPanel.hide();
                        }, component);
                        
                        mapWindowBlock.on('expand', function(legendPanel) {
                            if (legendPanel.active === true) {
                                legendPanel.show();
                                legendPanel.updateLocation();
                            }
                        }, component);
                        
                        mapWindowBlock.on('close', function(legendPanel) {
                            legendPanel.close();
                        }, component);
                        
                        mapWindowBlock.on('destroy', function(legendPanel) {
                            legendPanel.extendedTool.owningBlock.unRender();
                            legendPanel.extendedTool.owningBlock.remove();
                        }, component);
                        
                        if (component.extendedTool.owningBlock.itemDefinition.options.autoShow === false) {
                            component.active = false;
                            component.hide();
                        } else {
                            component.active = true;
                        }
                    }, 100, this);
                },
                beforedestroy: function() {
                    mapper.EventCenter.defaultEventCenter.removeAllCallbacksForObject(this.extendedTool);
                },
                close: function() {
                    this.extendedTool.owningBlock.remove();
                }
            }
        };
        
        legendPanel = skin.ExtJSPosition(legendPanel, block);
        legendPanel = Ext.create('Ext.panel.Panel', legendPanel);
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.layersConfigUpdated,
            extendedTool);
        
        return legendPanel;
    }
};

export var toolName = "cMapLegend";
export var tool = cMapLegend;