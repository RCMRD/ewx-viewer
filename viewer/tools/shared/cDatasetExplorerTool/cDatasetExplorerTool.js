var cDatasetExplorerTool = {
    options: {
        requiredBlocks: ['cMapPanel', 'cMapWindow'],
        events: ['layerchange']
    },
    Option : function(id, title, parentId) {
        this.id = id;
        this.text = title;
        this.parentId = parentId;
    },
    createExtendedTool: function(owningBlock) {
        var mapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = mapWindowBlock.extendedTool;
        var mapPanelBlock = owningBlock.getReferencedBlock('cMapPanel');
        
        var getRootOverlayConfig = function(layers, onlyOnLayerId, depth) {
            if (typeof(depth) === 'undefined') depth = 0;
            if (depth > 1) return null;
            
            for (var i = 0, len = layers.length; i < len; i+=1) {
                var layer = layers[i];
				if (depth > 0) {
					var onLayer = mapper.layers.query(
						layer.folder,
						{
							id: onlyOnLayerId
						}
					);
					if (onLayer.length > 0) {
						return layer;
					}
				}
                
                if (layer.type === 'folder') {
                    var rootFolder = getRootOverlayConfig(layer.folder, onlyOnLayerId, depth+1);
                    if (rootFolder !== null) return rootFolder.folder;
                }
            }
            
            return null;
        }
        
        var layersConfigId = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
        var onlyOnLayer = mapper.layers.getTopLayer(layersConfig.overlays);
        
        var overlays = [];
        if (onlyOnLayer === false) {
            overlays = layersConfig.overlays[0].folder[0].folder;
        } else {
            var onlyOnLayerId = onlyOnLayer.id;
            overlays = getRootOverlayConfig(layersConfig.overlays, onlyOnLayerId);
        }
        
        var options = [];
        for (var i = 0, len = overlays.length; i < len; i+=1) {
            var overlay = overlays[i];
            options.push({
                configs: overlay,
                parentId: null
            });
        }
        
        var datasetExplorerTool = new owningBlock.itemDefinition.DatasetExplorerTool(options, null, owningBlock);
        
        mapWindowBlock.on('overflowmenushow', function(datasetExplorerTool) {
            datasetExplorerTool.ensureItemsInMenu();
            datasetExplorerTool.updateOverflowCombos();
        }, datasetExplorerTool);
        
        return datasetExplorerTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        return extendedTool.getAllCombos();
    },
    DatasetExplorerTool : function(options, parentCombo, owningBlock) {
        this.init = function(options, parentCombo, owningBlock) {
            this.parentCombo = (typeof(parentCombo) === 'undefined') ? null : parentCombo;
            this.owningBlock = owningBlock;
            this.selectedParentId = null;
            this.childCombo = null;
            this.options = [];
            var childOptions = [];
            
            for (var i = 0, len = options.length; i < len; i+=1) {
                var option = options[i];
                var overlay = option.configs;
                
                if (overlay.type === 'folder') {
                    for (var j = 0, length = overlay.folder.length; j < length; j+=1) {
                        var childOverlay = overlay.folder[j];
                        childOptions.push({
                            configs: childOverlay,
                            parentId: overlay.id,
                        });
                    }
                } 
            }
            
            this.childCombo = (childOptions.length > 0) ? new owningBlock.itemDefinition.DatasetExplorerTool(childOptions, this, owningBlock) : null;
            
            for (var i = 0, len = options.length; i < len; i+=1) {
                var option = options[i];
                var overlay = option.configs;
                var optionObj = new owningBlock.itemDefinition.Option(overlay.id, overlay.title, option.parentId);
                
                if (overlay.type === 'layer') {
                    if (overlay.mask === false && overlay.loadOnly === false) {
                        optionObj.selectedByDefault = overlay.display;
                        this.options.push(optionObj);
                    }
                } else {
                    if (this.childCombo.hasOptionForParent(overlay.id)) this.options.push(optionObj);
                }
            }
            
            this.createCombo();
        }
        
        this.getDefaultSelectedOption = function() {
            if (this.childCombo !== null) {
                var childOption = this.childCombo.getDefaultSelectedOption();
                if (childOption === null) return null;
                for (var i = 0, len = this.options.length; i < len; i+=1) {
                    var option = this.options[i];
                    if (option.id === childOption.parentId) return option;
                }
            } else {
                for (var i = 0, len = this.options.length; i < len; i+=1) {
                    var option = this.options[i];
                    if (option.selectedByDefault === true) return option;
                }
            }
            
            return null;
        }
        
        this.hasOptionForParent = function(parentId) {
            var options = this.getOptionsForParent(parentId);
            if (this.childCombo !== null) {
                for (var i = 0, len = options.length; i < len; i+=1) {
                    var option = options[i];
                    if (this.childCombo.hasOptionForParent(option.id)) return true;
                }
            }
            
            return (options.length > 0);
        }
        
        this.getOptionsForParent = function(parentId) {
            var availableOptions = [];
            
            for (var i = 0, len = this.options.length; i < len; i+=1) {
                var option = this.options[i];
                if (option.parentId === parentId) availableOptions.push(option);
            }
            
            return availableOptions;
        }
        
        this.getOptionById = function(id) {
            for (var i = 0, len = this.options.length; i < len; i+=1) {
                var option = this.options[i];
                if (option.id === id) return option;
            }
            return null;
        }
        
        this.setOptions = function(parentId) {
            this.combo.suspendEvents();
            this.selectedParentId = parentId;
            var selectedOption = this.getOptionById(this.combo.getValue());
            var newOptions = this.getOptionsForParent(parentId);
            var newSelection = null;
            var newValue = '';
            
            if (newOptions.length === 0) {
                if (!this.combo.isHidden()) {
                    this.combo.hide();
                }
                
                this.isComboEmpty = true;
                this.hideOverflowCombo();
                this.combo.clearValue();
                this.combo.resumeEvents();
                return;
            } else {
                if (this.combo.isHidden()) {
                    this.combo.show();
                }
                
                this.isComboEmpty = false;
                this.showOverflowCombo();
            }
            
            if (selectedOption !== null) {
                for (var i = 0, len = newOptions.length; i < len; i+=1) {
                    var newOption = newOptions[i];
                    if (newOption.text === selectedOption.text) {
                        newSelection = newOption;
                        break;
                    } 
                }
            }
            
            this.combo.clearValue();
            var storeData = this.getStoreData();
            this.combo.bindStore(this.createStore(storeData));
            
            if (newSelection === null) {
                newValue = storeData[0].id;
            } else {
                for (var i = 0, len = storeData.length; i < len; i+=1) {
                    var data = storeData[i];
                    if (data.id === newSelection.id) {
                        newValue = data.id;
                        break;
                    }
                }
            }
            
            this.selectedOption = newValue;
            this.combo.setValue(newValue);
            if (this.combo.overflowClone) {
                overflowCombo = this.combo.overflowClone;
                var overflowStore = this.createStore();
                overflowCombo.bindStore(overflowStore);
                overflowCombo.setValue(newValue);
            }
            this.change();
            this.combo.resumeEvents();
        }
        
        this.change = function() {
            if (this.childCombo !== null) {
                this.childCombo.setOptions(this.selectedOption);
            }
            
            var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
            var owningMapWindow = mapWindowBlock.extendedTool;
            var layersConfigId = owningMapWindow.layersConfigId;
            var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);

            if (owningMapWindow.owningBlock.rendered === true && (this.childCombo === null || this.childCombo.isComboEmpty === true)) {
                var lastOverlays = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        type: 'layer',
                        display: true,
                        mask: false,
                        loadOnly: false
                    }
                );
                var lastOverlay = lastOverlays[0];
				
				for (var i = 0, len = lastOverlays.length; i < len; i+=1) {
					lastOverlays[i].display = false;
				}
                
                var newOverlays = mapper.layers.query(
                    layersConfig.overlays,
                    {
                        type: 'layer',
                        id: this.combo.getValue()
                    }
                );
                var newOverlay = newOverlays[0];
				newOverlay.display = true;
                
                if (typeof(lastOverlay) !== 'undefined' && lastOverlay.id !== newOverlay.id) {
                    var oldPeriodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(lastOverlay.id);
                    var newPeriodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(newOverlay.id);
                    newPeriodicityWrapper.syncSelection(oldPeriodicityWrapper);
                }
                
                mapper.layers.setLayersConfigById(
                    layersConfigId,
                    layersConfig);

                mapper.layers.setLayersConfigInstanceId(layersConfigId);
                mapper.layers.updateLayerAttributes(newOverlay.id);

                mapper.EventCenter.defaultEventCenter.postEvent(
                    mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                    owningMapWindow,
                    owningMapWindow);
                    
                this.owningBlock.fire('layerchange', this);
            }
        }
        
        this.createCombo = function() {
            var defaultOption = this.getDefaultSelectedOption();
            if (defaultOption === null) {
                this.selectedParentId = null;
            } else {
                this.selectedParentId = defaultOption.parentId;
            }
            
            var store = this.createStore();
            
            this.combo = Ext.create('Ext.form.field.ComboBox', {
                wrapper : this,
                width : 87,
                margin : '0 8px 0 0',
                queryMode : 'local',
                editable : false,
                autoRender: true,
                autoShow: true,
                displayField : 'name',
                valueField : 'id',
                listeners: {
                    change: function(combo, newValue) {
                        this.wrapper.selectedOption = newValue;
                        this.wrapper.change();
                    },
                    beforeshow: function() {
                        if (this.wrapper.isComboEmpty === true) return false;
                    }
                }
            });
            
            this.combo.initialConfig.storedComboId = this.combo.id;
            this.combo.bindStore(store);
            if (defaultOption !== null) {
                this.combo.setValue(defaultOption.id);
            }
        }
        
        this.hideOverflowCombo = function() {
            var overflowCombo = this.combo.overflowClone;
            if (overflowCombo) {
                overflowCombo.hide();
            }
        }
        
        this.showOverflowCombo = function() {
            var overflowCombo = this.combo.overflowClone;
            if (overflowCombo) {
                overflowCombo.show();
            }
        }
        
        this.updateOverflowCombos = function() {
            var overflowCombo = this.combo.overflowClone;
            if (overflowCombo) {
                if (this.isComboEmpty === true) {
                    if (!overflowCombo.isHidden()) {
                        overflowCombo.hide();
                    }
                } else {
                    if (overflowCombo.isHidden()) {
                        overflowCombo.show();
                    }
                }
                
                var store = this.createStore();
                overflowCombo.bindStore(store);
                overflowCombo.setValue(this.combo.getValue());
            }
            
            if (this.childCombo !== null) this.childCombo.updateOverflowCombos();
        }
        
        this.ensureItemsInMenu = function() {
            if (this.isComboEmpty === true) {
                var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
                
                var overflowHandler = mapWindowBlock.extendedTool.mapWindowToolbar.layout.overflowHandler;
                if (!overflowHandler.hasOwnProperty('menu')) return;
                var menuItems = overflowHandler.menu.items.items;
                var menuItemFound = false;
                
                for (var i = 0, len = menuItems.length; i < len; i+=1) {
                    var menuItem = menuItems[i];
                    if (menuItem.initialConfig.storedComboId === this.combo.id) {
                        menuItemFound = true;
                        break;
                    }
                }
                
                if (menuItemFound === false) {
                    var insertIndex = 0;
                    if (this.parentCombo !== null) {
                        var parentIndex = this.parentCombo.getIndexOfOverflowCombo();
                        if (parentIndex !== false) {
                            insertIndex = parentIndex+1;
                        }
                        
                        var overflowCombo = Ext.create(Ext.getClassName(this.combo), overflowHandler.createMenuConfig(this.combo));
                        this.combo.overflowClone = overflowHandler.menu.insert(insertIndex, overflowCombo);
                    }
                }
            }
            
            if (this.childCombo !== null) {
                this.childCombo.ensureItemsInMenu();
            }
        }
        
        this.getIndexOfOverflowCombo = function() {
            var mapWindowBlock = this.owningBlock.getReferencedBlock('cMapWindow');
            
            var overflowHandler = mapWindowBlock.extendedTool.mapWindowToolbar.layout.overflowHandler;
            if (!overflowHandler.hasOwnProperty('menu')) return;
            var menuItems = overflowHandler.menu.items.items;
            for (var i = 0, len = menuItems.length; i < len; i+=1) {
                var menuItem = menuItems[i];
                if (menuItem.initialConfig.storedComboId === this.combo.id) {
                    return i;
                }
            }
            return false;
        }
        
        this.getStoreData = function() {
            var options = this.getOptionsForParent(this.selectedParentId);
            var data = [];
            
            for (var i = 0, len = options.length; i < len; i+=1) {
                var option = options[i];
                data.push({
                    id: option.id,
                    name: option.text
                });
            }
            
            return data;
        }
        
        this.createStore = function(storeData) {
            if (typeof(storeData) === 'undefined') {
                storeData = this.getStoreData();
            }
            
            var store = Ext.create('Ext.data.Store', {
                fields: ['id', 'name'],
                data: storeData
            });
            
            return store;
        }
        
        this.getAllCombos = function(comboList) {
            if (typeof(comboList) === 'undefined') comboList = [];
            
            comboList.push(this.combo);
            if (this.childCombo !== null) {
                return this.childCombo.getAllCombos(comboList);
            }
            
            return comboList;
        }
        
        this.init(options, parentCombo, owningBlock);
    }
};

export var toolName = "cDatasetExplorerTool";
export var tool = cDatasetExplorerTool;