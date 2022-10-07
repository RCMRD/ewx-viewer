var cChartTypeCombo = {
    options: {
        requiredBlocks: ['cChartContainer', 'cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var mapperWindow = mapWindowBlock.extendedTool;
        
        var extendedTool = {
            owningBlock: owningBlock,
            setStore: function() { // Sets the store for this combo on initial chart load.
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                
                var data = this.getComboData(),
                attributes = chartContainer.getAttributes(),
                value = mapperWindow.savedGraphSelection[chartContainer.getDataTypeName()][attributes.overlayId][attributes.boundaryId];
                
                var store = Ext.create('Ext.data.Store', {
                    fields : ['name', 'value', 'qtip'],
                    data : data,
                    autoLoad: true
                });
                
                this.component.suspendEvents();
                this.component.bindStore(store);
                this.component.setValue(value);
                this.component.store.load({
                    scope: this,
                    callback: function(records) {
                        this.component.updateImage();
                    }
                });
                this.component.resumeEvents();
            },
            getComboData: function () {  // Gets the data for the store (either bar or line graph).
                var data = [];
                var chartContainerBlock = this.owningBlock.getReferencedBlock('cChartContainer');
                if (chartContainerBlock !== null) {
                    var chartContainer = chartContainerBlock.extendedTool;
                    var graphTypes = chartContainer.getGraphTypes();
                    var imagePaths = this.owningBlock.blockConfigs.images;
                    if (typeof(imagePaths) === 'undefined') {
                        imagePaths = {
                            bar: "images/bars.png",
                            line: "images/line_chart.png"
                        };
                    }
                    for (var i = 0, len = graphTypes.length; i < len; i+=1) {
                        switch (graphTypes[i]) {
                            case 'bar':
                                data.push({
                                    name : imagePaths.bar,
                                    value : graphTypes[i],
                                    qtip: 'Bar graph'
                                });
                                break;
                            case 'line':
                                data.push({
                                    name : imagePaths.line,
                                    value : graphTypes[i],
                                    qtip: 'Line graph'
                                });
                        }
                    }
                }
                return data;
            }
        };
        
        var chartContainerBlock = owningBlock.getReferencedBlock('cChartContainer');
        if (chartContainerBlock !== null) {
            chartContainerBlock.on('attributesupdated', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                extendedTool.attributesUpdated = true;
                if (extendedTool.owningBlock.rendered === true) extendedTool.setStore();
            }, extendedTool);
        }
        
        if (typeof(mapperWindow.savedGraphSelection) === 'undefined') {
            mapperWindow.savedGraphSelection = {};
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        var chartContainer = chartContainerBlock.extendedTool;
        var mapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
        var mapperWindow = mapWindowBlock.extendedTool;
        
        var savedGraphSelection = mapperWindow.savedGraphSelection,
        chartAttributes = chartContainer.getAllAttributes();
        
        for (var i = 0, len = chartAttributes.length; i < len; i+=1) {
            var attributes = chartAttributes[i],
            boundaryId = attributes.boundaryId,
            overlayId = attributes.overlayId;
            
            for (var j = 0, length = attributes.chart_types.length; j < length; j+=1) {
                var chartType = attributes.chart_types[j];
                var dataTypeName = chartContainer.getDataTypeName(chartType.data_type);
                if (!savedGraphSelection.hasOwnProperty(dataTypeName)) savedGraphSelection[dataTypeName] = {};
                if (!savedGraphSelection[dataTypeName].hasOwnProperty(overlayId)) savedGraphSelection[dataTypeName][overlayId] = {};
                if (savedGraphSelection[dataTypeName][overlayId].hasOwnProperty(boundaryId)) continue;
                savedGraphSelection[dataTypeName][overlayId][boundaryId] = chartType.graph_types[0];
            }
        }
        
        var combo = {
            saveSelection: block.saveSelection,
            extendedTool : extendedTool,
            width : block.width,
            editable : false,
            multiSelect : false,
            valueField : 'value',
            comboType : 'chartTypeCombo',
            tpl: [  // Allows rendering of images instead of text in combobox.
                '<tpl for=".">',
                    '<div class="x-boundlist-item" data-qtip="{qtip}">',
                        '<img src="{name}"/>',
                    '</div>',
                '</tpl>'
            ],
            getImageUrl: function() {
                var name = '';
                var value = this.getValue();
                var records = this.store.data.items;
                for (var i = 0, len = records.length; i < len; i+=1) {
                    var record = records[i];
                    if (record.get('value') === value) {
                        name = record.get('name');
                        break;
                    }
                }
                return name;
            },
            getOverflowCombo: function() {
                var toolbar = this.owningToolbar;
                if (toolbar && toolbar.layout.overflowHandler.menu) {
                    var items = toolbar.layout.overflowHandler.menu.items.items;
                    for (var i = 0, len = items.length; i < len; i+=1) {
                        var item = items[i];
                        if (item.comboType === 'chartTypeCombo') {
                            return item;
                        }
                    }
                }
                
                return null;
            },
            updateImage : function() {  // Updates the image shown in the combobox.
                var imageUrl = this.getImageUrl();
                
                this.inputEl.setStyle({
                    'background-image':    'url(' + imageUrl + ')',
                    'background-repeat':   'no-repeat',
                    'background-position': '3px center',
                    'padding-left':        '25px'
                });
                
                this.updateOverflowImage(imageUrl);
            },
            updateOverflowImage: function(imageUrl) {
                var overflowCombo = this.getOverflowCombo();
                if (overflowCombo !== null) {
                    if (typeof(imageUrl) === 'undefined') imageUrl = this.getImageUrl();
                    overflowCombo.inputEl.setStyle({
                        'background-image':    'url(' + imageUrl + ')',
                        'background-repeat':   'no-repeat',
                        'background-position': '3px center',
                        'padding-left':        '25px'
                    });
                }
            },
            listeners : {
                change : function (combo, records) {
                    var chartContainerBlock = this.extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                    var chartContainer = chartContainerBlock.extendedTool;
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    
                    var value = combo.getValue();
                    combo.updateImage();
                    
                    if (mapWindowBlock !== null) {
                        var mapperWindow = mapWindowBlock.extendedTool;
                        
                        var attributes = chartContainer.getAttributes();
                        
                        if (combo.saveSelection === true) {
                            mapperWindow.savedGraphSelection[chartContainer.getDataTypeName()][attributes.overlayId][attributes.boundaryId] = value;
                        }
                    }
                    
                    chartContainer.setSelectedGraphType(value);
                },
                afterrender: function(combo, records) {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                    
                    var chartContainer = chartContainerBlock.extendedTool;
                    var attributes = chartContainer.getAttributes(),
                    value = mapperWindow.savedGraphSelection[chartContainer.getDataTypeName()][attributes.overlayId][attributes.boundaryId];
                    if (value) chartContainer.selectedGraphType = value;
                    if (this.extendedTool.attributesUpdated === true) {
                        this.extendedTool.setStore();
                    }
                },
                render: function() {
                    Ext.create('Ext.tip.ToolTip', {
                        target: this.getEl(),
                        html: this.extendedTool.owningBlock.blockConfigs.tooltip
                    });
                }
            }
        };
        
        var combobox = Ext.create('Ext.form.field.ComboBox', combo);
        
        var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
        if (chartContainerBlock !== null) {
            chartContainerBlock.on('boundaryidchanged', function(extendedTool) {
                var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                var mapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                extendedTool.setStore();
                chartContainer.setSelectedGraphType(extendedTool.component.getValue());
            }, extendedTool);
            
            chartContainerBlock.on('datatypechanged', function(extendedTool) {
                var chartContainerBlock = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                var chartContainer = chartContainerBlock.extendedTool;
                var mapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                extendedTool.setStore();
                chartContainer.setSelectedGraphType(extendedTool.component.getValue());
            }, extendedTool);
            
            chartContainerBlock.on('overflowmenushow', function(extendedTool) {
                extendedTool.component.updateOverflowImage();
            }, extendedTool);
        }
        
        return combobox;
    }
};

export var toolName = "cChartTypeCombo";
export var tool = cChartTypeCombo;