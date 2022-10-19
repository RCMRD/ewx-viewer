var cPeriodTypeCombo = {
    options: {
        requiredBlocks: ['cChartContainer', 'cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        var block = owningBlock.blockConfigs;
        
        var extendedTool = {
            owningBlock: owningBlock,
            tooltipText: block.tooltip,
            saveSelection: block.saveSelection,
            setStore: function() {
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                
                var value = chartContainer.selectedDataType;
                var attributes = chartContainer.getAttributes();
                var chartTypes = attributes.chart_types;
                var data = [];
                
                for (var i = 0, len = chartTypes.length; i < len; i+=1) {
                    var chartType = chartTypes[i];
                    data.push({
                        value: chartType.data_type,
                        name: chartContainer.getDataTypeName(chartType.data_type)
                    });
                }
                
                var store = Ext.create('Ext.data.Store', {
                    fields : ['value', 'name'],
                    data : data
                });
                
                this.component.bindStore(store);
                this.component.setValue(value);
            }
        };
        
        /*var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
        chartContainerBlock.on('activate', function(callbackObj, postingObj, eventObj) {
            var extendedTool = callbackObj;
            if (extendedTool.attributesUpdated !== true) return;
            var chartContainer = postingObj;
            
            var value = extendedTool.component.getValue();
            var periodFormat = chartContainer.getPeriodFormat(value);
            chartContainer.setSelectedPeriodFormat(periodFormat);
            console.log(value);
            chartContainer.setSelectedDataType(value);
        }, extendedTool);*/
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        var chartContainer = chartContainerBlock.extendedTool;
        var data = [];
        var chartTypes = chartContainer.getAttributes().chart_types;
        var value = chartContainer.selectedDataType;
        for (var i = 0, len = chartTypes.length; i < len; i+=1) {
            var dataType = chartTypes[i].data_type;
            data.push({
                name: chartContainer.getDataTypeName(dataType),
                value: dataType
            });
        }
        
        var combo = {
            saveSelection: block.saveSelection,
            extendedTool : extendedTool,
            width : block.width,
            editable : false,
            multiSelect : false,
            matchFieldWidth: false,
            listConfig: {
                minWidth: block.width
            },
            displayField : 'name',
            valueField : 'value',
            value: value,
            store: Ext.create('Ext.data.Store', {
                fields: ['name', 'value'],
                data: data
            }),
            queryMode: 'local',
            listeners : {
                change : function () {
                    var extendedTool = this.extendedTool;
                    var value = this.getValue();
                    var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    var periodFormat = chartContainer.getPeriodFormat(value);
                    chartContainer.setSelectedPeriodFormat(periodFormat);
                    chartContainer.setSelectedDataType(value);
                },
                render: function() {
                    Ext.create('Ext.tip.ToolTip', {
                        target: this.getEl(),
                        html: this.extendedTool.tooltipText
                    });
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        var combobox = Ext.create('Ext.form.field.ComboBox', combo);
        return combobox;
    }
};

export var toolName = "cPeriodTypeCombo";
export var tool = cPeriodTypeCombo;