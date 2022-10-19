var cHeader = {
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;

        var content = block.content;
		var resizable = block.hasOwnProperty('resizable') ? block.resizable : true;
        
        var header = {
            extendedTool: extendedTool,
            items: items,
            menu: menu,
			resizable: resizable,
            layout : 'absolute',
            header : false,
            collapsible : block.hasOwnProperty('collapsible') ? block.collapsible : false,
            collapsed : block.hasOwnProperty('collapsed') ? block.collapsed : false,
            collapseMode : 'mini',
            bodyStyle : block.bodyStyle,
            split : true,
			splitterResize: false,
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
        
        if (toolbar) header = skin.blocks.addToolBarItems(block, header, toolbar);
        
        return skin.ExtJSPosition(header, block);
    }
}

export var toolName = "cHeader";
export var tool = cHeader;
