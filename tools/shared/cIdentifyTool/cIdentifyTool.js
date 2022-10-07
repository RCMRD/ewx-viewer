var cIdentifyTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    createExtendedTool: function(owningBlock) {
        var toolUniqueID = mapper.common.getRandomString(32, 36);
        
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        
        var extendedTool = {
            owningBlock: owningBlock,
            toggleGroupId: mapWindowBlock.extendedTool.toggleGroupId,
            //extTool : extIdentifyTool,
            //after this gets given away to the toolbar it is copied
            //and can no longer be referenced from this object
            //directly
            //you have to use Ext.getCmp(this.extIdentifyToolID);
            //to access it
            //dont forget that

            extToolID : toolUniqueID,
            identifyToolMapClickListenerCallbackFunction : function (eventObject, mapWindow) {

                //tools act upon the mapwindow
                //so this identify tool should
                //get the mapclick event and then modify the
                //featureinfo then post the featureInfoAvailable event
                
                var event = eventObject;
                var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                var mapPanelBlock = owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;

                var isPressed = this.component.pressed;
                if (isPressed)
                {
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
                        this);
                    
                    var newLayerConfig = mapper.OpenLayers.updateLayerConfigWithFeatureInfoForCoord
                        (
                            event.coordinate,
                            mapPanelBlock.component.map,
                            layersConfig
                        );

                    mapper.layers.setLayersConfigById(layersConfigId,layersConfig);
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED,
                        mapperWindow,
                        this);
                        
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_REQUEST_TOOLS_DRAWER_OPEN,
                        mapperWindow,
                        this);	
                }
            },
        };
        
        mapWindowBlock.on('click', function(callbackObj, postingObj, event) {
            var extendedTool = callbackObj;
            var mapperWindow = postingObj;
            
            extendedTool.identifyToolMapClickListenerCallbackFunction(event, mapperWindow);
        }, extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extIdentifyTool = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: 'fa ' + 'fa-info-circle',
            tooltip : block.tooltip,
            enableToggle : true,
            toggleGroup: extendedTool.toggleGroupId,
            id : extendedTool.extToolID,
            pressed : block.pressed,
            listeners : {
                toggle : function (button, pressed) {
                    var me = this;
                    if (!(me.pressed || Ext.ButtonToggleManager.getPressed(me.toggleGroup))) {
                            me.toggle(true, true);
                    }
                    
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return extIdentifyTool;
    }
};

export var toolName = "cIdentifyTool";
export var tool = cIdentifyTool;