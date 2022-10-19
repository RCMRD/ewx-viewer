var cClipNShipBtn = {
	options: {
		requiredBlocks: ['cClipNShip']
	},
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
		
		var component = {
			extendedTool: extendedTool,
			xtype: 'button',
			tooltip: block.tooltip,
			iconCls: 'fa fa-crop',
			handler: function() {
				var clipNShipPanel = this.extendedTool.owningBlock.getReferencedBlock('cClipNShip');
				clipNShipPanel.extendedTool.openAndEnable();
			}
		};
		
		return component;
    }
};

export var toolName = "cClipNShipBtn";
export var tool = cClipNShipBtn;