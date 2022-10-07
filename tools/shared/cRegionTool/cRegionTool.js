var cRegionTool = {
    firstLayersConfig: null,
    addInstanceToList: function(eventObject, callbackObject, postingObject) {
        var extendedTool = callbackObject;
        var newInstanceId = eventObject;
        var newLayersConfig = postingObject;
        var layersConfigByRegionId = extendedTool.layersConfigInstances[extendedTool.lastInstanceId];
        var newLayersConfigByRegionId = {};
        
        for (var regionId in layersConfigByRegionId) {
            if (regionId === extendedTool.selectedRegionId) {
                newLayersConfigByRegionId[regionId] = newLayersConfig;
            } else {
                newLayersConfigByRegionId[regionId] = JSON.parse(JSON.stringify(layersConfigByRegionId[regionId]));
            }
        }
        
        extendedTool.layersConfigInstances[newInstanceId] = newLayersConfigByRegionId;
        extendedTool.lastInstanceId = newInstanceId;
    },
    init: function(blueprint) {
        var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
        
        var regions = mapper.regions;
        var selectedRegionId = regions[0].id;
        if (mapper.urlParameters.hasOwnProperty('region')) {
            var region = mapper.common.getRegionWithRegionID(mapper.urlParameters.region);
            if (region !== null) {
                selectedRegionId = region.id;
            }
        }
        
        var filterLayersConfigByRegionId = function(layers, regionId) {
            var newLayersConfig = [];
            for (var i = 0, len = layers.length; i < len; i+=1) {
                var layer = layers[i];
                if (layer.type === 'folder') {
                    if (!layer.hasOwnProperty('regionId')) {
                        var newLayer = JSON.parse(JSON.stringify(layer));
                        newLayer.folder = filterLayersConfigByRegionId(newLayer.folder, regionId);
                        if (newLayer.folder.length > 0) {
                            newLayersConfig.push(newLayer);
                        }
                    } else if (layer.regionId === regionId) {
                        var newLayer = JSON.parse(JSON.stringify(layer));
                        newLayersConfig.push(newLayer);
                    }
                } else if (layer.type === 'layer') {
                    newLayersConfig.push(JSON.parse(JSON.stringify(layer)));
                }
            }
            return newLayersConfig;
        }
        
        var layersConfigsByRegion = {};
        for (var i = 0, len = regions.length; i < len; i+=1) {
            var region = regions[i];
            var newLayersConfig = {};
            for (var prop in layersConfig) {
                newLayersConfig[prop] = filterLayersConfigByRegionId(layersConfig[prop], region.id);
            }
            layersConfigsByRegion[region.id] = newLayersConfig;
        }
        
        blueprint.itemDefinition.firstLayersConfig = layersConfigsByRegion;
        
        mapper.layers.setLayersConfigById(currentInstanceId, layersConfigsByRegion[selectedRegionId]);
    },
    createExtendedTool: function(owningBlock) {
        var regions = mapper.regions;
        var selectedRegionId = regions[0].id;
        if (mapper.urlParameters.hasOwnProperty('region')) {
            var region = mapper.common.getRegionWithRegionID(mapper.urlParameters.region);
            if (region !== null) {
                selectedRegionId = region.id;
            }
        }
        
        var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
        
        var extendedTool = {
            owningBlock: owningBlock,
            layersConfigInstances: {},
            lastInstanceId: currentInstanceId,
            selectedRegionId: selectedRegionId
        };
        
        extendedTool.layersConfigInstances[currentInstanceId] = owningBlock.itemDefinition.firstLayersConfig;
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_CREATED,
            owningBlock.itemDefinition.addInstanceToList,
            extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var regionConfigs = mapper.regions;
        var data = [];
        
        for (var i = 0, len = regionConfigs.length; i < len; i+=1) {
            var regionConfig = regionConfigs[i];
            data.push({
                value: regionConfig.id,
                text: regionConfig.title
            });
        }
        
        var store = Ext.create('Ext.data.Store', {
            fields: ['value', 'text'],
            data: data
        });
        var selectedRegion = extendedTool.selectedRegionId;
        
        var regionTool = {
            extendedTool: extendedTool,
            valueField: 'value',
            displayField: 'text',
            store: store,
            width: block.width,
            editable: false,
            emptyText: 'Select a Region',
            value: selectedRegion,
            listeners: {
                change: function(combo) {
                    var value = combo.getValue();
                    this.extendedTool.selectedRegionId = value;
                    var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
                    var layersConfig = this.extendedTool.layersConfigInstances[currentInstanceId][value];
                    
                    var mapWindowBlueprints = skin.blocks.getBlueprintsByName('cMapWindow');
					
                    if (mapWindowBlueprints[0].blockConfigs.block === 'relative') {
						var mapWindowBlocks = skin.blocks.getBlocksByName('cMapWindow');
                        for (var i = mapWindowBlocks.length-1; i >= 0; i-=1) {
                            var mapWindowBlock = mapWindowBlocks[i];
                            mapWindowBlock.unRender();
                            mapWindowBlock.remove();
                        }
                        
                        mapper.layers.setLayersConfigById(mapper.layers.getLayersConfigInstanceId(), layersConfig);
                        mapper.layers.createNewInstanceOfLayersConfig();
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_REQUESTING_NEW_MAP_WINDOW,
                            null,
                            null);

						var mapWindows = skin.blocks.getBlocksByName('cMapWindow');

                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
                            layersConfig,
                            null);
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                            mapWindows[0].extendedTool,
                            null);
						
						mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_REGION_CHANGED,
                            this.extendedTool,
                            this.extendedTool.selectedRegionId);
                    } else {
                        var urlParameters = [];
                        for (var prop in mapper.urlParameters) {
                            if (prop !== 'region') {
                                urlParameters.push(prop + '=' + mapper.urlParameters[prop]);
                            }
                        }
                        urlParameters.push('region='+value);
                        var url = window.location.href.split('?')[0] + '?' + urlParameters.join('&');
                        window.location.href = url;
                    }
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        var combo = Ext.create('Ext.form.field.ComboBox', regionTool);
        extendedTool.component = combo;
        return combo;
    }
};

export var toolName = "cRegionTool";
export var tool = cRegionTool;