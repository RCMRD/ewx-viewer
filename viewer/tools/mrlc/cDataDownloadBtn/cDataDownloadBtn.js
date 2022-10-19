var cDataDownloadBtn = {
	options: {
		requiredBlocks: ['cDataDownload']
	},
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
		
		var component = {
			extendedTool: extendedTool,
			xtype: 'button',
			tooltip: block.tooltip,
			iconCls: 'fa fa-arrow-circle-o-down',
			handler: function() {
				var DataDownloadPanel = this.extendedTool.owningBlock.getReferencedBlock('cDataDownload');
				DataDownloadPanel.extendedTool.openAndEnable();
			}
		};
		
		return component;
    }
};

export var toolName = "cDataDownloadBtn";
export var tool = cDataDownloadBtn;