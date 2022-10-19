var cChartToolsMenu = {
    options: {
        requiredBlocks: ['cChartContainer']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var menu = {
            extendedTool: extendedTool,
            height : block.height,
            width : block.width,
            iconCls : 'fa fa-cog',
            tooltip: block.tooltip,
            id : mapper.common.getRandomString(32, 36),
            cls : 'x-btn-text-icon',
            menu : Ext.create('Ext.menu.Menu', {
                items: menu
            }),
            listeners : {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return menu;
    }
};

export var toolName = "cChartToolsMenu";
export var tool = cChartToolsMenu;