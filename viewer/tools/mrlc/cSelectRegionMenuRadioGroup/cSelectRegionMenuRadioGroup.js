var cSelectRegionMenuRadioGroup = {
    options: {
        events: ['select'],
        requiredBlocks: ['cStateTool', 'cRegionSelectorMenu', 'cResetQuery', 'cSelectRegionTool']
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
            hidden: true,
            columns: 1,
            items: items[0],
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
                    
                    var stateBlock = this.extendedTool.owningBlock.getReferencedBlock('cStateTool');
                    if (stateBlock !== null) {
                        stateBlock.on('select', function(callbackObj, postingObj) {
                            var extendedTool = callbackObj;
                            extendedTool.component.show();
                        }, this.extendedTool);
                    }
                }
            }
        };
        
        var containingMenu = extendedTool.owningBlock.getReferencedBlock('cRegionSelectorMenu');
        if (containingMenu !== null) {
            containingMenu.on('menushow', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var statesBlock = extendedTool.owningBlock.getReferencedBlock('cStateTool');
                if (statesBlock !== null && statesBlock.rendered === true) {
                    if (statesBlock.extendedTool.stateValue !== null) {
                        extendedTool.component.show();
                    }
                }
            }, extendedTool);
        }
        
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
                
                extendedTool.component.hide();
            }, extendedTool);
        }
        
        var selectRegionBlock = extendedTool.owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionBlock !== null) {
            selectRegionBlock.on('aoiSelected', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === true) extendedTool.component.show();
            }, extendedTool);
        }
        
        return component;
    }
};

export var toolName = "cSelectRegionMenuRadioGroup";
export var tool = cSelectRegionMenuRadioGroup;