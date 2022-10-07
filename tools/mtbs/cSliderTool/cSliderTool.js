/* The cSliderTool is a multi-point slider allowing the
   user to select a date or date range and then the layer
   is updated with features from those specific dates */
var cSliderTool = {
    options: {
        requiredBlocks: ['cMapPanel', 'cQueryParamsDisplay', 'cResetQuery']
    },
     init : function (blueprint) {
        var cqlFilterDisplayBlueprint = blueprint.getReferencedBlueprint('cQueryParamsDisplay');
        var displayText = '';
        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var layerMapping = blueprint.blockConfigs.layers[0];
        var layers = mapper.layers.query(
            layersConfig.overlays,
            {
                id: layerMapping.id
            }
        );
        var id = blueprint.id;
        for (var i = 0, len = layers.length; i < len; i+=1) {
            var layer = layers[i];
            if (!layer.hasOwnProperty('cqlFilter')) {
                layer.cqlFilter = {};
            }
            if (!layer.cqlFilter.hasOwnProperty(id)) {
                layer.cqlFilter[id] = '';
            }
            var beginningYear = blueprint.blockConfigs.initialValues[0];
            var endingYear = blueprint.blockConfigs.initialValues[1];
            var layerMapping = blueprint.blockConfigs.layers[0];
            var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
            // If the values are the same just use one for single year 
            if (beginningYear === endingYear) {
                layer.cqlFilter[id] = idProperty + ' = ' + beginningYear;
                displayText = 'Year: '+beginningYear;
            } else {
                layer.cqlFilter[id] = idProperty + ' BETWEEN ' + beginningYear + ' AND ' + endingYear;
                displayText = 'Years: '+beginningYear+' to '+endingYear;
            }
        }
        
        if (cqlFilterDisplayBlueprint !== null) {
            cqlFilterDisplayBlueprint.itemDefinition.defaultFilters.year = displayText;
        }
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;

        var position = block.block;
        var value1 = block.initialValues[0];
        var value2 = block.initialValues[1];
        var minValue = block.minValue;
        var maxValue = block.maxValue;

        var slider = Ext.create('Ext.slider.Multi', {
            extendedTool: extendedTool,
            selectedLayerIdentifier : "nothingyet",
            label : "multiSlider",
            id : "multiSlider",
            region : "north",
            cls : block.cssClass,
            height : block.height,
            width : block.width,
            style : block.style,
            disabled : false,
            values : [value1, value2],
            increment : 1,
            minValue : minValue,
            maxValue : maxValue,
            constrainThumbs: false,
            labelAlign : 'top',
            useTips: false,
            listeners : {
                changecomplete : function(t, options) {
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    var cqlFilterDisplayBlock = this.extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                    var displayText = '';

                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                    var layers = mapper.layers.query(
                        layersConfig.overlays,
                        {
                            id: layerMapping.id
                        }
                    );
                    var id = this.extendedTool.owningBlock.blueprint.id;
                    for (var i = 0, len = layers.length; i < len; i+=1) {
                        var layer = layers[i];
                        if (!layer.hasOwnProperty('cqlFilter')) {
                            layer.cqlFilter = {};
                        }
                        if (!layer.cqlFilter.hasOwnProperty(id)) {
                            layer.cqlFilter[id] = '';
                        }
                        var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
                        /* If the values are the same just use one for single year */
                        if (t.thumbs[0].value === t.thumbs[1].value) {
                            layer.cqlFilter[id] = idProperty + ' = ' + t.thumbs[0].value;
                            displayText = 'Year: '+t.thumbs[0].value;
                        } else {
                            /* Depending on which slider is first, may need to swap the order so the between works */
                            if (t.thumbs[0].value < t.thumbs[1].value ) {
                                var beginningYear = t.thumbs[0].value;
                                var endingYear = t.thumbs[1].value;
                            } else {
                                var beginningYear = t.thumbs[1].value;
                                var endingYear = t.thumbs[0].value;
                            }
                            
                            layer.cqlFilter[id] = idProperty + ' BETWEEN ' + beginningYear + ' AND ' + endingYear;
                            displayText = 'Years: '+beginningYear+' to '+endingYear;
                        }
                        mapper.OpenLayers.forceLayerUpdateById(layer.id, map);
                    }
                    
                    if (cqlFilterDisplayBlock !== null) {
                        cqlFilterDisplayBlock.extendedTool.setFilter('year', displayText);
                    }
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        layersConfig,
                        mapper.layers);
                },
                afterrender: function(t, options) {
                    for(i=0; i<t.thumbs.length; i++){
                        var thumbElId = t.thumbs[i].el.id;
                        var thumbLabelElId = 'thumb-label-'+i;
                        Ext.DomHelper.append(thumbElId,
                            {
                            tag: 'div',
                                id: thumbLabelElId,
                                cls: thumbLabelElId,
                                html: t.thumbs[i].value,
                            }
                        );
                    }
                    
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                },
                change: function(t, options) {
                    for(i=0; i<t.thumbs.length; i++){
                        var thumbLabelElId = 'thumb-label-'+i;
                        Ext.DomHelper.overwrite(thumbLabelElId,
                            {
                            tag: 'div',
                                id: thumbLabelElId,
                                cls: thumbLabelElId,
                                html: t.thumbs[i].value,
                            }
                        );
                        Ext.get(thumbLabelElId).applyStyles("margin-left:0%");
                    }
                }
            }
        });
        
        var resetQueryBlock = extendedTool.owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
                var initialValues = extendedTool.owningBlock.blockConfigs.initialValues;
                var startYear = initialValues[0];
                var endYear = initialValues[1];
                var cqlFilter = '';
                var displayText = '';
                
                if (startYear === endYear) {
                    cqlFilter = idProperty + ' = '+startYear;
                    displayText = 'Year: '+startYear;
                } else {
                    cqlFilter = idProperty + ' BETWEEN '+startYear+' AND '+endYear;
                    displayText = 'Years: '+startYear+' to '+endYear;
                }
                var layers = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        id: layerMapping.id
                    }
                );
                
                var id = extendedTool.owningBlock.blueprint.id;
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter.hasOwnProperty(id)) {
                        layer.cqlFilter[id] = cqlFilter;
                    }
                }
                
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('year', displayText);
                }
                
                extendedTool.component.setValue(initialValues, false);
            }, extendedTool);
        }
        
        return slider;
    }
}

export var toolName = "cSliderTool";
export var tool = cSliderTool;