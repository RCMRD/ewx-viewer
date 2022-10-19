Ext.require([
	Ext.QuickTips.init()
]);

Ext.onReady(function () {
			
	var chartMask;
	Ext.setGlyphFontFamily('FontAwesome');

	skin = {
		blockItems : [],
		initPart2Func : function(params)
		{
			
            
			// Set randomly generated ids on all blocks in the template.json
			mapper.blocks = skin.blocks.setBlockIds(mapper.blocks);
		
			skin.blocks.blueprints = skin.blocks.buildBlueprints(mapper.blocks);
			skin.blocks.setRelationships(skin.blocks.blueprints);
			skin.blocks.performInitialSetup(skin.blocks.blueprints);
			
			var items = skin.blocks.getBlocks(skin.blocks.blueprints);
			
			var viewportItems = {
				layout : "border",
				id : "ViewportItems",
				deferredRender : false,
				items : items
			};    
			
			skin.viewPortal.addItemsToViewPORT(viewportItems);
			var loadingMask = document.getElementById('initial-loading-mask');
			loadingMask.parentElement.removeChild(loadingMask);
			
			// If any periodic layers that get the start and end period from a rest endpoint
			// fails to get a response from the endpoint, show a warning message to the user.
			var getFailedLayersHtml = function(failedLayers, failedLayerIds, html) {
				if (typeof(html) === 'undefined') html = '';
				if (Object.prototype.toString.call(failedLayers) === '[object Object]') {
					html += '<ul style="list-style-type: none;">';
					for (var prop in failedLayers) {
						html += '<li>'+prop+': '+getFailedLayersHtml(failedLayers[prop], failedLayerIds)+'</li>';
					}
					html += '</ul>';
				} else {
					html += '[';
					for (var i = 0, len = failedLayers.length; i < len; i+=1) {
						var failedLayer = failedLayers[i];
						if (failedLayer.type === 'folder') {
							html += '{<ul style="list-style-type: none;">';
							html += '<li>ID: '+failedLayer.id+'</li><li>Title: '+failedLayer.title+'</li>';
							html += '<li>Folder: '+getFailedLayersHtml(failedLayer.folder, failedLayerIds)+'</li>';
						} else {
							html += '{<ul style="color: red; list-style-type: none;">';
							html += '<li>ID: '+failedLayer.id+'</li><li>Title: '+failedLayer.title+'</li>';
						}
						
						html += '</ul>}';
						if (i < len-1) html += ', ';
					}
					html += ']';
				}
				
				return html;
			}
			
			if (mapper.layers.hasOwnProperty('failedLayerIds')) {
				var message;
				if(mapper.debug){
					var failedLayerIds = mapper.layers.failedLayerIds;
					var failedLayers = mapper.layers.getLayerFolderStructure(mapper.layers.initialLayersConfig, failedLayerIds);
					var html = getFailedLayersHtml(failedLayers, failedLayerIds);
					message = '<div style="height: 400px; width: 430px; overflow: auto;"><div>The following layers from the data.json file failed to load and is being removed.</div>'+html+'</div>'
					Ext.MessageBox.show({
						title: 'Status',
						msg: message,
						buttons: Ext.MessageBox.OK,
						autoScroll: true
					});
					delete mapper.layers.failedLayerIds;
					delete mapper.layers.initialLayersConfig;
				}else{
					message = '<div style="height: 50px; width: 500px; overflow: auto;"><div>One or more layers failed to load. Toggle &quotDebug Mode&quot in settings.json for details</div>';     
					Ext.MessageBox.show({    
						title: 'Status',
						msg: message,
						buttons: Ext.MessageBox.OK,
						autoScroll: true
					});
					delete mapper.layers.failedLayerIds;
					delete mapper.layers.initialLayersConfig;
				}
			}
			
			if (typeof(params["showDowntime"]) != 'undefined')
			{
				
				fetch('configs/settings.json')
				.then(
						function(response)
						{
							return response.json();
						}
				).then(
						function(settings_json)
						{
							if (typeof(settings_json.service_check) != 'undefined')
							{
								var service_check_url = settings_json.service_check.source;
								fetch(service_check_url).then
								(
									function(response)
									{
										return response.json();
									}
								
								).then(
								
									function(service_api_response_json)
									{
									
										if (service_api_response_json.upcoming.length>0)
										{
											
											var message = service_api_response_json.upcoming[0].eta;
											
											var service_date = service_api_response_json.upcoming[0].utcTimestamp;
											
											
											//for some reason javascript likes date utc timestamps in milliseconds
											var j_date = new Date(service_date*1000);
											//var formatted_date = j_date.toLocaleDateString("default",{month:'long',day:'numeric'});
											
											
											var part1 = j_date.toLocaleDateString("default",{month:'long',day:'numeric'});
											var part2 = j_date.toLocaleDateString("default",{year:'numeric'});
											var part3 = j_date.toLocaleTimeString("default",{hour:'numeric',minute:'numeric'});
											
											var formatted_date = part1+", " + part2+ " at " +part3+"";
											
											
											var formatted_notice = "This application will be offline temporarily for routine maintenance on "+formatted_date;
											Ext.MessageBox.show({    
												title: 'Notice',
												msg: formatted_notice,
												buttons: Ext.MessageBox.OK,
												autoScroll: true
											});
										}
										
									}
								);
							}
						}
					)
				
			}
                
           
		},
		initCommon:function()
		{
			// This Extjs override fixes the issue of when a component is masked and is inside a floating container, if the floating container moves, the mask does not move with it.
            // We are assuming the devs of Extjs are not going to fix this issue since it was asked in 2012 but never addressed. See https://www.sencha.com/forum/showthread.php?252691-4-2-0-beta-GridPanel-in-Window-loading-mask-doesn-t-move-with-Window
            // This fix was found here https://stackoverflow.com/questions/21438425/loading-mask-not-tied-to-component-breaking-on-move-of-parent-x-y
            Ext.override(Ext.LoadMask, {
                sizeMask: function() {
                    var me = this,
                        target;

                    if(me.rendered && (me.isVisible() || me.getMaskEl().isVisible())) {
                        me.center();

                        target = me.getMaskTarget();
                        me.getMaskEl().show().setSize(target.getSize()).alignTo(target, 'tl-tl');
                    }
                }
            });
			
		},
		initModeNormal : function () {
            
			skin.initCommon();
			
			// Wait for all configurations to finish loading before loading the skin.
            for (var prop in mapper.configReady) {
                if (mapper.configReady[prop] === false) return;
            }
            
            mapper.EventCenter.createEventCenter();
            mapper.layers.createNewInstanceOfLayersConfig();
			var initPart2Params = {};
			
			// Called after loading all the tools.
            var initPart2Func = skin.initPart2Func;
            skin.blocks.loadToolSourceFilesAsync(mapper.blocks, initPart2Func,initPart2Params);
			
		},
		initModeShowUpcomingDowntime : function () {
            
			skin.initCommon();
			
			// Wait for all configurations to finish loading before loading the skin.
            for (var prop in mapper.configReady) {
                if (mapper.configReady[prop] === false) return;
            }
            
            mapper.EventCenter.createEventCenter();
            mapper.layers.createNewInstanceOfLayersConfig();
			
			// Called after loading all the tools.
            var initPart2Func = skin.initPart2Func;
			var initPart2Params = {};
			initPart2Params["showDowntime"] = true;
			
            skin.blocks.loadToolSourceFilesAsync(mapper.blocks, initPart2Func,initPart2Params);
			
		},
		blocks : {
			/**
			 * An instance of this class is created the the BlockBlueprint instance 
			 * once the tool is ready to be created. It's main purpose includes 
			 * getting references to other tools, handling tool events, and 
			 * creating the extended tool and Extjs components.
			 */
            Block: function(blueprint, parent) {
                if (typeof(parent) === 'undefined') parent = null;
                
                this.init = function(blueprint, parent) {
                    this.blockConfigs = blueprint.blockConfigs;
                    this.parent = parent;
                    this.type = blueprint.type;
					// The itemDefinition property is a reference to the tools source code.
                    this.itemDefinition = blueprint.itemDefinition;
					// An example of a group would be having one or more chart blocks
					// created per open map window. This is needed so that each chart 
					// knows which map window it belongs to.
                    this.groupOwner = blueprint.groupOwner;
                    this.id = 'block-' + mapper.common.getRandomString(32, 36);
                    this.blueprint = blueprint;
                    this.extendedTool = null;
                    
                    this.blockReferences = [];
                    
                    this.toolbarItems = [];
                    this.menuItems = [];
                    this.childItems = [];
                    
                    this.events = {
                        'remove': []
                    };
                    
                    if (this.blockConfigs.toolbar) {
                        this.events.overflowmenushow = [];
                    }
                    
                    var options = this.itemDefinition.options;
					// Add any events defined in the tool's item definition (source code)
                    if (options.events) {
                        var events = options.events;
                        for (var i = 0, len = events.length; i < len; i+=1) {
                            this.events[events[i]] = [];
                        }
                    }
                    
                    this.rendered = false;
                }
                
				/**
				 * Registers a callback to an event.
				 */
                this.on = function(eventName, callback, callbackObj, id) {
                    if (typeof(id) === 'undefined') id = null;
                    if (this.events[eventName]) {
                        this.events[eventName].push({
                            callbackObj: callbackObj,
                            callback: callback,
                            id: id,
                            enabled: true
                        });
                    }
                }
                
				/**
				 * Fires an event and calls all registered callbacks.
				 */
                this.fire = function(eventName, postingObj, originalEvent) {
                    if (this.events[eventName]) {
                        var events = this.events[eventName];
                        for (var i = 0, len = events.length; i < len; i+=1) {
                            var event = events[i];
                            if (event.enabled) event.callback(event.callbackObj, postingObj, originalEvent);
                        }
                    }
                }
                
                this.createExtendedTool = function() {
                    this.extendedTool = this.itemDefinition.createExtendedTool(this);
                }

				/**
				 * Recurses through all blocks and renders each one that is not already rendered.
				 * It first creates the extended tool for each one, then calls getComponent and adds
				 * whatever is returned to it's parent container.
				 */
                this.render = function() {
                    var renderedChildItems = [];
                    var renderedRelativeChildItems = [];
                    var renderedToolbarItems = [];
                    var renderedMenuItems = [];
                    var items;
                    var toolbar;
                    var menu;
                    
                    if (this.rendered === false) {
                        this.createExtendedTool();
                    }
                    
					// Render all child blocks to the body if this block is a container type.
                    if (this.blockConfigs.blocks) {
                        for (var i = 0, len = this.childItems.length; i < len; i+=1) {
                            var item = this.childItems[i];
							// Skip rendering blocks that are already rendered or have delayRender set to true.
							// delayRender is used for cases like the chart windows in which a block is created
							// for each open map window but is not rendered until clicking the map.
                            if (item.delayRender !== true && item.rendered === false) {
                                if (item.blockConfigs.block === 'relative') {
                                    renderedRelativeChildItems.push(item.render());
                                } else {
                                    renderedChildItems.push(item.render());
                                }
                            }
                        }
                        
                        items = renderedChildItems;
                    }
                    
					// Render all toolbar item blocks if this block is a container type and has a toolbar.
                    if (this.blockConfigs.toolbar) {
                        for (var i = 0, len = this.toolbarItems.length; i < len; i+=1) {
                            var item = this.toolbarItems[i];
                            if (item.delayRender !== true && item.rendered === false) {
								renderedToolbarItems.push(item.render());
							}
                        }
                        
                        toolbar = renderedToolbarItems;
                    }
                    
					// Render all menu item blocks if this block is a menu type.
                    if (this.blockConfigs.items) {
                        for (var i = 0, len = this.menuItems.length; i < len; i+=1) {
                            var item = this.menuItems[i];
                            if (item.delayRender !== true && item.rendered === false) {
								renderedMenuItems.push(item.render());
							}
                        }
                        
                        menu = renderedMenuItems;
                    }
                    
					// If this component is already rendered, add new children to the existing component.
					// If it is not rendered, call the getComponent method from the item definition.
                    if (this.rendered === true) {
						// Make sure new child items are being rendered.
                        if (renderedChildItems.length > 0) {
							// Some Extjs components have to be added to it's parent differently so
							// we support adding an addChild method to the item definition for these cases.
                            if (this.itemDefinition.hasOwnProperty('addChild')) {
                                this.itemDefinition.addChild(this.component, renderedChildItems);
                            } else {
                                this.component.add(renderedChildItems);
                            }
                            
							// Extjs often doesn't handle adding child items well. Calling doLayout seems to make it work.
                            this.component.doLayout();
                        }
                    } else {
                        component = this.itemDefinition.getComponent(this.extendedTool, items, toolbar, menu);
                        return component;
                    }
                }

				/**
				 * When delayRender is true, in order to render a tool on demand, the render 
				 * method must be called on a block that is already rendered. This may be 
				 * multiple levels up in the component heirarchy.
				 */
                this.getClosestRenderedParent = function() {
                    if (this.rendered === false) {
                        if (this.parent !== null) {
                            return this.parent.getClosestRenderedParent();
                        }
                    } else {
                        return this;
                    }
                    
                    return null;
                }

				/**
				 * Recursively find a child item by block name.
				 */
                this.find = function(blockName) {
                    for (var i = 0, len = this.childItems.length; i < len; i+=1) {
                        var item = this.childItems[i];
                        if (item.block.name === blockName) return item;
                        var childItem = item.find(blockName);
                        if (childItem !== null) return childItem;
                    }
                    return null;
                }

                this.addChild = function(childBlock) {
                    this.childItems.push(childBlock);
                    var component = childBlock.render();
                    this.component.items.add(component);
                }

				/**
				 * To render a block on demand, delayed rendering needs to be disabled.
				 * This not only needs to disable it for the current block but also any 
				 * parent blocks that are delayed.
				 */
                this.undelayRender = function() {
                    if (this.rendered !== true) {
                        this.delayRender = false;
                        if (this.parent !== null) {
                            this.parent.undelayRender();
                        }
                    }
                }
                
				/**
				 * Un renders a block from it's parent. In some cases, 
				 * parent blocks need to be unrendered as well.
				 */
                this.unRender = function(itemLevel) {
                    if (typeof(itemLevel) === 'undefined') {
                        itemLevel = 0;
                    }
                    
					// If this is the block that unRender was initially called from.
                    if (itemLevel === 0) {
						// Some blocks such as the container for chart tabs need to be removed 
						// if all the tabs have been closed.
                        var parentsNeedUnRendered = this.parentNeedsUnRendered();
                        if (parentsNeedUnRendered) {
                            this.parent.unRender(itemLevel);
                        } else {
							// First remove the component from the container.
                            if (this.parent !== null && this.parent.component !== null) {
                                this.parent.component.remove(this.component);
                            }
                            
							// Sometimes removing the component from the container is enough 
							// but sometimes it's not so we call the destroy method.
							// Sometimes removing the component also sets this.component to null
							// so check for that first.
                            if (this.component !== null) {
                                this.component.destroy();
                            }
                        }
                    }
                    
                    var childItems = this.childItems;
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        childItem.unRender(itemLevel + 1);
                    }
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        toolbarItem.unRender(itemLevel + 1);
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        menuItem.unRender(itemLevel + 1);
                    }
                    
                    this.extendedTool = null;
                    this.component = null;
                    this.rendered = false;
                    
                    this.events = {};  // Remove all events associated with this block.
                }
                
				/**
				 * Checks to see if the parent components need to be unrendered 
				 * in response to a child block being unrendered.
				 */
                this.parentNeedsUnRendered = function() {
                    var parentNeedsUnRendered = false;
                    if (this.parent !== null) {
                        var items = this.parent[this.type+'s'];
						// Check if no children are present or if a single child is  
						// present and is the child being unrendered.
                        if (items.length === 0 || (items.length === 1 && items[0].id === this.id)) {
							// destroyIfEmpty can either be set in the template.json or in the tool's item definition.
                            if (this.parent.blockConfigs.destroyIfEmpty === true || this.parent.itemDefinition.options.destroyIfEmpty === true) {
                                var parentNeedsUnRendered = true;
                            } else {
                                parentNeedsUnRendered = this.parent.parentNeedsUnRendered();
                            }
                        }
                    }
                    
                    return parentNeedsUnRendered;
                }
                
				/**
				 * Removes all registered event listeners to other blocks as it's being unrendered.
				 * Care must be taken to not remove event listeners before the removed event is fired.
				 * Since multiple instances of this block could have an event listener on the 
				 * same block, we use the block's id to ensure we only remove events for this block.
				 */
                this.removeEventListeners = function() {
                    var blockReferences = this.blockReferences;
                    for (var i = 0, len = blockReferences.length; i < len; i+=1) {
                        var events = blockReferences[i].events;
                        for (var eventName in events) {
                            var listeners = events[eventName];
                            for (var j = 0, length = listeners.length; j < length; j+=1) {
                                var listener = listeners[j];
                                if (listener.id === this.id) {
                                    listener.enabled = false;
                                    listener.callback = null;
                                    listener.callbackObj = null;
                                }
                            }
                        }
                    }
                }
                
				/**
				 * This function completely removes a block and it's blueprint 
				 * when simply unrendering is not enough. This also recurses 
				 * down the heirarchy and removes all it's children.
				 */
                this.remove = function(itemLevel) {
                    if (typeof(itemLevel) === 'undefined') {
                        itemLevel = 0;
                    }
                    
                    this.removeEventListeners();
                    
                    if (itemLevel === 0) {
						// If the parent container needs removed as well, delegate
						// the removal to the parent. That will cause it to recurse 
						// back down to this component so the remove method will 
						// be called again. Otherwise, start removing from this block.
                        if (this.parentNeedsRemoved()) {
                            this.parent.remove(itemLevel);
                        } else {
                            if (this.rendered === true) {
                                this.unRender();
                            }
                            var containingArray = [];
							
							// If this block is not a top level block, remove it from it's parent block.
							// Otherwise, remove it from the list of top level blocks.
                            if (this.parent !== null) {
                                containingArray = this.parent[this.type+'s'];
                            } else {
                                var topBlueprints = skin.blocks.blueprints;
                                for (var i = 0, len = topBlueprints.length; i < len; i+=1) {
                                    var topBlueprint = topBlueprints[i];
                                    if (topBlueprint.block !== null) {
                                        containingArray.push(topBlueprint.block);
                                    }
                                }
                            }
                            
                            var index = -1;
                            for (var i = 0, len = containingArray.length; i < len; i+=1) {
                                var item = containingArray[i];
                                if (item.id === this.id) {
                                    index = i;
                                    break;
                                }
                            }
                            
                            if (index !== -1) this.parent[this.type+'s'].splice(index, 1);
                        }
                    }
                    
					// Recursively remove all children.
                    var childItems = this.childItems;
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        childItem.remove(itemLevel + 1);
                    }
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        toolbarItem.remove(itemLevel + 1);
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        menuItem.remove(itemLevel + 1);
                    }
                    
                    this.blueprint.block = null;
                    this.blueprint.reset();
                    
					// Recurse through all other blocks and remove any references to this block.
                    skin.blocks.removeReferencesToBlock(skin.blocks.blueprints, this.id);
                    
                    this.fire('remove', this);
                }

				/**
				 * Recurse up the heirarchy to determine if a parent
				 * needs removed in response to this block being removed.
				 */
                this.parentNeedsRemoved = function() {
                    var parentNeedsRemoved = false;
                    if (this.parent !== null) {
                        var items = this.parent[this.type+'s'];
                        if (items.length === 0 || (items.length === 1 && items[0].id === this.id)) {
                            if (this.parent.blockConfigs.destroyIfEmpty === true || this.parent.itemDefinition.options.destroyIfEmpty === true) {
                                var parentNeedsRemoved = true;
                            } else {
                                parentNeedsRemoved = this.parent.parentNeedsRemoved();
                            }
                        }
                    }
                    
                    return parentNeedsRemoved;
                }
                
				/**
				 * In some cases like with the identify tool, when we expand it, we 
				 * also want to expand the container. Since the identify tool may or may not 
				 * be placed in a collapsible container, we do this recursively.
				 */
                this.expandParents = function() {
                    if (this.parent !== null) {
                        if (this.parent.rendered === true) {
                            if (this.parent.component.getCollapsed() !== false) {
                                this.parent.component.expand();
                            }
                            this.parent.expandParents();
                        }
                    }
                }
                
                this.collapseParents = function() {
                    if (this.parent !== null) {
                        if (this.parent.rendered === true) {
                            if (this.parent.component.collapsible === true) {
                                if (this.parent.component.getCollapsed() === false) {
                                    this.parent.component.collapse();
                                }
                            } else {
                                this.parent.collapseParents();
                            }
                        }
                    }
                }
                
				/**
				 * This get's a block referenced in the item definition. 
				 * This will only ever return a single block as referencing 
				 * multiple blocks is not supported. To get all blocks 
				 * with a particular name, use skin.blocks.getBlocksByName.
				 */
                this.getReferencedBlock = function(blockName) {
                    var blockReferences = this.blockReferences;
                    for (var i = 0, len = blockReferences.length; i < len; i+=1) {
                        var block = blockReferences[i];
                        if (block.blockConfigs.name === blockName) {
                            return block;
                        }
                    }
                    //mapper.error("Failed finding referencedBlock "+blockName);
                    return null;
                }
                
                this.init(blueprint, parent);
            },
            blueprintCopyCount: 0, // Each time a blueprint is copied, we need to keep a unique copy id.
            blueprintCopyList: {},
			
			/**
			 * An instance of this class is created on first load for every
			 * item in the template.json. This handles creating Block instances,
			 * determining which other blocks are referenced in cases such as 
			 * the chart container needing a reference to a specific map window,
			 * and creating copies of itself as needed.
			 */
            BlockBlueprint: function(blockConfigs, parent, type) {
                this.init = function(blockConfigs, parent, type) {
                    this.blockConfigs = blockConfigs;
                    this.parent = parent;
                    this.type = type;
                    
                    this.id = blockConfigs.id;
                    this.uniqueId = 'block-blueprint-' + mapper.common.getRandomString(32, 36);
                    this.requiredBlockBlueprints = [];
                    this.relatedBlockBlueprints = [];
                    this.groupBlockBlueprints = [];
                    this.delayRender = false;
                    this.groupOwner = null;
                    this.block = null;
                    this.copyId = skin.blocks.blueprintCopyCount;
                    
                    this.toolbarItems = [];
                    this.menuItems = [];
                    this.childItems = [];

                    if (this.blockConfigs.name) {
                        this.itemDefinition = mapper.common.convertPathToObjReference(skin, this.blockConfigs.name);
                    } else {
                        this.itemDefinition = skin.cBlocks;
                    }
                    
                    
					// Set options to empty object if not specified so we can add default options to it.
                    if (!this.itemDefinition.options) {
                        this.itemDefinition.options = {};
                    }
                    
					// delayRender mean to not create a block until asked to.
                    if (this.itemDefinition.options.delayRender) {
                        this.delayRender = this.itemDefinition.options.delayRender;
                    }
                    
					// Set the default createExtendedTool method to just reference the owning block.
                    if (!this.itemDefinition.createExtendedTool) {
                        this.itemDefinition.createExtendedTool = function(owningBlock) {
                            return {
                                owningBlock: owningBlock
                            };
                        }
                    }
                    
					// Track all blueprint copies so that references to other blocks can be determined.
                    if (!skin.blocks.blueprintCopyList[this.copyId.toString()]) {
                        skin.blocks.blueprintCopyList[this.copyId.toString()] = [];
                    }
                    
                    skin.blocks.blueprintCopyList[this.copyId.toString()].push(this);
                }
                
                this.undelayRender = function() {
                    if (this.rendered !== true) {
                        this.delayRender = false;
                        if (this.parent !== null) {
                            this.parent.undelayRender();
                        }
                    }
                }

				/**
				 * If asked to create a block but the parent blueprint has not 
				 * created a block yet, then call createParentBlock first.
				 */
                this.createParentBlock = function() {
                    if (this.parent === null) {
                        return null;
                    }
                    this.parent.createBlock();
                }
                
                this.addChildToParent = function(child, parent) {
                    switch (child.type) {
                        case 'toolbarItem':
                            parent.toolbarItems.push(child);
                            break;
                        case 'menuItem':
                            parent.menuItems.push(child);
                            break;
                        case 'childItem':
                            parent.childItems.push(child);
                            break;
                    }
                }
                
				/**
				 * Create an instance of Block for this blueprint.
				 */
                this.createBlock = function() {
					// If a block is already created for this blueprint, then 
					// we assume we want a new block so we have to 
					// create a copy of this blueprint. This is used in 
					// cases such as multiple map windows or chart windows.
                    if (this.block !== null) {
                        var copy = this.copy(this.parent);
                        var newBlock = copy.createBlock();
                        return newBlock;
                    }
                    
					// If it has a parent and the parent block is not created 
					// yet, delegate creating the block to the parent.
                    if (this.parent !== null && this.parent.block === null) {
                        var block = this.parent.createBlock();
                        return this.block;
                    }
                    
                    var parent = null;
                    if (this.parent !== null && this.parent.block !== null) {
                        parent = this.parent.block;
                    }
                    this.block = new skin.blocks.Block(this, parent);
                    
					// Recurse down the heirarchy and create blocks for all children.
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    var childItems = this.childItems;
                    var requiredBlockBlueprints = this.requiredBlockBlueprints;
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        if (toolbarItem.delayRender === false) {
                            toolbarItem.createBlock();
                        }
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        if (menuItem.delayRender === false) {
                            menuItem.createBlock();
                        }
                    }
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        if (childItem.delayRender === false) {
                            childItem.createBlock();
                        }
                    }
                    
					// Get references to other blocks.
                    for (var i = 0, len = requiredBlockBlueprints.length; i < len; i+=1) {
                        var requiredBlock = requiredBlockBlueprints[i];
						// Sometimes we get an undefined item in the list.
                        if (typeof(requiredBlock) === 'undefined') continue;
						// If the block has not yet been created for the blueprint, 
						// store the reference after the blockcreated event is fired.
                        if (requiredBlock.block !== null) {
                            this.block.blockReferences.push(requiredBlock.block);
                        } else {
                            requiredBlock.on('blockcreated', function(block, requiredBlock) {
                                block.blockReferences.push(requiredBlock);
                            }, this.block);
                        }
                    }
                    
					// Add the block to the parent block.
                    if (this.parent !== null) this.addChildToParent(this.block, this.parent.block);
                    this.fire('blockcreated', this.block);
                    return this.block;
                }
                
				/**
				 * Sometimes a tool needs to execute some code before a block 
				 * is created. In these cases, you can define an init method in 
				 * the item definition. This is also called for blueprint copies.
				 */
                this.performSetup = function(recursive) {
                    if (this.itemDefinition.init) {
                        this.itemDefinition.init(this);
                    }
                    
                    if (recursive === true) {
                        var toolbarItems = this.toolbarItems;
                        var menuItems = this.menuItems;
                        var childItems = this.childItems;
                        var groupBlockBlueprints = this.groupBlockBlueprints;
                        
                        for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                            var toolbarItem = toolbarItems[i];
                            toolbarItem.performSetup(recursive);
                        }
                        
                        for (var i = 0, len = menuItems.length; i < len; i+=1) {
                            var menuItem = menuItems[i];
                            menuItem.performSetup(recursive);
                        }
                        
                        for (var i = 0, len = childItems.length; i < len; i+=1) {
                            var childItem = childItems[i];
                            childItem.performSetup(recursive);
                        }
                        
						// If this blueprint is a group owner, call all performSetup methods
						// on blueprints that are grouped by this blueprint.
                        for (var i = 0, len = groupBlockBlueprints.length; i < len; i+=1) {
                            var groupBlock = groupBlockBlueprints[i];
                            var foundItem = this.findChildById(groupBlock.id);
                            if (foundItem === null) {
                                groupBlock.performSetup(recursive);
                            }
                        }
                    }
                }

				/**
				 * Performs a complete copy of this blueprint class.
				 * This is used in cases like multiple map windows.
				 */
                this.copy = function(parent) {
					// When a blueprint is copied, other blueprints may need to 
					// be copied as well so we store a unique copy id in order 
					// for other blueprints to reference the new copy.
                    skin.blocks.blueprintCopyCount+=1;
                    
					// Local recursive function for copying this blueprint and all related blueprints.
                    var performCopy = function(blueprint, parent) {
                        if (typeof(parent) === 'undefined') {
                            parent = blueprint.parent;
                        }
                        
                        var copy = new skin.blocks.BlockBlueprint(blueprint.blockConfigs, parent, blueprint.type);
                        
						// Add all referenced blueprints to the copy's references.
						// At this time they will reference the same blueprints because 
						// not all new copies are created yet so it will need to be 
						// updated to the new copies later.
                        var relatedBlockBlueprints = blueprint.relatedBlockBlueprints;
                        var requiredBlockBlueprints = blueprint.requiredBlockBlueprints;
                        var toolbarItems = blueprint.toolbarItems;
                        var menuItems = blueprint.menuItems;
                        var childItems = blueprint.childItems;
                        var groupBlockBlueprints = blueprint.groupBlockBlueprints;
                        
                        for (var i = 0, len = relatedBlockBlueprints.length; i < len; i+=1) {
                            var relatedBlock = relatedBlockBlueprints[i];
                            copy.relatedBlockBlueprints.push(relatedBlock);
                        }
                        
                        for (var i = 0, len = requiredBlockBlueprints.length; i < len; i+=1) {
                            var requiredBlock = requiredBlockBlueprints[i];
                            copy.requiredBlockBlueprints.push(requiredBlock);
                        }
                        
                        for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                            var toolbarItem = toolbarItems[i];
                            copy.toolbarItems.push(performCopy(toolbarItem, copy));
                        }
                        
                        for (var i = 0, len = menuItems.length; i < len; i+=1) {
                            var menuItem = menuItems[i];
                            copy.menuItems.push(performCopy(menuItem, copy));
                        }
                        
                        for (var i = 0, len = childItems.length; i < len; i+=1) {
                            var childItem = childItems[i];
                            copy.childItems.push(performCopy(childItem, copy));
                        }
                        
                        for (var i = 0, len = groupBlockBlueprints.length; i < len; i+=1) {
                            var groupBlock = groupBlockBlueprints[i];
                            var foundBlock = copy.findChildById(groupBlock.id);
							// All blueprints that are children of this blueprint are automatically copied 
							// recursively but some blocks such as the chart window are not children 
							// but still need to be copied.
                            if (foundBlock === null) {
                                var groupBlockCopy = performCopy(groupBlock, groupBlock.parent);
                                groupBlockCopy.groupOwner = copy;
                                copy.groupBlockBlueprints.push(groupBlockCopy);
                            } else {
                                groupBlock.groupOwner = copy;
                                copy.groupBlockBlueprints.push(groupBlock);
                            }
                        }
                        
                        blueprint.fire('blueprintcopied', copy);
                        return copy;
                    }
                    
                    var copy = performCopy(this);
					// Change referenced blueprints to the new copies that were made.
                    copy.updateRelationships(copy);
					// Perform the initial setup for this blueprint and all child blueprints.
                    copy.performSetup(true);
                    
                    return copy;
                }
                
				/**
				 * Updates references to other blueprints.
				 * When a blueprint is a copy of an existing blueprint, not all related blueprints are 
				 * copied at that time. This is called after all copies are finished 
				 * in order to update the references with the new copies.
				 */
                this.updateRelationships = function(groupOwner) {
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    var childItems = this.childItems;
                    var requiredBlockBlueprints = this.requiredBlockBlueprints;
                    var relatedBlockBlueprints = this.relatedBlockBlueprints;
                    var groupBlockBlueprints = groupOwner.groupBlockBlueprints;
                    var copyId = this.copyId.toString();
                    var blueprintCopyList = skin.blocks.blueprintCopyList[copyId];
                    
					// If this blueprint is a copy, update the relationships 
					// so they are referencing the same as the previous blueprint.
                    if (typeof(blueprintCopyList) !== 'undefined') {
                        for (var i = 0, len = relatedBlockBlueprints.length; i < len; i+=1) {
                            var relatedBlock = relatedBlockBlueprints[i];
                            for (var j = 0, length = blueprintCopyList.length; j < length; j+=1) {
                                var blueprintCopy = blueprintCopyList[j];
                                if (blueprintCopy.id === relatedBlock.id) {
                                    this.relatedBlockBlueprints[i] = blueprintCopy;
                                }
                            }
                        }
                        
                        for (var i = 0, len = requiredBlockBlueprints.length; i < len; i+=1) {
                            var requiredBlock = requiredBlockBlueprints[i];
                            for (var j = 0, length = blueprintCopyList.length; j < length; j+=1) {
                                var blueprintCopy = blueprintCopyList[j];
                                if (blueprintCopy.id === requiredBlock.id) {
                                    this.requiredBlockBlueprints[i] = blueprintCopy;
                                }
                            }
                        }
                    }
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        toolbarItem.updateRelationships(groupOwner);
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        menuItem.updateRelationships(groupOwner);
                    }
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        childItem.updateRelationships(groupOwner);
                    }
                    
					// Update all blueprints grouped by this blueprint.
                    var groupBlockBlueprints = this.groupBlockBlueprints;
                    for (var i = 0, len = groupBlockBlueprints.length; i < len; i+=1) {
                        var groupBlock = groupBlockBlueprints[i];
						// In the case of the charts, they can be docked inside 
						// the map window or be it's own floating window. If it's 
						// docked, it will be updated as a child item.
                        if (this.findChildById(groupBlock.id) === null) {
                            groupBlock.updateRelationships(groupOwner);
                        }
                    }
                }
                
				/**
				 * Recursively finds a child by id or returns null if not found.
				 */
                this.findChildById = function(id) {
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    var childItems = this.childItems;
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        if (toolbarItem.id === id) {
                            return toolbarItem;
                        }
                        var foundChild = toolbarItem.findChildById(id);
                        if (foundChild !== null) return foundChild;
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        if (menuItem.id === id) {
                            return menuItem;
                        }
                        var foundChild = menuItem.findChildById(id);
                        if (foundChild !== null) return foundChild;
                    }
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        if (childItem.id === id) {
                            return childItem;
                        }
                        var foundChild = childItem.findChildById(id);
                        if (foundChild !== null) return foundChild;
                    }
                    
                    return null;
                }
                
				/**
				 * One blueprint must always exist for each item in the template.json.
				 * If this is the initial blueprint, reset it to how it was at initial load 
				 * time before creating a block. If it's a copy, remove it.
				 */
                this.removeBlueprint = function() {
                    var siblings = [];
                    var indexInParent = 0;
                    var isCopyOfBlueprint = (this.blockConfigs.add === false) ? true : false;
                    if (this.parent !== null) {
                        switch (this.type) {
                            case 'toolbarItem':
                                siblings = this.parent.toolbarItems;
                                break;
                            case 'menuItem':
                                siblings = this.parent.menuItems;
                                break;
                            case 'childItem':
                                siblings = this.parent.childItems;
                                break;
                        }
                    } else {
                        siblings = skin.blocks.blueprints;
                    }
                    
					// If this is a copy of another blueprint, remove it from the parent blueprint.
                    for (var i = 0, len = siblings.length; i < len; i+=1) {
                        var sibling = siblings[i];
                        if (sibling.id === this.id) {
                            if (sibling.uniqueId === this.uniqueId) {
                                indexInParent = i;
                            } else {
                                isCopyOfBluePrint = true;
                            }
                        }
                    }
                    
                    if (isCopyOfBlueprint === true) {
                        siblings.splice(indexInParent, 1);
                        delete this;
                    }
                }
                
				/**
				 * Since a single blueprint must always exist for each item in 
				 * the template.json, if trying to remove the last blueprint that 
				 * exists, we instead reset it to the state it was in at initial 
				 * load before a block was created.
				 */
                this.reset = function() {
                    if (this.itemDefinition.options.delayRender === true) {
                        this.delayRender = true;
                    }
                    
                    this.uniqueId = 'block-blueprint-' + mapper.common.getRandomString(32, 36);
                    
                    var childItems = this.childItems;
                    var toolbarItems = this.toolbarItems;
                    var menuItems = this.menuItems;
                    
                    for (var i = 0, len = childItems.length; i < len; i+=1) {
                        var childItem = childItems[i];
                        childItem.reset();
                    }
                    
                    for (var i = 0, len = toolbarItems.length; i < len; i+=1) {
                        var toolbarItem = toolbarItems[i];
                        toolbarItem.reset();
                    }
                    
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        menuItem.reset();
                    }
                }
                
                this.events = {
                    blueprintcopied: [],
                    blockcreated: []
                };
                
                this.on = function(eventName, callback, callbackObj) {
                    if (this.events[eventName]) {
                        this.events[eventName].push({
                            callbackObj: callbackObj,
                            callback: callback
                        });
                    }
                }
                
                this.fire = function(eventName, postingObj) {
                    if (this.events[eventName]) {
                        var events = this.events[eventName];
                        for (var i = 0, len = events.length; i < len; i+=1) {
                            var event = events[i];
                            event.callback(event.callbackObj, postingObj);
                        }
                    }
                }
                
                this.getReferencedBlueprint = function(blockName) {
                    var blueprints = this.requiredBlockBlueprints;
                    for (var i = 0, len = blueprints.length; i < len; i+=1) {
                        var blueprint = blueprints[i];
                        if (blueprint.blockConfigs.name === blockName) {
                            return blueprint;
                        }
                    }
                    return null;
                }
                
                this.init(blockConfigs, parent, type);
            },


			/**
			 * Get's a list of paths to all tools in the template.json.
			 */
            getToolsSourceList:function(blocks)
            {
                //take mapper.blocks, and build a 1D list of blocks that have
                //an import
                var allBlocksWithImport = [];
                for (var i = 0, len = blocks.length; i < len; i+=1) 
                {
                    var blockConfigs = blocks[i];
                    if (blockConfigs.add === false) continue;


                    if (typeof(blockConfigs.import) !== 'undefined')
                    {
                        //mapper.log(blockConfigs);
                        allBlocksWithImport.push(blockConfigs);
                    }                    

                    if (blockConfigs.toolbar && blockConfigs.toolbar.add !== false)
                    {
                        var moreBlocksWithImport = skin.blocks.getToolsSourceList(blockConfigs.toolbar.items);
                        allBlocksWithImport.push.apply(allBlocksWithImport,moreBlocksWithImport);
                    }

                    if (blockConfigs.items)
                    {
                        var moreBlocksWithImport = skin.blocks.getToolsSourceList(blockConfigs.items);
                        allBlocksWithImport.push.apply(allBlocksWithImport,moreBlocksWithImport);
                    }

                    if (blockConfigs.blocks)
                    {
                        var moreBlocksWithImport = skin.blocks.getToolsSourceList(blockConfigs.blocks);
                        allBlocksWithImport.push.apply(allBlocksWithImport,moreBlocksWithImport);
                    }

                }
                return allBlocksWithImport;
            },
			
			/**
			 * Loads all tool source files which will be stored as 
			 * a blueprints itemDefinition.
			 */
            loadToolSourceFilesAsync: function(blocks,finishedFunc,finishedFuncParams)
            {

                /*
                //first make a list of all the blocks with an import
                var toollist = skin.blocks.getToolsSourceList(blocks);

                //mapper.log(toollist.length);
                var numLoadedTools = 0;
                
                //then add them
                for(var toolIndex in toollist)
                {
                    var blockConfigs = toollist[toolIndex];
                    //mapper.log(blockConfigs);

                    var path = blockConfigs.import;
                    // Replace . with /
                    path = path.replace(/\./g,'/');
                    //Add leading / and .js to end
                    //path = "./../" + path + ".js";
                    path = path + ".js";
                    var blockName = blockConfigs.name;
                    //aTool = mapper.common.convertJSFileObjReference(skin, this.blockConfigs.name, path);

                    SystemJS.import(path).then(function(aTool) 
                    {
                        
                        Object.defineProperty(skin, aTool.toolName, {
                            value: aTool.tool,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });

                        //mapper.log(skin);

                        numLoadedTools = numLoadedTools + 1;

                        //mapper.log(numLoadedTools + " " + toollist.length );

                        if (numLoadedTools == toollist.length)
                        {
                            finishedFunc();
                        }

                    });

                
                }

                if (toollist.length == 0)
                {
                    finishedFunc();
                }
                */

            
                //better version
                //first make a list of all the blocks with an import
                var toollist = skin.blocks.getToolsSourceList(blocks);

                var toolpaths = []
                for (tt in toollist)
                {
                    var blockConfigs = toollist[tt];

                    var path = blockConfigs.import;
                    // Replace . with /
                    path = path.replace(/\./g,'/');
                    //Add leading / and .js to end
                    //path = "./../" + path + ".js";
                    path = path + ".js?v=2.0.0";

                    if (toolpaths.includes(path) == false)
                    {
                        toolpaths.push(path);
                    }

                }

                //read
                //http://2ality.com/2014/09/es6-modules-final.html
                //section 7
                Promise.all
                (
                    toolpaths.map
                    (
                        function(x)
                        {
                            return System.import(x);
                        }
                        //x=>System.import(x)
                    )
                )
                .then
                (

                    function(allTools) 
                    {

                        for(tIndex in allTools)
                        {
                            aTool = allTools[tIndex];

                            Object.defineProperty(skin, aTool.toolName, {
                                value: aTool.tool,
                                writable: true,
                                enumerable: true,
                                configurable: true
                            });

                        }

                        finishedFunc(finishedFuncParams);
                    }
                ).
                catch
                (
                    function(err)
                    {
                        mapper.log(err);
                    }
                );

                if (toollist.length == 0)
                {
                    
                    finishedFunc();
                }


            },
			
            blueprints: [],
            blueprintsLookup: {},
			
			/**
			 * Recursively builds an instance of BlockBlueprint for 
			 * each item in the template.json on initial load.
			 */
            buildBlueprints: function(blocks, parent, type) {
                var blueprints = [];
                if (typeof(parent) === 'undefined') parent = null;
                if (typeof(type) === 'undefined') type = 'childItem';
                
                for (var i = 0, len = blocks.length; i < len; i+=1) {
                    var blockConfigs = blocks[i];
                    if (blockConfigs.add === false) continue;
                    
                    var blueprint = new skin.blocks.BlockBlueprint(blockConfigs, parent, type);
                    
                    if (blockConfigs.toolbar && blockConfigs.toolbar.add !== false)
                        blueprint.toolbarItems = skin.blocks.buildBlueprints(blockConfigs.toolbar.items, blueprint, 'toolbarItem');
                    if (blockConfigs.items)
                        blueprint.menuItems = skin.blocks.buildBlueprints(blockConfigs.items, blueprint, 'menuItem');
                    if (blockConfigs.blocks)
                        blueprint.childItems = skin.blocks.buildBlueprints(blockConfigs.blocks, blueprint, 'childItem');
                    
                    if (blockConfigs.name) {
                        var name = blockConfigs.name;
                        if (!skin.blocks.blueprintsLookup[name]) {
                            skin.blocks.blueprintsLookup[name] = [];
                        }
                        skin.blocks.blueprintsLookup[name].push(blueprint);
                    }
                    
                    blueprints.push(blueprint);
                }
                
                return blueprints;
            },
			
			/**
			 * Sets references to all related blocks on 
			 * initial load after all blueprints are created.
			 */
            setRelationships: function(blueprints) {
                for (var i = 0, len = blueprints.length; i < len; i+=1) {
                    var blueprint = blueprints[i];
                    var options = blueprint.itemDefinition.options;
                    if (options.requiredBlocks) {
                        requiredBlocks = options.requiredBlocks;
                        for (var j = 0, length = requiredBlocks.length; j < length; j+=1) 
                        {
                            var requiredBlock = requiredBlocks[j];

                            var foundRequiredBlock = skin.blocks.blueprintsLookup[requiredBlock];

                            if (typeof(foundRequiredBlock) === 'undefined')
                            {
                                //so this outputs the missingBLock
                                //but it needs to output also the block that is looking for it

                                var message = blueprint.blockConfigs.name + " is looking for " + requiredBlock + " but not finding it";
                                //message = message + " this might cause TypeError: requiredBlock is undefined later";

                                mapper.error(message);
                                
                            }
                            else
                            {
                                blueprint.requiredBlockBlueprints = blueprint.requiredBlockBlueprints.concat(foundRequiredBlock);    
                            }

                        }
                    }
                    
                    if (blueprint.blockConfigs.name) {
                        var name = blueprint.blockConfigs.name;
                        var relatedBlueprints = skin.blocks.blueprintsLookup[name];
                        for (var j = 0, length = relatedBlueprints.length; j < length; j+=1) {
                            var relatedBlueprint = relatedBlueprints[j];
                            if (relatedBlueprint.id !== blueprint.id) {
                                blueprint.relatedBlockBlueprints.push(relatedBlueprint);
                            }
                        }
                    }
                    
                    if (options.groupBy) {
                        var groupOwnerName = options.groupBy;
                        groupOwner = skin.blocks.blueprintsLookup[groupOwnerName][0];
                        blueprint.groupOwner = groupOwner;
                        groupOwner.groupBlockBlueprints.push(blueprint);
                    }
                    
                    skin.blocks.setRelationships(blueprint.toolbarItems);
                    skin.blocks.setRelationships(blueprint.menuItems);
                    skin.blocks.setRelationships(blueprint.childItems);
                }
            },
			
			/**
			 * Since the performSetup method also calls performSetup on 
			 * grouped blueprints that are not direct children of that blueprint 
			 * when called recursively, and this method recurses through 
			 * all blueprints, we don't call performSetup with the recursive 
			 * parameter to avoid some of them being called twice.
			 */
            performInitialSetup: function(blueprints) {
                for (var i = 0, len = blueprints.length; i < len; i+=1) {
                    var blueprint = blueprints[i];
                    blueprint.performSetup();
                    
                    skin.blocks.performInitialSetup(blueprint.toolbarItems);
                    skin.blocks.performInitialSetup(blueprint.menuItems);
                    skin.blocks.performInitialSetup(blueprint.childItems);
                }
            },
			
			/**
			 * Set unique block ids to all items in the template.json.
			 */
            setBlockIds: function(blocks) {
                for (var i = 0, len = blocks.length; i < len; i+=1) {
                    blocks[i].id = 'block-' + mapper.common.getRandomString(32, 36);
                    var block = blocks[i];
                    
                    if (block.toolbar) {
                        block.toolbar.items = this.setBlockIds(block.toolbar.items);
                    }
                    if (block.items) {
                        block.items = this.setBlockIds(block.items);
                    }
                    if (block.blocks) {
                        block.blocks = this.setBlockIds(block.blocks);
                    }
                }
                return blocks;
            },
			
			/**
			 * Recurse through all blueprints and create a block 
			 * for each one that does not have delayRender set
			 * or "add" set to false in the template.json. This 
			 * only calls createBlock on the top level blueprints 
			 * as createBlock will create all child blocks recursively.
			 */
		    getBlocks : function (blueprints) {
                var blocks = [];
                var items = [];
                
                for (var i = 0, len = blueprints.length; i < len; i+=1) {
                    var blueprint = blueprints[i];
                    
                    if (blueprint.blockConfigs.add !== false) blocks.push(blueprint.createBlock(null));
                }
                
                for (var i = 0, len = blocks.length; i < len; i+=1) {
                    var block = blocks[i];
                    items.push(block.render());
                }
                return items;
            },
			
			/**
			 * Recurse through all blueprints to remove any 
			 * references to a block that has been removed.
			 */
            removeReferencesToBlock: function(blueprints, blockId) {
                for (var i = 0, len = blueprints.length; i < len; i+=1) {
                    var blueprint = blueprints[i];
                    var block = blueprint.block;
                    if (block === null) continue;
                    
                    var blockReferences = block.blockReferences;
                    var index = -1;
                    for (var j = 0, length = blockReferences.length; j < length; j+=1) {
                        var blockReference = blockReferences[j];
                        if (blockReference.id === blockId) {
                            index = j;
                            break;
                        }
                    }
                    
                    if (index >= 0) {
                        block.blockReferences.splice(index, 1);
                    }
                    
                    skin.blocks.removeReferencesToBlock(blueprint.menuItems, blockId);
                    skin.blocks.removeReferencesToBlock(blueprint.toolbarItems, blockId);
                    skin.blocks.removeReferencesToBlock(blueprint.childItems, blockId);
                }
            },
			
			/**
			 * Convenience function called inside a getComponent method 
			 * to add any toolbar items present in the template.json.
			 */
            addToolBarItems : function (block, panel, toolbarExtItems, toolbarConfigs) {
			    // If no toolbar is configured or "add" is set to false, just return the component.
                if (!block.toolbar || block.toolbar.add === false) return panel;
				
			    var tb;
				// In case custom toolbar configs need to be passed.
                if (typeof(toolbarConfigs) !== 'undefined') {
                    tb = Ext.create('Ext.toolbar.Toolbar', toolbarConfigs);
                } else {
                    var obj = {};
                    if (block.toolbar.overflowMenu === true) {
                        obj.enableOverflow = true;
                    }

                    if (typeof(block.toolbar.style) !== 'undefined')
                    {
                        obj.style = block.toolbar.style;
                    }

                    tb = Ext.create('Ext.toolbar.Toolbar', obj);
                }
                
                

			    for (var index in toolbarExtItems)
			    {
                    toolbarExtItems[index].owningToolbar = tb;
				    tb.add(toolbarExtItems[index]);
			    }
			  
			    switch (block.toolbar.position) {
					case 'top':
						panel.tbar = tb;
						break;
					case 'bottom':
						panel.bbar = tb;
						break;
					case 'left':
						panel.lbar = tb;
						break;
					case 'right':
						panel.rbar = tb;
						break;
					default:
						panel.tbar = tb;
						break;
				} 
				return panel;
		    },
			
			/**
			 * Gets all blocks with the specified name.
			 * Note that in some cases like with the chart container, the template.json 
			 * may have it configured multiple times but only one or the other is 
			 * used at a given time. This will only return the blocks currently being used.
			 */
            getBlocksByName: function(name, blocks, matches) {
                if (typeof(blocks) === 'undefined') {
                    blocks = [];
                    var blueprints = skin.blocks.blueprints;
                    for (var i = 0, len = blueprints.length; i < len; i+=1) {
                        var blueprint = blueprints[i];
                        if (blueprint.block !== null) {
                            blocks.push(blueprint.block);
                        }
                    }
                }
                if (typeof(matches) === 'undefined') matches = [];
                
                for (var i = 0, len = blocks.length; i < len; i+=1) {
                    var block = blocks[i];
                    if (block.blockConfigs.name === name && block.rendered === true) {
                        matches.push(block);
                    }
                    matches = skin.blocks.getBlocksByName(name, block.childItems, matches);
                    matches = skin.blocks.getBlocksByName(name, block.toolbarItems, matches);
                    matches = skin.blocks.getBlocksByName(name, block.menuItems, matches);
                }
                return matches;
            },
			
			/**
			 * Gets all instances of BlockBlueprint with the given name.
			 */
			getBlueprintsByName: function(name, blueprints, matches) {
				if (typeof(blueprints) === 'undefined') {
                    blueprints = skin.blocks.blueprints;
                }
                if (typeof(matches) === 'undefined') matches = [];
                
                for (var i = 0, len = blueprints.length; i < len; i+=1) {
                    var blueprint = blueprints[i];
                    if (blueprint.blockConfigs.name === name) {
                        matches.push(blueprint);
                    }
                    matches = skin.blocks.getBlueprintsByName(name, blueprint.childItems, matches);
                    matches = skin.blocks.getBlueprintsByName(name, blueprint.toolbarItems, matches);
                    matches = skin.blocks.getBlueprintsByName(name, blueprint.menuItems, matches);
                }
                return matches;
			}
		},
		viewPortal : {
			addItemsToViewPORT : function (viewPortItems) {
				  Ext.create('Ext.Viewport', {
					layout : "fit",
					items : viewPortItems
				  });
			}
		},
		
		/**
		 * Convenience function for getting the correct Extjs region 
		 * config from the template.json.
		 * Note that this only works for the top level components
		 * even though it's supposed to work for all.
		 */
		ExtJSPosition : function (config, block) {
			switch (block.block) {
				case 'top':
					config.region = "north";
                    break;
				case 'bottom':
					config.region = "south";
                    break;
				case 'left':
					config.region = "west";
                    break;
				case 'right':
					config.region = "east";
                    break;
				case 'center':
					config.region = "center";
                    break;
                case 'relative':
                    if (config.xtype === 'panel') {
                        config.floating = true;
                    } else {
                        config.ghost = false;
                        config.constrain = true;
                        if (block.x) config.x = block.x;
                        if (block.y) config.y = block.y;
                        config = Ext.create('Ext.Window', config);
                        config.show();
                        config.doLayout();
                    }
                    
                    break;
				default:
					config.region = "north";
                    break;
			}
            
            return config;
		},
        
		/**
		 * If no block name is configured for a block in the template.json,
		 * this default component is used.
		 */
		cBlocks : {
            options: {
                events: ['resize']
            },
            getComponent : function (extendedTool, items, toolbar, menu) {
                var block = extendedTool.owningBlock.blockConfigs;
                var position = block.block;
                var width = block.width;
                var height = block.height;
                
                var cBlocks = {
                    extendedTool: extendedTool,
                    items : items,
                    cls : block.cssClass,
                    style : block.style,
                    menu : menu,
					resizable: true,
                    //header : false,
                    //autoScroll: true,
                    layout : 'autocontainer',
                    collapsible : block.hasOwnProperty('collapsible') ? block.collapsible : false,
                    collapsed : block.hasOwnProperty('collapsed') ? block.collapsed : false,
                    //collapseMode : 'mini',
                    width : width,
                    height : height,
                    //split : true,
                    listeners : {
                        afterrender: function() {
                            this.extendedTool.owningBlock.rendered = true;
                            this.extendedTool.owningBlock.component = this;
                        },
                        resize: function() {
                            this.extendedTool.owningBlock.fire('resize', this.extendedTool);
                        }
                    }
                };
				
				if (block.hasOwnProperty('resizable')) cBlocks.resizable = block.resizable;
				if (block.hasOwnProperty('resizeHandles')) cBlocks.resizeHandles = block.resizeHandles;
                
                if (block.hasOwnProperty('title')) {
                    cBlocks.header = true,
                    cBlocks.title = block.title;
                } else {
                    cBlocks.header = false;
                    cBlocks.collapseMode = 'mini';
                }
                
                cBlocks = skin.blocks.addToolBarItems(block, cBlocks, toolbar);
                
                return skin.ExtJSPosition(cBlocks, block);
            }
        },

		/**
		 * Namespace holds all methods for creating a month combobox in the date picker.
		 */
		monthCombo : {
			/**
			 * Registers callbacks to events on the periodicity object.
			 */
			registerEvents : function (picker, id, layerId) {
				// With Extjs, we can't guarantee when the html for the select box 
				// is actually added to the DOM so we have to check it's existence every 100 milliseconds.
				Ext.TaskManager.start({
					interval : 100,
					run : function () {
						var monthCombo = document.getElementById(id);

						if (monthCombo) {
							var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layerId);
							var monthPeriod = periodicityWrapper.periodicity.getChildPeriodByName('month');
							monthCombo.periodicity = monthPeriod;
							monthCombo.picker = picker;
							monthCombo.selectedIndex = monthPeriod.getSelectedIndex();

							// When the user changes the selected option in the month 
							// select box, changed the selected period in the periodicity object.
							monthCombo.onchange = function () {
								this.periodicity.setSelectedPeriod(parseInt(this.options[this.selectedIndex].value));
								mapper.layers.updateLayerAttributes(layerId);
								this.picker.updateValue();
							}

							// When the periodicity object's selected period changes, update the select box.
							monthPeriod.registerEvent('selectionChange', monthCombo, function (monthCombo, selection) {
								monthCombo.selectedIndex = monthCombo.periodicity.getSelectedIndex();
							});

							// When the available month's to select from changes, such as when the year 
							// changes, update the options in the select box.
							monthPeriod.registerEvent('optionsChange', monthCombo, function (monthCombo, selectedPeriod) {
								// Try to keep the same selection if it exists in the new list.
								// So if December is selected, and the year changes but December 
								// is available in the year, then select December.
								// If December is selected in a previous year and the year changes 
								// to the current year which only has data through October, select October instead.
								var selectedValue = parseInt(monthCombo.options[monthCombo.selectedIndex].value);
                                var options = monthCombo.periodicity.getOptionsPerParent();
								
								// Remove all current options.
								var length = monthCombo.options.length;
								for (var i = length - 1; i >= 0; i--) {
									monthCombo.remove(i);
								}

								// Determine if the selected option is available in the new list.
								var lowVal = monthCombo.periodicity.start;
								var highVal = 0;

								for (var i = 0; i < options.length; i++) {
									var option = options[i];
									if (option.value < lowVal)
										lowVal = option.value;
									if (option.value > highVal)
										highVal = option.value;
									var option = options[i];
									var htmlOption = document.createElement('option');
									htmlOption.value = option.value;
									var text = document.createTextNode(option.text);
									htmlOption.appendChild(text);
									monthCombo.appendChild(htmlOption);
								}

								if (selectedValue < lowVal)
									selectedValue = lowVal;
								if (selectedValue > highVal)
									selectedValue = highVal;

								monthCombo.periodicity.selectedPeriod = parseInt(selectedValue);
								monthCombo.selectedIndex = monthCombo.periodicity.getSelectedIndex();
								monthCombo.picker.updateValue();
							});
							return false;
						} else {
							return true;
						}
					}
				});
			},
			getMonthCombo : function (picker, id, layerId) {
				var monthPeriod = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity.getChildPeriodByName('month');

				var monthCombo = document.createElement('select');
				var options = monthPeriod.getOptionsPerParent();

				for (var i = 0; i < options.length; i++) {
					var option = options[i];
					var htmlOption = document.createElement('option');
					htmlOption.value = option.value;
					var text = document.createTextNode(option.text);
					htmlOption.appendChild(text);
					monthCombo.appendChild(htmlOption);
				}

				monthCombo.style = "width: 115px; height: 25px; margin: 0 5px;";
				monthCombo.setAttribute('id', id);
				monthCombo.setAttribute('class', "periodicityCombo");
				return monthCombo;
			}
		},
		
		// Not used by any projects.
		monthSpinner : {
			getMonthSpinner : function (picker) {
				var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(picker.layerId);
                var monthPeriod = periodicityWrapper.periodicity.getChildPeriodByName('month');
				var optionsPerParent = monthPeriod.getOptionsPerParent();
				var months = mapper.periodsConfig[periodicityWrapper.type].months;

				var customSpinner = Ext.ComponentQuery.query('customspinner');
				if (customSpinner.length == 0) {
					this.createCustomSpinner();
				}

				var monthSpinner = Ext.create('widget.customspinner', {
						picker : picker,
						periodicity : monthPeriod,
						margin : "0 5 0 5",
						editable : false,
						name : 'month',
						value : monthPeriod.formatSelection('label'),
						data : months,
						width : 115,
					});

				monthPeriod.registerEvent('selectionChange', monthSpinner, function (monthSpinner, selection) {
					monthSpinner.setValue(selection.text);
					monthSpinner.picker.updateValue();
				});

				monthPeriod.registerEvent('optionsChange', monthSpinner, function (monthSpinner, options) {
					var selectedValue = {
						value : monthSpinner.periodicity.selectedPeriod,
						text : monthSpinner.periodicity.formatSelection('label'),
					};

					var lowVal = {
						value : monthSpinner.periodicity.start,
						text : monthSpinner.periodicity.formatSelection('label'),
					};
					var highVal = {
						value : 0,
						text : '',
					};

					for (var i = 0; i < options.length; i++) {
						var option = options[i];
						if (option.value < lowVal.value) {
							lowVal.value = option.value;
							lowVal.text = option.text;
						}
						if (option.value > highVal.value) {
							highVal.value = option.value;
							highVal.text = option.text;
						}
					}

					if (selectedValue.value < lowVal.value) {
						selectedValue.value = lowVal.value;
						selectedValue.text = lowVal.text;
					}
					if (selectedValue.value > highVal.value) {
						selectedValue.value = highVal.value;
						selectedValue.text = highVal.text;
					}

					monthSpinner.minValue = lowVal.text;
					monthSpinner.highValue = highVal.text;
					monthSpinner.setValue(selectedValue.text);
					monthSpinner.periodicity.selectedPeriod = selectedValue.value;
					monthSpinner.picker.updateValue();
				});

				return monthSpinner;
			},
			createCustomSpinner : function () {
				Ext.define('Ext.ux.CustomSpinner', {
					extend : 'Ext.form.field.Spinner',
					alias : 'widget.customspinner',
					onSpinUp : function () {
						var period = this.periodicity;
						if (period.hasNext(period.title)) {
							period.setSelectedPeriod(period.selectedPeriod + 1);
						} else if (period.parentPeriod !== null && period.parentPeriod.hasNext(period.parentPeriod.title)) {
							period.parentPeriod.setSelectedPeriod(period.parentPeriod.selectedPeriod + 1);
							period.selectFirst(period.title);
							period.parentPeriod.callEvents('selectionChange', {
								value : period.parentPeriod.selectedPeriod,
								text : period.parentPeriod.formatSelection('label')
							});
						}
						period.callEvents('selectionChange', {
							value : period.selectedPeriod,
							text : period.formatSelection('label')
						});
						mapper.layers.updateLayerAttributes(this.picker.layerId);
						this.picker.updateValue();
					},
					onSpinDown : function () {
						var period = this.periodicity;
						if (period.hasPrev(period.title)) {
							period.setSelectedPeriod(period.selectedPeriod - 1);
						} else if (period.parentPeriod !== null && period.parentPeriod.hasPrev(period.parentPeriod.title)) {
							period.parentPeriod.setSelectedPeriod(period.parentPeriod.selectedPeriod - 1);
							period.selectLast(period.title);
							period.parentPeriod.callEvents('selectionChange', {
								value : period.parentPeriod.selectedPeriod,
								text : period.parentPeriod.formatSelection('label')
							});
						}
						period.callEvents('selectionChange', {
							value : period.selectedPeriod,
							text : period.formatSelection('label')
						});
						period.callChildEvents('optionsChange');
						mapper.layers.updateLayerAttributes(this.picker.layerId);
						this.picker.updateValue();
					}
				});
			},
		},
		
		/**
		 * namespace to hold all methods for creating the year select box.
		 * Since the year is at the top of the periodicity, we don't need to 
		 * worry about the available options changing.
		 */
		yearCombo : {
			registerEvents : function (picker, id, layerId) {
				Ext.TaskManager.start({
					interval : 100,
					run : function () {
						var yearCombo = document.getElementById(id);

						if (yearCombo) {
							var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layerId);
							var yearPeriod = periodicityWrapper.periodicity.getChildPeriodByName('year');
							yearCombo.periodicity = yearPeriod;
							yearCombo.picker = picker;
							yearCombo.selectedIndex = yearPeriod.getSelectedIndex();

							yearCombo.onchange = function () {
								this.periodicity.setSelectedPeriod(this.selectedIndex + 1);
								mapper.layers.updateLayerAttributes(layerId);
								this.picker.updateValue();
							}

							yearPeriod.registerEvent('selectionChange', yearCombo, function (yearCombo, selection) {
								yearCombo.selectedIndex = yearCombo.periodicity.getSelectedIndex();
							});

							return false;
						} else {
							return true;
						}
					}
				});
			},
			getYearCombo : function (picker, id, layerId) {
				var yearPeriod = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity.getChildPeriodByName('year');

				var yearCombo = document.createElement('select');
				var options = yearPeriod.getOptionsPerParent();

				for (var i = 0; i < options.length; i++) {
					var option = options[i];
					var htmlOption = document.createElement('option');
					htmlOption.value = option.value;
					var text = document.createTextNode(option.text);
					htmlOption.appendChild(text);
					yearCombo.appendChild(htmlOption);
				}

				yearCombo.style = "width: 65px; height: 25px; margin: 0 5px;";
				yearCombo.setAttribute('id', id);
				yearCombo.setAttribute('class', "periodicityCombo");

				return yearCombo;
			}
		},
        periodCombo : {
            registerEvents : function (picker, id) {
				var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
				var layer = mapper.layers.getTopLayer(layersConfig.overlays);
				var layerId = layer.id;
				
				Ext.TaskManager.start({
					interval : 100,
					run : function () {
						var periodCombo = document.getElementById(id);

						if (periodCombo) {
							var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layerId);
							var period = periodicityWrapper.periodicity.getChildPeriodByName('period');
							periodCombo.periodicity = period;
							periodCombo.picker = picker;
							periodCombo.selectedIndex = period.getSelectedIndex();

							period.onchange = function () {
								this.periodicity.setSelectedPeriod(parseInt(this.options[this.selectedIndex].value));
								mapper.layers.updateLayerAttributes(layerId);
								this.picker.updateValue();
							}

							period.registerEvent('selectionChange', period, function (period, selection) {
								period.selectedIndex = period.periodicity.getSelectedIndex();
							});

							period.registerEvent('optionsChange', period, function (period, selectedPeriod) {
								var selectedValue = parseInt(period.options[period.selectedIndex].value);
                                var options = period.periodicity.getOptionsPerParent();
								var length = period.options.length;
								for (var i = length - 1; i >= 0; i--) {
									period.remove(i);
								}

								var lowVal = period.periodicity.start;
								var highVal = 0;

								for (var i = 0; i < options.length; i++) {
									var option = options[i];
									if (option.value < lowVal)
										lowVal = option.value;
									if (option.value > highVal)
										highVal = option.value;
									var option = options[i];
									var htmlOption = document.createElement('option');
									htmlOption.value = option.value;
									var text = document.createTextNode(option.text);
									htmlOption.appendChild(text);
									period.appendChild(htmlOption);
								}

								if (selectedValue < lowVal)
									selectedValue = lowVal;
								if (selectedValue > highVal)
									selectedValue = highVal;

								period.periodicity.selectedPeriod = parseInt(selectedValue);
								period.selectedIndex = period.periodicity.getSelectedIndex();
								period.picker.updateValue();
							});
							return false;
						} else {
							return true;
						}
					}
				});
			},
			getPeriodCombo : function (picker, id, layerId) {
				var period = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity.getChildPeriodByName('period');

				var periodCombo = document.createElement('select');
				var options = period.getOptionsPerParent();

				for (var i = 0; i < options.length; i++) {
					var option = options[i];
					var htmlOption = document.createElement('option');
					htmlOption.value = option.value;
					var text = document.createTextNode(option.text);
					htmlOption.appendChild(text);
					periodCombo.appendChild(htmlOption);
				}

				periodCombo.style = "width: 115px; height: 25px; margin: 0 5px;";
				periodCombo.setAttribute('id', id);
				periodCombo.setAttribute('class', "periodicityCombo");
				return periodCombo;
			}
        },
		yearSpinner : {
			getYearSpinner : function (picker) {
				var customSpinner = Ext.ComponentQuery.query('customspinner');
				if (customSpinner.length == 0) {
					skin.monthSpinner.createCustomSpinner();
				}

				var yearPeriod = mapper.periodicity.getPeriodicityWrapperById(picker.layerId).periodicity.getChildPeriodByName('year');
				var savedSelection = yearPeriod.selectedPeriod;
				yearPeriod.selectedPeriod = 1;
				var minPeriod = yearPeriod.formatLabel();
				yearPeriod.selectedPeriod = yearPeriod.end;
				var maxPeriod = yearPeriod.formatLabel();
				yearPeriod.selectedPeriod = savedSelection;

				var yearSpinner = Ext.create('widget.customspinner', {
						picker : picker,
						periodicity : yearPeriod,
						editable : false,
						margin : "0 5 0 5",
						anchor : '100%',
						name : 'year',
						value : yearPeriod.formatLabel(),
						width : 65,
					});

				yearPeriod.registerEvent('selectionChange', yearSpinner, function (yearSpinner, selection) {
					yearSpinner.setValue(selection.text);
					yearSpinner.picker.updateValue();
				});

				return yearSpinner;
			},
		},
		
		/**
		 * This creates the button that goes back one period.
		 */
		previousBtn : {
			getPreviousBtn : function (picker) {
				var prevBtn = Ext.create('Ext.button.Button', {
                    picker : picker,
					cls : "cal-button",
                    iconCls : 'x-tbar-page-prev fa fa-chevron-left',
					handler : function () {
						var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
						var layer = mapper.layers.getTopLayer(layersConfig.overlays);
						var layerId = layer.id;
						var periodicity = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity;
						// Only go back one period if it's not already set to the first available period.
						if (periodicity.hasPrev())
							periodicity.prev();
						mapper.layers.updateLayerAttributes(layerId);
						this.picker.updateValue();
					}
				});


				return prevBtn;
			}
		},
		
		/**
		 * This creates the button that goes forward one period.
		 */
		nextBtn : {
			getNextBtn : function (picker) {
				var nextBtn = Ext.create('Ext.button.Button', {
						picker : picker,
						cls : "cal-button",
						iconCls : 'x-tbar-page-next  fa fa-chevron-right',
						handler : function () {
							var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
							var layer = mapper.layers.getTopLayer(layersConfig.overlays);
							var layerId = layer.id;
							var periodicity = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity;
							// Only go forward one period if it's not already set to the last available period.
							if (periodicity.hasNext())
								periodicity.next();
							mapper.layers.updateLayerAttributes(layerId);
							this.picker.updateValue();
						}
					});

				return nextBtn;
			}
		},
		
		/**
		 * Namespace to hold the methods for creating periodic buttons on the date picker.
		 */
		customCalendar : {
            getComboBox : function(picker) {
				this.picker = picker;
				this.periodicity = mapper.periodicity.getPeriodicityWrapperById(this.picker.layerId).periodicity.getChildPeriodByName('period');
                
            },
			
			/**
			 * Generates the container to hold the periodic buttons.
			 */
			getCustomCalendar : function (picker, layerId) {
				this.pdBtnWidth = 40;
				this.pdColumns = 4;
				this.picker = picker;
				this.periodicity = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity.getChildPeriodByName('period');

				this.periodicBtns = this.generatePeriodicBtns(this.picker, layerId);

				var customCalendarItems = [];

				var customCalendarItem = Ext.create('Ext.container.Container', {
						id : "customCalendar",
						picker : this.picker,
						cls : "center-buttons",
						layout : {
							type : 'table',
							columns : this.pdColumns,
							tdAttrs : {
								style : 'padding: 5px 0px;'
							}
						},
						defaults : {
							enableToggle : true
						},
						items : this.periodicBtns
					});

				this.customCalendarItem = customCalendarItem;

				if (this.periodicity !== null) {
					this.periodicity.registerEvent('selectionChange', this, function (customCalendar, selection) {
						var periodicBtns = customCalendar.customCalendarItem.query('button');
						for (var i = 0; i < periodicBtns.length; i++) {
							var btn = periodicBtns[i];
							btn.toggle(btn.value === selection);
						}
					});

					this.periodicity.registerEvent('optionsChange', this, function (customCalendar, options) {
						customCalendar.customCalendarItem.removeAll();
						customCalendar.customCalendarItem.add(skin.customCalendar.generatePeriodicBtns(customCalendar.picker, layerId));
						customCalendar.customCalendarItem.doLayout();
						mapper.layers.updateLayerAttributes(layerId);
						customCalendar.picker.updateValue();
					});
				}

				return [customCalendarItem];
			},
			
			generatePeriodicBtns : function (picker, layerId) {
				var periodicBtns = [];
				var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layerId);
				var period = periodicityWrapper.periodicity.getChildPeriodByName('period');
				var periodsConfig = mapper.periodsConfig[periodicityWrapper.type];

				if (period !== null) {
					var periodsInMonth = period.getPeriodsPerParent();
					var savedSelection = period.selectedPeriod;

					for (p = 1; p <= periodsInMonth; p++) {
						period.selectedPeriod = p;
						if (period.atStart() && savedSelection <= period.selectedPeriod) {
							savedSelection = p;
							break;
						} else if (period.atEnd() && savedSelection >= period.selectedPeriod) {
							savedSelection = p;
							break;
						}
					}

					for (p = 1; p <= periodsInMonth; p++) {
						period.selectedPeriod = p;
						var disablePeriod = (period.isOutOfRange()) ? true : false;
						var pressed = (p === savedSelection);

						periodicBtns.push({
							id : 'button' + p,
							picker : picker,
							xtype : 'button',
							pressed : pressed,
							text : periodsConfig.shortName + p,
							value : p,
							enableToggle : true,
							disabled : disablePeriod,
							toggleGroup : "periods",
							tooltip : periodsConfig.fullName + '-' + p,
							width : this.pdBtnWidth,
							handler : function (item) {
								var periodicity = mapper.periodicity.getPeriodicityWrapperById(layerId).periodicity.getChildPeriodByName('period');
								periodicity.selectedPeriod = this.value;
								mapper.layers.updateLayerAttributes(layerId);
								this.picker.updateValue();
							}
						});
					}
					period.selectedPeriod = savedSelection;
				}

				return periodicBtns;
			},
		},
		datePicker : {
			/**
			 * In the original TOC, we used to show a date picker for each layer inside the TOC itself.
			 * I don't think it's used anymore by any of the projects.
			 */
			defineDatePickerColumn : function () {
				Ext.define('datePicker.Column', {
					extend : 'Ext.grid.column.Column',
					alias : 'widget.datePickerColumn',
					renderer : function (value, p, record) {
						var containerId = Ext.id();
						var container = '<div id="' + containerId + '"></div>';
						var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(record.data.id);

						if (periodicityWrapper !== null && record.data.timeSeriesSelected !== "" && typeof(record.data.timeSeriesSelected) !== 'undefined') {
							if (periodicityWrapper.periodicity.hasMultiplePeriods()) {
								var datePicker = Ext.create('widget.periodic', {
										delayedRenderTo : containerId,
										layerId : record.data.id,
										value : record.data.timeSeriesSelected,
									});
							} else {
								container = '<div id="' + containerId + '">' + record.data.timeSeriesSelected + '</div>';
							}
						}

						return container;
					},
				});
			},
			
			/**
			 * Defines the Extjs override for a date picker.
			 */
			defineDatePicker : function () {
				this.defineDatePickerColumn();

				Ext.define('Periods.view.periodPicker', {
					extend : 'Ext.form.field.Picker',
					alias : 'widget.periodic',
					width : 130,
                    componentType : 'datePicker',
					layersConfigUpdated : function(newLayerConfig, callbackObject, postingObject)
					{
                        var topLayer = mapper.layers.getTopLayer(newLayerConfig.overlays);
                    
                        if (topLayer && topLayer.timeseries)
                        {
                            //this.setLayerId(topLayer.id);
                            var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(topLayer.id);
                            if (periodicityWrapper.periodicity.hasMultiplePeriods()) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        } else {
                            this.hide();
                        }
                        
                        /*if (this.owningToolbar) {
                            var toolbar = this.owningToolbar;
                            var menuItems = toolbar.layout.overflowHandler.menu.items.items;
                            
                            for (var i = 0, len = menuItems.length; i < len; i+=1) {
                                var menuItem = menuItems[i];
                                if (menuItem instanceof Periods.view.periodPicker) {
                                    //menuItem.layerId = topLayer.id;
                                    menuItem.setLayerId(topLayer.id);
									console.log(menuItem);
									console.log(menuItem.id);
                                }
                            }
                        }*/
					},
                    shouldUsePeriodicButtons : function() {
                        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
						var layer = mapper.layers.getTopLayer(layersConfig.overlays);
						if (layer && layer.timeseries && layer.timeseries.type === '1-day') {
							return true;
						}
                        return true;
                    },
					/*setLayerId : function (layerId) {
						this.layerId = layerId;
						if (this.picker)
							this.picker.layerId = layerId;
					},*/
					triggerCls : 'x-form-date-trigger',
					initComponent : function () {
						if (this.delayedRenderTo) {
							this.delayRender();
						}
						this.callParent(arguments);
					},
					/**
					 * Make sure the container exists before rendering.
					 */
					delayRender : function () {
						Ext.TaskManager.start({
							scope : this,
							interval : 100,
							run : function () {
								var container = Ext.fly(this.delayedRenderTo);

								if (container) {
									this.render(container);
									return false;
								} else {
									return true;
								}
							}
						});
					},
					xtype : 'toggle-buttons',
					updateValue : function () {
						var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
						var layer = mapper.layers.getTopLayer(layersConfig.overlays);
                        var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
						var newValue = periodicityWrapper.buildDisplayLabel(periodicityWrapper.format);
                        
						this.setValue(newValue);
					},
                    componentType: 'datePicker',
					/**
					 * Override the createPicker method to return our own custom date picker window.
					 */
					createPicker : function () {
						var pickerType = this.pickerType;
						var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
						var layer = mapper.layers.getTopLayer(layersConfig.overlays);
						var layerId = layer.id;
						var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layerId);

                        var period = periodicityWrapper.periodicity.getChildPeriodByName('period');
                        var monthPeriod = periodicityWrapper.periodicity.getChildPeriodByName('month');

						this.pdWindowHeight = '30';
                        this.pdColumns = (monthPeriod === null) ? 2:6;
						this.pdBtnWidth = 30;
						this.pdWindowWidth = (this.pdBtnWidth * (this.pdColumns + 3));

						this.itemsPerMonth = (period === null) ? 0 : period.getPeriodsPerParent();
						if (this.itemsPerMonth !== 0) {
							this.pdWindowHeight = (this.pdBtnWidth * (Math.ceil(this.itemsPerMonth / this.pdColumns) + 1)) + (4 * (Math.ceil(this.itemsPerMonth / this.pdColumns) + 1));
						}
                        var shouldUsePeriodicButtons = this.shouldUsePeriodicButtons();

                        if (pickerType === 'spinners') {
                            var columns = (shouldUsePeriodicButtons === true) ? 2 : 1;
                            this.yearMonthContainer = Ext.create('Ext.container.Container', {
                                layout : {
                                    type : 'table',
                                    columns : columns
                                },
                                width : 250,
                            });
                        } else if (pickerType === 'combobox') {
                            this.yearMonthContainer = Ext.create('Ext.container.Container', {
                                                               width : 250,
							});
                        }

						this.subMonthContainer = Ext.create('Ext.container.Container', {
                            items : []
                        });

						// Create the window to use for the date picker.
						var periodWindow = new Ext.create('Ext.window.Window', {
								wrapper : this,
								title : 'Select Period',
								height : 'auto',
								minHeight : this.pdWindowHeight,
								width : this.pdWindowWidth,
								minWidth : this.pdWindowWidth,
								closable : false,
								header : false,
								style : {
									border : 'solid 1px #ccc;'
								},
								xtype : 'toggle-buttons',
								layout : {
									type : 'table',
									columns : 3
								},
								bodyStyle : 'padding: 5px 10px 5px 10px;',
								items : [{
										xtype : 'container',
										width : 25,
										items : [skin.previousBtn.getPreviousBtn(this)]
									}, {
										xtype : 'container',
										width : (monthPeriod === null) ? 75: 205,
										items : [
											this.yearMonthContainer,
											this.subMonthContainer,
										]
									}, {
										xtype : 'container',
										width : 25,
										items : [skin.nextBtn.getNextBtn(this)]
									}
								],
								listeners : {
									/**
									 * We need to completely remove all items when the date picker is hidden and add them
									 * back in when it's shown because Extjs has a serious problem with layout if we leave them in.
									 */
									hide : function (btn, e, eOpts) {
										this.wrapper.yearMonthContainer.removeAll();
										this.wrapper.subMonthContainer.removeAll();
									},
									beforeshow : function (btn, e, eOpts) {
										var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
										var layer = mapper.layers.getTopLayer(layersConfig.overlays);
										var layerId = layer.id;
										var periodicity = mapper.periodicity.getPeriodicityWrapperById(layerId);
										if (periodicity === null)
											return false;

                                        if (pickerType === 'combobox') {
                                            this.createCombos(layerId);
                                        } else if (pickerType === 'spinners') {
                                            this.createSpinners();
                                        }
                                        
										var subMonthContainer = this.wrapper.subMonthContainer;
                                        if (this.wrapper.shouldUsePeriodicButtons() === true) {
                                            subMonthContainer.add(skin.customCalendar.getCustomCalendar(this.wrapper, layerId));
                                        } else {
                                            this.createPeriodCombo();
                                        }

										this.doLayout();
									},
								},
                                createPeriodCombo: function() {
                                    var subMonthContainer = this.wrapper.subMonthContainer;
                                    var periodId = 'period-combo-' + mapper.common.getRandomString(32, 36);

                                    var periodCombo = skin.periodCombo.getPeriodCombo(this.wrapper, periodId, layerId);

                                    var comboDiv = document.createElement('div');
                                    comboDiv.appendChild(periodCombo);
                                    subMonthContainer.update(comboDiv.outerHTML);
                                    skin.periodCombo.registerEvents(this.wrapper, periodId);
                                },
                                createCombos: function(layerId) {
                                    var yearMonthContainer = this.wrapper.yearMonthContainer;
                                    var yearId = 'year-combo-' + mapper.common.getRandomString(32, 36);
                                    

                                    var yearCombo = skin.yearCombo.getYearCombo(this.wrapper, yearId, layerId);

                                    var comboDiv = document.createElement('div');
                                    comboDiv.appendChild(yearCombo);
                                    skin.yearCombo.registerEvents(this.wrapper, yearId, layerId);

                                    if (monthPeriod!=null)
                                    {

                                        var monthId = 'month-combo-' + mapper.common.getRandomString(32, 36);
                                        var monthCombo = skin.monthCombo.getMonthCombo(this.wrapper, monthId, layerId);
                                        comboDiv.appendChild(monthCombo);
                                        skin.monthCombo.registerEvents(this.wrapper, monthId, layerId);

                                    } 
                                    
                                    yearMonthContainer.update(comboDiv.outerHTML);
                                },
                                createSpinners: function() {
                                    var yearMonthContainer = this.wrapper.yearMonthContainer;
                                    var yearSpinner = skin.yearSpinner.getYearSpinner(this.wrapper);
                                    yearMonthContainer.add(yearSpinner);

                                    var monthSpinner = skin.monthSpinner.getMonthSpinner(this.wrapper);
                                    yearMonthContainer.add(monthSpinner);
                                }
							});

						return periodWindow;
					}
				});
			},
			getWindowHeight : function (itemsPerMonth) {
				this.pdColumns = 6;
				this.pdBtnWidth = 30;

				if (mapper.periodicity.itemsPerMonth != 0) {
					this.pdWindowHeight = (this.pdBtnWidth * (Math.ceil(itemsPerMonth / this.pdColumns) + 1)) + (4 * (Math.ceil(itemsPerMonth / this.pdColumns) + 1));
				}

				return this.pdWindowHeight;
			}
		},

		/**
		 * Create the OpenLayers Extjs panel.
		 */
		OpenLayers : {
            defineOpenLayers : function () {
				Ext.define('OpenlayersPanel', {
					extend : 'Ext.panel.Panel',
					map : null,
					layout : 'fit',
					initComponent : function () 
					{
                        mapper.OpenLayers.extendOpenLayers();
                        mapper.OpenLayers.Map.prototype.tileLoadCompleteCallback = function() {
                            this.extendedTool.unMaskComponent();
                        }

                        mapper.OpenLayers.Map.prototype.tileLoadInitCallback = function() {
                            this.extendedTool.maskComponent();
                        }

						mapper.OpenLayers.overrideOpenLayersZoomCode();
						
						this.callParent(arguments);
                        
                        var blockConfigs = this.extendedTool.owningBlock.blockConfigs;
                        
                        var viewConfigs = {
                            center : [2309109.7504386036, 841426.3073632196],
                            zoom : 4,
                            minZoom : 1,
                            zoomFactor : 1.2
                        };
                        
						// Allow overwriting the projection and max extent from the template.json.
                        if (blockConfigs.hasOwnProperty('projection') && blockConfigs.projection !== null && blockConfigs.projection !== '') {
                            var projConfig = {
                                code: blockConfigs.projection,
                                units: 'm'
                            }
                        
                            if (blockConfigs.hasOwnProperty('max_extent') && blockConfigs.max_extent !== null && blockConfigs.max_extent.length > 0) {
                                projConfig.extent = blockConfigs.max_extent;
                            }
                            viewConfigs.projection = new ol.proj.Projection(projConfig);
                        }

						// Allow overwriting the center position from the template.json.
                        if (blockConfigs.hasOwnProperty('center') && blockConfigs.center !== null && blockConfigs.center.length > 0) {
                            viewConfigs.center = blockConfigs.center;
                        }
                        
                        var view = new ol.View(viewConfigs);
                        
						// Allow adding default interactions from template.json.
                        var interactions = [];
                        var interactionConfigs = blockConfigs.interactions;
                        if (typeof(interactionConfigs) !== 'undefined') {
                            for (var i = 0, len = interactionConfigs.length; i < len; i+=1) {
                                var interaction = interactionConfigs[i];
                                switch (interaction) {
                                    case 'pan':
                                        interactions.push(new ol.interaction.KeyboardPan({condition: ol.events.condition.always}));
                                        interactions.push(new ol.interaction.DragPan({condition: ol.events.condition.always}));
                                        break;
                                    case 'zoom':
                                        interactions.push(new ol.interaction.DoubleClickZoom({condition: ol.events.condition.always}));
                                        interactions.push(new ol.interaction.PinchZoom({condition: ol.events.condition.always}));
                                        interactions.push(new ol.interaction.KeyboardZoom({condition: ol.events.condition.always}));
                                        interactions.push(new ol.interaction.MouseWheelZoom({condition: ol.events.condition.always}));
                                        interactions.push(new ol.interaction.DragZoom({condition: ol.events.condition.shiftKeyOnly}));
                                        break;
                                }
                            }
                        }

						this.map = new mapper.OpenLayers.Map({
								logo : false,
								view : view,
                                interactions : interactions,
								controls: ol.control.defaults({
									attributionOptions: {
										collapsible: false
									}
								})
							});
					},
					listeners : {
						afterrender : function () {
							this.map.setTarget(this.body.dom);
							this.map.render();
                            this.extendedTool.component = this;
                            this.extendedTool.owningBlock.component = this;
                            this.extendedTool.owningBlock.rendered = true;
                            this.map.extendedTool = this.extendedTool;
                            this.extendedTool.getReady(this);
                            this.extendedTool.owningBlock.fire('rendercomponent', this.extendedTool);
						},
						resize : function () {
							this.map.setTarget(this.body.dom);
							this.map.updateSize();
							this.map.render();
						}
					}
				});
			}
        }
        ,
        createGridPanelHeaderCheckbox: function() {
            // Create Extjs overridden checkcolumn to allow a checkbox in header.
            // Source: https://github.com/twinssbc/extjs-CheckColumnPatch
            Ext.define('Ext.ux.CheckColumnPatch', {
                override: 'Ext.ux.CheckColumn',

                /**
                 * @cfg {Boolean} [columnHeaderCheckbox=false]
                 * True to enable check/uncheck all rows
                 */
                columnHeaderCheckbox: false,

                constructor: function (config) {
                    var me = this;
                    me.callParent(arguments);

                    me.addEvents('beforecheckallchange', 'checkallchange');

                    if (me.columnHeaderCheckbox) {
                        me.on('headerclick', function () {
                            this.updateAllRecords();
                        }, me);

                        me.on('render', function (comp) {
                            var grid = comp.up('grid');
                            this.mon(grid, 'reconfigure', function () {
                                if (this.isVisible()) {
                                    this.bindStore();
                                }
                            }, this);

                            if (this.isVisible()) {
                                this.bindStore();
                            }

                            this.on('show', function () {
                                this.bindStore();
                            });
                            this.on('hide', function () {
                                this.unbindStore();
                            });
                        }, me);
                    }
                },

                onStoreDataUpdate: function () {
                    var allChecked,
                        image;

                    if (!this.updatingAll) {
                        allChecked = this.getStoreIsAllChecked();
                        if (allChecked !== this.allChecked) {
                            this.allChecked = allChecked;
                            image = this.getHeaderCheckboxImage(allChecked);
                            this.setText(image);
                        }
                    }
                },

                getStoreIsAllChecked: function () {
                    var me = this,
                        allChecked = true;
					
					// Sometimes this method get's called before the afterrender 
					// callback that sets the reference to the extended tool.
                    if (me.extendedTool) {
                        var featureList = me.extendedTool.featureList;
                        for (var i = 0, len = featureList.length; i < len; i+=1) {
                            var feature = featureList[i];
                            if (feature[1] === false) {
                                allChecked = false;
                                return false;
                            }
                        }
                    } else {
                        me.store.each(function (record) {
                            if (!record.get(this.dataIndex)) {
                                allChecked = false;
                                return false;
                            }
                        }, me);
                    }
                    
                    return allChecked;
                },

                bindStore: function () {
                    var me = this,
                        grid = me.up('grid'),
                        store = grid.getStore();

                    me.store = store;

                    me.mon(store, 'datachanged', function () {
                        this.onStoreDataUpdate();
                    }, me);
                    me.mon(store, 'update', function () {
                        this.onStoreDataUpdate();
                    }, me);

                    me.onStoreDataUpdate();
                },

                unbindStore: function () {
                    var me = this,
                        store = me.store;

                    me.mun(store, 'datachanged');
                    me.mun(store, 'update');
                },

                updateAllRecords: function () {
                    var me = this,
                        allChecked = !me.allChecked;

                    if (me.fireEvent('beforecheckallchange', me, allChecked) !== false) {
                        this.updatingAll = true;
                        me.store.suspendEvents();
                        me.store.each(function (record) {
                            record.set(this.dataIndex, allChecked);
                        }, me);
                        me.store.resumeEvents();
                        me.up('grid').getView().refresh();
                        this.updatingAll = false;
                        this.onStoreDataUpdate();
                        me.fireEvent('checkallchange', me, allChecked);
                    }
                },

				/**
				 * Get the Extjs css class for the checkbox.
				 */
                getHeaderCheckboxImage: function (allChecked) {
                    var cls = [],
                        cssPrefix = Ext.baseCSSPrefix;

                    if (this.columnHeaderCheckbox) {
                        allChecked = this.getStoreIsAllChecked();
                        //Extjs 4.2.x css
                        cls.push(cssPrefix + 'grid-checkcolumn');
                        //Extjs 4.1.x css
                        cls.push(cssPrefix + 'grid-checkheader');

                        if (allChecked) {
                            //Extjs 4.2.x css
                            cls.push(cssPrefix + 'grid-checkcolumn-checked');
                            //Extjs 4.1.x css
                            cls.push(cssPrefix + 'grid-checkheader-checked');
                        }
                    }
                    return '<div style="margin:auto" class="' + cls.join(' ') + '">&#160;</div>'
                }
            });
        },

        createSelectAllCombo: function() {
            Ext.define('comboSelectedCount', {
                alias: 'plugin.selectedCount',
                init: function (combo) {
                    var fl = combo.getFieldLabel(),
                        allSelected = false,
                        id = combo.getId() + '-toolbar-panel';

                    Ext.apply(combo, {
                        listConfig: {
                            tpl : new Ext.XTemplate(
                                '<div id="' + id + '"></div><tpl for="."><div class="x-boundlist-item">{' + combo.displayField + '} </div></tpl>'
                            )
                        }
                    });
                    var toolbar = Ext.create('Ext.toolbar.Toolbar', {
                        items: [{
                            text: 'Select all',
                            xtype: 'button',
                            handler: function(btn, e) {
                                combo.select(combo.getStore().getRange());
                                allSelected = true;
                                e.stopEvent();
                            }
                        }, {
                            text: 'Reset',
                            xtype: 'button',
                            handler: function(btn, e) {
                                combo.setValue(this.defaultSelection);
                                allSelected = false;
                                e.stopEvent();
                            },
                            defaultSelection: [],
                            listeners: {
                                added: function() {
                                    var extendedTool = combo.extendedTool;
                                    var chartContainer = extendedTool.owningBlock.getReferencedBlock('cChartContainer');
                                    chartContainer.on('attributesupdated', function(callbackObj, postingObj, eventObj) {
                                        var combo = callbackObj.combo;
                                        var button = callbackObj.button;
                                        button.defaultSelection = combo.extendedTool.getDefaultValue();
                                    }, {button: this, combo: combo});
                                }
                            }
                        }]
                    });
                    combo.on({
                        expand: {
                            fn: function() {
                                var dropdown = Ext.get(id).dom.parentElement;
                                var container = Ext.DomHelper.insertBefore(dropdown, '<div id="'+id+'-container"></div>', true);
                                toolbar.render(container);
                            },
                            single: true
                        }
                    });
                }
            });
        }

	}
	
	//-------------------------------------------------------
	//PROGRAM START HERE
	//-------------------------------------------------------
	fetch('configs/settings.json')
	.then(
		function(response)
				{
					return response.json();
				})
	.then(
			function(settings_json)
			{
				if (typeof(settings_json.service_check) != 'undefined')
				{
					var service_check_url = settings_json.service_check.source;
					
					
					
					fetch(service_check_url).then
					(
						function(response)
						{
							return response.json();
						}
					
					).then(
					
						function(service_api_response_json)
						{
							
							if (service_api_response_json.down.length>0)
							{
								//services down scenario here
								
								var sheet = window.document.styleSheets[0];
								
								sheet.insertRule('body { text-align: center; padding: 150px; background:#ffffff !important; padding:150px !important; margin:8px !important;}', sheet.cssRules.length);
								sheet.insertRule('h1 { font-size: 50px !important; }', sheet.cssRules.length);
								sheet.insertRule('body { font: 20px Helvetica, sans-serif !important; color: #333 !important; }', sheet.cssRules.length);
								sheet.insertRule('article { display: block !important; text-align: left !important; width: 650px; margin: 0 auto !important; }', sheet.cssRules.length);
								sheet.insertRule('a { color: #dc8100 !important; text-decoration: none !important; }', sheet.cssRules.length);
								sheet.insertRule('a:hover { color: #333 !important; text-decoration: none !important; }', sheet.cssRules.length);
								
								
								
								document.body.innerHTML = "<article>"+
								"<h1>We&rsquo;ll be back soon!</h1>"+
								"<div>"+
								"<p>Sorry for the inconvenience but we&rsquo;re performing some routine maintenance at the moment. Please try again later.</p>"+
								"<p>Thank you.</p>"+
								"</div>"+
								"</article>";
								
							}
							else
							{
								if (service_api_response_json.upcoming.length>0)
								{
									
									//add loadingMask
									document.body.innerHTML += "<div id=\"initial-loading-mask\"></div>";
									
									var loadingMask = document.getElementById('initial-loading-mask');
									loadingMask.innerHTML = "<div id=\"initial-loading-message\">"+
									"<div id=\"initial-loading-message-text\" class=\"x-mask-msg-text custom-mask-loading\"></div>"+
									"</div>";
									
									mapper.init(skin.initModeShowUpcomingDowntime);
									
								}
								
								if (service_api_response_json.upcoming.length==0 && service_api_response_json.down.length==0)
								{
									//normal start here
									
									//add loadingMask
									document.body.innerHTML += "<div id=\"initial-loading-mask\"></div>";
									
									//add loadingMask
									var loadingMask = document.getElementById('initial-loading-mask');
									loadingMask.innerHTML = "<div id=\"initial-loading-message\">"+
									"<div id=\"initial-loading-message-text\" class=\"x-mask-msg-text custom-mask-loading\"></div>"+
									"</div>";
									mapper.init(skin.initModeNormal);
								}
							}
						}
					);
				} else {
                    mapper.init(skin.initModeNormal);
                }
			}
		);
	
	
	//-------------------------------------------------------

	
	
});