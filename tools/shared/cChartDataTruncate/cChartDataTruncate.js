var cChartDataTruncate = {
	options: {
		requiredBlocks: ['cChartContainer']
	},
	createExtendedTool: function(owningBlock) {
		var extendedTool = {
			owningBlock: owningBlock,
			setChartTruncating: function() {
				var chartContainer = this.owningBlock.getReferencedBlock('cChartContainer');
				chartContainer.extendedTool.startTruncating();
			},
			unsetChartTruncating: function() {
				var chartContainer = this.owningBlock.getReferencedBlock('cChartContainer');
				chartContainer.extendedTool.stopTruncating();
			}
		};
		
		var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
		chartContainerBlock.on('graphtypechanged', function(callbackObject, postingObject, eventObject) {
			var extendedTool = callbackObject;
			var chartContainer = postingObject;
			if (extendedTool.owningBlock.rendered === true) {
				var component = extendedTool.component;
				if (component.pressed === true) {
					component.toggle();
				}
				
				if (chartContainer.canTruncate() === true) {
					component.show();
				} else {
					component.hide();
				}
			}
			if (chartContainer.truncating === true) {
				
			}
		}, extendedTool);
		
		return extendedTool;
	},
	getComponent:  function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
		var component = {
			extendedTool: extendedTool,
			xtype: 'button',
            //cls : 'x-btn-left',
            //iconCls: (block.iconClass) ? block.iconClass : 'fa fa-scissors',
			icon: 'images/start_point.jpg',
			iconAlign: 'left',
			text: '<span style="color: black;">'+block.text+'</span>',
			textAlign: 'right',
			hidden: true,
			width: block.width ? block.width : 115,
            tooltip : block.tooltip,
            enableToggle : true,
			listeners: {
				toggle: function() {
					if (this.pressed) {
						this.extendedTool.setChartTruncating();
					} else {
						this.extendedTool.unsetChartTruncating();
					}
				},
				afterrender: function() {
					this.extendedTool.component = this;
					this.extendedTool.owningBlock.component = this;
					this.extendedTool.owningBlock.rendered = true;
					
					var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
					if (chartContainerBlock.extendedTool.canTruncate() === true) {
						this.show();
					}
				}
			}
		};
		
		return component;
	}
	
};

export var toolName = "cChartDataTruncate";
export var tool = cChartDataTruncate;