var cChartTabPanel = {
    options: {
        destroyIfEmpty: true
    },
    addChild: function(component, child) {
        component.add(child);
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            childIds: [],
            childUpdated: {
                periods: {},
                periodFormat: {}
            },
            updateChildren: function(updateType, chartContainer, triggerId) {
                var allChildrenUpdated = true;
                var noChildrenUpdated = true;
                for (var id in this.childUpdated[updateType]) {
                    if (this.childUpdated[updateType][id] === false) {
                        allChildrenUpdated = false;
                    } else {
                        noChildrenUpdated = false;
                    }
                }
                
                if (noChildrenUpdated === true) {
                    this.childUpdated[updateType][triggerId] = true;
                    switch (updateType) {
                        case 'periods':
                            this.updateSelectedPeriods(triggerId);
                            break;
                        case 'periodFormat':
                            this.updateSelectedPeriodFormat(triggerId);
                            break;
                    }
                } else if (allChildrenUpdated === true) {
                    for (var id in this.childUpdated[updateType]) {
                        this.childUpdated[updateType][id] = false;
                    }
                }
            },
            updateSelectedPeriods: function(triggerId) {
                var children = this.component.items;
                var periodList = [];
                children.each(function(child) {
                    if (child.extendedTool.uniqueId === triggerId) {
                        var selectedPeriods = child.extendedTool.selectedPeriods;
                        var seasons = child.extendedTool.getAttributes().seasons;
                        for (var i = 0, len = seasons.length; i < len; i+=1) {
                            var season = seasons[i];
                            var selected = true;
                            if (selectedPeriods.indexOf(season) === -1) {
                                selected = false;
                            }
                            periodList.push({
                                period: season,
                                selected: selected
                            });
                        }
                    }
                });
                children.each(function(child) {
                    if (child.extendedTool.uniqueId !== triggerId) {
                        this.childUpdated.periods[child.extendedTool.uniqueId] = true;
                        child.extendedTool.syncSelectedPeriods(periodList);
                    }
                }, this);
            },
            updateSelectedPeriodFormat: function(triggerId) {
                var children = this.component.items;
                var selectedPeriodFormat, selectedDataType;
                children.each(function(child) {
                    if (child.extendedTool.uniqueId === triggerId) {
                        selectedPeriodFormat = child.extendedTool.periodFormat;
                        selectedDataType = child.extendedTool.selectedDataType;
                    }
                });
                children.each(function(child) {
                    if (child.extendedTool.uniqueId !== triggerId) {
                        this.childUpdated.periodFormat[child.extendedTool.uniqueId] = true;
                        child.extendedTool.setSelectedPeriodFormat(selectedPeriodFormat);
                        console.log(child.extendedTool.owningBlock.rendered);
                        if (child.extendedTool.owningBlock.rendered === true) {
                            child.extendedTool.setSelectedDataType(selectedDataType);
                        } else {
                            child.extendedTool.selectedDataType = selectedDataType;
                        }
                    }
                }, this);
            }
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var tabPanel = skin.ExtJSPosition({
            extendedTool : extendedTool,
            xtype: 'tabpanel',
            DeferredRender : false,
            layout : 'card',
            autoRender : false,
            autoShow : false,
            defaults : {},
            closable : false,
            activeTab : 0,
            items : items,
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    var children = this.items;
                    children.each(function(child) {
                        this.childIds.push(child.extendedTool.uniqueId);
                        this.childUpdated.periods[child.extendedTool.uniqueId] = false;
                        this.childUpdated.periodFormat[child.extendedTool.uniqueId] = false;
                        
                        child.extendedTool.owningBlock.on('periodschanged', function(callbackObj, postingObj, eventObj) {
                            var extendedTool = callbackObj;
                            var chartContainer = postingObj;
                            extendedTool.updateChildren('periods', chartContainer, chartContainer.uniqueId);
                        }, this);
                        
                        /*child.extendedTool.owningBlock.on('periodformatchanged', function(callbackObj, postingObj, eventObj) {
                            var extendedTool = callbackObj;
                            var chartContainer = postingObj;
                            extendedTool.updateChildren('periodFormat', chartContainer, chartContainer.uniqueId);
                        }, this);*/
                    }, this.extendedTool);
                }
            }
        }, block);
        
        return tabPanel;
    }
};

export var toolName = "cChartTabPanel";
export var tool = cChartTabPanel;