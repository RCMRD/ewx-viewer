var cLegendEarTool = {
    options: {
        requiredBlocks: ['cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        var layersConfigId = mapper.layers.getLayersConfigInstanceId();
        
        var legendEarTool = {
            owningBlock: owningBlock,
            layerId: layersConfigId,
            legendPanel: Ext.create('Ext.Window', {
                wrapper : this,
                active : false,
                header : false,
                border : 0,
                constrain : false,
                html : "<img></img>",
                bodyStyle : "border: none; border-radius:5px;",
                style : {
                    borderWidth : '1px',
                    borderStyle : 'solid'
                },
                closable : false,
                items : {
                    border : false
                },
                updateLocation : function () {
                    var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
                    var mapperWindow = mapWindowBlock.extendedTool;
                    var mapWindow = mapperWindow.component;
                    
                    var x = mapWindow.getX();
                    var y = mapWindow.getY();
                    var height = mapWindow.getHeight();
                    var width = mapWindow.getWidth();
                    this.setPosition(x + width + 10, y + 35);
                },
            }),
            updateLegendImage: function () {
                var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                var windowJsonLayers = mapper.common.getAllLayersIncludeOverlayIncludeBoundaryRequireDisplay(layersConfig, true, false, true);

                if (windowJsonLayers.length == 0)
                    return;

                windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

                var layer = windowJsonLayers[windowJsonLayers.length - 1];

                var legendURL = mapper.legend.getLegendURL(layer);

                if (legendURL == null)
                    return;

                var image = new Image();
                image.src = legendURL;
                var legendPanel = this.legendPanel;
                image.onload = function () {
                    legendPanel.update('<img src="' + this.src + '">');
                    
                    legendPanel.setHeight(this.height);
                    legendPanel.setWidth(this.width);
                }
            },
            layersConfigUpdated: function (newLayerConfig,receiver,postingObject) {
                if ((mapper.layers.getLayersConfigInstanceId() == receiver.layerId)) {
                    receiver.updateLegendImage();
                }
            }
        };
        
        legendEarTool.legendPanel.show();
        legendEarTool.legendPanel.hide();
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            legendEarTool.layersConfigUpdated,
            legendEarTool);
            
        return legendEarTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var legendEarBtn = {
            extendedTool : extendedTool,
            cls : 'x-btn-left legend-glyph',
            iconCls: 'fa fa-list-ul',
            tooltip : 'Toggle map legend',
            enableToggle : true,
            pressed : false,
            listeners : {
                toggle : function () {
                    var legend = this.extendedTool.legendPanel;
                    if (this.pressed == true) {
                        legend.show();
                        legend.active = true;
                        legend.updateLocation();
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                        extendedTool.updateLegendImage();
                    } else {
                        legend.hide();
                        legend.active = false;
                        extendedTool.updateLegendImage();
                    }
                },
                afterrender: function() {
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        extendedTool.updateLegendImage();
        return legendEarBtn;
    }
};

export var toolName = "cLegendEarTool";
export var tool = cLegendEarTool;