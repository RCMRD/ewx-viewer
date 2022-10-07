var cExternalLinkButtonTool = {
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var component = {
            extendedTool: extendedTool,
            xtype : 'button',
            //cls : 'x-btn-middle white-glyph',
            cls : 'x-btn-middle',
            //iconCls: "fa " + block.icon,
            tooltip : block.tooltip,
            width: block.width,
            height: block.height,
            handler : function () {
                window.open(this.extendedTool.owningBlock.blockConfigs.url, "_blank");
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };

        if(typeof(block.text) !== 'undefined')
        {
            component.text = block.text;
        }
        else
        {
            component.iconCls =  "fa " + block.icon;
        }


        return component;
    }
};

export var toolName = "cExternalLinkButtonTool";
export var tool = cExternalLinkButtonTool;