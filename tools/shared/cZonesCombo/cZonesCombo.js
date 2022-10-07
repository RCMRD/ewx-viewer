var cZonesCombo = {
    options: {
        requiredBlocks: ['cChartContainer', 'cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            tooltipText: owningBlock.blockConfigs.tooltip,
            saveSelection: owningBlock.blockConfigs.saveSelection,
            setStore: function() {  // Sets the store on initial chart load.
                var storeData = this.getComboData();
                var value = storeData[0].value;
                var store = Ext.create('Ext.data.Store', {
                        fields : ['name', 'value'],
                        data : storeData
                    });
                
                this.component.bindStore(store);
                this.component.setValue(value);
            },
            getComboData: function () {  // Get the data for the store.
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                
                var comboData = [];
                var chartAttributes = chartContainer.getAllAttributes();
                for (var i = 0, len = chartAttributes.length; i < len; i+=1) {
                    var attributes = chartAttributes[i];
                    comboData.push({
                        value: attributes.boundaryId,
                        name: attributes.boundaryTitle
                    });
                }

                return comboData;
            }
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        var chartContainer = chartContainerBlock.extendedTool;
        var chartAttributes = chartContainer.getAllAttributes();
        var data = [];
        var value = chartContainer.selectedBoundaryId;
        for (var i = 0, len = chartAttributes.length; i < len; i+=1) {
            var attributes = chartAttributes[i];
            data.push({
                name: attributes.boundaryTitle,
                value: attributes.boundaryId
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
            valueField : 'value',
            displayField : 'name',
            store : Ext.create('Ext.data.Store', {
                fields: ['name', 'value'],
                data: data
            }),
            value: value,
            emptyText : 'Add Layers',
            listeners : {
                change : function () {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    chartContainer.setSelectedBoundaryId(this.getValue());
                },
                render: function() {
                    Ext.create('Ext.tip.ToolTip', {
                        target: this.getEl(),
                        html: this.extendedTool.tooltipText
                    });
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                }
            }
        };
        
        var combobox = Ext.create('Ext.form.field.ComboBox', combo);
        return combobox;
    }
};

export var toolName = "cZonesCombo";
export var tool = cZonesCombo;