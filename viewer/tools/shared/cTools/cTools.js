var cTools = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var position = block.block;
        var width = block.width;
        var height = block.height;
        var title = block.title;
        
        var tools = {
            extendedTool: extendedTool,
            layout : 'anchor',
            title : title,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            split : true,
            width : width,
            items : items,
            listeners: {
                afterrender: function(panel) {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    var panelEl = document.getElementById(panel.id);
                    panelEl.style.zIndex = 99999;
                }
            }
        };
        
        return skin.ExtJSPosition(tools, block);
    }
};

export var toolName = "cTools";
export var tool = cTools;