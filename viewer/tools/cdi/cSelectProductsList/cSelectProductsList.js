var cSelectProductsList = {
    options: {
        events: ['checkchange']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            selectAllChecked: false,
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
            fieldLabel: 'Available Products',
            labelAlign: 'top',
            items: [{
                boxLabel: 'Select All',
                name: 'selectall',
                inputValue: 'selectall'
            }, /*{
                boxLabel: 'Digital Elevation Model',
                name: 'products',
                inputValue: 'dem',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'bare earth DEM (Vendor Class 2 seeded TIN)'
                        });
                    }
                }
            }, {
                boxLabel: 'Digital Surface Model',
                name: 'products',
                inputValue: 'dsm',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'first return surface (FR seeded TIN, variable smoothing for evaluation)'
                        });
                    }
                }
            }, */{
                boxLabel: 'Height Density',
                name: 'products',
                inputValue: 'hght_hden',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'min value  >1.37m (dbh) - 5 (bin count / veg count)'
                        });
                    }
                }
            }, {
                boxLabel: 'Height Count',
                name: 'products',
                inputValue: 'hght_hcnt',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'min value  >1.37m (dbh) - 5'
                        });
                    }
                }
            }, {
                boxLabel: 'Height Percentiles',
                name: 'products',
                inputValue: 'hght_hpct',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'height percentiles'
                        });
                    }
                }
            }, {
                boxLabel: 'Vegetation Cover Density',
                name: 'products',
                inputValue: 'cnpy_cden',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'all veg R / all R'
                        });
                    }
                }
            }, {
                boxLabel: 'Canopy Cover',
                name: 'products',
                inputValue: 'cnpy_ccov',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'veg FR / all FR'
                        });
                    }
                }
            }, {
                boxLabel: 'Minimum Height',
                name: 'products',
                inputValue: 'stat_hmin',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, min'
                        });
                    }
                }
            }, {
                boxLabel: 'Maximum Height',
                name: 'products',
                inputValue: 'stat_hmax',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, max'
                        });
                    }
                }
            }, {
                boxLabel: 'Average Height',
                name: 'products',
                inputValue: 'stat_havg',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, avg'
                        });
                    }
                }
            }, {
                boxLabel: 'Standard Deviation of Height',
                name: 'products',
                inputValue: 'stat_hstd',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, std'
                        });
                    }
                }
            }, {
                boxLabel: 'Height Skewness',
                name: 'products',
                inputValue: 'stat_hske',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, ske'
                        });
                    }
                }
            }, {
                boxLabel: 'Height Kurtosis',
                name: 'products',
                inputValue: 'stat_hkur',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, kur'
                        });
                    }
                }
            }, {
                boxLabel: 'Quadratic Mean Height',
                name: 'products',
                inputValue: 'stat_hqav',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'statistics, qav: sqrt((sum(x^2)/length(x)))'
                        });
                    }
                }
            }, {
                boxLabel: 'Vertical Distribution Ratio (98th percentile)',
                name: 'products',
                inputValue: 'vdrs_vdr98',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'vertical density ratio (p98 - p50) / p98'
                        });
                    }
                }
            }, {
                boxLabel: 'Vertical Distribution Ratio (100th percentile)',
                name: 'products',
                inputValue: 'vdrs_vdr100',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'vertical density ratio (p100 - p50) / p100'
                        });
                    }
                }
            }/*, { //NOT YET SUPPORTED
                boxLabel: 'Crown Base Height',
                name: 'products',
                inputValue: 'cbh',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'havg - hstd'
                        });
                    }
                }
            }, { //NOT YET SUPPORTED
                boxLabel: 'Crown Bulk Density',
                name: 'products',
                inputValue: 'cbd',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'TBD'
                        });
                    }
                }
            }, { //NOT YET SUPPORTED
                boxLabel: 'Density Mask',
                name: 'products',
                inputValue: 'dmsk',
                listeners: {
                    afterrender: function(c) {
                        Ext.create('Ext.tip.ToolTip', {
                            target: this.getEl(),
                            html: 'density mask (count of 1st returns/pixel, >1)'
                        });
                    }
                }
            }*/],
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

export var toolName = "cSelectProductsList";
export var tool = cSelectProductsList;