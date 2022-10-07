var cMapWindowChartArea = {
    options: {
        delayRender: true,
        destroyIfEmpty: true
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var chartArea = {
            extendedTool: extendedTool,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            collapseDirection : 'bottom',
            title : block.title,
            width : block.width,
            height : block.height,
            layout : 'fit',
            flex : 5,
            items : items,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                },
                resize: function() {
                    this.doLayout();
                }
            }
        };
        
        chartArea = skin.blocks.addToolBarItems(block, chartArea, toolbar);
        chartArea = skin.ExtJSPosition(chartArea, block);
        
        return chartArea;
        return Ext.create('Ext.panel.Panel', chartArea);
    }
};

export var toolName = "cMapWindowChartArea";
export var tool = cMapWindowChartArea;