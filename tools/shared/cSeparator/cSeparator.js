var cSeparator = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        return {
            xtype: 'tbseparator',
            width: block.width,
            height: block.height,
            style: block.style
        };
    }
};

export var toolName = "cSeparator";
export var tool = cSeparator;