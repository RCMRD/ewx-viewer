var cTocTabPanel = {
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var Tabs = {
            extendedTool: extendedTool,
            xtype: 'tabpanel',
            layout : 'card',
            activeTab : 0,
            enableTabScroll : true,
            plain : true,
            items : items
        };
        
        Tabs = skin.blocks.addToolBarItems(block, Tabs, toolbar);

        return skin.ExtJSPosition(Tabs, block);
    }
};

export var toolName = "cTocTabPanel";
export var tool = cTocTabPanel;