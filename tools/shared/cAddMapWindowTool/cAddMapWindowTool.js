var cAddMapWindowTool = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extjsButton = {
            extendedTool : extendedTool,
			text: "New Map Window",
            baseCls : 'new-map-window-btn',
            tooltip : block.tooltip,
            handler : function () {	
            
                mapper.layers.createNewInstanceOfLayersConfig();
                
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_REQUESTING_NEW_MAP_WINDOW,
                    null,
                    null);
                
                /*
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                    this.mapperWindow,
                    this.mapperWindow);
                */
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                }
            }
        }

        return extjsButton;
    }
};

export var toolName = "cAddMapWindowTool";
export var tool = cAddMapWindowTool;