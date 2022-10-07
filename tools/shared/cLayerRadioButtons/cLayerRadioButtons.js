var cLayerRadioButtons = {
    options: {
        events: ['select']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            toolUniqueID: mapper.common.getRandomString(32, 36),
            radioName: mapper.common.getRandomString(32, 36),
            selectedValue: null
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var radioButtons = [];
        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var layerMapping = block.layers;
        var layers = [];
        
        for (var i = 0, len = layerMapping.length; i < len; i+=1) {
            var layerMap = layerMapping[i];
            var layer = mapper.layers.query(
                layersConfig,
                {
                    type: 'layer',
                    mask: false,
                    id: layerMap.id
                },
                ['overlays', 'boundaries']
            );
            
            if (layer.length > 0) layers.push(layer[0]);
        }
        
        for (var i = 0, len = layers.length; i < len; i+=1) {
            var layer = layers[i];
            radioButtons.push({
                extendedTool: extendedTool,
                boxLabel: layer.title,
                name: extendedTool.radioName,
                inputValue: layer.id,
                style: 'white-space: nowrap;',
                listeners: {
                    afterrender: function() {
                        // Component returned from this tool will be an array of components.
                        if (!this.extendedTool.hasOwnProperty('component')) {
                            this.extendedTool.component = [];
                            this.extendedTool.owningBlock.component = [];
                            this.extendedTool.owningBlock.rendered = true;
                        }
                        
                        this.extendedTool.component.push(this);
                        this.extendedTool.owningBlock.component.push(this);
                        if (this.extendedTool.selectedValue === this.inputValue) {
                            this.suspendEvents();
                            this.setValue(true);
                            this.resumeEvents();
                            this.extendedTool.owningBlock.fire('select', this.extendedTool);
                        }
                    },
                    change: function(checkbox, checked) {
                        if (checked === true) {
                            var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                            
                            var boundary = mapper.layers.query(
                                layersConfig,
                                {
                                    type: 'layer',
                                    id: this.inputValue
                                },
                                ['overlays', 'boundaries']
                            )[0];
                            
                            if (boundary.display === false) {
                                boundary.display = true;
                                
                                mapper.EventCenter.defaultEventCenter.postEvent(
                                    mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
                                    layersConfig,
                                    mapper.layers);
                                
                                mapper.EventCenter.defaultEventCenter.postEvent(
                                    mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                                    layersConfig,
                                    mapper.layers);
                            }
                            
                            this.extendedTool.radioGroup.active = true;
                            this.extendedTool.selectedValue = this.inputValue;
                            this.extendedTool.owningBlock.fire('select', this.extendedTool);
                            var relatedBlueprints = this.extendedTool.owningBlock.blueprint.relatedBlockBlueprints;
                            
                            for (var i = 0, len = relatedBlueprints.length; i < len; i+=1) {
                                var blueprint = relatedBlueprints[i];
                                if (blueprint.block === null) continue;
                                if (blueprint.block.rendered === false) {
                                    blueprint.block.extendedTool.selectedValue = this.inputValue;
                                    continue;
                                }
                                blueprint.block.extendedTool.radioGroup.active = false;
                                var relatedComponent = blueprint.block.extendedTool.component;
                                var hasValue = false;
                                
                                for (var j = 0, length = relatedComponent.length; j < length; j+=1) {
                                    relatedComponent[j].suspendEvents();
                                    
                                    if (relatedComponent[j].inputValue === this.inputValue) {
                                        relatedComponent[j].setValue(true);
                                        hasValue = true;
                                        blueprint.block.extendedTool.selectedValue = relatedComponent[j].inputValue;
                                    } else {
                                        relatedComponent[j].setValue(false);
                                    }
                                    
                                    relatedComponent[j].resumeEvents();
                                }
                                
                                if (hasValue === false) {
                                    blueprint.block.extendedTool.selectedValue = null;
                                }
                                
                                blueprint.block.fire('select', blueprint.block.extendedTool);
                            }
                        }
                    }
                }
            });
        }
        
        return radioButtons;
    }
};

export var toolName = "cLayerRadioButtons";
export var tool = cLayerRadioButtons;