var cExportCSV = {
    options: {
        requiredBlocks: ['cChartContainer']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var menuItem = {
            text : block.title,
            tooltip: block.tooltip,
            extendedTool: extendedTool,
            listeners : {
                click : function () {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    
                    var chartHandler = chartContainer.chartHandler;
                    var attributes = chartContainer.getAttributes();
                    chartHandler.exportChart(
                        attributes.id,
                        'CSV', {
                        period : attributes.period,
                        layerName : attributes.layerName,
                        periodicityWrapper : mapper.periodicity.getPeriodicityWrapperById(attributes.layerId),
                        startMonth : attributes.startMonth,
                        chartId : attributes.overlayTitle,
                    });
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return menuItem;
    }
};

export var toolName = "cExportCSV";
export var tool = cExportCSV;