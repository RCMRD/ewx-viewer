var cFeatureQueryDisplayPanel = {
    cqlFilterUpdated: function(eventObj, callbackObj, postingObj) {
        var extendedTool = callbackObj;
        extendedTool.updateDisplayedFeatures();
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            lastRequest: null,
            updateDisplayedFeatures: function() {
                if (this.lastRequest !== null) {
                    this.lastRequest.requestCanceled = true;
                }
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layerMapping = this.owningBlock.blockConfigs.layers;
                var overlay = null;
                var headerText = this.owningBlock.blockConfigs.label;
                
                for (var i = 0, len = layerMapping.length; i < len; i+=1) {
                    var layerMap = layerMapping[i];
                    var overlays = mapper.layers.query(
                        layersConfig.overlays,
                        {
                            type: 'layer',
                            display: true,
                            mask: false,
                            id: layerMap.id
                        }
                    );
                    
                    if (overlays.length > 0) {
                        overlay = overlays[0];
                        break;
                    }
                }
                
                if (overlay === null) {
                    this.component.getHeader().setTitle(headerText.replace('{count}', 0));
                    return;
                }
                
                var cqlFilterParam = '';
                var cqlFilter = [];
                var featureProperties = [];
                var featureParam = '';
                
                if (overlay.hasOwnProperty('cqlFilter')) {
                    for (var prop in overlay.cqlFilter) {
                        if (overlay.cqlFilter[prop] !== null) cqlFilter.push(overlay.cqlFilter[prop]);
                    }
                }
                if (cqlFilter.length > 0) {
                    cqlFilterParam = '&CQL_FILTER='+cqlFilter.join(' AND ');
                }
                
                var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(overlay.id, extendedTool.owningBlock.blockConfigs.layers);
                if (toolLayerConfig !== null) {
                    var featureInfoConfigs = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id']);
                    for (var j = 0, length = featureInfoConfigs.length; j < length; j+=1) {
                        featureProperties.push(featureInfoConfigs[j].propertyName);
                    }
                }
                
                if (featureProperties.length > 0) {
                    featureParam = '&propertyName='+featureProperties.join(',');
                }
                
                var url = overlay.source.wfs;
                var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+overlay.srs+'&typeNames='+overlay.name+'&outputFormat=application/json'+featureParam+cqlFilterParam;
                this.lastRequest = mapper.common.asyncAjax({
                    type: 'POST',
                    url: url,
                    params: params,
                    callbackObj: {
                        extendedTool: this,
                        overlay: overlay
                    },
                    callback: function(response, callbackObj) {
                        if (response.requestCanceled === true) {
                            return;
                        }
                        response.returned = true;
                        var extendedTool = callbackObj.extendedTool;
                        var overlay = callbackObj.overlay;
                        var featureInfo = JSON.parse(response.responseText);
                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(overlay.id, extendedTool.owningBlock.blockConfigs.layers);
                        var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                        
                        var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperties);
                        var headerText = extendedTool.owningBlock.blockConfigs.label;
                        extendedTool.component.getHeader().setTitle(headerText.replace('{count}', features.length.toLocaleString()));
                    }
                });
            }
        };
        
        return extendedTool;
    },
	getComponent: function(extendedTool, items, toolbar, menu) {
		var block = extendedTool.owningBlock.blockConfigs;
		
		var component = {
			extendedTool: extendedTool,
			width: block.width,
			height: block.height,
			cls: 'x-toolbar-default x-toolbar',
			style: 'border-color: #FFFFFF;',
			layout: {
				type: 'hbox',
				align: 'middle',
				pack: 'center',
				defaultMargins: '0 5px'
			},
			defaults: {
				cls: 'x-btn-middle',
				ui: 'default-toolbar'
			},
			header: {
				frame: false,
				titleAlign: 'center',
				cls: 'tool-group-panel-header',
				style: {
					fontWeight: 'bold',
					backgroundColor: '#FFFFFF',
					color: 'black!important',
					padding: 0
				},
				shadow: false,
				title: block.label
			},
			items : items,
			listeners : {
				afterrender: function() {
					this.extendedTool.component = this;
					this.extendedTool.owningBlock.component = this;
					this.extendedTool.owningBlock.rendered = true;
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        this.extendedTool.owningBlock.itemDefinition.cqlFilterUpdated,
                        this.extendedTool);
                    
                    this.extendedTool.updateDisplayedFeatures();
				}
			}
		};
		
		component = skin.blocks.addToolBarItems(block, component, toolbar);
		component = skin.ExtJSPosition(component, block);
		
		return Ext.create('Ext.panel.Panel', component);
	}
};

export var toolName = "cFeatureQueryDisplayPanel";
export var tool = cFeatureQueryDisplayPanel;