var cTocContainer = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        
        var contentsTab = {
            extendedTool: extendedTool,
            items : items,
            width : width,
            height : height,
            autoScroll : true,
            maxHeight : height,
            title : block.title,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                }
            }
        };
        
        contentsTab = skin.blocks.addToolBarItems(block, contentsTab, toolbar);
        
        return skin.ExtJSPosition(contentsTab, block);
    }
}

export var toolName = "cTocContainer";
export var tool = cTocContainer;