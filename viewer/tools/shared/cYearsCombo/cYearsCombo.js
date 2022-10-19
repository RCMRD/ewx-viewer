var cYearsCombo = {
    options: {
        requiredBlocks: ['cChartContainer', 'cMapWindow']
    },
    init: function(blueprint) {
        skin.createSelectAllCombo();
    },
    createExtendedTool: function(owningBlock) {
        var block = owningBlock.blockConfigs;
        
        var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
        var chartContainer = chartContainerBlock.extendedTool;
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var mapperWindow = mapWindowBlock.extendedTool;
        
        var extendedTool = {
            owningBlock: owningBlock,
            tooltipText: block.tooltip,
            saveSelection: block.saveSelection,
            store: null,
            defaultValue: null,
            createStore: function() {
                var data = extendedTool.getComboData();
                this.store = Ext.create('Ext.data.Store', {
                    fields : ['name', 'value'],
                    data : data
                });
                this.defaultValue = this.getDefaultValue();
            },
            setStore: function() {  // Sets the combo box store on initial chart load.
                var data = extendedTool.getComboData();
                var store = Ext.create('Ext.data.Store', {
                        fields : ['name', 'value'],
                        data : data
                    });
                
                this.component.bindStore(store);
                this.component.setValue(this.getDefaultValue());
            },
            getComboData: function() {  // Gets the data for the store.
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                
                var attributes = chartContainer.getAttributes();
                var periodFormat = chartContainer.getPeriodFormat();
                var data = [];
                if (periodFormat === 'years') {  // Not interannual. Get list of years.
                    var seasons = attributes.seasons;

                    for (var i = 0; i < seasons.length; i++) {
						var season = seasons[i];
						var display = season.toString();
                        data.push({
                            name : display,
                            value : season
                        });
                    }
					
					var staticSeasonNames = attributes.staticSeasonNames;
					if (staticSeasonNames) {
						for (var i = 0, len = staticSeasonNames.length; i < len; i+=1) {
							var season = staticSeasonNames[i];
							data.push({
								name : mapper.amcharts.getSeasonDisplayName(season),
								value : season
							});
						}
					}

                    data.reverse();
                } else if (periodFormat === 'periods') {
                    // Interannual. Get list of periods.
                    var period = attributes.period;
                    var periods = mapper.periodicity.getPeriodsPerYear(period);

                    for (var i = periods.length-1; i >= 0; i-=1) {
                        var periodInYear = periods[i];
                        var name = custom.periodicity.getPeriodLabel(period, periodInYear);

                        data.push({
                            name : name,
                            value : periodInYear
                        });
                    }
                }

                return data;
            },
            getSavedSelection: function() {  // Retrieves the saved selection when opening a new chart on the same map window.
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                
                if (mapWindowBlock !== null) {
                    var mapperWindow = mapWindowBlock.extendedTool;
                    var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    var attributes = chartContainer.getAttributes();
                    if (!mapperWindow.savedPeriodSelection.hasOwnProperty(chartContainer.uniqueId)) {
                        return [];
                    }
                    if (!mapperWindow.savedPeriodSelection[chartContainer.uniqueId].hasOwnProperty(attributes.period)) {
                        return [];
                    }
                    return mapperWindow.savedPeriodSelection[chartContainer.uniqueId][attributes.period][chartContainer.getPeriodFormat()];
                }
            },
            setSavedSelection: function(value) {  // Sets saved selection per map window.
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                
                if (mapWindowBlock !== null) {
                    var mapperWindow = mapWindowBlock.extendedTool;
                    var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    var attributes = chartContainer.getAttributes();
                    if (!mapperWindow.savedPeriodSelection.hasOwnProperty(chartContainer.uniqueId)) {
                        mapperWindow.savedPeriodSelection[chartContainer.uniqueId] = {};
                    }
                    if (!mapperWindow.savedPeriodSelection[chartContainer.uniqueId].hasOwnProperty(attributes.period)) {
                        mapperWindow.savedPeriodSelection[chartContainer.uniqueId][attributes.period] = {
                            years: [],
                            periods: []
                        };
                    }
                    mapperWindow.savedPeriodSelection[chartContainer.uniqueId][attributes.period][chartContainer.getPeriodFormat()] = value;
                }
            },
            getDefaultValue: function () {  // Gets the default value to select in the combo.
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                
                var periodFormat = chartContainer.getPeriodFormat();
                var attributes = chartContainer.getAttributes();
                var value;
                var mapWindow = mapWindowBlock.component;
                if (this.saveSelection === true && mapWindow && this.getSavedSelection().length > 0) {  // Uses saved selection if a selection was previously made and the map window has not been closed.
                    var savedSelection = this.getSavedSelection();
                    value = [];
                    var options = this.getComboData();
                    for (var i = 0; i < options.length; i++) {
                        var option = options[i].value;
                        var compareOption = (typeof(option) !== 'string' || /^\d\d\d\d\-\d\d\d\d$/.test(option) === false) ? option : parseInt(option.split('-')[1]);

                        for (var j = 0; j < savedSelection.length; j++) {
                            var selection = savedSelection[j];
                            var compareSelection = (typeof(selection) !== 'string' || /^\d\d\d\d\-\d\d\d\d$/.test(option) === false) ? selection : parseInt(selection.split('-')[1]);
                            if (compareSelection === compareOption) {
                                value.push(option);
                            }
                        }
                    }
                } else if (periodFormat === "years") {  // Retrieve default selected years on initial load.
					var seasons = attributes.seasons;
                    value = mapper.amcharts.getDefaultSelectedYears(attributes.startMonth, seasons, attributes.staticSeasonNames, this.owningBlock.blockConfigs.showByDefault);
                } else {  // Get default selected periods on initial load (default is current period in current year).
                    value = this.endPeriod;
                }

                return value;
            },
            isDataChanged: function(list1, list2) {
                for (var i = 0, len = list1.length; i < len; i+=1) {
                    var value1 = list1[i];
                    if (list2.indexOf(value1) === -1) {
                        return true;
                    }
                }
                for (var i = 0, len = list2.length; i < len; i+=1) {
                    var value2 = list2[i];
                    if (list1.indexOf(value2) === -1) {
                        return true;
                    }
                }
                return false;
            },
            getOverflowCombo : function() {  // Retrieve the associated combo in toolbars overflow menu.
                var toolbar = this.component.owningToolbar;
                if (toolbar.layout.overflowHandler.menu) {
                    var items = toolbar.layout.overflowHandler.menu.items.items;
                    for (var i = 0, len = items.length; i < len; i+=1) {
                        var item = items[i];
                        if (item.comboType === 'periodsCombo') {
                            return item;
                        }
                    }
                }
                return null;
            },
            updateOverflowCombo : function(data, newPeriodsComboValue) {  // Since the combo in the overflow menu is a copy of this combo, make sure it is updated when this combo is updated.
                var overflowCombo = this.getOverflowCombo();
                if (overflowCombo !== null) {
                    overflowCombo.suspendEvents();
                    if (typeof(data) === 'undefined' || data === null) data = this.getComboData();
                    if (typeof(newPeriodsComboValue) === 'undefined' || newPeriodsComboValue === null) newPeriodsComboValue = this.getDefaultValue();
                    
                    var store = Ext.create('Ext.data.Store', {
                        fields : ['name', 'value'],
                        data : data
                    });
                    
                    overflowCombo.clearValue();
                    overflowCombo.bindStore(store);
                    overflowCombo.setValue(newPeriodsComboValue);
                    overflowCombo.resumeEvents();
                }
            }
        };
        
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        
        chartContainerBlock.on('periodsync', function(callbackObj, postingObj, eventObj) {
            var extendedTool = callbackObj;
            if (extendedTool.attributesUpdated !== true) return;
            var chartContainer = postingObj;
            var periodList = eventObj;
            
            var seasons = chartContainer.getAttributes().seasons;
            var selection = extendedTool.getDefaultValue();
            var newSelection = [];
            for (var i = 0, len = periodList.length; i < len; i+=1) {
                var periodObj = periodList[i];
                if (seasons.indexOf(periodObj.period) !== -1 && periodObj.selected === true) {
                    newSelection.push(periodObj.period);
                }
            }
            
            for (var i = 0, len = selection.length; i < len; i+=1) {
                var value = selection[i];
                var valueInPeriodList = false;
                for (var j = 0, length = periodList.length; j < length; j+=1) {
                    var periodObj = periodList[j];
                    if (periodObj.period === value) {
                        valueInPeriodList = true;
                        break;
                    }
                }
                if (valueInPeriodList === false) {
                    newSelection.push(value);
                }
            }
            
            extendedTool.setSavedSelection(newSelection);
            if (extendedTool.owningBlock.rendered === true) {
                extendedTool.component.suspendEvents();
                extendedTool.setStore();
                extendedTool.component.resumeEvents();
            }
            chartContainer.setSelectedPeriods(newSelection);
        }, extendedTool);
        
        chartContainerBlock.on('attributesupdated', function(callbackObj, postingObj, eventObj) {  // After feature info is returned (chart attributes), we can use them here.
            var extendedTool = callbackObj;
            var chartContainer = postingObj;
            extendedTool.attributesUpdated = true;
            chartContainer.setSelectedPeriods(extendedTool.getDefaultValue());
            var attributes = chartContainer.getAttributes();
            
            if (!extendedTool.hasOwnProperty('endPeriod')) {
                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(attributes.overlayId);
                var topPeriod = periodicityWrapper.periodicity;
                var bottomPeriod = topPeriod.getBottomPeriodObj();
                topPeriod.suspendEvents();
                var selection = topPeriod.getSelection();
                topPeriod.setToEnd();
                var endPeriod = parseInt(topPeriod.buildLabel('{{'+topPeriod.labelVariable+'}}-{{'+bottomPeriod.labelVariable+'}}').split('-')[1]);
                topPeriod.setSelection(selection);
                topPeriod.resumeEvents();
                extendedTool.endPeriod = endPeriod;
            }
            
            if (extendedTool.owningBlock.rendered === true) {
                extendedTool.component.suspendEvents();
                extendedTool.setStore();
                extendedTool.component.resumeEvents();
                var width = extendedTool.owningBlock.blockConfigs.width;
                if (!width) width = 30;
                width += 10;
                var pickerWidth = (attributes.startMonth > 1) ? width + 30 : width;
                extendedTool.component.getPicker().setWidth(pickerWidth);
            }
            
        }, extendedTool);
        
        if (typeof(mapperWindow.savedPeriodSelection) === 'undefined') {
            mapperWindow.savedPeriodSelection = {};
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        
        var combo = {
            saveSelection: block.saveSelection,
            extendedTool : extendedTool,
            width : width,
            editable : false,
            multiSelect : true,
            matchFieldWidth: false,
            plugins : block.select_control_buttons === true ? ['selectedCount'] : [],
            displayField : 'name',
            valueField : 'value',
            comboType : 'periodsCombo',
            listeners : {
                change : function () {
                    var value = this.getValue();
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    if (this.saveSelection === true) this.extendedTool.setSavedSelection(value);
                    chartContainer.setSelectedPeriods(value);
                },
                render: function() {
                    Ext.create('Ext.tip.ToolTip', {
                        target: this.getEl(),
                        html: this.extendedTool.tooltipText
                    });
                },
                afterrender: function() {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                    if (!this.extendedTool.attributesUpdated) return;
                    var attributes = chartContainer.getAttributes();
                    this.suspendEvents();
                    this.extendedTool.setStore();
                    this.resumeEvents();
                    var width = this.extendedTool.owningBlock.blockConfigs.width;
                    if (!width) width = 30;
                    width += 10;
                    var pickerWidth = (attributes.startMonth > 1) ? width + 30 : width;
                    this.getPicker().setWidth(pickerWidth);
                }
            }
        };
        
        var combobox = Ext.create('Ext.form.field.ComboBox', combo);
        extendedTool.combo = combobox;
        
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        chartContainerBlock.on('datatypechanged', function(extendedTool) {  // Fires when the period type combo is changed. If interannual is selected, show list of periods. Else list of years.
            var combo = extendedTool.component;
            var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
            var chartContainer = chartContainerBlock.extendedTool;
            
            combo.suspendEvents();
            combo.clearValue();
            combo.resumeEvents();
            var data = extendedTool.getComboData();
            var value = extendedTool.getDefaultValue();
            var store = Ext.create('Ext.data.Store', {
                fields : ['name', 'value'],
                data : JSON.parse(JSON.stringify(data))
            });
            combo.bindStore(store);
            combo.setValue(value);
            extendedTool.updateOverflowCombo(data, value);
        }, extendedTool);
        
        chartContainerBlock.on('boundaryidchanged', function(extendedTool) {  // Fires when the period type combo is changed. If interannual is selected, show list of periods. Else list of years.
            var combo = extendedTool.component;
            var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
            var chartContainer = chartContainerBlock.extendedTool;
            
            combo.suspendEvents();
            combo.clearValue();
            combo.resumeEvents();
            var data = extendedTool.getComboData();
            var value = extendedTool.getDefaultValue();
            var store = Ext.create('Ext.data.Store', {
                fields : ['name', 'value'],
                data : JSON.parse(JSON.stringify(data))
            });
            combo.bindStore(store);
            combo.setValue(value);
            extendedTool.updateOverflowCombo(data, value);
        }, extendedTool);
        
        return combobox;
    }
};

export var toolName = "cYearsCombo";
export var tool = cYearsCombo;