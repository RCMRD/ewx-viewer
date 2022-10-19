var cTextPanel = {
    getComponent : function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        var content = block.content;
        
        var component = {
            extendedTool: extendedTool,
            items : items,
            cls : block.cssClass,
            style : block.style,
            header : false,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            html : content,
            width : width,
            height : height,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                }
            }
        };
        
        component = skin.blocks.addToolBarItems(block, component, toolbar);
        
        return skin.ExtJSPosition(component, block);
    }
};

export var toolName = "cTextPanel";
export var tool = cTextPanel;