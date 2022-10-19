var cMenuLabel = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        return {
            extendedTool: extendedTool,
            xtype : 'tbtext',
            text : block.label,
            style : {marginTop : '7px', marginBottom : '5px', marginLeft : '10px'},
            listeners : {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
    }
};

export var toolName = "cMenuLabel";
export var tool = cMenuLabel;