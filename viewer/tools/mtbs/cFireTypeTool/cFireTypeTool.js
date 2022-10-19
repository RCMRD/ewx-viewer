/* The FireTypeTool is a combobox that is populated using a wfs
   call to get the fire types from the firePolygons layer layer */
var cFireTypeTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel', 'cQueryParamsDisplay', 'cResetQuery'],
        events: ['select']
    },
    layerConfigUpdated: function(postingObj, callbackObj, eventObj) {
        var extendedTool = callbackObj;
        if (extendedTool.vectorAdded === true) {
            var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            map.removeLayer(extendedTool.vector);
            map.addLayer(extendedTool.vector);
        }
    },
    createExtendedTool : function(owningBlock) {
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var extendedTool = {
            owningBlock: owningBlock,
            value: null,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            vectorAdded: false,
            // getStoreLayer will get the layer to be used to query 
            getStoreLayer() {
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = this.owningBlock.blockConfigs.layers[0];
                var layer = mapper.layers.query(
                    layersConfig,
                    {
                        id: layerMapping.id
                    },
                    ['overlays', 'boundaries']
                )[0];
                
                return layer;

            },
            /* getStore will query the store layer for the id and display values 
             * and put it into a data store for loading the combobbox */
            getStore() {
                var layer = this.getStoreLayer();
                var layerMapping = this.owningBlock.blockConfigs.layers[0];
                var featureInfoMapping = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['display', 'id']);
                var properties = [];
                
                for (var i = 0, len = featureInfoMapping.length; i < len; i+=1) {
                    properties.push(featureInfoMapping[i].propertyName);
                }

                var propertyNameParam = '&propertyName='+properties.join(',');
                var url = layer.source.wfs;
                var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json'+propertyNameParam;
                //var url = 'http://igskmncnvs191.cr.usgs.gov:8080/geoserver/mtbs/wfs?service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=json'+propertyNameParam+cqlFilterParam;
                var store = [];
                mapper.common.asyncAjax({
                    type: 'POST',
                    url: url,
                    params: params,
                    callbackObj: this,
                    callback: function(response, extendedTool) {
                        //This returns the json of the display and id values for each record
                        var collection = JSON.parse(response.responseText);
                        var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                        var featureInfoMapping = layerMapping.featureInfo;
                        var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['id'], 'propertyName');
                        var displayProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display'], 'propertyName')[0];
                        var fields = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display', 'id'], 'propertyName');
                        
                        var features = mapper.OpenLayers.combineFeaturesByProperties(collection.features, idProperties);
                        var data = [];
                        //make the list distinct
                        for (var v = 0, len = features.length; v < len; v +=1)
                        {
                            var feature = features[v];
                            var obj = {};
                            for (var i = 0, length = featureInfoMapping.length; i < length; i+=1) {
                                var featureInfoMap = featureInfoMapping[i];
                                var value = mapper.layers.toolMapping.getFeatureInfoValue(feature, featureInfoMap.propertyName);
                                obj[featureInfoMap.propertyName] = value;
                            }
                            data.push(obj);
                        }
                        //Sort the list alphabetically
                        data.sort(function(a,b) {
                            if (a[displayProperty].toLowerCase() < b[displayProperty].toLowerCase()) {
                                return -1;
                            }
                            if (a[displayProperty].toLowerCase() > b[displayProperty].toLowerCase()) {
                                return 1;
                            }
                            return 0;
                        });
                        // The data store holding the data
                        var store = Ext.create('Ext.data.Store', {
                            fields : fields,
                            data: data
                        });
                        /* Bind the store to the combobox */
                        extendedTool.component.bindStore(store);
                        
                        if (extendedTool.hasOwnProperty('value') && extendedTool.value !== null) {
                            extendedTool.component.setValue(extendedTool.value);
                        }
                    }
                });
            },
            //When the combobox list is changed, this function is called which sets the cql filter to the 
            //items selected in the multi-select list.  
            setSelected: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var cqlFilterDisplayBlock = this.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                var displayText = '';
                var values = this.component.getValue();
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                var layers = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        id: layerMapping.id
                    }
                );
                var id = this.owningBlock.blueprint.id;
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    if (!layer.hasOwnProperty('cqlFilter')) {
                        layer.cqlFilter = {};
                    }
                    if (!layer.cqlFilter.hasOwnProperty(id)) {
                        layer.cqlFilter[id] = '';
                    }
                    
                    if (values.length === 0) {
                        layer.cqlFilter[id] = null;
                        displayText = null;
                    } else {
                        var idProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerMapping.featureInfo);
                        layer.cqlFilter[id] = idProperty + " in ('";
                        for (var j=0, len2=values.length; j < len2; j+=1) {
                            
                            layer.cqlFilter[id] += values[j];
                            if (j !== values.length-1) {
                                layer.cqlFilter[id] += "','";
                            } else {
                                layer.cqlFilter[id] += "')";
                            }
                        }
                        displayText = 'Fire Type: '+values;
                    }
                    
                    mapper.OpenLayers.forceLayerUpdateById(layer.id, map);
                }
                
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('firetype', displayText);
                }
                
                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                    layersConfig,
                    mapper.layers);  
            }
        };
        
        //If the Reset Button is enabled, then set the cqlFilter on the layers, clear the tools and query parameters values
        var resetQueryBlock = owningBlock.getReferencedBlock('cResetQuery');
        if (resetQueryBlock !== null) {
            resetQueryBlock.on('click', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                if (extendedTool.owningBlock.rendered === false) return;
                var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
  
                var layers = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        id: layerMapping.id
                    }
                );
                
                // Set the cqlFilter to null for each layer
                var id = extendedTool.owningBlock.blueprint.id;
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter.hasOwnProperty(id)) {
                        layer.cqlFilter[id] = null;
                    }
                }
                
                //Set the query parameters text to null for fire type
                var cqlFilterDisplayBlock = extendedTool.owningBlock.getReferencedBlock('cQueryParamsDisplay');
                if (cqlFilterDisplayBlock !== null) {
                    cqlFilterDisplayBlock.extendedTool.setFilter('firetype', null);
                }
                
                //Set this tools value to null
                extendedTool.component.setValue(null);
                extendedTool.value = null;
                
                if (extendedTool.vectorAdded === true) {
                    var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    map.removeLayer(extendedTool.vector);
                    extendedTool.vector.getSource().clear();
                    extendedTool.vectorAdded = false;
                }
            }, extendedTool);
        }
        
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.layerConfigUpdated,
            extendedTool);

        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var owningMapWindowBlock = extendedTool.owningBlock.getReferencedBlock('cMapWindow');
        if (!owningMapWindowBlock.hasOwnProperty('featureCqlFilterId')) {
            owningMapWindowBlock.featureCqlFilterId = mapper.common.getRandomString(32, 36);
        }
        extendedTool.cqlFilterId = owningMapWindowBlock.featureCqlFilterId;
        
        var layerMapping = extendedTool.owningBlock.blockConfigs.layers[0];
        var featureInfoMapping = layerMapping.featureInfo;
        var valueField = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['id'], 'propertyName')[0];
        var displayField = mapper.layers.toolMapping.getFeaturePropertiesByTypes(featureInfoMapping, ['display'], 'propertyName')[0];

        // Simple ComboBox using the data store
        var simpleCombo = Ext.create('Ext.form.field.ComboBox', {
            extendedTool: extendedTool,
            autoRender: true,
            editable: false,
            multiSelect: true,
            region : "north",
            width: block.width,
            queryMode: 'local',
            emptyText: block.emptyText,
            typeAhead: true,
            valueField: valueField,
            displayField: displayField,
            listeners: {
                change: function() {
                    this.extendedTool.setSelected();
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.getStore();
                }
            }
        });
        return simpleCombo;
    }
}

export var toolName = "cFireTypeTool";
export var tool = cFireTypeTool;