var cBoundaryToggleTool = {
    options: {
        requiredBlocks: ['cStateTool'],
        events: ['toggle']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            boundaryId: owningBlock.blockConfigs.layers[0].id,
            handleToggle: function() {
                var pressed = this.component.pressed;
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var boundary = mapper.layers.query(
                    layersConfig.boundaries,
                    {
                        type: 'layer',
                        id: this.boundaryId,
                        loadOnly: false,
                        mask: false
                    }
                );
                
                if (boundary.length === 0) return;
                boundary = boundary[0];
                
                if (pressed) {
                    boundary.display = true;
                }
                
                this.owningBlock.fire('toggle', this);
                
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
                    layersConfig,
                    mapper.layers);
                
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                    layersConfig,
                    mapper.layers);
            }
        };
        
        var stateBlock = owningBlock.getReferencedBlock('cStateTool');
        if (stateBlock !== null) {
            stateBlock.on('select', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.component.isHidden()) {
                    extendedTool.component.show();
                }
            }, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var displayedBoundaries = mapper.layers.query(
            layersConfig.boundaries,
            {
                type: 'layer',
                display: true,
                id: extendedTool.owningBlock.blockConfigs.layers[0].id
            }
        );
        
        var pressed = false;
        if (displayedBoundaries.length > 0) {
            pressed = true;
        }
        
        var component = {
            extendedTool: extendedTool,
            xtype: 'button',
            width: block.width,
            height: block.height,
            //toggle: true,
            toggleGroup: 'boundaryButtons',
            text: block.text,
            pressed: pressed,
            hidden: true,
            toggleHandler: function() {
                this.extendedTool.handleToggle();
            },
            listeners: {
                /*toggle: function() {
                    this.extendedTool.handleToggle();
                },*/
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cBoundaryToggleTool";
export var tool = cBoundaryToggleTool;