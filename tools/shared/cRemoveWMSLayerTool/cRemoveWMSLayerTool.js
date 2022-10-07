var cRemoveWMSLayerTool = {
    options: {
        requiredBlocks: ['cRemoveWMSLayerForm']
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extjsButton = {
            extendedTool : extendedTool,
            xtype : 'button',
            id : 'btn-remove-layer',
            cls : 'override mg5-r',
            iconCls: 'fa fa-remove-wms ',
            //glyph : 0xf056,
            marginLeft : 10,
            marginBottom : 10,
            tooltip : block.tooltip,
            handler : function () {
                var removeWMSLayerFormBlueprint = this.extendedTool.owningBlock.blueprint.getReferencedBlueprint('cRemoveWMSLayerForm');
                var formBlock = removeWMSLayerFormBlueprint.createBlock();
                var renderedParent = formBlock.getClosestRenderedParent();
                renderedParent.render();
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return extjsButton;
    }
};

export var toolName = "cRemoveWMSLayerTool";
export var tool = cRemoveWMSLayerTool;