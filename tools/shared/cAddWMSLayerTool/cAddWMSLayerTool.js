var cAddWMSLayerTool = {
    options: {
        requiredBlocks: ['cAddWMSLayerForm']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extjsButton = {
            extendedTool: extendedTool,
            xtype : 'button',
            id : 'btn-add-layer',
            cls : 'override mg5-r',
            iconCls: 'fa fa-add-wms',
            //glyph : 0xf055,
            marginLeft : 10,
            marginBottom : 10,
            tooltip : block.tooltip,
            handler : function () {
                var addWMSLayerFormBlueprint = this.extendedTool.owningBlock.blueprint.getReferencedBlueprint('cAddWMSLayerForm');
                var formBlock = addWMSLayerFormBlueprint.createBlock();
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

export var toolName = "cAddWMSLayerTool";
export var tool = cAddWMSLayerTool;