var cDataDownloadLinksMenuTool = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        
        var block = extendedTool.owningBlock.blockConfigs;
        var label = block.label;
        
        var menuOfLinks = {
            extendedTool: extendedTool,
            text : label,
            //iconCls: 'fa fa-cog',
            tooltip : label,
            cls : 'x-btn-text',
            menu : Ext.create('Ext.menu.Menu', {
                extendedTool: extendedTool,
                items: menu,
                listeners : {
                    hide : function () 
                    {
                    },
                    show : function () 
                    {
                    }
                }
            })
        };

        return menuOfLinks;
    }
};

export var toolName = "cDataDownloadLinksMenuTool";
export var tool = cDataDownloadLinksMenuTool;