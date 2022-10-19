var cRemoveWMSLayerForm = {
    options: {
        delayRender: true
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            mask: null,
            maskTool: function() {
                var block = owningBlock.blockConfigs;
                if (this.mask === null) {
                    this.mask = new Ext.LoadMask(this.component, {
                            msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Removing Layers ..."
                        });
                }

                this.mask.show();
            },
            unmaskTool: function() {
                setTimeout(function (extendedTool) {
                    extendedTool.mask.hide();
                }, 500, this);
            },
            getGridStore : function () {
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId()),
                layersList = [],
                //tocType = mapper.tocConfig.configuration.type,
                //display = (tocType === 'dataset') ? true : '*',
                overlays = mapper.layers.query(
                    layersConfig,
                    {
                        "type" : "layer",
                        "display" : true
                    },
                    ['overlays', 'additional']
                );
                overlays.reverse();

                for (var i = 0, len = overlays.length; i < len; i += 1) {
                    var layer = overlays[i];
                    layersList.push({
                        title : mapper.layers.getLayerTitleById(layersConfig, layer.id),
                        layerId : layer.id
                    });
                }

                var store = Ext.create('Ext.data.Store', {
                        fields : ['title', 'layerId'],
                        data : layersList,
                    });

                return store;
            },
            getCurrentMapWindow: function() {
                var mapWindowComponent = Ext.getCmp(mapper.layers.getLayersConfigInstanceId());
                if (mapWindowComponent) return mapWindowComponent;
                return null;
            }
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var removeWmsLayerForm = {
            extendedTool : extendedTool,
            title : block.title,
            id : 'removeWmsLayerWindow',
            width : 350,
            height : 300,
            ghost : false,
            layout : {
                type : 'vbox',
                align : 'stretch',
                pack : 'start',
            },
            autoHeight : true,
            x : block.x,
            y : block.y,
            bodyStyle : 'padding:5px;',
            border : false,
            collapsible : true,
            constrain : true,
            items : [{
                store : extendedTool.getGridStore(),
                xtype : 'grid',
                id : 'overlaysList',
                columns : [{
                    text : (typeof(block.wmsLayerTitleTxt) !== 'undefined') ? block.wmsLayerTitleTxt : 'Layer Title',
                    dataIndex : 'title',
                    width : '100%',
                }],
                width : 300,
                height : 200,
                margin : '10 0 0 0',
                border : 1,
                style : {
                    borderStyle : 'solid',
                },
                selModel : {
                    mode : "MULTI",
                },
            }, {
                xtype : 'button',
                extendedTool : extendedTool,
                text : (typeof(block.removeSelectedLayersBtnTxt) !== 'undefined') ? block.removeSelectedLayersBtnTxt : 'Remove selected layers',
                id : 'removeLayersBtn',
                margin : '10 0 0 0',
                handler : function () {
                    this.extendedTool.maskTool();

                    var grid = this.extendedTool.component.query('grid')[0];
                    var rows = grid.getSelectionModel().getSelection(),
                    mapWindow = this.extendedTool.getCurrentMapWindow(),
                    layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

                    for (var i = 0, len = rows.length; i < len; i += 1) {
                        var row = rows[i];

                        for (var prop in layersConfig) {
                            mapper.layers.removeLayerById(layersConfig[prop], row.raw.layerId);
                        }
                    }

                    var mapPanelBlock = mapWindow.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    mapper.OpenLayers.updateMapLayerOpacitiesAndDisplayedLayersFromLayersConfig(layersConfig, mapPanelBlock.component.map);
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
                        layersConfig,
                        null);
                    
                    grid.bindStore(this.extendedTool.getGridStore());
                    this.extendedTool.unmaskTool();
                }
            }],
            listeners : {
                close : function () {
                    this.extendedTool.owningBlock.remove();
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        removeWmsLayerForm = skin.blocks.addToolBarItems(block, removeWmsLayerForm, toolbar);
    
        return skin.ExtJSPosition(removeWmsLayerForm, block);
    }
};

export var toolName = "cRemoveWMSLayerForm";
export var tool = cRemoveWMSLayerForm;