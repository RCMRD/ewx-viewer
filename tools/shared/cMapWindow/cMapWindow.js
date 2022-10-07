/* hideTitle is a blockConfig setting that will hide the title bar if set to true.  
   If this parameter does not exist the title will be displayed  */
var cMapWindow = {
    options: {
        events: ['click', 'move', 'activate', 'resize', 'collapse', 'expand', 'close', 'destroy', 'rendercomponent'],
        requiredBlocks: ['cMapPanel']
    },
    currentMapWindowId: null,
    createNewMapWindow: function(eventObject, callbackObject, postingObject) {
        var blueprint = callbackObject;
        
        var block = blueprint.createBlock();
        var renderedParent = block.getClosestRenderedParent();
        renderedParent.render();

        var mapwindowID = block.extendedTool.layersConfigId;
        //can also use block.extendedTool.component.id

        if (mapwindowID != mapper.layers.getLayersConfigInstanceId()) {
            mapper.layers.setLayersConfigInstanceId(mapwindowID);
        }

        mapper.EventCenter.defaultEventCenter.postEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            block.extendedTool,
            block.extendedTool);
    },
    validateIfShouldBeDefocused: function (eventObject, callbackObject, postingObject) {
        var mapperWindow = callbackObject;
        var mapWindow = mapperWindow.component;
        if (mapperWindow.component.getId() != mapper.layers.getLayersConfigInstanceId()) {
            if (!mapWindow.hasCls("deselected-window")) mapWindow.addCls("deselected-window");
        } else {
            if (mapWindow.hasCls("deselected-window")) mapWindow.removeCls("deselected-window");
        }
    },
    updateMapperLayersConfig: function (newLayerConfig, aMapWindow, postingObject) {
        if ((mapper.layers.getLayersConfigInstanceId() == aMapWindow.layersConfigId)) 
        {
            var mapPanelBlock = aMapWindow.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            
            mapper.OpenLayers.updateMapLayerOpacitiesAndDisplayedLayersFromLayersConfig(newLayerConfig, map);
            
            var extWindow = aMapWindow.component;
            var mapWindowTitle = aMapWindow.getTitle(newLayerConfig);
            
            extWindow.setTitle(mapWindowTitle);

            mapper.EventCenter.defaultEventCenter.postEvent(
                mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_LAYER_CONFIGURATION_UPDATED,
                newLayerConfig,
                aMapWindow);
        }
    },
    initialized: false,
    init: function(blueprint) {
        if (skin.cMapWindow.initialized === false) {
            mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
                mapper.EventCenter.EventChoices.EVENT_REQUESTING_NEW_MAP_WINDOW,
                blueprint.itemDefinition.createNewMapWindow,
                blueprint);
            
            skin.cMapWindow.initialized = true;
        }
    },
    createExtendedTool: function(owningBlock) {
        var layersConfigId = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
        
        var toggleGroupId = 'button-group-' + mapper.common.getRandomString(32, 36);
        
        var mapperWindow = {
            owningBlock: owningBlock,
            toggleGroupId: toggleGroupId,
            layersConfigId: layersConfigId,
            getTitle : function (layersConfig) {
                /* Don't display the title bar if hideTitle is set to true */
				if (owningBlock.blockConfigs.hideTitle === true) {
					 return null;
				}
				var mapWindowTitle = mapper.layers.getTopLayerTitle(layersConfig.overlays);
				
				var regionFolder = mapper.layers.query(
					layersConfig.overlays,
					function(folder) {
						if (folder.type === 'folder' && folder.hasOwnProperty('regionId')) {
							var displayedLayers = mapper.layers.query(
								folder.folder,
								{
									type: 'layer',
									display: true,
									loadOnly: false,
									mask: false
								}
							);
							if (displayedLayers.length > 0) return true;
							return false;
						}
						return false;
					}
				);
				
				if (regionFolder.length > 0) {
					var regionId = regionFolder[0].regionId;
					var regionConfigs = mapper.common.getRegionWithRegionID(regionId);
					mapWindowTitle = regionConfigs.title + ' ' + mapWindowTitle;
				}
				
				return mapWindowTitle;
            },
            setRegionExtent: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var aMapWindow = this;
                var layersConfig = mapper.layers.getLayersConfigById(this.layersConfigId);
                
                var regionFolders = mapper.layers.query(
                    layersConfig,
                    function(folder) {
                        if (folder.type === 'folder' && typeof(folder.regionId) !== 'undefined') {
                            var displayedLayers = mapper.layers.query(
                                folder.folder,
                                {
                                    type: 'layer',
                                    display: true
                                }
                            );
                            
                            if (displayedLayers.length > 0) return true;
                            return false;
                        }
                        return false;
                    },
                    ['overlays', 'boundaries', 'baselayers']
                );
                
                if (regionFolders.length > 0) {
                    var regions = [];
                    for (var i = 0, len = regionFolders.length; i < len; i+=1) {
                        var regionFolder = regionFolders[i];
                        var regionId = regionFolder.regionId;
                        if (regions.indexOf(regionId) === -1) regions.push(regionId);
                    }
                    
                    for (var i = 0, len = regions.length; i < len; i+=1) {
                        regions[i] = mapper.common.getRegionWithRegionID(regions[i]);
                    }
                    mapper.OpenLayers.setExtentEncompassingSpecifiedRegionsForMap(map, regions);
                }
            }
        };
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            owningBlock.itemDefinition.updateMapperLayersConfig,
            mapperWindow);
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            owningBlock.itemDefinition.validateIfShouldBeDefocused,
            mapperWindow);
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_CREATED,
            owningBlock.itemDefinition.validateIfShouldBeDefocused,
            mapperWindow);
        
        return mapperWindow;
    },
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        var title = block.title;
        var content = block.content;
        var layersConfigId = extendedTool.layersConfigId;
        var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
		var resizable = block.hasOwnProperty('resizable') ? block.resizable : true;
        
        var mapWindowConfig = {
            extendedTool : extendedTool,
			resizable: resizable,
            width : width,
            height : height,
            id : layersConfigId,
            title : extendedTool.getTitle(layersConfig),
            hideTitle : (typeof(block.hideTitle) !== 'undefined') ? block.hideTitle : false,
            layout : {
                type : 'vbox',
                align : 'stretch',
                pack : 'start',
            },
            bodyStyle : 'padding:5px;',
            border : false,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            maximizable: true,
            items: items,
            listeners : {
                collapse : function () {
                    this.extendedTool.owningBlock.fire('collapse', this.extendedTool);
                },

                expand : function () {
                    this.extendedTool.owningBlock.fire('expand', this.extendedTool);
                },
                
                move : function () {
                    this.extendedTool.owningBlock.fire('move', this.extendedTool);
                },
                
                activate : function () 
                {
                    if (this.id != mapper.layers.getLayersConfigInstanceId()) {
                        mapper.layers.setLayersConfigInstanceId(this.id);

                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                            this.extendedTool,
                            this.extendedTool);
                    }
                    
                    this.extendedTool.owningBlock.fire('activate', this.extendedTool);
                },
                beforeDestroy : function () 
                {
                    //skin.mapWindow.removeMapWindowInfoForMapWindowId(this.id);
                    //this.extendedTool.owningBlock.itemDefinition.removeMapWindowInfoForMapWindowId(this.id);
                    
                    //-----------------------------
                    //so the toc shows no layer selected
                    //just turn off the layer
                    //query returns by reference
                    var allReferencedLayers = mapper.layers.query(
                        this.extendedTool.mapWindowMapperLayersConfig,
                        {type: "layer"},
                        ['overlays']
                    );
                    
                    for(var index in allReferencedLayers)
                    {
                        allReferencedLayers[index].display = false;
                    }
                    
                    mapper.EventCenter.defaultEventCenter.removeAllCallbacksForObject(this.extendedTool);
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_DESTROYED,
                        this.extendedTool,
                        this.extendedTool);
                    
                    this.extendedTool.owningBlock.fire('destroy');
                    
                    var currentId = this.id;
                    this.zIndexManager.eachTopDown(function(component) {
                        if (component.extendedTool && component.extendedTool.layersConfigId && component.id !== currentId) {
                            component.setActive(true);
                            return false;
                        }
                    });
                },
                resize : function (mapWindow, width, height) {
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_RESIZED,
                        mapWindow.extendedTool,
                        mapWindow.extendedTool);
                    
                    this.extendedTool.owningBlock.fire('resize', this.extendedTool);
                },
                afterrender : function(mapWindow) {
                    mapWindow.extendedTool.component = mapWindow;
                    mapWindow.extendedTool.owningBlock.component = mapWindow;
                    mapWindow.extendedTool.owningBlock.rendered = true;
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_CREATED,
                        mapWindow.extendedTool,
                        mapWindow.extendedTool);
                    
                    setTimeout(function(mapWindow) {
                        mapWindow.extendedTool.setRegionExtent();
                    },
                    1,
                    mapWindow);
                    
                    this.extendedTool.owningBlock.fire('rendercomponent', this.extendedTool);
                },
                close: function() {
                    this.extendedTool.owningBlock.fire('close');
                    this.extendedTool.owningBlock.remove();
                }
            }
        };
        
        if (extendedTool.owningBlock.blockConfigs.toolbar.overflowMenu === true) {
            var toolbarConfigs = {
                enableOverflow: true,
                extendedTool: extendedTool,
                style: block.toolbar.style,
                listeners: {
                    afterrender: function() {
                        this.extendedTool.toolbar = this;
                    },
                    overflowchange: function(lastHiddenCount, hiddenCount, hiddenItems) {
                        var overflowHandler = this.layout.overflowHandler;
                        var menu = overflowHandler.menu;
                        var menuBtn = menu.ownerButton;
                        
                        if (typeof(menuBtn.hasBeenUpdated) === 'undefined') {
                            menuBtn.hasBeenUpdated = true;
                            menuBtn.extendedTool = this.extendedTool;
                            menuBtn.on('click', function() {
                                var layersConfigId = this.extendedTool.layersConfigId;
                                var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
                                mapper.layers.setLayersConfigInstanceId(layersConfigId);
                            });
                        }
                        
                        if (typeof(menu.hasBeenUpdated) === 'undefined') {
                            menu.hasBeenUpdated = true;
                            menu.extendedTool = this.extendedTool;
                            menu.on('show', function() {
                                this.extendedTool.component.setActive(true);
                                this.focus();
                                this.extendedTool.owningBlock.fire('overflowmenushow');
                            });
                        }
                    }
                }
            };
            
            mapWindowConfig = skin.blocks.addToolBarItems(block, mapWindowConfig, toolbar, toolbarConfigs);
        } else {
            mapWindowConfig = skin.blocks.addToolBarItems(block, mapWindowConfig, toolbar);
        }
        
        var mapWindow = skin.ExtJSPosition(mapWindowConfig, block);
        
        return mapWindow;
        
        //how to set auto?
        //aMapWindow.extWindowConfig.width = 580;
        //aMapWindow.extWindowConfig.height = 650;
        
        //return aMapWindow.extWindowConfig;
    }
};

export var toolName = "cMapWindow";
export var tool = cMapWindow;