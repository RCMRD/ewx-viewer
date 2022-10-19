var cFeatureInfoTableLabel = {
    options: {
        requiredBlocks: ['cFeatureInfoTable']
    },
    featureTableUpdatedCallback: function(callbackObj, postingObj) {
        var extendedTool = callbackObj;
        var aoiTool = postingObj;
        var featureInfoTableBlock = extendedTool.owningBlock.getReferencedBlock('cFeatureInfoTable');
        var totalCount = 0;
        if (featureInfoTableBlock.rendered === true) {
            totalCount = featureInfoTableBlock.extendedTool.featureList.length;
        }
        extendedTool.component.setText('Total Fires: ' + totalCount);
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var extTool = {
            extendedTool: extendedTool,
            xtype : 'tbtext',
            text : block.label,
            style : block.style,
            listeners : {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;

                }
            }
        };

        /* Set up the listener for featureInfoTable so the label gets updated when its updated */
        var featureInfoTableBlock = extendedTool.owningBlock.getReferencedBlock('cFeatureInfoTable');
        featureInfoTableBlock.on('tableUpdatedEvent', extendedTool.owningBlock.itemDefinition.featureTableUpdatedCallback, extendedTool);

        return extTool;
    }
}

export var toolName = "cFeatureInfoTableLabel";
export var tool = cFeatureInfoTableLabel;