var cSelectDatasetCategory = {
    options: {
        events: ['checkchange']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            selectAllChecked: false,
            /* openAndEnable: function() {
				var parent = this.owningBlock.parent.component;
				if (parent.collapsed) {
					parent.expand();
				}
				
				if (this.owningBlock.rendered === true) {
					if (this.component.collapsed) {
						this.component.expand();
					}
					
					var clipNShipBtn = Ext.getCmp('clipNShipToggle');
					if (clipNShipBtn.pressed === false) {
						clipNShipBtn.toggle(true);
					}
				} else {
					setTimeout(function(extendedTool) {
						if (extendedTool.component.collapsed) {
							extendedTool.component.expand();
						}
					
						var clipNShipBtn = Ext.getCmp('clipNShipToggle');
						if (clipNShipBtn.pressed === false) {
							clipNShipBtn.toggle(true);
						}
					}, 200, this);
				}
			} */
        };

        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        var height = block.height;
        var component = {
            extendedTool: extendedTool,
            xtype: 'checkboxgroup',
            vertical: true,
            columns: 1,
            height: height,
            width: width,
            overflowY: 'auto',
            fieldLabel: 'Downloads',
            labelAlign: 'top',
            items: [/* {
				xtype: 'button',
				text: 'Select Extent on Map',
				enableToggle : true,
				extendedTool: extendedTool,
				id: 'clipNShipToggle',
				listeners: {
					toggle: function() {
						if (this.pressed) {
							this.extendedTool.addMapInteraction();
						} else {
							this.extendedTool.removeMapInteraction();
						}
					}
				}
			}, */
            {
                boxLabel: 'Select All',
                name: 'selectall',
                inputValue: 'selectall'
            }, {
                boxLabel: 'Land Cover',
                name: 'products',
                inputValue: 'land_cover',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'Land Cover'
                        });
                    }
                }
            }, {
                boxLabel: 'Impervious',
                name: 'products',
                inputValue: 'impervious',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'Impervious'
                        });
                    }
                }
            }, {
                boxLabel: 'Canopy Analytical',
                name: 'products',
                inputValue: 'canopy_analytical',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'Canopy Analytical'
                        });
                    }
                }
            }, {
                boxLabel: 'Canopy Cartographic',
                name: 'products',
                inputValue: 'canopy_cartographic',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'Canopy Cartographic'
                        });
                    }
                }
            }],
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                },
                change: function(chkgrp, newValue) {
                    this.suspendEvents();
                    var values = {};
                    if (this.extendedTool.selectAllChecked === true) {
                        this.extendedTool.selectAllChecked = false;
                        if (!newValue.hasOwnProperty('selectall')) {
                            this.setValue(values);
                        } else {
                            values.products = newValue.products;
                            this.setValue({
                                products: newValue.products
                            });
                        }
                    } else {
                        if (newValue.hasOwnProperty('selectall')) {
                            values = {
                                selectall: [],
                                products: []
                            };
                            this.items.each(function(item) {
                                values[item.name].push(item.inputValue);
                            });
                            this.extendedTool.selectAllChecked = true;
                            this.setValue(values);
                        } else {
                            values = newValue;
                        }
                    }
                    this.extendedTool.owningBlock.fire('checkchange', this, values);
                    this.resumeEvents();
                }
            }
        };

        return component;
    }
};

export var toolName = "cSelectDatasetCategory";
export var tool = cSelectDatasetCategory;
