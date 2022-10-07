var cTocContentsTab = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        
        var contentsTab = {
            extendedTool: extendedTool,
            layout : 'border',
            title : block.title,
            defaults : {
                split : true,
                bodyPadding : 0
            },
            items : items,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        contentsTab = skin.blocks.addToolBarItems(block, contentsTab, toolbar);
        
        return skin.ExtJSPosition(contentsTab, block);
    }
};

export var toolName = "cTocContentsTab";
export var tool = cTocContentsTab;