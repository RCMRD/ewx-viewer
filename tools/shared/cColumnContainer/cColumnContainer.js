var cColumnContainer = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        var height = block.height;
		var resizable = block.hasOwnProperty('resizable') ? block.resizable : true;
        var component = {
            extendedTool: extendedTool,
			resizable: resizable,
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch',
                defaultMargins: {
                    left: 10,
                    right: 10,
                    top: 10
                }
            },
            padding: 10,
            width: width,
            height: height,
            items: items
        };
        
        component = skin.blocks.addToolBarItems(block, component, toolbar);
        return skin.ExtJSPosition(component, block);
    }
};

export var toolName = "cColumnContainer";
export var tool = cColumnContainer;