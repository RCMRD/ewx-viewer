var cTOCDesktopLike = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
		var resizable = block.hasOwnProperty('resizable') ? block.resizable : true;
        
        var toc = {
            id : "toolsTOCLegendArea",
            //layout : 'fit',
			resizable: resizable,
            autoScroll : true,
            header : false,
            split : true,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            width : width,
            minHeight : 60,
            height : height,
            maxHeight : height,
            items : items,
            listeners : {
                resize : function () {
                    //skin.toc.tocTabs.reFreshTabs();
                }
            }
        };
        
        toc = skin.blocks.addToolBarItems(block, toc, toolbar);
        
        return skin.ExtJSPosition(toc, block);
    }
};

export var toolName = "cTOCDesktopLike";
export var tool = cTOCDesktopLike;