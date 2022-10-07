var cDatePickerTool = {
    options: {
        requiredBlocks: ['cDatasetExplorerTool']
    },
    init: function(blueprint) {
        if (Ext.ComponentQuery.query('periodic').length == 0)
            skin.datePicker.defineDatePicker();
    },
    createExtendedTool: function(owningBlock) {
        var datasetExplorerTool = owningBlock.getReferencedBlock('cDatasetExplorerTool');
        
        var extendedTool = {
            owningBlock: owningBlock,
            tooltipText: owningBlock.blockConfigs.tooltip,
            pickerType: owningBlock.blockConfigs.pickerType
        };
        
        if (datasetExplorerTool !== null) {
            datasetExplorerTool.on('layerchange', function(callbackObj, postingObj) {
                var datePickerTool = callbackObj;
                var datasetExplorerTool = postingObj;
                var mapWindowBlock = datasetExplorerTool.owningBlock.getReferencedBlock('cMapWindow');
                var layersConfig = mapper.layers.getLayersConfigById(mapWindowBlock.extendedTool.layersConfigId);
                //var layersConfig = mapWindowBlock.extendedTool.mapWindowMapperLayersConfig;
                
                datePickerTool.component.layersConfigUpdated(layersConfig);
            }, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var layersConfigID = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(layersConfigID);
        var topLayer = mapper.layers.getTopLayer(layersConfig.overlays);
        
        var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(topLayer.id);
        var hidden = true;
        if (periodicityWrapper !== null && periodicityWrapper.periodicity.hasMultiplePeriods()) {
            hidden = false;
        }
        
        var aDatePickerTool = Ext.create('widget.periodic', {
            extendedTool: extendedTool,
            width : 30,
            layerId : topLayer.id,
            pickerType : extendedTool.pickerType,
            hidden : hidden,
            listeners : {
                afterrender : function () {
                    Ext.create('Ext.tip.ToolTip', {
                        target : this.getEl(),
                        html : this.extendedTool.tooltipText,
                    });
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            },
        });
    
        return aDatePickerTool;
    }
};

export var toolName = "cDatePickerTool";
export var tool = cDatePickerTool;