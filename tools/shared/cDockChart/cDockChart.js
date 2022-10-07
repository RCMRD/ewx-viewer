var cDockChart = {
    options: {
        requiredBlocks: ['cChartContainer', 'cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        
        var extendedTool = {
            owningBlock: owningBlock
        };
        
        mapWindowBlock.on('remove', function(extendedTool) {
            if (extendedTool.owningBlock.rendered === true) extendedTool.component.disable();
        }, extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var glyphClass = (block.dockedState === 'docked') ? 'fa-expand' : 'fa-compress';
        
        return {
            extendedTool: extendedTool,
            xtype: 'button',
            html: '<span class="pop-out fa '+glyphClass+'"></span>',
            tooltip: block.tooltip,
            border: false,
            handler: function() {
                var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                
                var selectedZoneId = chartContainer.selectedZoneId;
                var selectedGraphType = chartContainer.selectedGraphType;
                var selectedPeriods = chartContainer.selectedPeriods;
                var selectedDataType = chartContainer.selectedDataType;
                var periodFormat = chartContainer.periodFormat;
                var chartAttributes = chartContainer.chartAttributes;
                var mapperWindow = chartContainer.mapperWindow;
                var addLegend = chartContainer.addLegend;
                var chartMapping = chartContainer.chartMapping;
                
                chartContainerBlock.unRender();
                chartContainerBlock.remove();
                
                var relatedBlueprint = chartContainerBlock.blueprint.relatedBlockBlueprints[0];
                relatedBlueprint.itemDefinition.enabledChartContainerId = relatedBlueprint.id;
                relatedBlueprint.undelayRender();
                
                var newBlock = relatedBlueprint.block;
                if (newBlock === null) {
                    newBlock = relatedBlueprint.createBlock();
                }
                
                newBlock.selectedZoneId = selectedZoneId;
                newBlock.selectedGraphType = selectedGraphType;
                newBlock.selectedPeriods = selectedPeriods;
                newBlock.selectedDataType = selectedDataType;
                newBlock.periodFormat = periodFormat;
                newBlock.chartAttributes = chartAttributes;
                newBlock.mapperWindow = mapperWindow;
                newBlock.addLegend = addLegend;
                newBlock.chartMapping = chartMapping;
                
                var renderedParent = newBlock.getClosestRenderedParent();
                renderedParent.render();
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
    }
};

export var toolName = "cDockChart";
export var tool = cDockChart;