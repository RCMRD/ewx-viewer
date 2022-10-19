 var cFooter = {
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;

        var content = block.content;
		var resizable = block.hasOwnProperty('resizable') ? block.resizable : true;
        
        var component = {
            extendedTool: extendedTool,
            items: items,
            menu: menu,
			resizable: resizable,
            layout : 'absolute',
            header : false,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            collapseMode : 'mini',
            bodyStyle : block.bodyStyle,
            split : true,
            minHeight : 60,
            height : height,
            maxHeight : height,
            html : content,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                }
            }
        };
        
        if (toolbar) component = skin.blocks.addToolBarItems(block, component, toolbar);
        
        return skin.ExtJSPosition(component, block);
    }
}

export var toolName = "cFooter";
export var tool = cFooter;
