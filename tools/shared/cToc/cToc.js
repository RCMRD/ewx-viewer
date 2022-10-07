var cToc = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        
        var toc = {
            extendedTool: extendedTool,
            id : "toolsTOCLegendArea",
            layout : 'fit',
            header : false,
            split : true,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            collapseMode : 'mini',
            width : width,
            minHeight : 60,
            height : height,
            maxHeight : height,
            items : items,
            listeners : {
                resize : function () {
                    //skin.toc.tocTabs.reFreshTabs();
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        toc = skin.blocks.addToolBarItems(block, toc, toolbar);
        
        return skin.ExtJSPosition(toc, block);
    }
};

export var toolName = "cToc";
export var tool = cToc;