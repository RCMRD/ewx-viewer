var cSelectResolutionRadios = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        var height = block.height;
        var selections = block.selections;
        var radioName = 'radio-group-'+mapper.common.getRandomString(32, 36);
        
        var radioButtons = [];
        for (var i = 0, len = selections.length; i < len; i+=1) {
            var selection = selections[i];
            var checked = (i === 0) ? true : false;
            radioButtons.push({
                inputValue: selection.value,
                boxLabel: selection.text,
                name: radioName,
                checked: checked
            });
        }
        
        var component = {
            extendedTool: extendedTool,
            xtype: 'radiogroup',
            width: width,
            height: height,
            items: radioButtons,
            fieldLabel: 'Resolution',
            labelAlign: 'top',
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cSelectResolutionRadios";
export var tool = cSelectResolutionRadios;