var cToolGroupPanel = {
	getComponent: function(extendedTool, items, toolbar, menu) {
		var block = extendedTool.owningBlock.blockConfigs;
		
		var component = {
			extendedTool: extendedTool,
			width: block.width,
			height: block.height,
			cls: 'x-toolbar-default x-toolbar',
			style: 'border-color: #FFFFFF;',
			layout: {
				type: 'hbox',
				align: 'middle',
				pack: 'center',
				defaultMargins: '0 5px',
			},
			defaults: {
				cls: 'x-btn-middle',
				ui: 'default-toolbar'
			},
			header: {
				frame: false,
				titleAlign: 'center',
				cls: 'tool-group-panel-header',
				style: {
					fontWeight: 'bold',
					backgroundColor: '#FFFFFF',
					color: 'black!important',
					padding: 0,
				},
				shadow: false,
				title: block.label
			},
			items : items,
			listeners : {
				afterrender: function() {
					this.extendedTool.component = this;
					this.extendedTool.owningBlock.component = this;
					this.extendedTool.owningBlock.rendered = true;
				},
			}
		};
		
		component = skin.blocks.addToolBarItems(block, component, toolbar);
		component = skin.ExtJSPosition(component, block);
		
		return Ext.create('Ext.panel.Panel', component);
	}
};

export var toolName = "cToolGroupPanel";
export var tool = cToolGroupPanel;