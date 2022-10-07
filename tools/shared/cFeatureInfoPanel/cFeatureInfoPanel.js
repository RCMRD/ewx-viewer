
/*
custom block fields
    ignoreDisplayNames
*/

var cFeatureInfoPanel = {
    openDrawer : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        var featureInfoPanel = extendedTool.component;
        var parent = extendedTool.owningBlock.parent.component;
        
        if (parent.collapsed) {
            parent.expand();
        }
        
        if (featureInfoPanel.collapsed) {
            featureInfoPanel.expand();
        }
    },
    mapWindowFocused : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        
        var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var shouldShut = extendedTool.updateFeatureInfoPanel(newLayersConfig);
        extendedTool.applyShouldShut(shouldShut);
    }
    ,
    featureInfoUpdatedCallbackFunction : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        var mapWindow = eventObject;
        var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        
        var shouldShut = extendedTool.updateFeatureInfoPanel(newLayersConfig);
        extendedTool.tempMask.hide();
        
        extendedTool.applyShouldShut(shouldShut);
    }
    ,
    featureInfoFetchingCallbackFunction : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        var featureInfoPanel = extendedTool.component;
        extendedTool.tempMask = new Ext.LoadMask(featureInfoPanel, 
        {
            msg : "Fetching Info"
        });
        extendedTool.tempMask.show();
    }
    ,
    mapWindowDestroyed : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        extendedTool.clearFeatureInfoPanel();
    }
    ,
    mapWindowCreated : function (eventObject, callbackObject, postingObject) 
    {
        var extendedTool = callbackObject;
        extendedTool.clearFeatureInfoPanel();
    }
    ,
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            uniqueId: 'feature-info-panel-' + mapper.common.getRandomString(32, 36),
            tempMask: null,
            clearFeatureInfoPanel:function() {
                var test = this.component;
                var f;
                while(f = test.items.first()){
                  test.remove(f, true);
                }
            },
            updateFeatureInfoPanel:function(newLayersConfig)
            {
                if (typeof(this.component) === 'undefined') return false;
                
                var layersFeatureInfos = mapper.layers.query(
                    newLayersConfig,
                    {
                        'featureInfo' : '*',
                        'display' : true,
                        'loadOnly' : false,
                        'mask' : false
                    },
                    ['overlays', 'boundaries']
                );
                
                var layersFeatureInfoLoadOnly = mapper.layers.query(
                    newLayersConfig,
                    {
                        'featureInfo' : '*',
                        'display' : false,
                        'loadOnly' : true,
                        'mask' : false
                    },
                    ['overlays', 'boundaries']
                );

                layersFeatureInfos.push.apply(layersFeatureInfos,layersFeatureInfoLoadOnly);
                
                this.component.removeAll();
                
                var areAllFeaturesNull = true;
                
                for(var index in layersFeatureInfos)
                {
                    var layerWithFeatureInfo = layersFeatureInfos[index];
                    
                    var layerFeatureInfoHtml = "";
                    
                    
                    for(var propertyName in layerWithFeatureInfo)
                    {
                        if(propertyName==="featureInfo")
                        {
                            var featureInfoNode = layerWithFeatureInfo[propertyName];
                            
                            for(var featureInfoProperty in featureInfoNode)
                            {
                                var oneFeatureObject = featureInfoNode[featureInfoProperty];
                                
                                var row = oneFeatureObject.displayName + " : " + mapper.common.roundValue(oneFeatureObject.displayValue, oneFeatureObject.significantDigits);
                                

                                //mapper.log(oneFeatureObject.displayName);
                                //mapper.log(this.owningBlock.blockConfigs);

                                if (typeof(this.owningBlock.blockConfigs.ignoreDisplayNames) !== 'undefined')
                                {
                                    if (this.owningBlock.blockConfigs.ignoreDisplayNames.includes(oneFeatureObject.displayName))
                                    {
                                        //mapper.log("ignoring" + oneFeatureObject.displayName);
                                    }
                                    else
                                    {
                                       layerFeatureInfoHtml = layerFeatureInfoHtml + row + "<br/>"; 
                                    }
                                }
                                else
                                {
                                    layerFeatureInfoHtml = layerFeatureInfoHtml + row + "<br/>";
                                }

                                
                                
                                if(oneFeatureObject.value != null)
                                {
                                    areAllFeaturesNull = false;
                                }
                            }
                            
                        }
                    }
                    
                    var sectionToUse = null;
                    
					var onLayers = mapper.layers.query(
						newLayersConfig.boundaries,
						{id: layerWithFeatureInfo.id}
					);
					if (onLayers.length > 0) {
						sectionToUse = newLayersConfig.boundaries;
					}
					
					onLayers = mapper.layers.query(
						newLayersConfig.overlays,
						{id: layerWithFeatureInfo.id}
					);
					if (onLayers.length > 0) {
						sectionToUse = newLayersConfig.overlays;
					}
					
                    //take each layer and make a panel from it
                    //for each in the feature info loop
                    var anItem = {
                        title : mapper.layers.getDisplayNameForLayer(layerWithFeatureInfo,sectionToUse),
                        collapsed : false,
                        collapsible : false,
                        height : 'auto',
                        cls : 'featureInfoPanelSidebar',
                        html : "<div class='info-panels'>" +layerFeatureInfoHtml+"</div>",
                    };

                    this.component.add(anItem);
                }
                
                return areAllFeaturesNull;
            },
            //since there is only one used it makes sense to not make the 
            //mutating methods part of the object
            applyShouldShut : function(shouldShut)
            {
                var parent = this.owningBlock.parent.component;
                if (shouldShut) {
                    if (!parent.collapsed) {
                        if (!this.component.collapsed) {
                            this.component.toggleCollapse(true);
                        }
                    }
                } else {
                    if (!parent.collapsed) {
                        if (this.component.collapsed) {
                            this.component.toggleCollapse(true);
                        }
                    }
                }
                
                if (!parent.collapsed) {
                    parent.doLayout();
                    this.component.doLayout();
                }
            }
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var panel = {
            extendedTool: extendedTool,
            id: extendedTool.uniqueId,
            title : block.title,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            closable : false,
            overflowY: 'auto',
            height: block.height,
            width: block.width,
            border: 1,
            bodyCls: 'roundCorners',
            cls: 'padPanel',
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
        
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_FETCHING,
                        this.extendedTool.owningBlock.itemDefinition.featureInfoFetchingCallbackFunction,
                        this.extendedTool
                    );
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED,
                        this.extendedTool.owningBlock.itemDefinition.featureInfoUpdatedCallbackFunction,
                        this.extendedTool
                    );
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_REQUEST_TOOLS_DRAWER_OPEN,
                        this.extendedTool.owningBlock.itemDefinition.openDrawer,
                        this.extendedTool
                    );
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                        this.extendedTool.owningBlock.itemDefinition.mapWindowFocused,
                        this.extendedTool
                    );
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_DESTROYED,
                        this.extendedTool.owningBlock.itemDefinition.mapWindowDestroyed,
                        this.extendedTool
                    );
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
                    (
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_CREATED,
                        this.extendedTool.owningBlock.itemDefinition.mapWindowCreated,
                        this.extendedTool
                    );
                }
            }
        };
        
        return skin.ExtJSPosition(panel, block);
    }
};

export var toolName = "cFeatureInfoPanel";
export var tool = cFeatureInfoPanel;