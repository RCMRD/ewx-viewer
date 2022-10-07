var cSelectRegionToolRadioGroup = {
    options: {
        events: ['select'],
        requiredBlocks: ['cResetQuery']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var component = {
            extendedTool: extendedTool,
            xtype: 'radiogroup',
            layout: {
                type: 'vbox',
                align: 'left'
            },
            vertical: true,
            columns: 1,
            items: items[0],
            fieldLabel: 'Select by',
            labelAlign: 'top',
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    var radioBlock = this.extendedTool.owningBlock.childItems[0];  // Only one radio buttons block can be a child of radio group.
                    radioBlock.extendedTool.radioGroup = this.extendedTool;
                    radioBlock.on('select', function(callbackObj, postingObj) {
                        var extendedTool = callbackObj;
                        var radioButtonsTool = postingObj;
                        extendedTool.selectedValue = radioButtonsTool.selectedValue;
                        extendedTool.owningBlock.fire('select', extendedTool);
                    }, this.extendedTool);
                }
            }
        };
        
        var resetQueryBlock = extendedTool.owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === false) return;
                var radioBlock = extendedTool.owningBlock.childItems[0];
                var radioButtons = radioBlock.component;
                for (var i = 0, len = radioButtons.length; i < len; i+=1) {
                    var radioButton = radioButtons[i];
                    radioButton.setValue(false);
                }
                extendedTool.selectedValue = null;
            }, extendedTool);
        }
        
        return component;
    }
};

export var toolName = "cSelectRegionToolRadioGroup";
export var tool = cSelectRegionToolRadioGroup;