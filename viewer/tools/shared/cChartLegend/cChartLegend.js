var cChartLegend = {
    options: {
        requiredBlocks: ['cChartContainer']
    },
    createExtendedTool: function(owningBlock) {
        var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
        var chartContainer = chartContainerBlock.extendedTool;
        
        var addLegend = owningBlock.blockConfigs.pressed;
        
        if (chartContainer.hasOwnProperty('addLegend')) {
            addLegend = chartContainer.addLegend;
        }
        
        return {
            owningBlock: owningBlock,
            addLegend: addLegend
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        return {
            cls : 'x-btn-left legend-glyph',
            iconCls : 'fa fa-list-ul',
            extendedTool: extendedTool,
            tooltip : block.tooltip,
            legendPosition: block.legendPosition,
            enableToggle : true,
            pressed : extendedTool.addLegend,
            listeners : {
                toggle : function () {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    
                    var attributes = chartContainer.getAttributes();
                    var chartHandler = chartContainer.chartHandler;
                    var chart = chartHandler.getChartById(attributes.id);
                    chartContainer.addLegend = this.pressed;
                    
                    if (this.pressed === true) {
                        var legend = new AmCharts.AmLegend();
                        var legendOptions = chartContainer.getLegendOptions(this.legendPosition);
                        for (var prop in legendOptions) {
                            legend[prop] = legendOptions[prop];
                        }
                        chart.chart.addLegend(legend);
                        
                    } else {
                        chart.chart.removeLegend();
                    }
                    
                    chart.chart.invalidateSize();
                },
                afterrender: function() {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    chartContainer.addLegend = this.pressed;
                }
            }
        };
    }
};

export var toolName = "cChartLegend";
export var tool = cChartLegend;