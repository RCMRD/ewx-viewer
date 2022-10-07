var cChartDataTruncateReset = {
	options: {
		requiredBlocks: ['cChartContainer']
	},
	createExtendedTool: function(owningBlock) {
		var extendedTool = {
			owningBlock: owningBlock,
			resetStartPoint: function() {
				var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
				chartContainerBlock.extendedTool.resetStartPoint();
				this.component.hide();
			},
			setVisibility: function() {
				var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
				var chartContainer = chartContainerBlock.extendedTool;
				if (chartContainer.truncateStartPeriod !== null && !isNaN(chartContainer.truncateStartPeriod) && chartContainer.canTruncate()) {
					this.component.show();
				} else {
					this.component.hide();
				}
			}
		};
		
		var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
		chartContainerBlock.on('startpointset', function(callbackObject, postingObject, eventObject) {
			var extendedTool = callbackObject;
			extendedTool.setVisibility();
		}, extendedTool);
		
		chartContainerBlock.on('datatypechanged', function(callbackObject, postingObject, eventObject) {
			var extendedTool = callbackObject;
			extendedTool.setVisibility();
		}, extendedTool);
		
		return extendedTool;
	},
	getComponent:  function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
		var component = {
			extendedTool: extendedTool,
			xtype: 'button',
			text: '<span style="color: black;">'+block.text+'</span>',
			hidden: true,
			width: block.width ? block.width : 115,
            tooltip : block.tooltip,
			handler: function() {
				this.extendedTool.resetStartPoint();
			},
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

export var toolName = "cChartDataTruncateReset";
export var tool = cChartDataTruncateReset;